import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Users, Plus, RefreshCw, Sparkles, Check, AlertCircle } from 'lucide-react';
import { TripSpaceViewModel } from '@/types/tripSpace.types';

interface TripHeaderProps {
  data: TripSpaceViewModel;
  onRegenerate: () => void;
}

export function TripHeader({ data, onRegenerate }: TripHeaderProps) {
  const [updateNotice, setUpdateNotice] = useState(false);

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
      return `${dayStart} – ${dayEnd} ${monthEnd} ${dEnd.getUTCFullYear()}`;
    }
    return `${data.startDate} a ${data.endDate}`;
  };

  const handleUpdateClick = () => {
    setUpdateNotice(true);
    setTimeout(() => setUpdateNotice(false), 3500);
  };

  return (
    <header className="mb-8">
      {data.stalenessStatus && data.stalenessStatus !== 'UP_TO_DATE' && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h4 className="font-bold text-sm">Roteiro desatualizado</h4>
            <p className="text-xs mt-1 text-yellow-700/90">
              As preferências ou reservas mudaram desde a última geração. Você pode regenerar para refletir as alterações.
            </p>
          </div>
          <button
            onClick={onRegenerate}
            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border border-yellow-300 px-4 py-2 rounded-lg font-bold text-xs shrink-0 transition-colors cursor-pointer"
          >
            Regerar Roteiro
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Seu canto da viagem
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Aqui sua viagem ganha vida. Organize, ajuste e descubra o melhor de cada momento.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <button
              onClick={onRegenerate}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
              <span>Atualizar roteiro</span>
            </button>
          </div>
        </div>
      </div>

      {/* Info Chips */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold text-slate-700">
        <div className="bg-white border border-slate-200/80 px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-xs">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>{data.destinationName}, {data.destinationCountry}</span>
        </div>

        <div className="bg-white border border-slate-200/80 px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{formatDateRange()}</span>
        </div>

        <div className="bg-white border border-slate-200/80 px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-xs">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>{data.travelersCount} {data.travelersCount > 1 ? 'viajantes' : 'viajante'}</span>
        </div>

        {data.isCollaborative && (
          <div className="bg-purple-50 border border-purple-200 text-purple-700 px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>Viagem em colaboração</span>
          </div>
        )}
      </div>
    </header>
  );
}
