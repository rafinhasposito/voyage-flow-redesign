import React from 'react';
import { 
  MapPin, Calendar, Users, Edit3, Hotel, CheckCircle2, 
  Sparkles, DollarSign, Footprints, Clock, AlertCircle, Plus 
} from 'lucide-react';
import { TripSpaceViewModel } from '@/types/tripSpace.types';

interface TripContextSidebarProps {
  data: TripSpaceViewModel;
  isOverviewMode?: boolean;
}

export function TripContextSidebar({ data, isOverviewMode }: TripContextSidebarProps) {
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
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col justify-center">
            <p className="text-slate-900 font-extrabold text-lg leading-none mb-1">{data.reservations?.length || 0}</p>
            <p className="text-slate-400 font-medium text-[10px]">reservas confirmadas</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col justify-center">
            <p className="text-slate-900 font-extrabold text-lg leading-none mb-1">{(data.days || []).reduce((acc, day) => acc + (day.activities || day.stops || []).length, 0)}</p>
            <p className="text-slate-400 font-medium text-[10px]">atividades no roteiro</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col justify-center">
            <p className="text-slate-900 font-extrabold text-lg leading-none mb-1">{data.documents?.length || 0}</p>
            <p className="text-slate-400 font-medium text-[10px]">documentos</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col justify-center">
            <p className="text-slate-900 font-extrabold text-lg leading-none mb-1">{(data.checklist || []).filter(c => !c.completed).length}</p>
            <p className="text-slate-400 font-medium text-[10px]">preparativos pendentes</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
