/* eslint-disable @typescript-eslint/no-explicit-any */
import { 
  parseExperienceMetadata, 
  serializeExperienceMetadata, 
  DEFAULT_METADATA 
} from "./experienceMetadata";

let testsRun = 0;
let testsFailed = 0;

function runTest(name: string, fn: () => void) {
  testsRun++;
  try {
    fn();
    console.log(`✅ Teste passou: ${name}`);
  } catch (error: any) {
    testsFailed++;
    console.error(`❌ Teste FALHOU: ${name}`);
    console.error(error);
  }
}

function assertEqual(actual: any, expected: any, message?: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(message || `Esperava ${JSON.stringify(expected)}, mas obteve ${JSON.stringify(actual)}`);
  }
}

function assert(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || "Asserção falhou");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Execução dos Testes
// ─────────────────────────────────────────────────────────────────────────────

runTest("1. Entrada nula", () => {
  const result = parseExperienceMetadata(null);
  assertEqual(result.status, "empty");
  assertEqual(result.data, DEFAULT_METADATA);
  assertEqual(result.original, "");
});

runTest("2. String vazia", () => {
  const result = parseExperienceMetadata("");
  assertEqual(result.status, "empty");
  assertEqual(result.data, DEFAULT_METADATA);
  assertEqual(result.original, "");
  
  const resultWhitespace = parseExperienceMetadata("   ");
  assertEqual(resultWhitespace.status, "empty");
});

runTest("3. Texto comum", () => {
  const text = "Este é um texto descritivo comum do catálogo antigo.";
  const result = parseExperienceMetadata(text);
  assertEqual(result.status, "plain_text");
  assertEqual(result.data, null);
  assertEqual(result.original, text);
});

runTest("4. JSON inválido", () => {
  const brokenJson = "{ rating: 4.5, tags: [broken ";
  const result = parseExperienceMetadata(brokenJson);
  assertEqual(result.status, "invalid_json");
  assertEqual(result.data, null);
  assertEqual(result.original, brokenJson);
  assert(typeof result.error === "string");
});

runTest("5. JSON válido completo", () => {
  const validJson = JSON.stringify({
    rating: 4.8,
    reviews_count: 150,
    tags: ["culture", "photography"],
    reservation_required: true,
    exclusivityLevel: "premium",
    recommendedSeasons: ["spring"],
    weatherCompatibility: ["all"],
    personaWeights: {
      explorador_visual: 90,
      curador_experiencias: 70,
      descobridor: 80,
      aproveitador: 60,
      slow_traveler: 50
    },
    companionshipCompatibility: {
      solo: 80,
      couple: 90,
      family: 70,
      friends: 80
    },
    is_must_see: true
  });
  
  const result = parseExperienceMetadata(validJson);
  assertEqual(result.status, "valid");
  assertEqual(result.data.rating, 4.8);
  assertEqual(result.data.tags, ["culture", "photography"]);
  assertEqual(result.data.personaWeights.explorador_visual, 90);
  assertEqual(result.data.is_must_see, true);
  assertEqual(result.original, validJson);
});

runTest("6. JSON válido parcial (campos ausentes recebem defaults)", () => {
  const partialJson = JSON.stringify({
    rating: 4.5,
    tags: ["history"]
  });
  
  const result = parseExperienceMetadata(partialJson);
  assertEqual(result.status, "partial");
  assertEqual(result.data.rating, 4.5);
  assertEqual(result.data.tags, ["history"]);
  // Campo ausente assume default
  assertEqual(result.data.reservation_required, false);
  assertEqual(result.data.exclusivityLevel, "accessible");
  assertEqual(result.data.is_must_see, false);
  assert(result.issues.length > 0);
});

runTest("7. Campo com tipo incorreto", () => {
  // tags deveria ser string[], mas enviamos um número
  const badTypeJson = JSON.stringify({
    rating: 4.5,
    tags: 12345 // Incorreto
  });
  
  const result = parseExperienceMetadata(badTypeJson);
  assertEqual(result.status, "partial");
  // O parser gera fallback unindo os campos válidos sem quebrar o objeto
  assertEqual(result.data.rating, 4.5);
  assertEqual(result.data.tags, []); // Assume default do schema para o campo que falhou
  assert(result.issues.length > 0);
  assert(result.issues.some(issue => issue.includes("tags")));
});

runTest("8. Campo desconhecido (passthrough)", () => {
  const extraKeysJson = JSON.stringify({
    rating: 4.2,
    customFieldIA: "valor_desconhecido_futuro",
    anotherExtra: 999
  });
  
  const result = parseExperienceMetadata(extraKeysJson);
  // É considerado partial porque faltam chaves do schema, mas as chaves adicionais devem ser mantidas
  assertEqual(result.status, "partial");
  assertEqual(result.data.rating, 4.2);
  assertEqual((result.data as any).customFieldIA, "valor_desconhecido_futuro");
  assertEqual((result.data as any).anotherExtra, 999);
});

runTest("9. Serialização válida", () => {
  const meta = {
    rating: 4.9,
    reviews_count: 200,
    tags: ["nature"],
    reservation_required: false,
    exclusivityLevel: "accessible",
    recommendedSeasons: ["all"],
    weatherCompatibility: ["all"],
    personaWeights: {
      explorador_visual: 60,
      curador_experiencias: 60,
      descobridor: 60,
      aproveitador: 60,
      slow_traveler: 60
    },
    companionshipCompatibility: {
      solo: 50,
      couple: 50,
      family: 50,
      friends: 50
    },
    is_must_see: false,
    extraKey: "keep_me"
  };
  
  const result = serializeExperienceMetadata(meta);
  assertEqual(result.status, "success");
  
  // Tentar fazer parse do JSON produzido
  const reparsed = JSON.parse(result.json!);
  assertEqual(reparsed.rating, 4.9);
  assertEqual(reparsed.extraKey, "keep_me"); // Verifica se o passthrough funcionou na serialização
});

runTest("10. Tentativa de serializar objeto inválido", () => {
  // personaWeights com valor acima de 100 (inválido no schema)
  const invalidMeta = {
    rating: 4.5,
    personaWeights: {
      explorador_visual: 150, // Inválido (max 100)
      curador_experiencias: 50,
      descobridor: 50,
      aproveitador: 50,
      slow_traveler: 50
    }
  };
  
  const result = serializeExperienceMetadata(invalidMeta);
  assertEqual(result.status, "error");
  assert(result.error !== undefined);
});

runTest("11. Preservação do conteúdo original em caso de erro", () => {
  const brokenJson = "{ invalid }";
  const result = parseExperienceMetadata(brokenJson);
  assertEqual(result.status, "invalid_json");
  assertEqual(result.original, brokenJson);
  assertEqual(result.data, null);
});

runTest("12. Não mutação do objeto de entrada", () => {
  const inputObj = {
    rating: 4.6,
    tags: ["art"]
  };
  const inputCopy = JSON.parse(JSON.stringify(inputObj));
  
  // O parser e o serializer não devem alterar o objeto de entrada original
  parseExperienceMetadata(JSON.stringify(inputObj));
  serializeExperienceMetadata(inputObj);
  
  assertEqual(inputObj, inputCopy);
});

// ─────────────────────────────────────────────────────────────────────────────
// Relatório Final dos Testes
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n========================================");
console.log(`Relatório de Testes: ${testsRun - testsFailed}/${testsRun} passaram.`);
console.log("========================================");

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
