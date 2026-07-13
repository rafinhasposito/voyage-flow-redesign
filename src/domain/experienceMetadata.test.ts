import {
  parseExperienceMetadata,
  parseExperienceMetadataValue,
  serializeExperienceMetadata,
  createDefaultExperienceMetadata,
} from "./experienceMetadata";

let testsRun = 0;
let testsFailed = 0;

function runTest(name: string, fn: () => void) {
  testsRun++;
  try {
    fn();
    console.log(`✅ Teste passou: ${name}`);
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

// =============================================================================
// GRUPO A — parseExperienceMetadata (string → parse, legado)
// =============================================================================

runTest("A1. Entrada nula → empty", () => {
  const result = parseExperienceMetadata(null);
  assertEqual(result.status, "empty");
  assertEqual(result.data, createDefaultExperienceMetadata());
});

runTest("A2. String vazia → empty", () => {
  const result = parseExperienceMetadata("");
  assertEqual(result.status, "empty");

  const resultWhitespace = parseExperienceMetadata("   ");
  assertEqual(resultWhitespace.status, "empty");
});

runTest("A3. Texto comum (short_description editorial) → plain_text", () => {
  const text = "Museu incrível no coração de Manhattan, cheio de história.";
  const result = parseExperienceMetadata(text);
  assertEqual(result.status, "plain_text");
  assertEqual(result.data, null);
});

runTest("A4. JSON inválido com sintaxe quebrada → invalid_json", () => {
  const brokenJson = "{ personaWeights: broken ";
  const result = parseExperienceMetadata(brokenJson);
  assertEqual(result.status, "invalid_json");
  assertEqual(result.data, null);
});

runTest("A5. parseExperienceMetadata delega ao parseExperienceMetadataValue após parse", () => {
  // Um JSON com apenas personaWeights parcial deve gerar 'repaired' em ambos os parsers
  const raw = JSON.stringify({ personaWeights: { explorador_visual: 90 } });
  const fromString = parseExperienceMetadata(raw);
  const fromValue = parseExperienceMetadataValue(JSON.parse(raw));
  assertEqual(fromString.status, fromValue.status);
  assertEqual(fromString.data, fromValue.data);
});

// =============================================================================
// GRUPO B — parseExperienceMetadataValue (JSONB do Supabase)
// =============================================================================

runTest("B1. null → empty com defaults corretos", () => {
  const result = parseExperienceMetadataValue(null);
  assertEqual(result.status, "empty");
  const def = createDefaultExperienceMetadata();
  assertEqual(result.data, def);
  // Confirmar ausência de campos estruturados no default
  assert(!("tags" in (result.data ?? {})), "tags não deve existir no default");
  assert(!("rating" in (result.data ?? {})), "rating não deve existir no default");
  assert(!("reservation_required" in (result.data ?? {})), "reservation_required não deve existir no default");
  assert(!("is_must_see" in (result.data ?? {})), "is_must_see não deve existir no default");
  assert(!("exclusivity_level" in (result.data ?? {})), "exclusivity_level não deve existir no default");
  assert(!("reviews_count" in (result.data ?? {})), "reviews_count não deve existir no default");
});

runTest("B2. undefined → empty", () => {
  const result = parseExperienceMetadataValue(undefined);
  assertEqual(result.status, "empty");
});

runTest("B3. Objeto JSONB completo válido → valid", () => {
  const obj = {
    personaWeights: {
      explorador_visual: 90,
      curador_experiencias: 70,
      descobridor: 80,
      aproveitador: 60,
      slow_traveler: 50,
    },
    companionshipCompatibility: {
      solo: 80,
      couple: 90,
      family: 70,
      friends: 80,
    },
    recommendedSeasons: ["spring", "summer"],
    weatherCompatibility: ["rain", "all"],
  };
  const result = parseExperienceMetadataValue(obj);
  assertEqual(result.status, "valid");
  assert(result.data !== null);
  if (result.data) {
    assertEqual(result.data.personaWeights.explorador_visual, 90);
    assertEqual(result.data.companionshipCompatibility.couple, 90);
    assertEqual(result.data.recommendedSeasons, ["spring", "summer"]);
  }
});

runTest("B4. Objeto JSONB parcial → incomplete com defaults preenchidos", () => {
  const obj = {
    personaWeights: {
      explorador_visual: 75,
      curador_experiencias: 75,
      descobridor: 75,
      aproveitador: 75,
      slow_traveler: 75,
    },
  };
  const result = parseExperienceMetadataValue(obj);
  assertEqual(result.status, "incomplete");
  assert(result.data !== null);
  if (result.data) {
    assertEqual(result.data.personaWeights.explorador_visual, 75);
    // Campos ausentes recebem defaults
    assertEqual(result.data.recommendedSeasons, ["all"]);
    assertEqual(result.data.weatherCompatibility, ["all"]);
  }
  if (result.status === "incomplete") {
    assert(result.issues.length > 0);
  }
});

runTest("B5. Objeto JSONB com campo aninhado inválido → repaired", () => {
  const obj = {
    personaWeights: {
      explorador_visual: "cem", // tipo errado
      curador_experiencias: 80,
      descobridor: 80,
      aproveitador: 80,
      slow_traveler: 80,
    },
    companionshipCompatibility: {
      solo: 50,
      couple: 50,
      family: 50,
      friends: 50,
    },
    recommendedSeasons: ["all"],
    weatherCompatibility: ["all"],
  };
  const result = parseExperienceMetadataValue(obj);
  assertEqual(result.status, "repaired");
  assert(result.data !== null);
  if (result.data) {
    assertEqual(result.data.personaWeights.explorador_visual, 50); // default
    assertEqual(result.data.personaWeights.curador_experiencias, 80); // mantido
  }
});

runTest("B6. Array → invalid_type", () => {
  const result = parseExperienceMetadataValue([1, 2, 3]);
  assertEqual(result.status, "invalid_type");
  assertEqual(result.data, null);
  if (result.status === "invalid_type") {
    assert(result.error.includes("array"));
  }
});

runTest("B7. String → invalid_type", () => {
  const result = parseExperienceMetadataValue("texto simples");
  assertEqual(result.status, "invalid_type");
  assertEqual(result.data, null);
  if (result.status === "invalid_type") {
    assert(result.error.includes("string"));
  }
});

runTest("B8. Número → invalid_type", () => {
  const result = parseExperienceMetadataValue(42);
  assertEqual(result.status, "invalid_type");
  assertEqual(result.data, null);
});

runTest("B9. Boolean → invalid_type", () => {
  const result = parseExperienceMetadataValue(true);
  assertEqual(result.status, "invalid_type");
  assertEqual(result.data, null);
});

runTest("B10. Campos desconhecidos preservados via passthrough", () => {
  const obj = {
    personaWeights: {
      explorador_visual: 60,
      curador_experiencias: 60,
      descobridor: 60,
      aproveitador: 60,
      slow_traveler: 60,
    },
    companionshipCompatibility: {
      solo: 50,
      couple: 50,
      family: 50,
      friends: 50,
    },
    recommendedSeasons: ["all"],
    weatherCompatibility: ["all"],
    campo_ia_futuro: "valor_extra",
    nested_desconhecido: { chave: 42 },
  };
  const result = parseExperienceMetadataValue(obj);
  assertEqual(result.status, "valid");
  if (result.data) {
    assertEqual(result.data["campo_ia_futuro"], "valor_extra");
    assertEqual(result.data["nested_desconhecido"], { chave: 42 });
  }
  if (result.status === "valid") {
    assert(result.unknownFields.includes("campo_ia_futuro"));
    assert(result.unknownFields.includes("nested_desconhecido"));
  }
});

runTest("B11. Objeto de entrada não é modificado", () => {
  const original = {
    personaWeights: {
      explorador_visual: 80,
      curador_experiencias: 80,
      descobridor: 80,
      aproveitador: 80,
      slow_traveler: 80,
    },
  };
  const snapshot = JSON.parse(JSON.stringify(original));
  parseExperienceMetadataValue(original);
  assertEqual(original, snapshot, "O objeto original não deve ser modificado");
});

// =============================================================================
// GRUPO C — Defaults e Imutabilidade
// =============================================================================

runTest("C1. Dois defaults sem referências compartilhadas", () => {
  const meta1 = createDefaultExperienceMetadata();
  const meta2 = createDefaultExperienceMetadata();

  assert(meta1 !== meta2, "Instâncias de objeto distintas");
  assert(meta1.personaWeights !== meta2.personaWeights, "personaWeights não compartilhado");
  assert(meta1.companionshipCompatibility !== meta2.companionshipCompatibility, "companionshipCompatibility não compartilhado");
  assert(meta1.recommendedSeasons !== meta2.recommendedSeasons, "recommendedSeasons não compartilhado");
  assert(meta1.weatherCompatibility !== meta2.weatherCompatibility, "weatherCompatibility não compartilhado");

  meta1.personaWeights.explorador_visual = 99;
  meta1.recommendedSeasons.push("winter");

  assertEqual(meta2.personaWeights.explorador_visual, 50);
  assertEqual(meta2.recommendedSeasons, ["all"]);
});

runTest("C2. Defaults não contêm campos estruturados do banco", () => {
  const def = createDefaultExperienceMetadata();
  const keys = Object.keys(def);
  const forbidden = ["tags", "rating", "reviews_count", "reservation_required", "is_must_see", "exclusivity_level"];
  forbidden.forEach(f => {
    assert(!keys.includes(f), `Campo estruturado '${f}' não deve estar no default flexível`);
  });
});

// =============================================================================
// GRUPO D — Recuperação Estrutural
// =============================================================================

runTest("D1. personaWeights incompleto → repaired com defaults nos campos ausentes", () => {
  const obj = {
    personaWeights: { explorador_visual: 90 }, // faltam 4 subchaves
    companionshipCompatibility: { solo: 60, couple: 60, family: 60, friends: 60 },
    recommendedSeasons: ["all"],
    weatherCompatibility: ["all"],
  };
  const result = parseExperienceMetadataValue(obj);
  assertEqual(result.status, "repaired");
  if (result.data) {
    assertEqual(result.data.personaWeights.explorador_visual, 90);
    assertEqual(result.data.personaWeights.curador_experiencias, 50); // default
  }
});

runTest("D2. companionshipCompatibility incompleto → repaired", () => {
  const obj = {
    personaWeights: { explorador_visual: 50, curador_experiencias: 50, descobridor: 50, aproveitador: 50, slow_traveler: 50 },
    companionshipCompatibility: { solo: 100 }, // faltam 3 subchaves
    recommendedSeasons: ["all"],
    weatherCompatibility: ["all"],
  };
  const result = parseExperienceMetadataValue(obj);
  assertEqual(result.status, "repaired");
  if (result.data) {
    assertEqual(result.data.companionshipCompatibility.solo, 100);
    assertEqual(result.data.companionshipCompatibility.couple, 50); // default
  }
});

runTest("D3. personaWeights como string → repaired com default completo", () => {
  const obj = {
    personaWeights: "pesos_como_string", // irrecuperável individualmente
    companionshipCompatibility: { solo: 50, couple: 50, family: 50, friends: 50 },
    recommendedSeasons: ["all"],
    weatherCompatibility: ["all"],
  };
  const result = parseExperienceMetadataValue(obj);
  assertEqual(result.status, "repaired");
  if (result.data) {
    assertEqual(result.data.personaWeights, createDefaultExperienceMetadata().personaWeights);
  }
});

// =============================================================================
// GRUPO E — Serializer
// =============================================================================

runTest("E1. Serialização válida preserva campos flexíveis e unknown", () => {
  const meta = {
    personaWeights: { explorador_visual: 60, curador_experiencias: 60, descobridor: 60, aproveitador: 60, slow_traveler: 60 },
    companionshipCompatibility: { solo: 50, couple: 50, family: 50, friends: 50 },
    recommendedSeasons: ["all"],
    weatherCompatibility: ["all"],
    extraKey: "keep_me",
  };
  const result = serializeExperienceMetadata(meta);
  assertEqual(result.status, "success");
  if (result.status === "success") {
    const reparsed = JSON.parse(result.json);
    assertEqual(reparsed.personaWeights.explorador_visual, 60);
    assertEqual(reparsed.extraKey, "keep_me");
  }
});

runTest("E2. Tentativa de serializar objeto com valor inválido → error", () => {
  const invalidMeta = {
    personaWeights: {
      explorador_visual: 150, // acima do max(100)
      curador_experiencias: 50,
      descobridor: 50,
      aproveitador: 50,
      slow_traveler: 50,
    },
  };
  const result = serializeExperienceMetadata(invalidMeta);
  assertEqual(result.status, "error");
});

runTest("E3. Serializer não modifica o objeto original", () => {
  const original = {
    personaWeights: { explorador_visual: 80, curador_experiencias: 80, descobridor: 80, aproveitador: 80, slow_traveler: 80 },
    companionshipCompatibility: { solo: 50, couple: 50, family: 50, friends: 50 },
    recommendedSeasons: ["all"],
    weatherCompatibility: ["all"],
    custom: "field",
  };
  const copy = JSON.parse(JSON.stringify(original));
  serializeExperienceMetadata(original);
  assertEqual(original, copy);
});

runTest("E4. Serializer com tipos inválidos no topo → error", () => {
  assertEqual(serializeExperienceMetadata("string").status, "error");
  assertEqual(serializeExperienceMetadata(null).status, "error");
  assertEqual(serializeExperienceMetadata([1, 2]).status, "error");
  assertEqual(serializeExperienceMetadata(42).status, "error");
});

runTest("E5. Resultado reparado é serializável com sucesso", () => {
  const obj = {
    personaWeights: { explorador_visual: "cem", curador_experiencias: 80, descobridor: 80, aproveitador: 80, slow_traveler: 80 },
    companionshipCompatibility: { solo: 50, couple: 50, family: 50, friends: 50 },
    recommendedSeasons: ["all"],
    weatherCompatibility: ["all"],
  };
  const parseResult = parseExperienceMetadataValue(obj);
  assertEqual(parseResult.status, "repaired");
  const serializeResult = serializeExperienceMetadata(parseResult.data);
  assertEqual(serializeResult.status, "success");
});

// =============================================================================
// GRUPO F — Identidade dos campos do schema flexível
// =============================================================================

runTest("F1. personaWeights usa os identificadores corretos da Engine", () => {
  const def = createDefaultExperienceMetadata();
  const keys = Object.keys(def.personaWeights);
  const expected = ["explorador_visual", "curador_experiencias", "descobridor", "aproveitador", "slow_traveler"];
  expected.forEach(k => {
    assert(keys.includes(k), `Chave '${k}' deve existir em personaWeights`);
  });
  assertEqual(keys.length, expected.length);
});

runTest("F2. companionshipCompatibility usa os identificadores corretos da Engine", () => {
  const def = createDefaultExperienceMetadata();
  const keys = Object.keys(def.companionshipCompatibility);
  const expected = ["solo", "couple", "family", "friends"];
  expected.forEach(k => {
    assert(keys.includes(k), `Chave '${k}' deve existir em companionshipCompatibility`);
  });
  assertEqual(keys.length, expected.length);
});

// =============================================================================
// Relatório Final
// =============================================================================

console.log("\n========================================");
console.log(`Relatório de Testes: ${testsRun - testsFailed}/${testsRun} passaram.`);
console.log("========================================");

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
