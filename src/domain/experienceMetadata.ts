import { z } from "zod";

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

// --- Main Schema ---
// Passthrough é utilizado para preservar campos adicionais sem apagá-los silenciosamente ao resalvar
export const ExperienceMetadataSchema = z.object({
  rating: z.number().nullable().optional().default(null),
  reviews_count: z.number().nullable().optional().default(null),
  tags: z.array(z.string()).default([]),
  reservation_required: z.boolean().default(false),
  exclusivityLevel: z.string().default("accessible"),
  recommendedSeasons: z.array(z.string()).default(["all"]),
  weatherCompatibility: z.array(z.string()).default(["all"]),
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
  is_must_see: z.boolean().default(false),
});

export type ExperienceMetadata = z.infer<typeof ExperienceMetadataSchema>;

// --- Defaults centralizados e Imutáveis ---
export function createDefaultExperienceMetadata(): ExperienceMetadata {
  return {
    rating: null,
    reviews_count: null,
    tags: [],
    reservation_required: false,
    exclusivityLevel: "accessible",
    recommendedSeasons: ["all"],
    weatherCompatibility: ["all"],
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
    is_must_see: false,
  };
}

// --- Tipos de Resultados de Parse ---

export type ExperienceMetadataParseResult =
  | {
      status: 'valid';
      data: ExperienceMetadata & Record<string, unknown>;
      unknownFields: string[];
      original: string;
    }
  | {
      status: 'incomplete';
      data: ExperienceMetadata & Record<string, unknown>;
      unknownFields: string[];
      original: string;
      issues: string[];
    }
  | {
      status: 'repaired';
      data: ExperienceMetadata & Record<string, unknown>;
      unknownFields: string[];
      original: string;
      issues: string[];
    }
  | {
      status: 'schema_error';
      data: null;
      original: string;
      issues: string[];
    }
  | {
      status: 'empty';
      data: ExperienceMetadata;
      original: null | '';
    }
  | {
      status: 'plain_text';
      data: null;
      original: string;
    }
  | {
      status: 'invalid_json';
      data: null;
      original: string;
      error: string;
    };

// --- Helpers de Chaves Desconhecidas ---

function getUnknownFields(obj: Record<string, unknown>): string[] {
  const schemaKeys = new Set(Object.keys(ExperienceMetadataSchema.shape));
  return Object.keys(obj).filter(key => !schemaKeys.has(key));
}

// --- Parser ---

