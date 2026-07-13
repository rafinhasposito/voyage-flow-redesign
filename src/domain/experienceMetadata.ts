import { z } from "zod";

// =============================================================================
// FONTES DE VERDADE — LEIA ANTES DE ALTERAR
// =============================================================================
// intelligence_metadata (JSONB) é reservado EXCLUSIVAMENTE para estruturas
// flexíveis que NÃO possuem coluna própria no banco:
//   - personaWeights
//   - companionshipCompatibility
//   - recommendedSeasons
//   - weatherCompatibility
//
// Os seguintes campos possuem COLUNAS ESTRUTURADAS próprias em public.experiences
// e NÃO devem ser duplicados aqui:
//   - tags              → row.tags
//   - rating            → row.rating
//   - reviews_count     → row.reviews_count
//   - reservation_required → row.reservation_required
//   - is_must_see       → row.is_must_see
//   - exclusivity_level → row.exclusivity_level
//
// short_description é texto editorial puro e NUNCA deve ser interpretado
// como JSON pelo Repository, pelo Editor ou por qualquer outra camada.
// =============================================================================

// --- Sub-schemas ---

export const PersonaWeightsSchema = z.object({
  explorador_visual: z.number().min(0).max(100),
  curador_experiencias: z.number().min(0).max(100),
  descobridor: z.number().min(0).max(100),
  aproveitador: z.number().min(0).max(100),
  slow_traveler: z.number().min(0).max(100),
});

export const CompanionshipCompatibilitySchema = z.object({
  solo: z.number().min(0).max(100),
  couple: z.number().min(0).max(100),
  family: z.number().min(0).max(100),
  friends: z.number().min(0).max(100),
});

// --- Schema Flexível (somente campos sem coluna estruturada própria) ---
// Passthrough preserva campos desconhecidos sem apagá-los silenciosamente ao resalvar.
export const ExperienceMetadataSchema = z.object({
  personaWeights: PersonaWeightsSchema.default({
    explorador_visual: 50,
    curador_experiencias: 50,
    descobridor: 50,
    aproveitador: 50,
    slow_traveler: 50,
  }),
  companionshipCompatibility: CompanionshipCompatibilitySchema.default({
    solo: 50,
    couple: 50,
    family: 50,
    friends: 50,
  }),
  recommendedSeasons: z.array(z.string()).default(["all"]),
  weatherCompatibility: z.array(z.string()).default(["all"]),
});

export type ExperienceMetadata = z.infer<typeof ExperienceMetadataSchema>;

