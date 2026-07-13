# Relatório: Proposta de Migration - Intelligence Metadata

Este relatório documenta a análise e proposta de migration para a adição do campo `intelligence_metadata` na tabela `experiences`.

## 1. Verificação do Histórico
- **Migrations Analisadas:** O diretório `supabase/migrations` não existia localmente. O schema atual está centralizado em `supabase/schema.sql` como um dump inicial. 
- **Estado Atual Confirmado:** A tabela `experiences` não possui o campo `intelligence_metadata`. O campo `short_description` (TEXT NOT NULL) está armazenando os textos editoriais legados dos 108 registros.
- **Tipagem Existente:** O arquivo `src/types/supabase.types.ts` não possui referência a `intelligence_metadata`.
- **Restrições:** Não existem triggers complexos ou constraints JSON avançadas na tabela `experiences`, apenas um trigger básico de `updated_at`.

## 2. Proposta SQL
A migration foi criada localmente no arquivo `supabase/migrations/20260713000000_add_intelligence_metadata.sql` (apenas para revisão).

```sql
ALTER TABLE public.experiences
ADD COLUMN IF NOT EXISTS intelligence_metadata JSONB NULL;

ALTER TABLE public.experiences
ADD CONSTRAINT chk_experiences_intelligence_metadata_is_object 
CHECK (
  intelligence_metadata IS NULL 
  OR jsonb_typeof(intelligence_metadata) = 'object'
);

COMMENT ON COLUMN public.experiences.intelligence_metadata IS 'Armazena metadados de inteligência da IA (pesos de personas, compatibilidade, tags adicionais, etc). Validado via Zod no cliente.';
```

### Decisões Técnicas:
- **Default e NOT NULL:** Descartados. O campo começa como `NULL` para os 108 registros, sem backfill.
- **Índices (GIN):** Descartados por enquanto, até que consultas concretas de busca baseadas no JSON se tornem gargalos comprovados.
- **RLS e Grants:** Nenhuma alteração. O campo herda as políticas de segurança padrão da tabela `experiences`.
- **Constraint Recomendada:** Uma verificação `jsonb_typeof = 'object'` garante que apenas objetos sejam armazenados, rejeitando acidentes como salvar strings "puras" ou arrays numéricos diretamente na coluna JSON.

## 3. Rollback SQL
O script de rollback seria:
```sql
ALTER TABLE public.experiences
DROP COLUMN IF EXISTS intelligence_metadata;
```
> [!WARNING]
> Este rollback **exclui permanentemente todos os dados** salvos na coluna `intelligence_metadata`. Ele só é seguro para ser executado *antes* da ferramenta de Admin começar a gravar dados valiosos em produção. A reversão local de código deve sempre usar `git revert`.

## 4. Impacto no Projeto
| Componente | Nível de Impacto | Momento de Implementação |
| :--- | :--- | :--- |
| `supabase.types.ts` | Atualização da interface | Necessário imediatamente na próxima integração |
| `ExperienceMetadata` | Integração do parser/serializer na entidade | Necessário na integração seguinte |
| `ExperienceEditor` | Substituição da manipulação de state | Necessário na integração seguinte |
| `ExperienceRepository` | Tratar a leitura/escrita do novo campo | Necessário na integração seguinte |
| `Import` | Possível atualização de mapeamento (CSV) | Futuro |
| `QualityDashboard` | Refletir a nova estrutura (cálculos de score) | Futuro |
| `Consumer / Engine` | Ler de intelligence_metadata e fallback | Futuro |
| `Edge Functions` | N/A (se o app usa o SDK do cliente) | Nenhum impacto (ou futuro se usado para backfill) |

## 5. Plano de Compatibilidade Temporária
1. O campo `short_description` permanece inalterado com seu texto editorial.
2. A coluna `intelligence_metadata` é populada com `NULL` nos registros antigos (compatível com os 108 existentes).
3. Na integração, o `ExperienceEditor` em memória aplicará metadados vazios/default usando `createDefaultExperienceMetadata()` apenas de forma visual.
4. Nenhuma gravação automática de defaults deve acontecer caso o operador abra um registro e feche sem salvar. A coluna só deve ser preenchida após uma ação de salvamento intencional.
5. O Consumer e a Engine devem prever comportamentos seguros (defaults seguros ou ignoração de pesos) caso consultem registros em que o campo ainda é nulo.
6. Nenhum fallback deverá ler a inteligência dentro de `short_description` quando a migração estiver completa.
