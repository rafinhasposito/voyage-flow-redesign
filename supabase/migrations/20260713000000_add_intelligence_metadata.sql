-- Migration: Add intelligence_metadata to experiences table
-- Descrição: Criação da coluna dedicada para armazenar metadados de inteligência (JSON)
-- sem afetar o campo legado short_description.

ALTER TABLE public.experiences
ADD COLUMN IF NOT EXISTS intelligence_metadata JSONB NULL;

-- Constraint de segurança simples para garantir que, se não for nulo,
-- o conteúdo gravado seja obrigatoriamente um objeto JSON (evita arrays soltos ou strings em formato JSON).
ALTER TABLE public.experiences
ADD CONSTRAINT chk_experiences_intelligence_metadata_is_object 
CHECK (
  intelligence_metadata IS NULL 
  OR jsonb_typeof(intelligence_metadata) = 'object'
);

-- Comentário da coluna para documentação no banco
COMMENT ON COLUMN public.experiences.intelligence_metadata IS 'Armazena metadados de inteligência da IA (pesos de personas, compatibilidade, tags adicionais, etc). Validado via Zod no cliente.';
