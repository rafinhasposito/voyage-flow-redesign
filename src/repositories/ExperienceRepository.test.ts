import { ExperienceRepository, ExperienceRow } from "./ExperienceRepository";
import { supabase } from "@/lib/supabase";
import { CacheManager } from "../services/CacheManager";

// Mock para simular o import.meta.env
(globalThis as unknown as { import: unknown }).import = { meta: { env: { VITE_DEMO_MODE: "false", DEV: false } } };

let testsRun = 0;
let testsFailed = 0;

function runTest(name: string, fn: () => void | Promise<void>) {
  testsRun++;
  try {
    const result = fn();
    if (result instanceof Promise) {
      result.then(() => console.log(`✅ Teste passou: ${name}`))
            .catch(error => {
              testsFailed++;
              console.error(`❌ Teste FALHOU: ${name}`);
              console.error(error);
            });
    } else {
      console.log(`✅ Teste passou: ${name}`);
    }
  } catch (error: unknown) {
    testsFailed++;
    console.error(`❌ Teste FALHOU: ${name}`);
    console.error(error);
  }
}

function assertEqual(actual: unknown, expected: unknown, message?: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      message ||
        `Esperava ${JSON.stringify(expected)}, mas obteve ${JSON.stringify(actual)}`
    );
  }
}

function assert(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || "Asserção falhou");
  }
}

// Acesso ao método privado mapRowToModel para testes unitários do mapeamento
const mapRowToModel = (row: Partial<ExperienceRow>) => {
  return (ExperienceRepository as any).mapRowToModel(row as ExperienceRow);
};

// =============================================================================
// GRUPO A — Mapeamento de Colunas Estruturadas
// =============================================================================

runTest("A1. tags, rating, reviews_count, reservation_required", () => {
  const row = {
    tags: ["parque", "natureza"],
    rating: 4.8,
    reviews_count: 1500,
    reservation_required: true,
  };
  const result = mapRowToModel(row);
  assertEqual(result.tags, ["parque", "natureza"]);
  assertEqual(result.rating, 4.8);
  assertEqual(result.reviews_count, 1500);
  assertEqual(result.reservationRequired, true);
});

runTest("A2. is_must_see, exclusivity_level, dress_code", () => {
  const row = {
    is_must_see: true,
    exclusivity_level: "premium",
    dress_code: "smart_casual",
  };
  const result = mapRowToModel(row);
  assertEqual(result.is_must_see, true);
  assertEqual(result.exclusivityLevel, "premium");
  assertEqual(result.dressCode, "smart_casual");
});

runTest("A3. type distinto de category, climate, ideal_companion", () => {
  const row = {
    category: "culture",
    type: "museum",
    climate: "indoor_controlled",
    ideal_companion: "family",
  };
  const result = mapRowToModel(row);
  assertEqual(result.category, "culture");
  assertEqual(result.type, "museum");
  assertEqual(result.climate, "indoor_controlled");
  assertEqual(result.ideal_companion, "family");
});

runTest("A4. Coordenadas iguais a zero (válidas)", () => {
  const row = {
    location_lat: 0,
    location_lng: 0,
  };
  const result = mapRowToModel(row);
  assertEqual(result.coordinates, { lat: 0, lng: 0 });
});

runTest("A5. Coordenadas null", () => {
  const row = {
    location_lat: null,
    location_lng: null,
  };
  const result = mapRowToModel(row);
  assertEqual(result.coordinates, undefined);
});

runTest("A6. media_urls null", () => {
  const row = {
    media_urls: null,
  };
  const result = mapRowToModel(row);
  assertEqual(result.images, []);
  assertEqual(result.image, "");
});

runTest("A7. short_description textual é completamente ignorado", () => {
  const row = {
    short_description: "Um belo texto editorial que não é JSON.",
    intelligence_metadata: null,
  };
  const result = mapRowToModel(row);
  // Se tentasse fazer JSON.parse, daria erro. Como ignoramos, passa.
  // Os pesos devem ser nulos (undefined) pois intelligence_metadata é null.
  assertEqual(result.personaWeights, undefined);
});

