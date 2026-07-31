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
    <header className="mb-8 relative rounded-[32px] overflow-hidden bg-slate-950 shadow-xl min-h-[280px] flex flex-col justify-end p-8 border border-slate-800">
      {/* Background Image & Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: `url(${data.basecamp?.photoUrl || 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=2000&auto=format&fit=crop'})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
      
      {/* Top action bar */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        {data.stalenessStatus && data.stalenessStatus !== 'UP_TO_DATE' && (
          <div className="bg-yellow-500/20 backdrop-blur-md border border-yellow-500/30 text-yellow-300 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-bold">Roteiro desatualizado</span>
          </div>
        )}
        <button
          onClick={onRegenerate}
          className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-5 py-2.5 rounded-full font-extrabold text-sm flex items-center gap-2 transition-all shadow-lg cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Atualizar roteiro</span>
        </button>
      </div>

      <div className="relative z-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-lime-400 text-slate-950 text-[10px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-full">
              Roteiro Personalizado
            </span>
            {data.isCollaborative && (
              <span className="bg-purple-500/20 text-purple-200 border border-purple-500/30 text-[10px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Colaborativo
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
            {data.destinationName}
          </h1>
          <p className="text-slate-300 font-medium text-sm md:text-base max-w-xl">
            Sua curadoria finalizada. Planejamento inteligente para {data.travelersCount > 1 ? `${data.travelersCount} viajantes` : 'você'} viver o melhor de {data.destinationName}.
          </p>
        </div>

        {/* Info Chips */}
        <div className="flex flex-col gap-2 shrink-0">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3 text-white">
            <Calendar className="w-4 h-4 text-lime-400" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Período</p>
              <p className="text-xs font-extrabold">{formatDateRange()}</p>
            </div>
          </div>
          {data.basecamp && (
            <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3 text-white">
              <MapPin className="w-4 h-4 text-lime-400" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Basecamp</p>
                <p className="text-xs font-extrabold truncate max-w-[160px]">{data.basecamp.name}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
