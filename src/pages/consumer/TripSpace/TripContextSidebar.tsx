import React from 'react';
import { 
  MapPin, Calendar, Users, Edit3, Hotel, CheckCircle2, 
  Sparkles, DollarSign, Footprints, Clock, AlertCircle, Plus 
} from 'lucide-react';
import { TripSpaceViewModel } from '@/types/tripSpace.types';
import { isDateToday, selectNextStep } from './utils/dayProgress';

interface TripContextSidebarProps {
  data: TripSpaceViewModel;
  isOverviewMode?: boolean;
  activeDay?: number;
  onModuleChange?: (moduleId: string) => void;
}

export function TripContextSidebar({ data, isOverviewMode, activeDay, onModuleChange }: TripContextSidebarProps) {
  const currentDay = (data.days || []).find(d => d.dayNumber === activeDay);

  const getConciergeMessage = () => {
    const stops = currentDay?.stops || [];
    if (!currentDay) return 'Escolha um dia no roteiro para receber sugestões contextuais.';
    const today = isDateToday(currentDay.fullDateStr);
    const dayLabel = today ? 'Hoje' : 'Neste dia';

    if (stops.length === 0) {
      return `O Dia ${currentDay.dayNumber} ainda está livre. Quer sugestões para começar a montar o roteiro?`;
    }

    const next = selectNextStep(stops, today);
    if (next) {
      const { stop, isNow } = next;
      if (isNow) {
        return `Você está em "${stop.title}" agora. Quando terminar, posso sugerir o que combina com o restante do seu roteiro.`;
      }
      if (today) {
        return `Sua próxima parada hoje é "${stop.title}"${stop.time ? ` às ${stop.time}` : ''}. Quer sugestões para o tempo livre até lá?`;
      }
      return `${dayLabel} seu roteiro começa em "${stop.title}"${stop.time ? ` às ${stop.time}` : ''}. Quer sugestões para completar o restante do dia?`;
    }

    return 'Você já passou por todas as paradas planejadas para hoje. Quer sugestões para os próximos dias?';
  };

  const formatDateRange = () => {
    if (!data.startDate || !data.endDate) return 'Datas a definir';
    const startParts = data.startDate.split('-').map(Number);
    const endParts = data.endDate.split('-').map(Number);
    if (startParts.length === 3 && endParts.length === 3) {
      const dStart = new Date(Date.UTC(startParts[0], startParts[1] - 1, startParts[2]));
      const dEnd = new Date(Date.UTC(endParts[0], endParts[1] - 1, endParts[2]));
      const dayStart = String(dStart.getUTCDate()).padStart(2, '0');
      const dayEnd = String(dEnd.getUTCDate()).padStart(2, '0');
      const monthEnd = dEnd.toLocaleDateString('pt-BR', { timeZone: 'UTC', month: 'short' }).replace('.', '');
      return `${dayStart} – ${dayEnd} ${monthEnd}`;
    }
    return `${data.startDate} a ${data.endDate}`;
  };

  return (
    <aside className="space-y-6">
      {/* 1. Resumo da Viagem Card */}
      <div className="bg-white border border-slate-200/80 rounded-[28px] p-5 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-slate-900 text-sm">Resumo da viagem</h3>
        </div>

        {/* Hero image preview */}
        <div className="relative h-32 rounded-2xl overflow-hidden mb-4">
          <img
            src={data.heroImageUrl}
            alt={data.destinationName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 text-white">
            <p className="font-extrabold text-base leading-tight">{data.destinationName}</p>
            <p className="text-[11px] text-slate-300 font-medium">{data.destinationCountry}</p>
          </div>
        </div>

        <div className="space-y-2.5 text-xs font-bold text-slate-600">
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="flex items-center gap-2 text-slate-400 font-medium">
              <Calendar className="w-3.5 h-3.5" /> Período
            </span>
            <span className="text-slate-900">{formatDateRange()} ({data.nightsCount} noites)</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="flex items-center gap-2 text-slate-400 font-medium">
              <Sparkles className="w-3.5 h-3.5" /> Perfil & Companhia
            </span>
            <span className="text-slate-900 capitalize">{data.travelStyle}</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="flex items-center gap-2 text-slate-400 font-medium">
              <Users className="w-3.5 h-3.5" /> Viajantes
            </span>
            <span className="text-slate-900">{data.travelersCount} {data.travelersCount === 1 ? 'pessoa' : 'pessoas'}</span>
          </div>
        </div>
      </div>

      {/* 2. Basecamp Card */}
      <div className="bg-white border border-slate-200/80 rounded-[28px] p-5 shadow-xs">
        <h3 className="font-extrabold text-slate-900 text-sm mb-3 flex items-center gap-2">
          <Hotel className="w-4 h-4 text-slate-500" /> Basecamp
        </h3>

        {data.basecamp ? (
          <div className="flex gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            {data.basecamp.photoUrl ? (
              <img
                src={data.basecamp.photoUrl}
                alt={data.basecamp.name}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center shrink-0 text-slate-500 font-bold text-xs">
                Hotel
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-slate-900 text-xs truncate">{data.basecamp.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{data.basecamp.address}</p>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold mt-2">
                <span>Check-in: {data.basecamp.checkIn}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
            <p className="text-xs font-bold text-slate-700 mb-1">Você ainda não definiu uma hospedagem como basecamp.</p>
          </div>
        )}
      </div>

      {/* 3. Visão Geral (Budget & Progress) */}
      <div className="bg-white border border-slate-200/80 rounded-[28px] p-5 shadow-xs space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm">Visão geral</h3>

        <div>
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-slate-500 font-medium">Orçamento estimado</span>
            <span className="text-slate-900">
              {data.estimatedBudget ? `US$ ${data.estimatedBudget.spent} de US$ ${data.estimatedBudget.total}` : 'Não calculado'}
            </span>
          </div>
          {data.estimatedBudget && (
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-lime-400 rounded-full"
                style={{ width: `${Math.min(100, (data.estimatedBudget.spent / data.estimatedBudget.total) * 100)}%` }}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs font-bold">
          <button
            type="button"
            onClick={() => onModuleChange?.('carteira')}
            className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col justify-center items-start text-left hover:bg-slate-100 hover:border-slate-200 transition-colors"
          >
            <p className="text-slate-900 font-extrabold text-lg leading-none mb-1">{data.reservations?.length || 0}</p>
            <p className="text-slate-400 font-medium text-[10px]">reservas confirmadas</p>
          </button>
          <button
            type="button"
            onClick={() => onModuleChange?.('roteiro')}
            className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col justify-center items-start text-left hover:bg-slate-100 hover:border-slate-200 transition-colors"
          >
            <p className="text-slate-900 font-extrabold text-lg leading-none mb-1">{(data.days || []).reduce((acc, day) => acc + (day.stops || []).length, 0)}</p>
            <p className="text-slate-400 font-medium text-[10px]">atividades no roteiro</p>
          </button>
          <button
            type="button"
            onClick={() => onModuleChange?.('documentos')}
            className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col justify-center items-start text-left hover:bg-slate-100 hover:border-slate-200 transition-colors"
          >
            <p className="text-slate-900 font-extrabold text-lg leading-none mb-1">{data.documents?.length || 0}</p>
            <p className="text-slate-400 font-medium text-[10px]">documentos</p>
          </button>
          <button
            type="button"
            onClick={() => onModuleChange?.('preparativos')}
            className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col justify-center items-start text-left hover:bg-slate-100 hover:border-slate-200 transition-colors"
          >
            <p className="text-slate-900 font-extrabold text-lg leading-none mb-1">{(data.checklist || []).filter(c => !c.completed).length}</p>
            <p className="text-slate-400 font-medium text-[10px]">preparativos pendentes</p>
          </button>
        </div>
      </div>

      {/* 4. IA Concierge */}
      <div className="bg-slate-950 border border-slate-900 rounded-[28px] p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-lime-400/10 blur-2xl rounded-full pointer-events-none" />

        <h3 className="font-extrabold text-white text-sm mb-3 flex items-center gap-2 relative z-10">
          <Sparkles className="w-4 h-4 text-purple-400" /> IA Concierge
        </h3>
        <p className="text-sm font-medium text-slate-300 leading-relaxed relative z-10">
          {getConciergeMessage()}
        </p>
        <button
          onClick={() => onModuleChange?.('roteiro')}
          className="mt-4 w-full bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs py-3 rounded-xl transition-colors border border-white/10 relative z-10"
        >
          Ver sugestões
        </button>
      </div>
    </aside>
  );
}
