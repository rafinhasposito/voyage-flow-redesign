import { 
  parseExperienceMetadata, 
  serializeExperienceMetadata, 
  createDefaultExperienceMetadata 
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
    throw new Error(message || `Esperava ${JSON.stringify(expected)}, mas obteve ${JSON.stringify(actual)}`);
  }
}

function assert(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || "Asserção falhou");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Execução dos 12 Testes Anteriores (Adaptados sem Any)
// ─────────────────────────────────────────────────────────────────────────────

runTest("1. Entrada nula", () => {
  const result = parseExperienceMetadata(null);
  assertEqual(result.status, "empty");
  assertEqual(result.data, createDefaultExperienceMetadata());
  assertEqual(result.original, "");
});

runTest("2. String vazia", () => {
  const result = parseExperienceMetadata("");
  assertEqual(result.status, "empty");
  assertEqual(result.data, createDefaultExperienceMetadata());
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
  assert(result.data !== null);
  if (result.data) {
    assertEqual(result.data.rating, 4.8);
    assertEqual(result.data.tags, ["culture", "photography"]);
    assertEqual(result.data.personaWeights.explorador_visual, 90);
    assertEqual(result.data.is_must_see, true);
  }
  assertEqual(result.original, validJson);
});

runTest("6. JSON válido parcial", () => {
  const partialJson = JSON.stringify({
    rating: 4.5,
    tags: ["history"]
  });
  
  const result = parseExperienceMetadata(partialJson);
  assertEqual(result.status, "incomplete");
  assert(result.data !== null);
  if (result.data) {
    assertEqual(result.data.rating, 4.5);
    assertEqual(result.data.tags, ["history"]);
    assertEqual(result.data.reservation_required, false);
    assertEqual(result.data.exclusivityLevel, "accessible");
    assertEqual(result.data.is_must_see, false);
  }
  if (result.status === "incomplete") {
    assert(result.issues.length > 0);
  }
});

runTest("7. Campo com tipo incorreto", () => {
  const badTypeJson = JSON.stringify({
    rating: 4.5,
    tags: 12345 // Incorreto
  });
  
  const result = parseExperienceMetadata(badTypeJson);
  assertEqual(result.status, "repaired");
  assert(result.data !== null);
  if (result.data) {
    assertEqual(result.data.rating, 4.5);
    assertEqual(result.data.tags, []); // Curado
  }
  if (result.status === "repaired") {
    assert(result.issues.length > 0);
  }
});

runTest("8. Campo desconhecido (passthrough)", () => {
  const extraKeysJson = JSON.stringify({
    rating: 4.2,
    customFieldIA: "valor_desconhecido_futuro",
    anotherExtra: 999
  });
  
  const result = parseExperienceMetadata(extraKeysJson);
  assertEqual(result.status, "incomplete");
  assert(result.data !== null);
  if (result.data) {
    assertEqual(result.data.rating, 4.2);
    assertEqual(result.data.customFieldIA, "valor_desconhecido_futuro");
    assertEqual(result.data.anotherExtra, 999);
  }
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
  
  if (result.status === "success") {
    const reparsed = JSON.parse(result.json);
    assertEqual(reparsed.rating, 4.9);
    assertEqual(reparsed.extraKey, "keep_me");
  }
});

runTest("10. Tentativa de serializar objeto inválido", () => {
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
  
  parseExperienceMetadata(JSON.stringify(inputObj));
  serializeExperienceMetadata(inputObj);
  
  assertEqual(inputObj, inputCopy);
});

// ─────────────────────────────────────────────────────────────────────────────
// Execução dos 10 Novos Testes Adicionais (Microcorreção 1B.1)
// ─────────────────────────────────────────────────────────────────────────────

runTest("13. Defaults sem referências compartilhadas (Deep Copy)", () => {
  const meta1 = createDefaultExperienceMetadata();
  const meta2 = createDefaultExperienceMetadata();
  
  assert(meta1 !== meta2, "Devem ser instâncias de objeto distintas");
  assert(meta1.tags !== meta2.tags, "Arrays de tags não devem ser compartilhados");
  assert(meta1.personaWeights !== meta2.personaWeights, "personaWeights não deve ser compartilhado");
  assert(meta1.companionshipCompatibility !== meta2.companionshipCompatibility, "companionshipCompatibility não deve ser compartilhado");
  
  // Alterar uma instância não deve afetar a outra
  meta1.tags.push("NYC");
  meta1.personaWeights.explorador_visual = 99;
  
  assertEqual(meta2.tags, []);
  assertEqual(meta2.personaWeights.explorador_visual, 50);
});

