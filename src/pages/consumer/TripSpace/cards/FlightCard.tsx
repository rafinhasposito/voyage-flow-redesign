import React, { useState } from 'react';
import { Plane, ChevronDown, ChevronUp } from 'lucide-react';
import { TripSpaceStop } from '@/types/tripSpace.types';
import { DocumentUploadButton } from './DocumentUploadButton';
import { StatusBadge, getStopStatus } from './StatusBadge';

interface FlightCardProps {
  stop: TripSpaceStop;
  isSelected?: boolean;
  onClick?: () => void;
  tripId?: string;
  userId?: string;
  hideTimelineDot?: boolean;
}

export function FlightCard({ stop, isSelected, onClick, tripId, userId, hideTimelineDot }: FlightCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isArrival = stop.title.toLowerCase().includes('chegada');
  const imageUrl = "https://www.latamairlines.com/content/dam/latamxp/sites/trabaja-con-nosotros/pilotos/319a.jpg.transform/sm/image.jpg";

  return (
    <div className="relative group">
      {/* Timeline Node Dot (apenas se não estiver oculto pelo modo mobile V2) */}
      {!hideTimelineDot && (
        <div className={`absolute -left-[39px] top-6 w-7 h-7 rounded-full border-4 border-white flex items-center justify-center transition-colors z-10 shadow-sm ${
          isArrival ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-lime-400'
        }`}>
          <Plane className="w-3 h-3" />
        </div>
      )}

      <div
        onClick={() => {
          onClick?.();
          setExpanded(!expanded);
        }}
        className={`relative rounded-xl overflow-hidden border transition-all cursor-pointer ${
          isSelected
            ? 'bg-indigo-50 border-indigo-200 shadow-sm'
            : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
        }`}
      >
        {/* Visual Cover */}
        <div className="relative h-32 w-full">
          <img src={imageUrl} alt="Flight" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/10" />
        </div>

        {/* Ticket Content Area */}
        <div className="bg-white px-6 pb-6 pt-4 relative">
          {/* Perforation Line */}
          <div className="absolute -top-[10px] left-0 right-0 h-5 overflow-hidden flex justify-between px-[-8px]">
            <div className="w-4 h-4 rounded-full bg-slate-50 border border-slate-200 -ml-2 shadow-inner" />
            <div className="flex-1 border-b-2 border-dashed border-slate-200 mt-2 mx-2" />
            <div className="w-4 h-4 rounded-full bg-slate-50 border border-slate-200 -mr-2 shadow-inner" />
          </div>

          <div className="flex items-end justify-between mt-2">
            <div className="max-w-[70%]">
              <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md mb-2 inline-block border ${isArrival ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-lime-50 text-lime-700 border-lime-200'}`}>
                {isArrival ? 'Chegada de Voo' : 'Embarque'}
              </span>
              <h3 className="font-black text-slate-900 text-2xl leading-tight tracking-tight mt-1">
                {stop.title}
              </h3>
              <div className="mt-2">
                <StatusBadge status={getStopStatus(stop)} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-900 font-black text-3xl tracking-tighter">{stop.time}</p>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">Horário Local</p>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="p-5 bg-white border-t border-slate-100 animate-in slide-in-from-top-2 duration-200" onClick={e => e.stopPropagation()}>
            {/* Metadados do voo — vindos da reserva real, aqui via stop.metadata */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium mb-1">Voo</p>
                <p className="font-extrabold text-slate-900">
                  {(stop as any).metadata?.flightNumber || '—'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium mb-1">Reserva (PNR)</p>
                <p className="font-extrabold text-slate-900">
                  {(stop as any).metadata?.confirmationCode || '—'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {/*
                Upload real do Cartão de Embarque.
                tripId e userId são necessários para o upload seguro.
                Se ausentes, o componente exibe estado desabilitado.
              */}
              <DocumentUploadButton
                label="Cartão de Embarque (.pdf)"
                tripId={tripId}
                userId={userId}
                acceptedFormats="application/pdf,image/jpeg,image/png"
                maxSizeMb={10}
              />

              {/*
                Edição de informações do voo: funcionalidade ainda não implementada.
                Botão desabilitado — sem alert, sem modal vazio.
              */}
              <div className="w-full bg-slate-50 border border-dashed border-slate-200 font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-2 text-slate-400 cursor-not-allowed select-none">
                Editar informações do voo — em desenvolvimento
              </div>
            </div>
          </div>
        )}

        {/* Toggle Indicator */}
        <div className="bg-slate-50 py-2 flex justify-center border-t border-slate-100">
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>
    </div>
  );
}
