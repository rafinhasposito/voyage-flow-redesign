import React, { useState } from 'react';
import {
  ExperienceIntelligenceSnapshot
} from '../../../lib/intelligence/experienceIntelligenceSnapshot';
import {
  ChevronDown,
  ChevronUp,
  Info,
  AlertTriangle,
  Zap,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface Props {
  snapshot: ExperienceIntelligenceSnapshot;
  onRecalculate: () => void;
  isRecalculating?: boolean;
}

const translateSource = (source: string, manualOverride: boolean) => {
  if (manualOverride) return "Alterado manualmente";
  switch (source) {
    case "rule": return "Calculado por regras";
    case "human": return "Informado pela curadoria";
    case "import": return "Importado do catálogo anterior";
    case "ai_suggestion": return "Sugestão de IA";
    case "cadastro": return "Informado no cadastro";
    default: return source;
  }
};

const translateConfidence = (confidence: string) => {
  switch (confidence) {
    case "high": return "Alta";
    case "medium": return "Média";
    case "low": return "Baixa";
    case "none": return "Sem confiança calculada";
    default: return confidence;
  }
};

const formatDecimalPtBR = (val: number): string => {
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

const formatIntegerPtBR = (val: number): string => {
  return val.toLocaleString('pt-BR');
};

const translateReviewConfidence = (val: string | null): string => {
  switch (val) {
    case "high": return "Alta";
    case "medium": return "Média";
    case "low": return "Baixa";
    case "none": return "Sem confiança calculada";
    default: return val || "Não informado";
  }
};

const translatePremium = (val: string | null): string => {
  switch (val) {
    case "high": return "Alto";
    case "moderate": return "Moderado";
    case "low": return "Baixo";
    case "none": return "Nenhum";
    default: return val || "Não informado";
  }
};

const translateEditorialPriority = (val: string | null): string => {
  switch (val) {
    case "high": return "Alta";
    case "medium": return "Média";
    case "low": return "Baixa";
    case "none": return "Não definida";
    default: return val || "Não informado";
  }
};

/** Linha de planejamento sem confiança inventada: exibe valor + origem informada no cadastro */
function PlanningRow({ label, value, source }: { label: string; value: string; source: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-zinc-200 rounded-xl mb-3 overflow-hidden bg-white shadow-sm">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 flex-1">
          <span className="font-medium text-zinc-900 min-w-[140px]">{label}</span>
          <span className="font-semibold text-zinc-800">{value}</span>
        </div>
        <button className="text-zinc-400 hover:text-indigo-600 flex items-center gap-1 text-sm font-medium transition-colors">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      {expanded && (
        <div className="p-4 bg-zinc-50 border-t border-zinc-100 text-sm">
          <p className="text-zinc-500 font-medium mb-1 text-xs uppercase tracking-wider">Origem</p>
          <p className="text-zinc-700">{source}</p>
        </div>
      )}
    </div>
  );
}

const translateBoolean = (val: boolean | null | undefined) => {
  if (val === null || val === undefined) return "Não informado";
  return val ? "Sim" : "Não";
};

const getBand = (val: number | null) => {
  if (val === null) return "Não calculado — faltam informações";
  const p = Math.round(val * 100);
  if (p <= 20) return "Muito baixa";
  if (p <= 40) return "Baixa";
  if (p <= 60) return "Moderada";
  if (p <= 80) return "Alta";
  return "Muito alta";
};

function DimensionRow({
  label,
  dimension,
  isPercentage = false
}: {
  label: string;
  dimension: any;
  isPercentage?: boolean
}) {
  const [expanded, setExpanded] = useState(false);

  const isNull = dimension.value === null || dimension.value === undefined;

  let displayValue = isNull ? "Não informado" : String(dimension.value);
  if (isPercentage && !isNull && typeof dimension.value === 'number') {
    displayValue = `${Math.round(dimension.value * 100)}%`;
  }

  const band = isPercentage ? getBand(dimension.value) : null;

  return (
    <div className="border border-zinc-200 rounded-xl mb-3 overflow-hidden bg-white shadow-sm">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 flex-1">
          <span className="font-medium text-zinc-900 min-w-[140px]">{label}</span>
          <div className="flex items-center gap-3">
            <span className={`font-semibold ${isNull ? 'text-zinc-400 font-normal' : 'text-zinc-800'}`}>
              {displayValue}
            </span>
            {band && !isNull && (
              <span className="text-sm text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                {band}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!isNull && dimension.confidence && dimension.confidence !== 'none' && (
            <span className="text-xs text-zinc-400 hidden sm:inline-block">
              Confiança: {translateConfidence(dimension.confidence)}
            </span>
          )}
          <button className="text-zinc-400 hover:text-indigo-600 flex items-center gap-1 text-sm font-medium transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 bg-zinc-50 border-t border-zinc-100 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-zinc-500 font-medium mb-2 text-xs uppercase tracking-wider">Origem & Confiança</p>
              <ul className="space-y-1">
                <li className="text-zinc-700"><span className="text-zinc-400 mr-2">Fonte:</span> {translateSource(dimension.source, dimension.manual_override)}</li>
                <li className="text-zinc-700"><span className="text-zinc-400 mr-2">Confiança:</span> {translateConfidence(dimension.confidence)}</li>
              </ul>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-2 text-xs uppercase tracking-wider">Por que estes resultados?</p>
              {dimension.evidences && dimension.evidences.length > 0 ? (
                <ul className="space-y-1">
                  {dimension.evidences.map((ev: string, idx: number) => (
                    <li key={idx} className="text-zinc-700 flex items-start gap-2">
                      <span className="text-indigo-400 mt-0.5">›</span>
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-400 italic">Nenhuma evidência capturada.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
      {children}
    </span>
  );
}

export function ExperienceIntelligencePanel({ snapshot, onRecalculate, isRecalculating }: Props) {
  const { semantic_profile, affinity_profile, quality_profile, restrictions_profile } = snapshot;

  // Semantic mappings for UI
  const formatMap: Record<string, string> = {
    musical: "Musical", show: "Show", attraction: "Atração", museum: "Museu", park: "Parque",
    tour: "Tour", dining: "Restaurante", nightlife: "Vida Noturna", shopping: "Compras",
    wellness: "Bem-estar", event: "Evento", hotel: "Hospedagem", transportation: "Transporte"
  };
  const themeMap: Record<string, string> = {
    broadway: "Broadway", fantasy: "Fantasia", family: "Familiar", romance: "Romântico",
    history: "Histórico", art: "Arte", culture: "Cultura", local: "Local", iconic: "Icônico",
    mainstream: "Mainstream", hidden_gem: "Achado", luxury: "Luxo", adventure: "Aventura",
    relaxation: "Relaxante", gastronomy: "Gastronomia", entertainment: "Entretenimento", scenic_view: "Vista Panorâmica"
  };
  const envMap: Record<string, string> = { indoor: "Ambiente Interno", outdoor: "Ao Ar Livre", mixed: "Misto" };
  const energyMap: Record<string, string> = { calm: "Calmo", moderate: "Moderado", intense: "Intenso" };
  const famMap: Record<string, string> = { child_focused: "Familiar, com foco em crianças", family_friendly: "Adequado para famílias", neutral: "Neutro", adult_oriented: "Foco adulto" };

  return (
    <div className="bg-zinc-50/50 rounded-2xl border border-zinc-200 p-6 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-zinc-900">IA Concierge</h2>
          </div>
          <p className="text-zinc-600">
            Analisa os dados da experiência e mostra como ela é interpretada pelas regras de recomendação.
          </p>
        </div>
        <button
          onClick={onRecalculate}
          disabled={isRecalculating}
          className="inline-flex items-center justify-center px-4 py-2 bg-lime-400 text-zinc-900 rounded-xl font-medium hover:bg-lime-500 transition-colors disabled:opacity-50 whitespace-nowrap gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRecalculating ? 'animate-spin' : ''}`} />
          {isRecalculating ? "Recalculando..." : "Recalcular diagnóstico"}
        </button>
      </div>

      <div className="bg-indigo-50/50 text-indigo-800 text-sm p-3 rounded-lg flex items-start gap-3 border border-indigo-100">
        <Info className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
        <p>Ajustes editoriais avançados serão conectados após a validação do diagnóstico.</p>
      </div>

      {/* Semantic Profile */}
      <section>
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Perfil da Experiência</h3>
        <div className="flex flex-wrap gap-2">
          <Chip>{formatMap[semantic_profile.experience_format.value as string] || semantic_profile.experience_format.value}</Chip>
          {semantic_profile.themes.value?.map(t => (
            <Chip key={t}>{themeMap[t] || t}</Chip>
          ))}
          <Chip>{envMap[semantic_profile.environment_type.value as string]}</Chip>
          <Chip>{energyMap[semantic_profile.energy_level.value as string]}</Chip>
          <Chip>{famMap[semantic_profile.family_orientation.value as string]}</Chip>
          {semantic_profile.nightlife.value && <Chip>Vida Noturna</Chip>}
          {semantic_profile.alcohol_focused.value && <Chip>Foco em Álcool</Chip>}
        </div>
      </section>

      {/* Affinities */}
      <section>
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Afinidade com Estilos</h3>
        <DimensionRow label="Visual" dimension={affinity_profile.personas.explorador_visual} isPercentage />
        <DimensionRow label="Curador" dimension={affinity_profile.personas.curador_experiencias} isPercentage />
        <DimensionRow label="Entusiasta" dimension={affinity_profile.personas.aproveitador} isPercentage />
        <DimensionRow label="Descobridor" dimension={affinity_profile.personas.descobridor} isPercentage />
        <DimensionRow label="Slow Traveler" dimension={affinity_profile.personas.slow_traveler} isPercentage />
      </section>

      {/* Companionship */}
      <section>
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Adequação por Companhia</h3>
        <DimensionRow label="Solo" dimension={affinity_profile.companionship.solo} isPercentage />
        <DimensionRow label="Casal" dimension={affinity_profile.companionship.couple} isPercentage />
        <DimensionRow label="Amigos" dimension={affinity_profile.companionship.friends} isPercentage />
        <DimensionRow label="Família" dimension={affinity_profile.companionship.family} isPercentage />
      </section>

      {/* Quality and Priority */}
      <section>
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Qualidade e Prioridade</h3>
        <DimensionRow label="Avaliação" dimension={{...quality_profile.quality_score, value: quality_profile.quality_score.value !== null ? formatDecimalPtBR(quality_profile.quality_score.value * 5) : null}} />
        {(() => {
          const rc = quality_profile.review_confidence;
          if (rc.value === null) return <DimensionRow label="Confiança da Avaliação" dimension={{...rc, value: null}} />;
          const translated = translateReviewConfidence(rc.value as string);
          const numMatch = rc.evidences?.[0]?.match(/(\d[\d.]*)/);
          const reviewCount = numMatch ? Number(numMatch[1].replace(/\./g, '')) : 0;
          const displayValue = reviewCount > 0
            ? `${translated} — ${formatIntegerPtBR(reviewCount)} avaliações`
            : translated;
          return <DimensionRow label="Confiança da Avaliação" dimension={{...rc, value: displayValue}} />;
        })()}
        <DimensionRow label="Imperdível (Must See)" dimension={{...quality_profile.editorial_priority, value: quality_profile.editorial_priority.value === 'high' ? 'Sim' : 'Não'}} />
        <DimensionRow label="Prioridade Editorial" dimension={{...quality_profile.editorial_priority, value: translateEditorialPriority(quality_profile.editorial_priority.value as string)}} />
        <DimensionRow label="Posicionamento Premium" dimension={{...quality_profile.premium_positioning, value: translatePremium(quality_profile.premium_positioning.value as string)}} />
        <DimensionRow label="Completude dos Dados" dimension={quality_profile.data_completeness} isPercentage />
        {(() => {
          const rv = quality_profile.planning_requirements.reservation_required;
          const hasVerified = rv.source === 'human' || rv.source === 'import';
          if (hasVerified) {
            return <DimensionRow label="Reserva Necessária" dimension={{...rv, value: translateBoolean(rv.value)}} />;
          }
          return <PlanningRow label="Reserva Necessária" value={translateBoolean(rv.value)} source="Informado no cadastro" />;
        })()}
        {(() => {
          const dc = quality_profile.planning_requirements.dress_code;
          const hasVerified = dc.source === 'human' || dc.source === 'import';
          if (hasVerified) {
            return <DimensionRow label="Dress Code" dimension={dc} />;
          }
          const val = dc.value !== null && dc.value !== undefined ? String(dc.value) : 'Não informado';
          return <PlanningRow label="Dress Code" value={val} source="Informado no cadastro" />;
        })()}
      </section>

      {/* Restrictions */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Restrições Verificadas</h3>
          {restrictions_profile.issues.length > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">
              <AlertCircle className="w-3 h-3" />
              {restrictions_profile.issues.length} alertas detectados
            </span>
          )}
        </div>

        {restrictions_profile.issues.length > 0 && (
          <div className="mb-4 space-y-2">
            {restrictions_profile.issues.map((issue, idx) => (
              <div key={idx} className={`p-3 rounded-lg border flex items-start gap-3 text-sm ${issue.severity === 'error' ? 'bg-pink-50 text-pink-900 border-pink-200' : 'bg-amber-50 text-amber-900 border-amber-200'}`}>
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${issue.severity === 'error' ? 'text-pink-500' : 'text-amber-500'}`} />
                <p>{issue.message}</p>
              </div>
            ))}
          </div>
        )}

        <DimensionRow label="Idade Mínima" dimension={restrictions_profile.min_age} />
        <DimensionRow label="Somente Adultos" dimension={{...restrictions_profile.adult_only, value: translateBoolean(restrictions_profile.adult_only.value)}} />
        <DimensionRow label="Crianças Permitidas" dimension={{...restrictions_profile.family_with_children_allowed, value: translateBoolean(restrictions_profile.family_with_children_allowed.value)}} />
        <DimensionRow label="Tamanho Mín. do Grupo" dimension={restrictions_profile.minimum_group_size} />
        <DimensionRow label="Tamanho Máx. do Grupo" dimension={restrictions_profile.maximum_group_size} />
        <DimensionRow label="Exige Acompanhante" dimension={{...restrictions_profile.requires_companion, value: translateBoolean(restrictions_profile.requires_companion.value)}} />
        <DimensionRow label="Acesso Cadeirantes" dimension={{...restrictions_profile.wheelchair_accessible, value: translateBoolean(restrictions_profile.wheelchair_accessible.value)}} />
        <DimensionRow label="Uso de Escadas" dimension={{...restrictions_profile.stairs_required, value: translateBoolean(restrictions_profile.stairs_required.value)}} />
        <DimensionRow label="Notas de Acessibilidade" dimension={restrictions_profile.accessibility_notes} />

        <div className="mt-4 p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
          <p className="text-zinc-500 font-medium mb-2 text-xs uppercase tracking-wider">Verificação de Restrições</p>
          <ul className="text-sm space-y-1">
            <li className="text-zinc-700"><span className="text-zinc-400 mr-2">Fonte:</span> {restrictions_profile.verification.source ? translateSource(restrictions_profile.verification.source, false) : "Não informada"}</li>
            <li className="text-zinc-700"><span className="text-zinc-400 mr-2">Data da Verificação:</span> {restrictions_profile.verification.verified_at || "Não informada"}</li>
            <li className="text-zinc-700"><span className="text-zinc-400 mr-2">Responsável:</span> {restrictions_profile.verification.verified_by || "Não informado"}</li>
          </ul>
        </div>
      </section>

    </div>
  );
}
