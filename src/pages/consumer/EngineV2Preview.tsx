import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TripRepository } from '@/repositories/TripRepository';
import { TripWalletRepository } from '@/repositories/TripWalletRepository';
import { ExperienceRepository } from '@/repositories/ExperienceRepository';
import { EngineInputBuilder } from '@/domain/itinerary-engine/inputBuilder';
import { InputHealthValidator, TripEngineInputHealth } from '@/domain/itinerary-engine/inputHealth';
import { SchedulerV1, ItineraryDraftV1, DaySchedule, ScheduledActivity } from '@/domain/itinerary-engine/schedulerV1';
import { TripEngineInputV1 } from '@/domain/itinerary-engine/contracts';
import { Loader2, ArrowLeft, AlertTriangle, CheckCircle, Info, Plane, Hotel, MapPin, Calendar, Clock, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EngineV2Preview() {
  const { tripId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [health, setHealth] = useState<TripEngineInputHealth | null>(null);
  const [draft, setDraft] = useState<ItineraryDraftV1 | null>(null);
  const [inputData, setInputData] = useState<TripEngineInputV1 | null>(null);

  const generatePreview = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!tripId) throw new Error("Trip ID is required");

      const trip = await TripRepository.getTripById(tripId);
      const reservations = await TripWalletRepository.getReservations(tripId);
      
      const catalog = await ExperienceRepository.getByDestination(trip.destination);
      
      const input = EngineInputBuilder.build(trip, reservations, catalog);
      setInputData(input);
      
      const healthResult = InputHealthValidator.validate(input);
      setHealth(healthResult);

      const itineraryDraft = SchedulerV1.generate(input);
      setDraft(itineraryDraft);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao gerar o preview.');
    } finally {
      setLoading(false);
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
          <Button onClick={generatePreview} className="bg-slate-900 text-white">Recalcular Draft</Button>
        </header>

        {health && (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
               {health.ready ? <CheckCircle className="w-6 h-6 text-lime-500" /> : <AlertTriangle className="w-6 h-6 text-red-500" />}
               Input Health: {health.confidence.toUpperCase()} CONFIDENCE
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <h3 className="font-bold text-sm text-red-800 bg-red-50 p-2 rounded mb-2">Critical Issues ({health.critical.length})</h3>
                  <ul className="space-y-2 text-sm text-red-700">
                    {health.critical.map((c, i) => <li key={i} className="flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /> {c.message}</li>)}
                    {health.critical.length === 0 && <li className="text-slate-400">Nenhum problema crítico.</li>}
                  </ul>
               </div>
               <div>
                  <h3 className="font-bold text-sm text-amber-800 bg-amber-50 p-2 rounded mb-2">Warnings ({health.warnings.length})</h3>
                  <ul className="space-y-2 text-sm text-amber-700">
                    {health.warnings.map((w, i) => <li key={i} className="flex gap-2"><Info className="w-4 h-4 shrink-0" /> {w.message}</li>)}
                    {health.warnings.length === 0 && <li className="text-slate-400">Nenhum warning.</li>}
                  </ul>
               </div>
            </div>
          </section>
        )}

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
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <h2 className="text-xl font-bold text-slate-800 mb-2">Itinerary Draft V1</h2>
               {draft.overallWarnings.length > 0 && (
                 <div className="mb-4 p-3 bg-amber-50 rounded-lg text-sm text-amber-800 border border-amber-200">
                   <strong>Avisos Gerais:</strong>
                   <ul className="list-disc pl-5 mt-1">
                     {draft.overallWarnings.map((w, i) => <li key={i}>{w}</li>)}
                   </ul>
                 </div>
               )}
            </div>

            {draft.days.map((day: DaySchedule, i: number) => {
              const [dy, dm, dd] = day.date.split('-').map(Number);
              const dateObj = new Date(dy, dm - 1, dd);
              return (
              <div key={day.date} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <h3 className="text-lg font-bold text-slate-800">Dia {i + 1} - {dateObj.toLocaleDateString('pt-BR')}</h3>
                </div>

                {day.warnings.length > 0 && (
                  <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg text-sm font-medium">
                    {day.warnings.map((w, wi) => <div key={wi}>{w}</div>)}
                  </div>
                )}

                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[1.125rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {day.activities.map((act, actIdx) => {
                    const st = act.startTime.split('T')[1]?.substring(0, 5) || act.startTime;
                    const et = act.endTime.split('T')[1]?.substring(0, 5) || act.endTime;
                    
                    return (
                      <div key={`${act.id}-${actIdx}`} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 group-[.is-active]:bg-lime-50 text-slate-500 group-[.is-active]:text-lime-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          {renderActivityIcon(act)}
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                          <div className="flex items-center justify-between space-x-2 mb-1">
                            <div className="font-bold text-slate-800">{act.title}</div>
                            <time className="font-mono text-xs font-medium text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full">{st} - {et}</time>
                          </div>
                          {act.location && <div className="text-sm text-slate-500 mb-2">{act.location}</div>}
                          
                          <div className="flex gap-2 flex-wrap mt-2">
                             {act.isFixed && <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">FIXA</span>}
                             <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                               {act.source}
                             </span>
                          </div>
                          
                          {act.reason && (
                             <div className="mt-3 pt-3 border-t border-slate-50 text-xs text-slate-400 font-medium">
                               <Info className="inline w-3 h-3 mr-1 -mt-0.5" />
                               {act.reason}
                             </div>
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
