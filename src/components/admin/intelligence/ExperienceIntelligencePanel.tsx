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
  AlertCircle,
  Eye,
  Star,
  Compass,
  Coffee,
  MapPin,
  ShieldOff
} from 'lucide-react';

interface Props {
  snapshot: ExperienceIntelligenceSnapshot;
  onRecalculate: () => void;
  isRecalculating?: boolean;
}

// ─── Helpers de tradução ───────────────────────────────────────────────────

const translateSource = (source: string, manualOverride: boolean) => {
  if (manualOverride) return 'Alterado manualmente';
  switch (source) {
    case 'rule': return 'Calculado por regras';
    case 'human': return 'Informado pela curadoria';
    case 'import': return 'Importado do catálogo anterior';
    case 'ai_suggestion': return 'Sugestão de IA';
    case 'cadastro': return 'Informado no cadastro';
    default: return source;
  }
};

const translateConfidence = (confidence: string) => {
  switch (confidence) {
    case 'high': return 'Alta';
    case 'medium': return 'Média';
    case 'low': return 'Baixa';
    case 'none': return 'Sem confiança calculada';
    default: return confidence;
  }
};

const formatDecimalPtBR = (val: number): string =>
  val.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const formatIntegerPtBR = (val: number): string =>
  val.toLocaleString('pt-BR');

const translateReviewConfidence = (val: string | null): string => {
  switch (val) {
    case 'high': return 'Alta';
    case 'medium': return 'Média';
    case 'low': return 'Baixa';
    case 'none': return 'Sem confiança calculada';
    default: return val || 'Não informado';
  }
};

const translatePremium = (val: string | null): string => {
  switch (val) {
    case 'high': return 'Alto';
    case 'moderate': return 'Moderado';
    case 'low': return 'Baixo';
    case 'none': return 'Nenhum';
    default: return val || 'Não informado';
  }
};

const translateEditorialPriority = (val: string | null): string => {
  switch (val) {
    case 'high': return 'Alta';
    case 'medium': return 'Média';
    case 'low': return 'Baixa';
    case 'none': return 'Não definida';
    default: return val || 'Não informado';
  }
};

const translateBoolean = (val: boolean | null | undefined) => {
  if (val === null || val === undefined) return 'Não informado';
  return val ? 'Sim' : 'Não';
};

const getBand = (val: number | null) => {
  if (val === null) return 'Não calculado — faltam informações';
  const p = Math.round(val * 100);
  if (p <= 20) return 'Muito baixa';
  if (p <= 40) return 'Baixa';
  if (p <= 60) return 'Moderada';
  if (p <= 80) return 'Alta';
  return 'Muito alta';
};

// ─── Dados fixos das personas ──────────────────────────────────────────────

const PERSONA_META: Record<string, {
  icon: React.ReactNode;
  description: string;
  lowSummary: string;
  highSummary: string;
}> = {
  explorador_visual: {
    icon: <Eye className="w-4 h-4" />,
    description: 'Valoriza estética, cenários e experiências visualmente marcantes.',
    lowSummary: 'Pouco indicado para quem prioriza fotografia e impacto visual.',
    highSummary: 'Muito indicado para quem busca experiências visualmente marcantes.',
  },
  curador_experiencias: {
    icon: <Star className="w-4 h-4" />,
    description: 'Valoriza cultura, qualidade e produções reconhecidas.',
    lowSummary: 'Pouco alinhado ao perfil de quem valoriza curadoria e reconhecimento cultural.',
    highSummary: 'Muito alinhado ao perfil que valoriza produções de qualidade e cultura.',
  },
  aproveitador: {
    icon: <Zap className="w-4 h-4" />,
    description: 'Busca diversão, energia e entretenimento.',
    lowSummary: 'Pouco indicado para quem busca diversão e entretenimento intenso.',
    highSummary: 'Muito indicado para quem busca diversão, energia e entretenimento.',
  },
  descobridor: {
    icon: <Compass className="w-4 h-4" />,
    description: 'Busca experiências autênticas, locais e fora do circuito tradicional.',
    lowSummary: 'Pouco indicado para quem procura experiências secretas e fora do circuito tradicional.',
    highSummary: 'Muito indicado para quem busca lugares autênticos e pouco conhecidos.',
  },
  slow_traveler: {
    icon: <Coffee className="w-4 h-4" />,
    description: 'Prefere calma, contemplação e um ritmo de viagem sem pressa.',
    lowSummary: 'Pouco indicado para quem prefere ritmo lento e contemplação.',
    highSummary: 'Muito indicado para quem aprecia calma, bem-estar e ritmo relaxado.',
  },
};

