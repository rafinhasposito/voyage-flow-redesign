import React, { useState } from 'react';
import { ShieldCheck, FileCheck, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { TripSpaceStop } from '@/types/tripSpace.types';
import { DocumentUploadButton } from './DocumentUploadButton';

interface ImmigrationCardProps {
  stop: TripSpaceStop;
  isSelected?: boolean;
  onClick?: () => void;
  tripId?: string;
  userId?: string;
}

export function ImmigrationCard({ stop, isSelected, onClick, tripId, userId }: ImmigrationCardProps) {
  const [expanded, setExpanded] = useState(false);

  const imageUrl = "https://viagemeturismo.abril.com.br/wp-content/uploads/2025/07/JFK_Terminal_One_inside.jpg?crop=1&resize=1212,909";

  return (
    <div className="relative group">
      {/* Timeline Node Dot */}
      <div className="absolute -left-[39px] top-6 w-7 h-7 rounded-full border-4 border-white flex items-center justify-center transition-colors z-10 shadow-sm bg-blue-600 text-white">
        <ShieldCheck className="w-3.5 h-3.5" />
      </div>

      <div
        onClick={() => {
          onClick?.();
          setExpanded(!expanded);
        }}
        className={`relative rounded-xl overflow-hidden border transition-all cursor-pointer ${
          isSelected
            ? 'bg-blue-50 border-blue-200 shadow-sm'
            : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
        }`}
      >
        {/* Visual Cover */}
        <div className="relative h-32 w-full">
          <img src={imageUrl} alt="Immigration" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-900/10" />
        </div>

        {/* Content Header Area */}
        <div className="bg-white px-6 pb-6 pt-4 relative">
          <div className="flex items-end justify-between">
            <div className="max-w-[70%]">
              <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-md mb-2 inline-block border border-blue-200">
                Missão - Fronteira
              </span>
              <h3 className="font-black text-slate-900 text-2xl leading-tight tracking-tight mt-1">
                {stop.title}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-slate-900 font-black text-3xl tracking-tighter">{stop.time}</p>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">Estimativa</p>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="p-5 bg-white border-t border-blue-50 animate-in slide-in-from-top-2 duration-200" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex gap-3 items-start p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <AlertTriangle className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-800">Esteja preparado</p>
                <p className="text-xs text-slate-600 mt-1">Tenha seus documentos em mãos antes de entrar na fila. O processo costuma levar em média 60 minutos.</p>
              </div>
            </div>

            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">Documentos Necessários</h4>

            <div className="space-y-2">
              {/*
                Uploads reais via Supabase Storage.
                Documentos pessoais (passaporte, visto) usam bucket privado `trip-documents`
                com URL assinada — nunca expostos publicamente.
                Se tripId/userId ausentes, o componente mostra estado desabilitado.
              */}
              <DocumentUploadButton
                label="Passaporte Válido"
                tripId={tripId}
                userId={userId}
                acceptedFormats="application/pdf,image/jpeg,image/png"
                maxSizeMb={10}
              />

              <DocumentUploadButton
                label="Visto de Entrada"
                tripId={tripId}
                userId={userId}
                acceptedFormats="application/pdf,image/jpeg,image/png"
                maxSizeMb={10}
              />

              <DocumentUploadButton
                label="Passagem de Volta"
                tripId={tripId}
                userId={userId}
                acceptedFormats="application/pdf,image/jpeg,image/png"
                maxSizeMb={10}
              />

              {/*
                Comprovante de Hotel — pode ser gerado a partir das reservas da wallet.
                Por ora exibe o estado informativo (sem alert).
              */}
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-emerald-800">Comprovante de Hotel</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-200/50 px-3 py-1.5 rounded-lg">
                  Ver na Wallet
                </span>
              </div>

              {/*
                Apólice de Seguro — informativo; link para documentos da wallet.
              */}
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-emerald-800">Seguro Viagem</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-200/50 px-3 py-1.5 rounded-lg">
                  Ver Apólice
                </span>
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
