import React, { useState } from 'react';
import { Car, Train, Bus, MapPin, ChevronDown, ChevronUp, Navigation, AlertCircle } from 'lucide-react';
import { TripSpaceStop, TripSpaceBasecamp } from '@/types/tripSpace.types';
import { StatusBadge, getStopStatus } from './StatusBadge';

interface TransportCardProps {
  stop: TripSpaceStop;
  basecamp?: TripSpaceBasecamp;
  isSelected?: boolean;
  onClick?: () => void;
  originLabel?: string;
  originAddress?: string;
  destinationLabel?: string;
  destinationAddress?: string;
  hideTimelineDot?: boolean;
  onRemove?: () => void;
}

type TransportMode = 'uber' | 'metro' | 'transfer';

export function TransportCard({ stop, basecamp, isSelected, onClick, originLabel, originAddress, destinationLabel, destinationAddress, hideTimelineDot, onRemove }: TransportCardProps) {
  const getInitialMode = (): TransportMode => {
    const title = stop.title?.toLowerCase() || '';
    if (title.includes('metrô') || title.includes('metro') || title.includes('subway') || title.includes('train')) return 'metro';
    if (title.includes('transfer') || title.includes('onibus') || title.includes('bus')) return 'transfer';
    return 'uber';
  };

  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<TransportMode>(getInitialMode());
  const [copied, setCopied] = useState(false);

  // Detect if this is likely an airport extraction based on duration/cost/title
  const isAirport = stop.title?.toLowerCase().includes('uber') || stop.time === '08:05' || stop.cost?.includes('55');

  const dropoffQuery = destinationAddress
    ? (destinationLabel ? `${destinationLabel}, ${destinationAddress}` : destinationAddress)
    : (destinationLabel || (basecamp ? `${basecamp.name}, ${basecamp.address}` : undefined));

  return (
    <div className="relative group my-2">
      {/* Timeline Node Dot (matching LuggageCard) */}
      {!hideTimelineDot && (
        <div className={`absolute -left-[39px] top-6 w-7 h-7 rounded-full border-4 border-white flex items-center justify-center transition-colors z-10 shadow-sm bg-slate-700 text-white`}>
          {mode === 'uber' ? <Car className="w-3.5 h-3.5" /> : mode === 'metro' ? <Train className="w-3.5 h-3.5" /> : <Bus className="w-3.5 h-3.5" />}
        </div>
      )}

      <div
        className={`relative rounded-[24px] overflow-hidden border transition-all ${
          isSelected
            ? 'bg-white border-blue-400 shadow-xl ring-2 ring-blue-900/5'
            : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
        }`}
      >
        <div onClick={() => { onClick?.(); setExpanded(!expanded); }} className="cursor-pointer p-5 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-slate-100 text-slate-600`}>
            {mode === 'uber' ? <Car className="w-6 h-6" /> : mode === 'metro' ? <Train className="w-6 h-6" /> : <Bus className="w-6 h-6" />}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  Deslocamento
                </span>
                <StatusBadge status={getStopStatus(stop)} />
              </div>
              {onRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Remover este deslocamento do roteiro?')) {
                      onRemove();
                    }
                  }}
                  className="w-6 h-6 rounded-full hover:bg-red-50 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"
                  title="Remover deslocamento"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              )}
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg leading-tight">
              {originLabel || 'Origem não disponível'} → {destinationLabel || 'Destino não disponível'}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1 truncate">
              {mode === 'uber' ? 'Uber / Táxi' : mode === 'metro' ? 'Metrô' : 'Transfer'} • Duração: {stop.duration || 'não disponível'} • {stop.cost && stop.cost !== 'Grátis' ? `Faixa de preço: ${stop.cost}` : 'Faixa de preço não disponível'}
            </p>
          </div>
        </div>

        {/* Expanded Content (Actionable Utilities) */}
        {expanded && (
          <div className="px-4 pb-4 pt-2 border-t border-slate-200/60 bg-white">
            
            {/* Mode Selectors */}
            <div className="flex gap-2 mb-4 mt-2">
              <button 
                onClick={(e) => { e.stopPropagation(); setMode('uber'); }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors border ${mode === 'uber' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
              >
                Uber/Táxi
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setMode('metro'); }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors border ${mode === 'metro' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
              >
                Metrô
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setMode('transfer'); }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors border ${mode === 'transfer' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
              >
                Transfer
              </button>
            </div>

            {/* Context Origin -> Destination */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 mt-2">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <span className="text-[10px]">📍</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-slate-500 font-medium">De: <strong className="text-slate-700">{originLabel || 'Origem não disponível'}</strong></span>
                    {originAddress && (
                      <p className="text-[10px] text-slate-400 truncate max-w-[220px] mt-0.5">{originAddress}</p>
                    )}
                  </div>
                </div>
                <div className="w-0.5 h-3 bg-slate-300 ml-2.5" />
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px]">🎯</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-slate-500 font-medium">Para: <strong className="text-slate-900">{destinationLabel || 'Destino não disponível'}</strong></span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                        {destinationAddress || 'Endereço não disponível'}
                      </span>
                      {destinationAddress && (
                        <button
                          onClick={(e) => {
                             e.stopPropagation();
                             if (!destinationAddress) return;
                             navigator.clipboard.writeText(destinationAddress).then(() => {
                               setCopied(true);
                               setTimeout(() => setCopied(false), 2000);
                             }).catch(() => {
                               // Fallback para navegadores sem permissão de clipboard
                               const el = document.createElement('textarea');
                               el.value = destinationAddress;
                               el.style.position = 'fixed';
                               el.style.opacity = '0';
                               document.body.appendChild(el);
                               el.focus();
                               el.select();
                               document.execCommand('copy');
                               document.body.removeChild(el);
                               setCopied(true);
                               setTimeout(() => setCopied(false), 2000);
                             });
                          }}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded transition-colors ${
                            copied
                              ? 'text-emerald-700 bg-emerald-100'
                              : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                          }`}
                        >
                          {copied ? '✓ Copiado!' : 'Copiar'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Instructions (Extraction) */}
            {isAirport && mode === 'uber' && (
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 items-start">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-900 mb-1">Dica de Sobrevivência (JFK/EWR)</p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">Não chame o Uber na porta principal de Desembarque. Siga as placas verdes de <strong>"Ride App Pick-up"</strong>. Você vai precisar pegar o elevador para a área designada antes de chamar o carro.</p>
                </div>
              </div>
            )}

            {isAirport && mode === 'metro' && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex gap-3 items-start">
                <Navigation className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-emerald-900 mb-1">Instrução de Metrô (AirTrain)</p>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">Siga as placas para o <strong>AirTrain</strong> dentro do terminal. Pegue a linha sentido Jamaica Station. Chegando lá, pague a tarifa e faça a transferência para a linha E do metrô comum sentido Manhattan.</p>
                </div>
              </div>
            )}

            {/* Call to Action & Detailed Route */}
            {mode === 'metro' ? (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2">
                <div className="flex items-center gap-2 mb-3">
                   {/* Metro Badges (Mocked for NY) */}
                   <div className="flex gap-1">
                     <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">A</span>
                     <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">C</span>
                     <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">E</span>
                   </div>
                   <span className="text-xs font-bold text-slate-700 ml-1">Sentido Downtown / Brooklyn</span>
                </div>
                
                <div className="relative pl-4 space-y-3 before:absolute before:left-[7px] before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-slate-300">
                  <div className="relative">
                    <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-slate-400" />
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Embarque</p>
                    <p className="text-xs font-bold text-slate-800">Estação Atual / Mais Próxima</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Siga placas azuis no subsolo</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-emerald-500" />
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Desembarque</p>
                    <p className="text-xs font-bold text-slate-800">{destinationLabel || 'Destino não disponível'}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Siga até a saída principal</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  {dropoffQuery ? (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dropoffQuery)}&travelmode=transit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-[10px] font-extrabold text-slate-700 bg-white border border-slate-200 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <MapPin className="w-3 h-3 text-emerald-600" /> Abrir no Google Maps (Rota ao Vivo)
                    </a>
                  ) : (
                    <span className="w-full text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-2 rounded-md flex items-center justify-center gap-2">
                      Endereço de destino não disponível
                    </span>
                  )}
                </div>
              </div>
            ) : mode === 'uber' ? (
              dropoffQuery ? (
                <a
                  href={`uber://?client_id=voyageflow&action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(dropoffQuery)}`}
                  className="w-full mt-2 flex items-center justify-center gap-2 bg-slate-900 text-white font-extrabold text-xs py-3 rounded-lg hover:bg-black transition-colors"
                >
                  <Car className="w-4 h-4" />
                  Abrir App do Uber com Destino
                </a>
              ) : (
                <span className="w-full mt-2 flex items-center justify-center gap-2 bg-slate-100 text-slate-400 font-extrabold text-xs py-3 rounded-lg">
                  Endereço de destino não disponível
                </span>
              )
            ) : (
              <span className="w-full mt-2 flex items-center justify-center gap-2 bg-slate-100 text-slate-400 font-extrabold text-xs py-3 rounded-lg">
                Voucher não anexado
              </span>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