// =============================================================================
// GRUPO B — Intelligence Metadata
// =============================================================================

runTest("B1. intelligence_metadata null", () => {
  const row = {
    intelligence_metadata: null,
  };
  const result = mapRowToModel(row);
  assertEqual(result.personaWeights, undefined);
  assertEqual(result.companionshipCompatibility, undefined);
  assertEqual(result.recommendedSeasons, undefined);
  assertEqual(result.weatherCompatibility, undefined);
});

runTest("B2. intelligence_metadata com pesos na escala 0-1 (ideal)", () => {
  const row = {
    intelligence_metadata: {
      personaWeights: { explorador_visual: 0.9, curador_experiencias: 0.8 },
      companionshipCompatibility: { solo: 0.7, couple: 1.0 },
      recommendedSeasons: ["summer"],
    },
  };
  const result = mapRowToModel(row);
  assertEqual(result.personaWeights.explorador_visual, 0.9);
  assertEqual(result.personaWeights.curador_experiencias, 0.8);
  // Default values applied for the rest
  assertEqual(result.personaWeights.descobridor, 0.5); 
  assertEqual(result.companionshipCompatibility.solo, 0.7);
  assertEqual(result.companionshipCompatibility.couple, 1.0);
  assertEqual(result.recommendedSeasons, ["summer"]);
});

runTest("B3. Compatibilidade temporária: pesos em 0-100", () => {
  const row = {
    intelligence_metadata: {
      personaWeights: { explorador_visual: 90, curador_experiencias: 80 },
    },
  };
  const result = mapRowToModel(row);
  // 90 vira 0.9, 80 vira 0.8
  assertEqual(result.personaWeights.explorador_visual, 0.9);
  assertEqual(result.personaWeights.curador_experiencias, 0.8);
});

runTest("B4. Peso inválido (fora da faixa) cai para default", () => {
  const row = {
    intelligence_metadata: {
      personaWeights: { explorador_visual: -10, curador_experiencias: 150 },
    },
  };
  const result = mapRowToModel(row);
  // Fora de 0-100 vira 0.5
  assertEqual(result.personaWeights.explorador_visual, 0.5);
  assertEqual(result.personaWeights.curador_experiencias, 0.5);
});

// =============================================================================
// GRUPO C — Comportamento de Erro e Fallback
// =============================================================================

runTest("C1. Catálogo vazio sem fallback (VITE_DEMO_MODE=false)", async () => {
  // Mock supabase
  const originalSupabase = supabase.from;
  (supabase as any).from = () => ({
    select: () => ({
      eq: () => Promise.resolve({ data: [], error: null })
    })
  });

  CacheManager.invalidate("experiences", 1);
  const data = await ExperienceRepository.forceRefresh();
  assertEqual(data, []);

  // Restore mock
  (supabase as any).from = originalSupabase;
});

runTest("C2. Erro de rede sem fallback (VITE_DEMO_MODE=false)", async () => {
  const originalSupabase = supabase.from;
  (supabase as any).from = () => ({
    select: () => ({
      eq: () => Promise.resolve({ data: null, error: { message: "Network error" } })
    })
  });

  CacheManager.invalidate("experiences", 1);
  try {
    await ExperienceRepository.forceRefresh();
    assert(false, "Deveria ter lançado erro");
  } catch (e: any) {
    assertEqual(e.message, "Network error");
  }

  // Restore mock
  (supabase as any).from = originalSupabase;
});

// Adicionando retardo para exibir resultados corretos
setTimeout(() => {
  console.log("\n========================================");
  console.log(`Relatório de Testes (Repository): ${testsRun - testsFailed}/${testsRun} passaram.`);
  console.log("========================================");
  if (testsFailed > 0) process.exit(1);
  else process.exit(0);
}, 100);
