import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { parseExperienceMetadata, ExperienceMetadataSchema } from "../src/domain/experienceMetadata";

// CRITICAL WARNING / FONTES DE VERDADE:
// 1. short_description nos 108 registros ativos do Supabase contém apenas texto editorial legível.
// 2. Esta camada NÃO autoriza sobrescrever esse texto com JSON e nenhuma conversão automática deve ser feita na base.
// 3. O script de diagnóstico abaixo realiza apenas operações de leitura (SELECT), sem modificar nenhum dado.
// 4. Metadados de inteligência deverão ser migrados para campo dedicado em etapa futura (ex: intelligence_metadata).

interface ExperienceRow {
  id: string;
  title: string;
  category: string | null;
  short_description: string | null;
}

// --- Env Loader Manual para compatibilidade de execução local ---
function loadEnv(): void {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts.join("=");
        process.env[key.trim()] = value.trim().replace(/^['"]|['"]$/g, "");
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function runAudit(): Promise<void> {
  console.log("=== INICIANDO AUDITORIA DOS METADADOS DO CATÁLOGO ===\n");
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ ERRO: Chaves do Supabase não encontradas no ambiente ou no .env.local.");
    console.log("Por favor, garanta que VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estejam configurados.");
    process.exit(1);
  }

  // Instancia o client para leitura somente
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log("Conectando ao Supabase e buscando registros (Apenas SELECT)...");
  
  // Executa estritamente um SELECT sem nenhuma mutação
  const { data, error } = await supabase
    .from("experiences")
    .select("id, title, category, short_description");

  if (error) {
    console.error("❌ Falha ao buscar registros do Supabase:", error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log("⚠️ Nenhum registro encontrado na tabela experiences.");
    process.exit(0);
  }

  const rows = data as unknown as ExperienceRow[];
  const total = rows.length;
  let emptyCount = 0;
  let validCount = 0;
  let incompleteCount = 0;
  let repairedCount = 0;
  let schemaErrorCount = 0;
  let plainTextCount = 0;
  let invalidJsonCount = 0;

  let hasTags = 0;
  let hasPersonaWeights = 0;
  let hasCompanionshipCompatibility = 0;
  let hasMustSee = 0;

  const categories: Record<string, number> = {};
  const extraKeysFreq: Record<string, number> = {};
  const sampleProblems: Array<{ id: string; title: string; status: string; issueOrError: string }> = [];

  const schemaKeys = new Set(Object.keys(ExperienceMetadataSchema.shape));

  rows.forEach(row => {
    // Contagem de categorias
    const cat = row.category || "Sem Categoria";
    categories[cat] = (categories[cat] || 0) + 1;

    const result = parseExperienceMetadata(row.short_description);

    switch (result.status) {
      case "empty":
        emptyCount++;
        break;
      case "valid":
        validCount++;
        break;
      case "incomplete":
        incompleteCount++;
        break;
      case "repaired":
        repairedCount++;
        break;
      case "schema_error":
        schemaErrorCount++;
        if (sampleProblems.length < 5) {
          sampleProblems.push({
            id: row.id,
            title: row.title,
            status: "Erro de Schema",
            issueOrError: result.issues.join(", ")
          });
        }
        break;
      case "plain_text":
        plainTextCount++;
        if (sampleProblems.length < 5) {
          sampleProblems.push({
            id: row.id,
            title: row.title,
            status: "Texto Comum",
            issueOrError: "O conteúdo não é um JSON válido: '" + (row.short_description || "").substring(0, 40) + "...'"
          });
        }
        break;
      case "invalid_json":
        invalidJsonCount++;
        if (sampleProblems.length < 5) {
          sampleProblems.push({
            id: row.id,
            title: row.title,
            status: "JSON Inválido",
            issueOrError: result.error
          });
        }
        break;
    }

    // Se possui dados de metadados
    if (result.data) {
      if (result.data.tags && result.data.tags.length > 0) hasTags++;
      if (result.data.personaWeights) hasPersonaWeights++;
      if (result.data.companionshipCompatibility) hasCompanionshipCompatibility++;
      if (result.data.is_must_see) hasMustSee++;

      // Contagem de chaves extras desconhecidas
      const dataObj = result.data as Record<string, unknown>;
      Object.keys(dataObj).forEach(key => {
        if (!schemaKeys.has(key)) {
          extraKeysFreq[key] = (extraKeysFreq[key] || 0) + 1;
        }
      });
    }
  });

  // Exibição do Relatório (Sem expor credenciais)
  console.log("====================================================");
  console.log(`📊 TOTAL DE REGISTROS ANALISADOS: ${total}`);
  console.log("====================================================");
  console.log(`🟢 JSON Válido Completo:   ${validCount} (${((validCount/total)*100).toFixed(1)}%)`);
  console.log(`🟡 JSON Incompleto (Default): ${incompleteCount} (${((incompleteCount/total)*100).toFixed(1)}%)`);
  console.log(`🟠 JSON Reparado (Curado):   ${repairedCount} (${((repairedCount/total)*100).toFixed(1)}%)`);
  console.log(`🟤 Falha de Schema (Graves): ${schemaErrorCount} (${((schemaErrorCount/total)*100).toFixed(1)}%)`);
  console.log(`⚪ short_description Vazio:  ${emptyCount} (${((emptyCount/total)*100).toFixed(1)}%)`);
  console.log(`🔵 Texto Comum (Legado):     ${plainTextCount} (${((plainTextCount/total)*100).toFixed(1)}%)`);
  console.log(`🔴 JSON Sintaxe Corrompida:  ${invalidJsonCount} (${((invalidJsonCount/total)*100).toFixed(1)}%)`);
  console.log("----------------------------------------------------");
  console.log("🧠 Cobertura de Campos de Inteligência:");
  console.log(`- Com Tags de Interesse:     ${hasTags}`);
  console.log(`- Com Pesos de Personas:     ${hasPersonaWeights}`);
  console.log(`- Com Compatibilidade Comp.:  ${hasCompanionshipCompatibility}`);
  console.log(`- Marcados como Must See:    ${hasMustSee}`);
  console.log("----------------------------------------------------");
  console.log("📁 Categorias de Catálogo Encontradas:");
  Object.entries(categories).forEach(([name, count]) => {
    console.log(`- ${name}: ${count} itens`);
  });
  console.log("----------------------------------------------------");
  console.log("🔍 Chaves Extras Desconhecidas Detectadas:");
  const extraEntries = Object.entries(extraKeysFreq).sort((a, b) => b[1] - a[1]);
  if (extraEntries.length > 0) {
    extraEntries.forEach(([key, freq]) => {
      console.log(`- '${key}': aparece em ${freq} registros`);
    });
  } else {
    console.log("Nenhuma chave adicional fora do schema Zod foi encontrada.");
  }
  
  if (sampleProblems.length > 0) {
    console.log("\n====================================================");
    console.log("🚨 AMOSTRA DE REGISTROS PROBLEMÁTICOS/LEGADOS (Max 5):");
    console.log("====================================================");
    sampleProblems.forEach((p, idx) => {
      console.log(`${idx + 1}. ID: [${p.id}] | Título: "${p.title}"`);
      console.log(`   Status: [${p.status}] | Detalhes: ${p.issueOrError}\n`);
    });
  }

  console.log("====================================================");
  console.log("✅ Auditoria finalizada.");
}

runAudit().catch(err => {
  console.error("Ocorreu um erro catastrófico na execução:", err);
});