// ─── Componente: PersonaRow ────────────────────────────────────────────────

function PersonaRow({
  personaKey,
  dimension,
}: {
  personaKey: string;
  dimension: any;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = PERSONA_META[personaKey];
  const isNull = dimension.value === null || dimension.value === undefined;
  const pct = isNull ? null : Math.round(dimension.value * 100);
  const band = getBand(dimension.value);

  const summary = isNull
    ? 'Não foi possível calcular — faltam dados.'
    : pct! <= 20
    ? meta?.lowSummary
    : pct! >= 70
    ? meta?.highSummary
    : null;

  const labelNames: Record<string, string> = {
    explorador_visual: 'Visual',
    curador_experiencias: 'Curador',
    aproveitador: 'Entusiasta',
    descobridor: 'Descobridor',
    slow_traveler: 'Slow Traveler',
  };

  return (
    <div className="border border-zinc-200 rounded-xl mb-3 overflow-hidden bg-white shadow-sm">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-indigo-400">{meta?.icon}</span>
              <span className="font-medium text-zinc-900">{labelNames[personaKey] ?? personaKey}</span>
            </div>
            {meta?.description && (
              <span className="text-[12px] text-zinc-500">"{meta.description}"</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`font-semibold ${isNull ? 'text-zinc-400 font-normal' : 'text-zinc-800'}`}>
              {isNull ? 'Não calculado' : `${pct}%`}
            </span>
            {!isNull && (
              <span className="text-sm text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">{band}</span>
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
        <div className="p-4 bg-zinc-50 border-t border-zinc-100 text-sm space-y-4">


          {/* Resumo do resultado */}
          {summary && (
            <div>
              <p className="text-zinc-500 font-medium mb-1 text-xs uppercase tracking-wider">Interpretação</p>
              <p className="text-zinc-700">{summary}</p>
            </div>
          )}

          {/* Evidências técnicas */}
          {dimension.evidences && dimension.evidences.length > 0 && (
            <div>
              <p className="text-zinc-500 font-medium mb-2 text-xs uppercase tracking-wider">Por que esta nota?</p>
              <ul className="space-y-1">
                {dimension.evidences.map((ev: string, idx: number) => (
                  <li key={idx} className="text-zinc-700 flex items-start gap-2">
                    <span className="text-indigo-400 mt-0.5">›</span>
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-zinc-500 font-medium mb-1 text-xs uppercase tracking-wider">Origem</p>
            <p className="text-zinc-700">{translateSource(dimension.source, dimension.manual_override)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente: DimensionRow (genérico) ──────────────────────────────────

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
  let displayValue = isNull ? 'Não informado' : String(dimension.value);
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
              <span className="text-sm text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">{band}</span>
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

// ─── Componente: PlanningRow (sem confiança inventada) ────────────────────

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

// ─── Componente: Chip ─────────────────────────────────────────────────────

function Chip({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
      {children}
    </span>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────

export function ExperienceIntelligencePanel({ snapshot, onRecalculate, isRecalculating }: Props) {
  const { semantic_profile, affinity_profile, quality_profile, restrictions_profile } = snapshot;

  // Mapas de tradução para o perfil semântico
  const formatMap: Record<string, string> = {
    musical: 'Musical', show: 'Show', attraction: 'Atração', museum: 'Museu', park: 'Parque',
    tour: 'Tour', dining: 'Restaurante', nightlife: 'Vida Noturna', shopping: 'Compras',
    wellness: 'Bem-estar', event: 'Evento', hotel: 'Hospedagem', transportation: 'Transporte'
  };
  const themeMap: Record<string, string> = {
    broadway: 'Broadway', fantasy: 'Fantasia', family: 'Familiar', romance: 'Romântico',
    history: 'Histórico', art: 'Arte', culture: 'Cultura', local: 'Local', iconic: 'Icônico',
    mainstream: 'Mainstream', hidden_gem: 'Achado', luxury: 'Luxo', adventure: 'Aventura',
    relaxation: 'Relaxante', gastronomy: 'Gastronomia', entertainment: 'Entretenimento', scenic_view: 'Vista Panorâmica'
  };
  const envMap: Record<string, string> = { indoor: 'Ambiente Interno', outdoor: 'Ao Ar Livre', mixed: 'Misto' };
  const energyMap: Record<string, string> = { calm: 'Calmo', moderate: 'Moderado', intense: 'Intenso' };
  const famMap: Record<string, string> = {
    child_focused: 'Familiar, com foco em crianças',
    family_friendly: 'Adequado para famílias',
    neutral: 'Neutro',
    adult_oriented: 'Foco adulto'
  };

  // Detecta se há alguma restrição factual preenchida
  const hasAnyRestriction =
    restrictions_profile.min_age.value !== null ||
    restrictions_profile.adult_only.value !== null ||
    restrictions_profile.family_with_children_allowed.value !== null ||
    restrictions_profile.minimum_group_size.value !== null ||
    restrictions_profile.maximum_group_size.value !== null ||
    restrictions_profile.requires_companion.value !== null ||
    restrictions_profile.wheelchair_accessible.value !== null ||
    restrictions_profile.stairs_required.value !== null ||
    restrictions_profile.accessibility_notes.value !== null;

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
          {isRecalculating ? 'Recalculando...' : 'Recalcular diagnóstico'}
        </button>
      </div>

      <div className="bg-indigo-50/50 text-indigo-800 text-sm p-3 rounded-lg flex items-start gap-3 border border-indigo-100">
        <Info className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
        <p>Ajustes editoriais avançados serão conectados após a validação do diagnóstico.</p>
      </div>

      {/* 1. Características da Experiência (ex-Perfil da Experiência) */}
      <section>
        <div className="mb-4">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Características da Experiência</h3>
          <p className="text-xs text-zinc-400 mt-1">Informações usadas para classificar a experiência e recomendar aos viajantes certos.</p>
        </div>
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

      {/* 2. Afinidade com Estilos — agora com PersonaRow */}
      <section>
        <div className="mb-4">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Afinidade com Estilos</h3>
          <p className="text-xs text-zinc-400 mt-1">Percentual de adequação da experiência a cada perfil de viajante. Clique para ver a descrição do perfil e o motivo da nota.</p>
        </div>
        <PersonaRow personaKey="explorador_visual" dimension={affinity_profile.personas.explorador_visual} />
        <PersonaRow personaKey="curador_experiencias" dimension={affinity_profile.personas.curador_experiencias} />
        <PersonaRow personaKey="aproveitador" dimension={affinity_profile.personas.aproveitador} />
        <PersonaRow personaKey="descobridor" dimension={affinity_profile.personas.descobridor} />
        <PersonaRow personaKey="slow_traveler" dimension={affinity_profile.personas.slow_traveler} />
      </section>

      {/* 3. Adequação por Companhia */}
      <section>
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Adequação por Companhia</h3>
        <DimensionRow label="Solo" dimension={affinity_profile.companionship.solo} isPercentage />
        <DimensionRow label="Casal" dimension={affinity_profile.companionship.couple} isPercentage />
        <DimensionRow label="Amigos" dimension={affinity_profile.companionship.friends} isPercentage />
        <DimensionRow label="Família" dimension={affinity_profile.companionship.family} isPercentage />
      </section>

      {/* 4. Qualidade e Prioridade */}
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

      {/* 5. Restrições: estado vazio ou dados reais */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Políticas e Acessibilidade</h3>
          {restrictions_profile.issues.length > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">
              <AlertCircle className="w-3 h-3" />
              {restrictions_profile.issues.length} alertas detectados
            </span>
          )}
        </div>

        {/* Alertas de inconsistência (sempre visíveis quando existem) */}
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

        {/* Estado vazio: nenhum dado factual cadastrado */}
        {!hasAnyRestriction ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 flex flex-col items-center text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
              <ShieldOff className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p className="font-medium text-zinc-700">Políticas e acessibilidade ainda não verificadas</p>
              <p className="text-sm text-zinc-400 mt-1">Nenhuma informação factual foi cadastrada para esta experiência.</p>
            </div>
            <div className="flex items-start gap-2 text-xs text-zinc-400 bg-zinc-50 rounded-lg p-3 border border-zinc-100 text-left max-w-sm">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-zinc-300" />
              <span>A IA não cria restrições sem uma fonte informada. Idade mínima, políticas para crianças e acessibilidade precisam ser verificadas por um curador.</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <MapPin className="w-3 h-3" />
              <span>Os campos de verificação estarão disponíveis na seção <strong>Políticas e Acessibilidade</strong> em breve.</span>
            </div>
          </div>
        ) : (
          // Estado com dados: mostra somente campos que possuem valor
          <>
            {restrictions_profile.min_age.value !== null && (
              <DimensionRow label="Idade Mínima" dimension={restrictions_profile.min_age} />
            )}
            {restrictions_profile.adult_only.value !== null && (
              <DimensionRow label="Somente Adultos" dimension={{...restrictions_profile.adult_only, value: translateBoolean(restrictions_profile.adult_only.value)}} />
            )}
            {restrictions_profile.family_with_children_allowed.value !== null && (
              <DimensionRow label="Crianças Permitidas" dimension={{...restrictions_profile.family_with_children_allowed, value: translateBoolean(restrictions_profile.family_with_children_allowed.value)}} />
            )}
            {restrictions_profile.minimum_group_size.value !== null && (
              <DimensionRow label="Tamanho Mín. do Grupo" dimension={restrictions_profile.minimum_group_size} />
            )}
            {restrictions_profile.maximum_group_size.value !== null && (
              <DimensionRow label="Tamanho Máx. do Grupo" dimension={restrictions_profile.maximum_group_size} />
            )}
            {restrictions_profile.requires_companion.value !== null && (
              <DimensionRow label="Exige Acompanhante" dimension={{...restrictions_profile.requires_companion, value: translateBoolean(restrictions_profile.requires_companion.value)}} />
            )}
            {restrictions_profile.wheelchair_accessible.value !== null && (
              <DimensionRow label="Acesso Cadeirantes" dimension={{...restrictions_profile.wheelchair_accessible, value: translateBoolean(restrictions_profile.wheelchair_accessible.value)}} />
            )}
            {restrictions_profile.stairs_required.value !== null && (
              <DimensionRow label="Uso de Escadas" dimension={{...restrictions_profile.stairs_required, value: translateBoolean(restrictions_profile.stairs_required.value)}} />
            )}
            {restrictions_profile.accessibility_notes.value !== null && (
              <DimensionRow label="Notas de Acessibilidade" dimension={restrictions_profile.accessibility_notes} />
            )}

            {(restrictions_profile.verification.source || restrictions_profile.verification.verified_at) && (
              <div className="mt-4 p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                <p className="text-zinc-500 font-medium mb-2 text-xs uppercase tracking-wider">Verificação</p>
                <ul className="text-sm space-y-1">
                  {restrictions_profile.verification.source && (
                    <li className="text-zinc-700"><span className="text-zinc-400 mr-2">Fonte:</span> {translateSource(restrictions_profile.verification.source, false)}</li>
                  )}
                  {restrictions_profile.verification.verified_at && (
                    <li className="text-zinc-700"><span className="text-zinc-400 mr-2">Data da Verificação:</span> {restrictions_profile.verification.verified_at}</li>
                  )}
                  {restrictions_profile.verification.verified_by && (
                    <li className="text-zinc-700"><span className="text-zinc-400 mr-2">Responsável:</span> {restrictions_profile.verification.verified_by}</li>
                  )}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

    </div>
  );
}
