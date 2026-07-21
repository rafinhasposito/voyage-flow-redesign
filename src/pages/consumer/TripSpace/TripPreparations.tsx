import React, { useState } from 'react';
import { 
  FolderCheck, CheckSquare, Square, CreditCard, Hotel, 
  Plane, FileText, Plus, AlertCircle, ShieldCheck, FileCheck 
} from 'lucide-react';
import { TripSpaceChecklistItem, TripSpaceReservation, TripSpaceDocument } from '@/types/tripSpace.types';
import { TripRepository } from '@/repositories/TripRepository';

interface TripPreparationsProps {
  tripId: string;
  checklist: TripSpaceChecklistItem[];
  reservations: TripSpaceReservation[];
  documents: TripSpaceDocument[];
  onChecklistUpdate?: () => void;
}

export function TripPreparations({ tripId, checklist: initialChecklist, reservations, documents, onChecklistUpdate }: TripPreparationsProps) {
  const [items, setItems] = useState<TripSpaceChecklistItem[]>(initialChecklist);

  const handleToggleItem = async (id: string) => {
    const nextItems = items.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
    setItems(nextItems);
    try {
      await TripRepository.updateTripOnboarding(tripId, {
        preferences: { checklist: nextItems }
      });
      if (onChecklistUpdate) onChecklistUpdate();
    } catch (err) {
      console.error("Falha ao salvar checklist", err);
    }
  };

  const completedCount = items.filter(i => i.completed).length;

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* 1. Preparativos Card */}
      <div className="bg-white border border-slate-200/80 rounded-[28px] p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <FolderCheck className="w-4 h-4 text-slate-500" /> Preparativos
            </h3>
            {items.length > 0 && (
              <span className="text-[11px] font-bold text-slate-400">
                {completedCount} de {items.length} concluídos
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
              <p className="text-xs font-bold text-slate-700 mb-1">Você ainda não possui preparativos cadastrados.</p>
              <p className="text-[11px] text-slate-500">Adicione tarefas ou checklists essenciais para a viagem.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleItem(item.id)}
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-xs"
                >
                  {item.completed ? (
                    <CheckSquare className="w-4 h-4 text-lime-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                  <span className={`font-medium ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="mt-4 text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1 py-2 bg-slate-50 rounded-xl border border-slate-100 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Adicionar item
        </button>
      </div>

      {/* 2. Carteira da Viagem Card */}
      <div className="bg-white border border-slate-200/80 rounded-[28px] p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-500" /> Carteira da viagem
            </h3>
            <span className="text-[11px] font-bold text-slate-400">{reservations.length} itens</span>
          </div>

          {reservations.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
              <p className="text-xs font-bold text-slate-700 mb-1">Nenhuma reserva adicionada à carteira.</p>
              <p className="text-[11px] text-slate-500">Adicione ingressos, voos ou hotéis da sua viagem.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {reservations.map((res) => (
                <div key={res.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {res.type === 'hotel' ? (
                      <Hotel className="w-4 h-4 text-slate-500 shrink-0" />
                    ) : res.type === 'flight' ? (
                      <Plane className="w-4 h-4 text-slate-500 shrink-0" />
                    ) : (
                      <CreditCard className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <div className="truncate">
                      <p className="font-extrabold text-slate-800 truncate">{res.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{res.details || res.type}</p>
                    </div>
                  </div>
                  <span className="bg-lime-100 text-lime-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                    {res.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="mt-4 text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1 py-2 bg-slate-50 rounded-xl border border-slate-100 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Adicionar reserva
        </button>
      </div>

      {/* 3. Documentos Card */}
      <div className="bg-white border border-slate-200/80 rounded-[28px] p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" /> Documentos
            </h3>
            <span className="text-[11px] font-bold text-slate-400">{documents.length} salvos</span>
          </div>

          {documents.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
              <p className="text-xs font-bold text-slate-700 mb-1">Você ainda não adicionou documentos a esta viagem.</p>
              <p className="text-[11px] text-slate-500">Guarde passaportes, vistos e comprovantes de forma segura.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCheck className="w-4 h-4 text-slate-500 shrink-0" />
                    <div className="truncate">
                      <p className="font-extrabold text-slate-800 truncate">{doc.name}</p>
                      {doc.validUntil && <p className="text-[10px] text-slate-400">Válido até {doc.validUntil}</p>}
                    </div>
                  </div>
                  <span className="bg-lime-100 text-lime-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="mt-4 text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1 py-2 bg-slate-50 rounded-xl border border-slate-100 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Adicionar documento
        </button>
      </div>
    </section>
  );
}
