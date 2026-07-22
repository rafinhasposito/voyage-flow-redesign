import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TripRepository } from '@/repositories/TripRepository';
import { TripWalletRepository } from '@/repositories/TripWalletRepository';
import { ExperienceRepository } from '@/repositories/ExperienceRepository';
import { EngineInputBuilder } from '@/domain/itinerary-engine/inputBuilder';
import { InputHealthValidator, TripEngineInputHealth } from '@/domain/itinerary-engine/inputHealth';
import { SchedulerV1, ItineraryDraftV1, DaySchedule, ScheduledActivity } from '@/domain/itinerary-engine/schedulerV1';
import { TripEngineInputV1 } from '@/domain/itinerary-engine/contracts';
import { LocalDeterministicGeoProvider } from '@/domain/itinerary-engine/geoProvider';
import { Loader2, ArrowLeft, AlertTriangle, CheckCircle, Info, Plane, Hotel, MapPin, Calendar, Clock, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GeoAuditPanel } from './GeoAuditPanel';
import { TripItineraryMapper } from '@/domain/itinerary-engine/mapper';

export default function EngineV2Preview() {
  const { tripId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [health, setHealth] = useState<TripEngineInputHealth | null>(null);
  const [draft, setDraft] = useState<ItineraryDraftV1 | null>(null);
  const [inputData, setInputData] = useState<TripEngineInputV1 | null>(null);
  const [persistedTrip, setPersistedTrip] = useState<any>(null);
  
  const [approvalState, setApprovalState] = useState<'IDLE' | 'REVIEW' | 'APPLYING' | 'APPLIED' | 'ALREADY_APPLIED' | 'ITINERARY_CHANGED_SINCE_PREVIEW' | 'PERSISTENCE_FAILED' | 'READBACK_MISMATCH' | 'BLOCKED_BY_CONFLICT'>('IDLE');
  const [applyError, setApplyError] = useState<string | null>(null);

  const generatePreview = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!tripId) throw new Error("Trip ID is required");

      const trip = await TripRepository.getTripById(tripId);
      setPersistedTrip(trip);
      const reservations = await TripWalletRepository.getReservations(tripId);
      
      const catalog = await ExperienceRepository.getByDestination(trip.destination);
      
      const input = EngineInputBuilder.build(trip, reservations, catalog);
      setInputData(input);
      
      const healthResult = InputHealthValidator.validate(input);
      setHealth(healthResult);

      const geoProvider = new LocalDeterministicGeoProvider();
      const itineraryDraft = await SchedulerV1.generate(input, geoProvider);
      setDraft(itineraryDraft);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao gerar o preview.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDraft = async () => {
    if (!draft || !persistedTrip || !tripId) return;
    setApprovalState('APPLYING');
    setApplyError(null);
    try {
      const payload = TripItineraryMapper.toPersistedV2(draft, health);
      const result = await TripRepository.applyApprovedItineraryDraft(tripId, payload, persistedTrip.updated_at);
      if (result.status === 'ALREADY_APPLIED') {
        setApprovalState('ALREADY_APPLIED');
      } else {
        setApprovalState('APPLIED');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('ITINERARY_CHANGED_SINCE_PREVIEW')) {
         setApprovalState('ITINERARY_CHANGED_SINCE_PREVIEW');
      } else if (err.message.includes('BLOCKED_BY_CONFLICT')) {
         setApprovalState('BLOCKED_BY_CONFLICT');
         setApplyError(err.message);
      } else if (err.message.includes('READBACK_MISMATCH')) {
         setApprovalState('READBACK_MISMATCH');
      } else {
         setApprovalState('PERSISTENCE_FAILED');
         setApplyError(err.message);
      }
    }
  };

  useEffect(() => {
    generatePreview();
  }, [tripId]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-lime-600" /></div>;
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
         <h1 className="text-2xl font-bold text-red-600 mb-4">Erro Crítico</h1>
         <p>{error}</p>
         <Link to={`/trips/${tripId}`} className="text-lime-600 mt-4 block">Voltar</Link>
      </div>
    );
  }

  const renderActivityIcon = (act: ScheduledActivity) => {
    if (act.type === 'flight') return <Plane className="w-5 h-5 text-indigo-500" />;
    if (act.type === 'hotel') return <Hotel className="w-5 h-5 text-fuchsia-500" />;
    if (act.source === 'transit') return <Info className="w-5 h-5 text-sky-500" />;
    if (act.isFixed) return <Calendar className="w-5 h-5 text-amber-500" />;
    return <MapPin className="w-5 h-5 text-lime-500" />;
  };

  // Build diagnostics
  const usedIds = new Set<string>();
  const repeatedIds = new Set<string>();
  let totalActs = 0;
  if (draft) {
    draft.days.forEach(day => {
      day.activities.forEach(a => {
        if (a.type === 'experience') {
          totalActs++;
          if (usedIds.has(a.id)) repeatedIds.add(a.id);
          usedIds.add(a.id);
        }
      });
    });
  }

  const voteStats = { yes: 0, love: 0, maybe: 0, no: 0, open: 0 };
  if (inputData) {
    Object.values(inputData.matchVotes).forEach(v => {
      if (v === 'yes') voteStats.yes++;
      else if (v === 'love') voteStats.love++;
      else if (v === 'maybe') voteStats.maybe++;
      else if (v === 'no' || v === 'dislike') voteStats.no++;
    });
    voteStats.open = inputData.catalog.length - (voteStats.yes + voteStats.love + voteStats.maybe + voteStats.no);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <header className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <Link to={`/trips/${tripId}`} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100"><ArrowLeft className="w-4 h-4" /></Link>
               <h1 className="text-3xl font-extrabold text-slate-800">Engine V2 Preview</h1>
            </div>
            <p className="text-slate-500 ml-11">Este é um draft isolado. Nada foi salvo no banco oficial trips.itinerary.</p>
           </div>
            <p className="text-slate-500 ml-11">Este é um draft isolado. Nada foi salvo no banco oficial trips.itinerary.</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={generatePreview} variant="outline" className="text-slate-700">Recalcular Draft</Button>
            {draft && persistedTrip && (
              <Button onClick={() => setApprovalState('REVIEW')} className="bg-lime-600 text-white hover:bg-lime-700">
                Aplicar ao Trip Space
              </Button>
            )}
          </div>
        </header>

        {approvalState === 'REVIEW' && draft && persistedTrip && (
          <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-lime-500 mb-8 relative z-50">
            <h2 className="text-2xl font-black text-slate-800 mb-4">Revisar aplicação ao Trip Space</h2>
            <div className="grid grid-cols-2 gap-6 mb-6">
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                 <h3 className="font-bold text-slate-700 mb-2">Resumo do Draft</h3>
                 <ul className="text-sm space-y-1">
                   <li><strong>Dias:</strong> {draft.days.length}</li>
                   <li><strong>Experiências:</strong> {draft.days.reduce((acc, d) => acc + d.activities.filter(a => a.type === 'experience').length, 0)}</li>
                   <li><strong>Reservas Fixas:</strong> {draft.days.reduce((acc, d) => acc + d.activities.filter(a => a.isFixed).length, 0)}</li>
                   <li><strong>Deslocamentos:</strong> {draft.days.reduce((acc, d) => acc + d.activities.filter(a => a.source === 'transit').length, 0)}</li>
                   <li><strong>Prontidão:</strong> {draft.geographicReadiness}</li>
                 </ul>
               </div>
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                 <h3 className="font-bold text-slate-700 mb-2">Comparação (Impacto)</h3>
                 <ul className="text-sm space-y-1 text-slate-600">
                   <li>Versão atual: {new Date(persistedTrip.updated_at).toLocaleString()}</li>
                   <li>O roteiro anterior será substituído pela versão do Engine.</li>
                   <li className="text-amber-600 font-semibold mt-2">Atenção: Ações de reversão automática não estão garantidas nesta versão (V2 Foundation).</li>
                 </ul>
               </div>
            </div>
            <div className="flex gap-4">
               <Button onClick={handleApplyDraft} className="bg-slate-900 text-white font-bold w-full">
                 Aprovar e aplicar ao Trip Space
               </Button>
               <Button onClick={() => setApprovalState('IDLE')} variant="outline" className="w-1/3">
                 Cancelar
               </Button>
            </div>
          </div>
        )}

        {approvalState !== 'IDLE' && approvalState !== 'REVIEW' && (
           <div className={`p-6 rounded-2xl shadow-sm mb-8 font-bold border-2 ${approvalState === 'APPLYING' ? 'bg-blue-50 border-blue-500 text-blue-800' : approvalState === 'APPLIED' ? 'bg-lime-50 border-lime-500 text-lime-800' : 'bg-red-50 border-red-500 text-red-800'}`}>
              {approvalState === 'APPLYING' && <div className="flex items-center gap-3"><Loader2 className="w-6 h-6 animate-spin" /> Aplicando Roteiro...</div>}
              {approvalState === 'APPLIED' && <div className="flex flex-col gap-3"><div className="flex items-center gap-3"><CheckCircle className="w-6 h-6" /> Roteiro persistido com sucesso!</div><Link to={`/app/trips/${tripId}`} className="text-lime-700 underline text-sm font-medium ml-9">Abrir no Trip Space</Link></div>}
              {approvalState === 'ALREADY_APPLIED' && <div className="flex items-center gap-3"><Info className="w-6 h-6" /> Este exato draft já foi aplicado ao banco. Nenhuma alteração feita.</div>}
              {approvalState === 'ITINERARY_CHANGED_SINCE_PREVIEW' && <div className="flex items-center gap-3"><AlertTriangle className="w-6 h-6" /> Concorrência: A viagem foi alterada no banco depois que você abriu este preview. Recalcule o draft.</div>}
              {approvalState === 'BLOCKED_BY_CONFLICT' && <div className="flex items-center gap-3"><AlertTriangle className="w-6 h-6" /> Conflito: O draft removeu ou alterou itens protegidos (reservas fixas). {applyError}</div>}
              {approvalState === 'READBACK_MISMATCH' && <div className="flex items-center gap-3"><AlertTriangle className="w-6 h-6" /> Erro de Leitura: Os dados foram salvos mas a leitura de confirmação falhou.</div>}
              {approvalState === 'PERSISTENCE_FAILED' && <div className="flex items-center gap-3"><AlertTriangle className="w-6 h-6" /> Erro de Persistência: {applyError}</div>}
           </div>
        )}

        {(health || draft) && (() => {
          let hasCriticals = health ? health.critical.length > 0 : false;
          let integrationBlocked = !health?.isReadyForIntegration || hasCriticals;
          let blockReasons: string[] = [];

          if (draft) {
             draft.days.forEach(d => {
                d.warnings.forEach(w => {
                   if (w.includes('TEMPORAL_OVERLAP') || w.includes('INVALID_') || w.includes('OVERLOAD') || w.includes('DUPLICATE_')) {
                      integrationBlocked = true;
                      hasCriticals = true;
                      blockReasons.push(w);
                   }
                });
             });
             
             draft.geoHealthIssues?.forEach(g => {
                if (g.severity === 'critical') {
                   integrationBlocked = true;
                   hasCriticals = true;
                   blockReasons.push(`[GEO_CRITICAL] ${g.message}`);
                }
             });
             if (draft.overallWarnings.some(w => w.includes('Planejamento incompleto'))) {
                integrationBlocked = true;
             }
          }

          let providerName = "LocalDeterministicGeoProvider";
          let providerSource = "local_fallback";
          let providerConfidence = "low";
          
          let eligibleGps = 0;
          if (inputData) {
            inputData.catalog.forEach(c => {
              if (c.location_lat && c.location_lng) eligibleGps++;
            });
          }
          
          let draftGps = 0;
          let draftNoGps = 0;
          let routeSegments = 0;
          if (draft) {
            draft.days.forEach(d => {
              d.activities.forEach(a => {
                if (a.source === 'transit') routeSegments++;
                else if (['experience', 'hotel', 'flight', 'reservation'].includes(a.type)) {
                  if (a.coordinates) draftGps++;
                  else draftNoGps++;
                }
              });
            });
          }
          
          let gpsCoverage = draftGps + draftNoGps > 0 ? Math.round((draftGps / (draftGps + draftNoGps)) * 100) : 0;
          let geoReadiness = draft?.geographicReadiness || 'FAILED';

          return (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            {hasCriticals ? (
               <div className="bg-red-600 text-white p-4 rounded-xl mb-6 shadow-md flex flex-col items-center justify-center font-black tracking-wide">
                 <span className="text-xl">DRAFT INVÁLIDO — REQUER CORREÇÃO</span>
               </div>
            ) : integrationBlocked ? (
               <div className="bg-amber-500 text-white p-4 rounded-xl mb-6 shadow-md flex flex-col items-center justify-center font-black tracking-wide">
                 <span className="text-xl">AINDA NÃO PRONTO PARA INTEGRAÇÃO</span>
                 <span className="text-sm font-medium mt-1">DRAFT VÁLIDO PARA REVISÃO</span>
               </div>
            ) : (
               <div className="bg-lime-600 text-white p-4 rounded-xl mb-6 shadow-md flex items-center justify-center font-black text-xl tracking-wide">
                 DRAFT PRONTO PARA INTEGRAÇÃO
               </div>
            )}
            
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
               {health?.ready ? <CheckCircle className="w-6 h-6 text-lime-500" /> : <AlertTriangle className="w-6 h-6 text-red-500" />}
               Input Health: {health?.confidence.toUpperCase()} CONFIDENCE
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <h3 className="font-bold text-sm text-red-800 bg-red-50 p-2 rounded mb-2">Critical Issues ({(health?.critical.length || 0) + blockReasons.length})</h3>
                  <ul className="space-y-2 text-sm text-red-700">
                    {health?.critical.map((c, i) => <li key={`hc-${i}`} className="flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /> {c.message}</li>)}
                    {blockReasons.map((r, i) => <li key={`dr-${i}`} className="flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /> {r}</li>)}
                    {(health?.critical.length === 0 && blockReasons.length === 0) && <li className="text-slate-400">Nenhum problema crítico.</li>}
                  </ul>
               </div>
               <div>
                  <h3 className="font-bold text-sm text-amber-800 bg-amber-50 p-2 rounded mb-2">Warnings ({health?.warnings.length || 0})</h3>
                  <ul className="space-y-2 text-sm text-amber-700">
                    {health?.warnings.map((w, i) => <li key={i} className="flex gap-2"><Info className="w-4 h-4 shrink-0" /> {w.message}</li>)}
                    {health?.warnings.length === 0 && <li className="text-slate-400">Nenhum warning.</li>}
                  </ul>
               </div>
               {draft?.geoHealthIssues && draft.geoHealthIssues.length > 0 && (
                 <div className="md:col-span-2">
                    <h3 className="font-bold text-sm text-sky-800 bg-sky-50 p-2 rounded mb-2 flex items-center justify-between">
                       <span>Geo Health Issues ({draft.geoHealthIssues.length})</span>
                    </h3>
                    <ul className="space-y-2 text-sm">
                      {draft.geoHealthIssues.map((g, i) => (
                        <li key={`geo-${i}`} className={`flex gap-2 ${g.severity === 'critical' ? 'text-red-700 font-bold' : 'text-sky-700'}`}>
                           <MapPin className="w-4 h-4 shrink-0" /> [{g.code}] {g.message}
                        </li>
                      ))}
                    </ul>
                 </div>
               )}
            </div>
          </section>
        )})()}

        <GeoAuditPanel inputData={inputData} draft={draft} tripId={tripId} />

        {inputData && (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
               <BarChart className="w-5 h-5 text-indigo-500" /> Diagnóstico do Algoritmo
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                <div>
                   <strong className="block text-slate-500 uppercase text-xs">Datas</strong>
                   <div>Original: {inputData.startDate} a {inputData.endDate}</div>
                   <div>Geradas: {draft?.days.length} dias ({draft?.days[0]?.date} a {draft?.days[draft?.days.length-1]?.date})</div>
                </div>
                <div>
                   <strong className="block text-slate-500 uppercase text-xs">Voo de Chegada</strong>
                   {inputData.arrivalFlight ? 
                      <div>{inputData.arrivalFlight.flightNumber} ({inputData.arrivalFlight.arrivalLocalDateTime})</div> : 
                      <div className="text-amber-600">Não identificado</div>
                   }
                   <strong className="block text-slate-500 uppercase text-xs mt-2">Voo de Partida</strong>
                   {inputData.departureFlight ? 
                      <div>{inputData.departureFlight.flightNumber} ({inputData.departureFlight.departureLocalDateTime})</div> : 
                      <div className="text-amber-600">Não identificado</div>
                   }
                </div>
                <div>
                   <strong className="block text-slate-500 uppercase text-xs">Basecamp</strong>
                   {inputData.basecamp ? 
                      <div>{inputData.basecamp.name} {inputData.basecamp.lat ? '(GPS OK)' : <span className="text-amber-600">(Sem GPS)</span>}</div> :
                      <div className="text-red-600">Nenhum hotel configurado</div>
                   }
                </div>
                <div>
                   <strong className="block text-slate-500 uppercase text-xs">Match Votes Encontrados</strong>
                   <div>Yes: {voteStats.yes} | Love: {voteStats.love}</div>
                   <div>Maybe: {voteStats.maybe} | No: {voteStats.no}</div>
                   <div>Sem voto (Elegíveis): {voteStats.open}</div>
                </div>
                <div>
                   <strong className="block text-slate-500 uppercase text-xs">Deduplicação</strong>
                   <div>Experiências geradas: {totalActs}</div>
                   <div>Experiências únicas: {usedIds.size}</div>
                   {repeatedIds.size > 0 ? (
                      <div className="text-red-600 font-bold">Atenção: {repeatedIds.size} repetições indevidas!</div>
                   ) : (
                      <div className="text-lime-600">Nenhuma repetição detectada</div>
                   )}
                </div>
             </div>
          </section>
        )}

        {draft && (
          <section className="space-y-6">
            {draft.days.map((day: DaySchedule, i: number) => {
              const [dy, dm, dd] = day.date.split('-').map(Number);
              const dateObj = new Date(dy, dm - 1, dd);
              return (
              <div key={day.date} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <h3 className="text-lg font-bold text-slate-800">Dia {i + 1} - {dateObj.toLocaleDateString('pt-BR')}</h3>
                </div>

                <div className="space-y-4">
                  {day.activities.map((act, actIdx) => {
                    const st = act.startTime.split('T')[1]?.substring(0, 5) || act.startTime;
                    const et = act.endTime ? act.endTime.split('T')[1]?.substring(0, 5) || act.endTime : null;
                    
                    return (
                      <div key={`${act.id}-${actIdx}`} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 group-[.is-active]:bg-lime-50 text-slate-500 group-[.is-active]:text-lime-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          {renderActivityIcon(act)}
                        </div>
                        <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border relative overflow-hidden transition-all hover:shadow-md ${
                          act.isFixed ? 'bg-amber-50/50 border-amber-200' :
                          act.isWindow ? 'bg-slate-50 border-slate-200' :
                          act.isEstimatedTime ? 'bg-blue-50/30 border-blue-100' :
                          act.source === 'transit' ? 'bg-sky-50 border-sky-200' :
                          'bg-white border-slate-200'
                        }`}>
                          
                          {act.source === 'transit' ? (
                            <div>
                               <div className="font-bold text-sky-900 mb-2">{act.title}</div>
                               <details className="text-[10px] text-sky-500 font-mono mb-2">
                                 <summary className="cursor-pointer hover:text-sky-700">Debug IDs</summary>
                                 <div className="mt-1 pl-2 border-l-2 border-sky-200">
                                   {act.routeEstimate?.fromActivityId} &rarr; {act.routeEstimate?.toActivityId}
                                 </div>
                               </details>
                               <div className="grid grid-cols-2 gap-2 text-sm text-sky-800">
                                  <div>{act.routeEstimate?.estimate.mode === 'walk' ? '🚶' : '🚌'} {act.routeEstimate?.estimate.distanceMeters}m</div>
                                  <div>⏱ {act.routeEstimate?.estimate.durationMinutes} min</div>
                               </div>
                               <div className="mt-3 pt-3 border-t border-sky-100 text-[10px] text-sky-600 uppercase tracking-wide">
                                  Provider: local_fallback | Confiança: Baixa
                               </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between space-x-2 mb-1">
                                <div className="font-bold text-slate-800">{act.title}</div>
                                {act.isWindow ? (
                                   <time className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">A partir das {st}</time>
                                ) : (
                                   <time className="font-mono text-xs font-medium text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full">{st} - {et}</time>
                                )}
                              </div>
                              {act.location && <div className="text-sm text-slate-500 mb-2">{act.location}</div>}
                              
                              <div className="flex gap-2 flex-wrap mt-2">
                                 {act.isFixed && <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">FIXA</span>}
                                 {act.isWindow && <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">A PARTIR DE</span>}
                                 {act.isEstimatedTime && !act.isWindow && <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">⏰ ESTIMADO</span>}
                                 {act.isDecisionPending && <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> DECISÃO PENDENTE</span>}
                                 <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                   {act.source}
                                 </span>
                              </div>
                              
                              {act.reason && (
                                 <div className="mt-3 pt-3 border-t border-slate-50 text-xs text-slate-400 font-medium">
                                   <Info className="inline w-3 h-3 mr-1 -mt-0.5" />
                                   {act.reason}
                                 </div>
                              )}

                              {(() => {
                                 const isRoutable = !act.isWindow && act.type !== 'flight' && act.source !== 'logistics' && act.source !== 'transit' && !act.id.includes('luggage') && !act.id.includes('rest');
                                 if (isRoutable && !act.coordinates) {
                                    return (
                                      <div className="mt-2 pt-2 border-t border-red-50 flex items-center gap-2 text-xs font-mono text-red-500 bg-red-50 p-2 rounded">
                                        <AlertTriangle className="w-3 h-3 shrink-0" />
                                        Deslocamento não calculado - Motivo: coordenadas ausentes
                                      </div>
                                    );
                                 }
                                 return null;
                              })()}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {day.activities.length === 0 && (
                    <div className="text-center text-slate-400 py-8 relative z-10 bg-white border border-dashed border-slate-200 rounded-xl">
                       Dia totalmente livre.
                    </div>
                  )}
                </div>
              </div>
            )})}
          </section>
        )}
      </div>
    </div>
  );
}
