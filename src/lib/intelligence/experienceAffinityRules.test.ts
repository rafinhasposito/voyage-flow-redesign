import { describe, it, expect } from 'vitest';
import { calculateAffinityV1 } from './experienceAffinityRules';
import { supabase } from '../supabase';
import { buildExperiencePayload, mapNodeToFormState, defaultForm } from '../experienceUtils';
import { FormState } from '../../pages/admin/ExperienceEditor';

describe('Motor de Afinidade V1', () => {
  it('deve calcular corretamente sem evidencias vazias forçarem 50', () => {
    const formMock = {
      title: "Central Park Carriage Tour",
      media_urls: ["img1", "img2", "img3"],
      is_must_see: true,
      tags: ["natureza", "parque", "romântico", "casal"],
      base_cost: 150,
      exclusivity_level: "premium",
      dress_code: "smart_casual",
      reservation_required: true,
      reviews_count: 25,
      neighborhood: "Manhattan",
      duration_minutes: 130,
      type: "attractions"
    };

    const result = calculateAffinityV1(formMock);
    console.log("=== RESULTADO DA IA V1 ===");
    console.log(JSON.stringify(result, null, 2));

    expect(result.personaWeights.explorador_visual.score).not.toBeNull();
    expect(result.personaWeights.aproveitador.score).toBeNull();
  });
});

describe('Persistência (Integração Lógica)', () => {
  it('deve preservar intelligence_metadata corretamente, sem defaults visuais sobrescrevendo o db', async () => {
    
    // Simula um registro bruto que veio do banco, SEM dados de intelligence, apenas null
    const recordFromDB = {
      id: "123",
      title: "Teste",
      status: "published",
      intelligence_metadata: null
    };
    
    console.log("=== TESTE DE PERSISTÊNCIA ===");
    console.log(`Usando registro ID: ${recordFromDB.id} | Status: ${recordFromDB.status}`);
    console.log("Valores Iniciais (intelligence_metadata):", JSON.stringify(recordFromDB.intelligence_metadata, null, 2));

    // O Frontend mapeia esse JSON para o formulário
    const parsedForm = mapNodeToFormState(recordFromDB, defaultForm) as FormState;

    // O Admin edita manualmente os sliders:
    parsedForm.personaWeights.explorador_visual = 85; 
    parsedForm.companionshipCompatibility.couple = 90;
    parsedForm.manualOverride = true;

    // Geramos o Payload para envio:
    const payloadToSave = buildExperiencePayload(parsedForm);
    console.log("\nPayload que será enviado ao Supabase:");
    console.log(JSON.stringify(payloadToSave.intelligence_metadata, null, 2));
    
    // O banco armazena isso no JSONB
    // Simulamos a releitura que o Supabase faria (retorna JSON parseado)
    const storedMetadata = JSON.parse(JSON.stringify(payloadToSave.intelligence_metadata));
    
    // Mapeamos de volta como o Frontend faria ao abrir a página
    const reFetchedRecord = { ...recordFromDB, intelligence_metadata: storedMetadata };
    const refetchedForm = mapNodeToFormState(reFetchedRecord, defaultForm) as FormState;
    
    console.log("\n=== RESULTADOS APÓS REABERTURA ===");
    console.log("Visual Final (Esperado: 85):", refetchedForm.personaWeights.explorador_visual);
    console.log("Casal Final (Esperado: 90):", refetchedForm.companionshipCompatibility.couple);
    console.log("Aproveitador (Esperado: null):", refetchedForm.personaWeights.aproveitador);
    console.log("Status Final (Esperado: published):", payloadToSave.status);
    
    expect(refetchedForm.personaWeights.explorador_visual).toBe(85);
    expect(refetchedForm.companionshipCompatibility.couple).toBe(90);
    expect(refetchedForm.personaWeights.aproveitador).toBeNull();
  });
});