export function parseExperienceMetadata(raw: string | null | undefined): ExperienceMetadataParseResult {
  // CRITICAL WARNING / FONTES DE VERDADE: 
  // 1. short_description nos 108 registros ativos do Supabase contém apenas texto editorial legível.
  // 2. Esta camada NÃO autoriza sobrescrever esse texto com JSON e nenhuma conversão automática deve ser feita na base.
  // 3. Integrações futuras precisam preservar e não destruir o texto se não houver metadados ricos em JSON.
  // 4. No futuro, os metadados de inteligência deverão ser migrados para uma coluna dedicada própria (ex: intelligence_metadata).

  if (raw === null || raw === undefined || raw.trim() === '') {
    return {
      status: 'empty',
      data: createDefaultExperienceMetadata(),
      original: raw ?? '',
    };
  }

  let parsedVal: unknown;
  try {
    parsedVal = JSON.parse(raw);
  } catch (err: unknown) {
    const trimmed = raw.trim();
    // Se não começar com '{', consideramos texto plano legado do catálogo
    if (!trimmed.startsWith('{')) {
      return {
        status: 'plain_text',
        data: null,
        original: raw,
      };
    }
    const message = err instanceof Error ? err.message : 'JSON.parse falhou';
    return {
      status: 'invalid_json',
      data: null,
      original: raw,
      error: message,
    };
  }

  if (typeof parsedVal !== 'object' || parsedVal === null || Array.isArray(parsedVal)) {
    return {
      status: 'invalid_json',
      data: null,
      original: raw,
      error: 'JSON parseado não é um objeto',
    };
  }

  const parsedObj = parsedVal as Record<string, unknown>;
  const unknownFields = getUnknownFields(parsedObj);

  // 1. Validação utilizando passthrough para reter chaves desconhecidas
  const firstParse = ExperienceMetadataSchema.passthrough().safeParse(parsedObj);

  if (firstParse.success) {
    const issues: string[] = [];
    const schemaKeys = Object.keys(ExperienceMetadataSchema.shape);
    
    // Identificar chaves do schema que vieram ausentes no payload original e receberam defaults
    schemaKeys.forEach(key => {
      if (!(key in parsedObj)) {
        issues.push(`Campo ausente '${key}' preenchido com default.`);
      }
    });

    if (issues.length > 0) {
      return {
        status: 'incomplete',
        data: firstParse.data as ExperienceMetadata & Record<string, unknown>,
        unknownFields,
        original: raw,
        issues,
      };
    }

    return {
      status: 'valid',
      data: firstParse.data as ExperienceMetadata & Record<string, unknown>,
      unknownFields,
      original: raw,
    };
  }

  // 2. Recuperação de erros de validação de tipo de forma estruturada e segura
  const issues = firstParse.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
  
  // Criamos fallback mesclando com defaults de forma a desvincular referências
  const defaultMeta = createDefaultExperienceMetadata();
  const repairedObj: Record<string, unknown> = { ...defaultMeta, ...parsedObj };

  // Substitui cirurgicamente no repairedObj os campos que falharam no Zod por seus defaults correspondentes
  firstParse.error.errors.forEach(err => {
    const path = err.path;
    if (path.length === 0) return;

    const rootKey = path[0];
    // Se o erro for na raiz do tipo, ou dentro de um array como tags, recommendedSeasons, weatherCompatibility
    if (path.length === 1 || rootKey === 'tags' || rootKey === 'recommendedSeasons' || rootKey === 'weatherCompatibility') {
      const defaultVal = (defaultMeta as Record<string, unknown>)[rootKey];
      
      // Clone profundo raso para arrays e subobjetos defaults
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
      if (parentKey === 'personaWeights' || parentKey === 'companionshipCompatibility') {
        const parentDefault = (defaultMeta as Record<string, unknown>)[parentKey] as Record<string, unknown>;
        const parentCurrent = repairedObj[parentKey];
        const parentObj = (typeof parentCurrent === 'object' && parentCurrent !== null && !Array.isArray(parentCurrent))
          ? { ...(parentCurrent as Record<string, unknown>) }
          : { ...parentDefault };
        
        parentObj[childKey] = parentDefault[childKey];
        repairedObj[parentKey] = parentObj;
      }
    }
  });

  // 3. Validar novamente a versão recuperada estruturalmente sem casts
  const secondParse = ExperienceMetadataSchema.passthrough().safeParse(repairedObj);

  if (secondParse.success) {
    return {
      status: 'repaired',
      data: secondParse.data as ExperienceMetadata & Record<string, unknown>,
      unknownFields,
      original: raw,
      issues,
    };
  }

  // 4. Falha irrecuperável de estrutura
  const finalIssues = secondParse.error.errors.map(err => `Recuperação: ${err.path.join('.')}: ${err.message}`);
  return {
    status: 'schema_error',
    data: null,
    original: raw,
    issues: [...issues, ...finalIssues],
  };
}

// --- Serializer ---

export type ExperienceMetadataSerializeResult =
  | {
      status: 'success';
      json: string;
    }
  | {
      status: 'error';
      error: string;
    };

export function serializeExperienceMetadata(metadata: unknown): ExperienceMetadataSerializeResult {
  if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
    return {
      status: 'error',
      error: 'Metadata deve ser um objeto',
    };
  }

  const result = ExperienceMetadataSchema.passthrough().safeParse(metadata);
  if (!result.success) {
    const errorMsg = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
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
    const message = err instanceof Error ? err.message : 'JSON.stringify falhou';
    return {
      status: 'error',
      error: message,
    };
  }
}