// --- Defaults centralizados e Imutáveis ---
// Cada chamada gera novas instâncias de arrays e objetos para evitar
// contaminação de estado entre chamadas.
export function createDefaultExperienceMetadata(): ExperienceMetadata {
  return {
    personaWeights: {
      explorador_visual: 50,
      curador_experiencias: 50,
      descobridor: 50,
      aproveitador: 50,
      slow_traveler: 50,
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
}

// --- Tipos de Resultados de Parse ---

export type ExperienceMetadataParseResult =
  | {
      status: 'valid';
      data: ExperienceMetadata & Record<string, unknown>;
      unknownFields: string[];
    }
  | {
      status: 'incomplete';
      data: ExperienceMetadata & Record<string, unknown>;
      unknownFields: string[];
      issues: string[];
    }
  | {
      status: 'repaired';
      data: ExperienceMetadata & Record<string, unknown>;
      unknownFields: string[];
      issues: string[];
    }
  | {
      status: 'schema_error';
      data: null;
      issues: string[];
    }
  | {
      status: 'empty';
      data: ExperienceMetadata;
    }
  | {
      status: 'plain_text';
      data: null;
    }
  | {
      status: 'invalid_json';
      data: null;
      error: string;
    }
  | {
      status: 'invalid_type';
      data: null;
      error: string;
    };

// --- Helpers de Chaves Desconhecidas ---

function getUnknownFields(obj: Record<string, unknown>): string[] {
  const schemaKeys = new Set(Object.keys(ExperienceMetadataSchema.shape));
  return Object.keys(obj).filter(key => !schemaKeys.has(key));
}

// --- Núcleo de Validação (compartilhado pelos dois parsers) ---

function validateObject(obj: Record<string, unknown>): ExperienceMetadataParseResult {
  const unknownFields = getUnknownFields(obj);

  // 1. Tentativa de validação direta com passthrough
  const firstParse = ExperienceMetadataSchema.passthrough().safeParse(obj);

  if (firstParse.success) {
    const issues: string[] = [];
    const schemaKeys = Object.keys(ExperienceMetadataSchema.shape);

    schemaKeys.forEach(key => {
      if (!(key in obj)) {
        issues.push(`Campo ausente '${key}' preenchido com default.`);
      }
    });

    if (issues.length > 0) {
      return {
        status: 'incomplete',
        data: firstParse.data as ExperienceMetadata & Record<string, unknown>,
        unknownFields,
        issues,
      };
    }

    return {
      status: 'valid',
      data: firstParse.data as ExperienceMetadata & Record<string, unknown>,
      unknownFields,
    };
  }

  // 2. Recuperação estrutural de erros de tipo
  const issues = firstParse.error.errors.map(
    err => `${err.path.join('.')}: ${err.message}`
  );

  const defaultMeta = createDefaultExperienceMetadata();
  const repairedObj: Record<string, unknown> = { ...defaultMeta, ...obj };

  firstParse.error.errors.forEach(err => {
    const path = err.path;
    if (path.length === 0) return;

    const rootKey = path[0];

    if (
      path.length === 1 ||
      rootKey === 'recommendedSeasons' ||
      rootKey === 'weatherCompatibility'
    ) {
      const defaultVal = (defaultMeta as Record<string, unknown>)[rootKey];

      if (Array.isArray(defaultVal)) {
        repairedObj[rootKey] = [...defaultVal];
      } else if (typeof defaultVal === 'object' && defaultVal !== null) {
        repairedObj[rootKey] = { ...defaultVal };
      } else {
        repairedObj[rootKey] = defaultVal;
      }
    } else if (path.length === 2) {
      const parentKey = path[0];
      const childKey = path[1];

      if (
        parentKey === 'personaWeights' ||
        parentKey === 'companionshipCompatibility'
      ) {
        const parentDefault = (defaultMeta as Record<string, unknown>)[
          parentKey
        ] as Record<string, unknown>;
        const parentCurrent = repairedObj[parentKey];
        const parentObj =
          typeof parentCurrent === 'object' &&
          parentCurrent !== null &&
          !Array.isArray(parentCurrent)
            ? { ...(parentCurrent as Record<string, unknown>) }
            : { ...parentDefault };

        parentObj[childKey] = parentDefault[childKey];
        repairedObj[parentKey] = parentObj;
      }
    }
  });

  // 3. Validar novamente a versão recuperada
  const secondParse = ExperienceMetadataSchema.passthrough().safeParse(repairedObj);

  if (secondParse.success) {
    return {
      status: 'repaired',
      data: secondParse.data as ExperienceMetadata & Record<string, unknown>,
      unknownFields,
      issues,
    };
  }

  // 4. Falha irrecuperável
  const finalIssues = secondParse.error.errors.map(
    err => `Recuperação: ${err.path.join('.')}: ${err.message}`
  );

  return {
    status: 'schema_error',
    data: null,
    issues: [...issues, ...finalIssues],
  };
}

// =============================================================================
// parseExperienceMetadataValue
// =============================================================================
// Use para valores vindos de intelligence_metadata (JSONB) do Supabase.
// O valor já foi desserializado pelo cliente — NUNCA execute JSON.parse aqui.
//
// Aceita: null | undefined | object | array | string | number | boolean
//   null / undefined        → empty
//   objeto                  → valid | incomplete | repaired | schema_error
//   array/string/num/bool   → invalid_type
//
// O objeto de entrada nunca é modificado.
// =============================================================================
export function parseExperienceMetadataValue(
  raw: unknown
): ExperienceMetadataParseResult {
  if (raw === null || raw === undefined) {
    return {
      status: 'empty',
      data: createDefaultExperienceMetadata(),
    };
  }

  if (
    typeof raw === 'string' ||
    typeof raw === 'number' ||
    typeof raw === 'boolean' ||
    Array.isArray(raw)
  ) {
    return {
      status: 'invalid_type',
      data: null,
      error: `Tipo inválido para intelligence_metadata JSONB: ${Array.isArray(raw) ? 'array' : typeof raw}`,
    };
  }

  if (typeof raw !== 'object') {
    return {
      status: 'invalid_type',
      data: null,
      error: `Tipo desconhecido: ${typeof raw}`,
    };
  }

  // Cópia rasa para garantir imutabilidade do objeto original
  const obj = { ...(raw as Record<string, unknown>) };

  return validateObject(obj);
}

// =============================================================================
// parseExperienceMetadata (string → parse)
// =============================================================================
// @deprecated para uso com intelligence_metadata. Use parseExperienceMetadataValue().
//
// Mantido para compatibilidade com testes legados e diagnóstico.
// IMPORTANTE: short_description é texto editorial puro. Nunca chame este parser
// com o valor de short_description no Repository ou Editor.
// =============================================================================
export function parseExperienceMetadata(
  raw: string | null | undefined
): ExperienceMetadataParseResult {
  if (raw === null || raw === undefined || raw.trim() === '') {
    return {
      status: 'empty',
      data: createDefaultExperienceMetadata(),
    };
  }

  let parsedVal: unknown;
  try {
    parsedVal = JSON.parse(raw);
  } catch (err: unknown) {
    const trimmed = raw.trim();
    if (!trimmed.startsWith('{')) {
      return {
        status: 'plain_text',
        data: null,
      };
    }
    const message = err instanceof Error ? err.message : 'JSON.parse falhou';
    return {
      status: 'invalid_json',
      data: null,
      error: message,
    };
  }

  // Delega ao parser de valor após JSON.parse para evitar duplicação de lógica
  return parseExperienceMetadataValue(parsedVal);
}

// =============================================================================
// Serializer
// =============================================================================
// Serializa apenas os campos flexíveis de intelligence_metadata.
// Não use para serializar campos estruturados (tags, rating, etc.).
// =============================================================================

export type ExperienceMetadataSerializeResult =
  | {
      status: 'success';
      json: string;
    }
  | {
      status: 'error';
      error: string;
    };

export function serializeExperienceMetadata(
  metadata: unknown
): ExperienceMetadataSerializeResult {
  if (
    typeof metadata !== 'object' ||
    metadata === null ||
    Array.isArray(metadata)
  ) {
    return {
      status: 'error',
      error: 'Metadata deve ser um objeto',
    };
  }

  const result = ExperienceMetadataSchema.passthrough().safeParse(metadata);
  if (!result.success) {
    const errorMsg = result.error.errors
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    return {
      status: 'error',
      error: errorMsg,
    };
  }

  try {
    const json = JSON.stringify(result.data);
    return {
      status: 'success',
      json,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'JSON.stringify falhou';
    return {
      status: 'error',
      error: message,
    };
  }
}
