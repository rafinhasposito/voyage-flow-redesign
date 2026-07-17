import { describe, it, expect } from 'vitest';
import { normalizeIntelligenceValue, toDisplayPercent, fromDisplayPercent, PERSONA_DISPLAY_LABELS } from './utils';
import fs from 'fs';
import path from 'path';
import { adaptLegacyMetadata, LegacyIntelligenceMetadata } from './legacyAdapter';

describe('Fundação EI-1: Escala Canônica', () => {
  it('0.85 vira 85% na UI (toDisplayPercent)', () => {
    expect(toDisplayPercent(0.85)).toBe(85);
    expect(toDisplayPercent(0)).toBe(0);
    expect(toDisplayPercent(1)).toBe(100);
  });

  it('85% vira 0.85 na persistência (fromDisplayPercent)', () => {
    expect(fromDisplayPercent(85)).toBe(0.85);
    expect(fromDisplayPercent(0)).toBe(0);
    expect(fromDisplayPercent(100)).toBe(1);
  });

  it('null permanece null', () => {
    expect(normalizeIntelligenceValue(null)).toBeNull();
    expect(toDisplayPercent(null)).toBeNull();
    expect(fromDisplayPercent(null)).toBeNull();
    expect(normalizeIntelligenceValue(undefined)).toBeNull();
  });

  it('valor acima de 1 é limitado (normalizeIntelligenceValue)', () => {
    // Se passar 1.5, seria clampado para 1 (ou dividido por 100 se considerarmos legado de % vazado)
    // No nosso utils, value > 1 é dividido por 100
    expect(normalizeIntelligenceValue(85)).toBe(0.85); // fallback para caso legado salvo como 85%
    expect(normalizeIntelligenceValue(120)).toBe(1); // 120 / 100 = 1.2 -> clamp = 1
  });

  it('valor abaixo de 0 é limitado', () => {
    expect(normalizeIntelligenceValue(-0.5)).toBe(0);
    expect(fromDisplayPercent(-50)).toBe(0);
  });
});

describe('Fundação EI-1: Adaptador Legado', () => {
  it('formato legado é adaptado', () => {
    const legacy: LegacyIntelligenceMetadata = {
      personaWeights: {
        explorador_visual: 0.7,
        aproveitador: 0.9,
      },
      companionshipCompatibility: {
        family: null,
        friends: 0.8,
      },
      manualOverride: true,
    };

    const adapted = adaptLegacyMetadata(legacy);

    // source legado vira import
    // confidence legado vira low
    // manual override é preservado
    expect(adapted.personas.explorador_visual.value).toBe(0.7);
    expect(adapted.personas.explorador_visual.source).toBe("import");
    expect(adapted.personas.explorador_visual.confidence).toBe("low");
    expect(adapted.personas.explorador_visual.manual_override).toBe(true);
    expect(adapted.personas.explorador_visual.evidences).toEqual([]);

    // null é preservado
    expect(adapted.companionship.family.value).toBeNull();

    // friends é preservado
    expect(adapted.companionship.friends.value).toBe(0.8);

    // chave aproveitador é testada e preservada na engine
    expect(adapted.personas.aproveitador.value).toBe(0.9);
    
    // verifica metadados preenchidos corretamente
    expect(adapted.schema_version).toBe("experience-intelligence-v1");
    expect(adapted.rules_version).toBe("affinity-v2");
  });

  it('formato parcial é seguro', () => {
    const legacy: LegacyIntelligenceMetadata = {
      personaWeights: {
        explorador_visual: 0.7,
      },
      companionshipCompatibility: {
        family: null,
      },
      manualOverride: false,
    };

    const adapted = adaptLegacyMetadata(legacy);

    // presentes mantêm "low" e valor
    expect(adapted.personas.explorador_visual.value).toBe(0.7);
    expect(adapted.personas.explorador_visual.confidence).toBe("low");

    // null explícito ganha "none"
    expect(adapted.companionship.family.value).toBeNull();
    expect(adapted.companionship.family.confidence).toBe("none");

    // ausente completo ganha "none" e null
    expect(adapted.companionship.friends.value).toBeNull();
    expect(adapted.companionship.friends.confidence).toBe("none");
    expect(adapted.personas.descobridor.value).toBeNull();
    expect(adapted.personas.descobridor.confidence).toBe("none");
  });
});

describe('Fundação EI-1: Mapa de Labels', () => {
  it('aproveitador é exibido como Entusiasta', () => {
    expect(PERSONA_DISPLAY_LABELS.aproveitador).toBe("Entusiasta");
  });
});

describe('Fundação EI-1: Teste Arquitetural', () => {
  it('nenhum arquivo de inteligência importa páginas React', () => {
    const dir = __dirname;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      
      // Permitimos que este próprio arquivo de teste faça menção ao nome no teste arquitetural
      if (file === 'intelligence.test.ts') continue;
      
      expect(content).not.toMatch(/pages\/admin\/ExperienceEditor/);
      expect(content).not.toMatch(/\bFormState\b/);
      expect(content).not.toMatch(/\/pages\//);
    }
  });
});
