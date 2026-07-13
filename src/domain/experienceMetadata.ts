/* eslint-disable @typescript-eslint/no-explicit-any */
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

// --- Defaults centralizados ---
export const DEFAULT_METADATA: ExperienceMetadata = {
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

// --- Tipos de Resultados de Parse ---

export type ExperienceMetadataParseResult =
  | {
      status: 'valid';
      data: ExperienceMetadata & Record<string, any>;
      original: string;
    }
  | {
      status: 'partial';
      data: ExperienceMetadata & Record<string, any>;
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

// --- Parser ---

export function parseExperienceMetadata(raw: string | null | undefined): ExperienceMetadataParseResult {
  if (raw === null || raw === undefined || raw.trim() === '') {
    return {
      status: 'empty',
      data: { ...DEFAULT_METADATA },
      original: raw ?? '',
    };
  }

  let parsedObj: any;
  try {
    parsedObj = JSON.parse(raw);
  } catch (err: any) {
    const trimmed = raw.trim();
    // Se não se parece com um objeto JSON, consideramos texto plano
    if (!trimmed.startsWith('{') && !trimmed.endsWith('}')) {
      return {
        status: 'plain_text',
        data: null,
        original: raw,
      };
    }
    return {
      status: 'invalid_json',
      data: null,
      original: raw,
      error: err.message || 'JSON.parse falhou',
    };
  }

  if (typeof parsedObj !== 'object' || parsedObj === null || Array.isArray(parsedObj)) {
    return {
      status: 'invalid_json',
      data: null,
      original: raw,
      error: 'JSON parseado não é um objeto',
    };
  }

  // Validação utilizando passthrough para reter chaves desconhecidas e passá-las adiante
  const result = ExperienceMetadataSchema.passthrough().safeParse(parsedObj);

  if (result.success) {
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
        status: 'partial',
        data: result.data,
        original: raw,
        issues,
      };
    }

    return {
      status: 'valid',
      data: result.data,
      original: raw,
    };
  } else {
    // Mapeia erros de validação de tipo do Zod para issues, mas mantém o objeto original sem perder dados
    const issues = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
    
    // Criamos um fallback mesclando com os defaults apenas o que falhou na estrutura
    const fallbackData = { ...DEFAULT_METADATA, ...parsedObj };

    // Substitui cirurgicamente no fallbackData os campos que falharam no Zod por seus defaults correspondentes
    result.error.errors.forEach(err => {
      const path = err.path;
      if (path.length === 1) {
        const key = path[0] as keyof ExperienceMetadata;
        (fallbackData as any)[key] = DEFAULT_METADATA[key];
      } else if (path.length === 2) {
        const parentKey = path[0] as keyof ExperienceMetadata;
        const childKey = path[1];
        if (parentKey === 'personaWeights' || parentKey === 'companionshipCompatibility') {
          (fallbackData as any)[parentKey] = {
            ...(fallbackData[parentKey] as any),
            [childKey]: (DEFAULT_METADATA[parentKey] as any)[childKey]
          };
        }
      }
    });

    return {
      status: 'partial',
      data: fallbackData,
      original: raw,
      issues,
    };
  }
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

export function serializeExperienceMetadata(metadata: any): ExperienceMetadataSerializeResult {
  if (typeof metadata !== 'object' || metadata === null) {
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
  } catch (err: any) {
    return {
      status: 'error',
      error: err.message || 'JSON.stringify falhou',
    };
  }
}