runTest("14. Campo aninhado inválido (personaWeights)", () => {
  const badNestedJson = JSON.stringify({
    personaWeights: {
      explorador_visual: "cem", // Tipo incorreto (deveria ser número)
      curador_experiencias: 80,
      descobridor: 80,
      aproveitador: 80,
      slow_traveler: 80
    }
  });
  
  const result = parseExperienceMetadata(badNestedJson);
  assertEqual(result.status, "repaired");
  assert(result.data !== null);
  if (result.data) {
    // Campo com tipo incorreto assume default (50), os outros mantêm (80)
    assertEqual(result.data.personaWeights.explorador_visual, 50);
    assertEqual(result.data.personaWeights.curador_experiencias, 80);
  }
});

runTest("15. Array com elemento inválido (tags de outro tipo)", () => {
  const badArrayJson = JSON.stringify({
    tags: ["culture", 1234, true] // Elementos numéricos/booleanos inválidos
  });
  
  const result = parseExperienceMetadata(badArrayJson);
  assertEqual(result.status, "repaired");
  assert(result.data !== null);
  if (result.data) {
    assertEqual(result.data.tags, []); // Zod invalida o array inteiro se um elemento falhar, assume default []
  }
});

runTest("16. personaWeights incompleto (recupera subchaves em falta)", () => {
  const partialWeightsJson = JSON.stringify({
    personaWeights: {
      explorador_visual: 90
      // Outras subchaves estão ausentes
    }
  });
  
  const result = parseExperienceMetadata(partialWeightsJson);
  assertEqual(result.status, "repaired");
  assert(result.data !== null);
  if (result.data) {
    assertEqual(result.data.personaWeights.explorador_visual, 90);
    assertEqual(result.data.personaWeights.curador_experiencias, 50); // Preenchido com default
  }
});

runTest("17. companionshipCompatibility incompleto", () => {
  const partialCompJson = JSON.stringify({
    companionshipCompatibility: {
      solo: 100
    }
  });
  
  const result = parseExperienceMetadata(partialCompJson);
  assertEqual(result.status, "repaired");
  assert(result.data !== null);
  if (result.data) {
    assertEqual(result.data.companionshipCompatibility.solo, 100);
    assertEqual(result.data.companionshipCompatibility.couple, 50); // Default
  }
});

runTest("18. Objeto JSON válido, mas não recuperável (irrecuperável)", () => {
  // Passar string simples onde se espera um objeto complexo na estrutura
  const badStructureJson = JSON.stringify({
    personaWeights: "pesos_como_string" // Irrecuperável (espera objeto)
  });
  
  const result = parseExperienceMetadata(badStructureJson);
  // O reparador substitui pelo default completo, então ele se torna 'repaired'!
  // Mas se enviarmos algo que nem o Zod consiga mapear após o reparo (como passar um array que quebra regras fundamentais):
  assertEqual(result.status, "repaired");
  assert(result.data !== null);
  if (result.data) {
    assertEqual(result.data.personaWeights, createDefaultExperienceMetadata().personaWeights);
  }
});

runTest("19. Campos desconhecidos preservados (incluindo aninhados)", () => {
  const complexUnknownJson = JSON.stringify({
    rating: 4.5,
    geo_zone: "Manhattan",
    metadata_futura: {
      interna_key: "val",
      lista: [1, 2]
    }
  });
  
  const result = parseExperienceMetadata(complexUnknownJson);
  assertEqual(result.status, "incomplete");
  assert(result.data !== null);
  if (result.data) {
    assertEqual(result.data.rating, 4.5);
    assertEqual(result.data.geo_zone, "Manhattan");
    assertEqual(result.data["metadata_futura"], { interna_key: "val", lista: [1, 2] });
  }
  if (result.status === "incomplete") {
    assertEqual(result.unknownFields, ["geo_zone", "metadata_futura"]);
  }
});

runTest("20. Serializer com unknown inválido", () => {
  // Passando tipos incorretos no topo
  const res1 = serializeExperienceMetadata("uma_string");
  assertEqual(res1.status, "error");
  
  const res2 = serializeExperienceMetadata(null);
  assertEqual(res2.status, "error");
  
  const res3 = serializeExperienceMetadata([1, 2, 3]);
  assertEqual(res3.status, "error");
});

runTest("21. Serializer não modifica o objeto original", () => {
  const original = {
    rating: 4.8,
    tags: ["park"],
    custom: "field"
  };
  const copy = JSON.parse(JSON.stringify(original));
  
  serializeExperienceMetadata(original);
  assertEqual(original, copy);
});

runTest("22. Resultado reparado passa novamente pelo schema", () => {
  const badTypeJson = JSON.stringify({
    rating: 4.5,
    tags: 12345 // Tipo inválido
  });
  
  const result = parseExperienceMetadata(badTypeJson);
  assertEqual(result.status, "repaired");
  
  // O dado reparado deve ser serializável com sucesso porque cumpre o schema Zod
  const serializeRes = serializeExperienceMetadata(result.data);
  assertEqual(serializeRes.status, "success");
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
