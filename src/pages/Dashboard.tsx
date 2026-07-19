"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Compass, Calendar, MapPin, Clock, DollarSign, Sparkles, 
  CheckSquare, Square, Plus, Trash2, ArrowRight, ChevronRight, 
  Briefcase, Award, RefreshCw, Heart
} from "lucide-react";
import { getTravelState, saveTravelState, Attraction, ItineraryDay, RecommendedExperience } from "@/utils/travelState";
import { showSuccess } from "@/utils/toast";
import { MatchScoreBadge } from "@/components/MatchScoreBadge";
import { ConciergeExplanation } from "@/components/ConciergeExplanation";
import { ExperienceWarning } from "@/components/ExperienceWarning";
import { recalculateAffectedSegment } from "@/utils/travelItineraryPartial";
import { Lock, Unlock, ArrowUp, ArrowDown, Undo, CalendarPlus, Replace, Clock as ClockIcon } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [state, setState] = useState(getTravelState());
  const [activeDay, setActiveDay] = useState(1);

  useEffect(() => {
    // Garante que o estado inicial esteja carregado
    setState(getTravelState());
  }, []);

  const handleToggleChecklist = (id: string) => {
    const updatedChecklist = state.checklist.map(item => 
      item.id === id ? { ...item, done: !item.done } : item
    );
    const newState = { ...state, checklist: updatedChecklist };
    setState(newState);
    saveTravelState(newState);
  };

  const saveStateToHistory = (currentState: typeof state) => {
    return [currentState.itinerary];
  };

  const handleRemoveAttraction = (dayNumber: number, attractionId: string) => {
    const history = saveStateToHistory(state);
    const dayIndex = state.itinerary.findIndex(d => d.dayNumber === dayNumber);
    if (dayIndex === -1) return;

    const stopIndex = state.itinerary[dayIndex].recommendations?.findIndex(r => r.experience.id === attractionId) ?? -1;

    const updatedItinerary = state.itinerary.map(day => {
      if (day.dayNumber === dayNumber) {
        return {
          ...day,
          attractions: day.attractions.filter(a => a.id !== attractionId),
          recommendations: day.recommendations ? day.recommendations.filter(r => r.experience.id !== attractionId) : []
        };
      }
      return day;
    });
    
    const recalculated = recalculateAffectedSegment(updatedItinerary, state.profile, dayIndex, Math.max(0, stopIndex - 1));
    const newState = { ...state, itinerary: recalculated, itineraryHistory: history };
    setState(newState);
    saveTravelState(newState);
    showSuccess("Atração removida do roteiro!");
  };

  const handleToggleLock = (dayNumber: number, attractionId: string) => {
    const history = saveStateToHistory(state);
    const dayIndex = state.itinerary.findIndex(d => d.dayNumber === dayNumber);
    
    const updatedItinerary = state.itinerary.map(day => {
      if (day.dayNumber === dayNumber) {
        return {
          ...day,
          recommendations: day.recommendations?.map(r => {
             if (r.experience.id === attractionId) {
                return {
                   ...r,
                   manualMetadata: {
                      ...(r.manualMetadata || {}),
                      source: "manual",
                      locked: !(r.manualMetadata?.locked)
                   }
                }
             }
             return r;
          })
        };
      }
      return day;
    });
    const recalculated = recalculateAffectedSegment(updatedItinerary, state.profile, dayIndex, 0);
    const newState = { ...state, itinerary: recalculated, itineraryHistory: history };
    setState(newState);
    saveTravelState(newState);
    showSuccess("Fixação alterada!");
  };

  const handleMove = (dayNumber: number, attractionId: string, direction: -1 | 1) => {
    const history = saveStateToHistory(state);
    const updatedItinerary = [...state.itinerary];
    const dayIndex = updatedItinerary.findIndex(d => d.dayNumber === dayNumber);
    if (dayIndex === -1) return;
    
    const recs = [...(updatedItinerary[dayIndex].recommendations || [])];
    const idx = recs.findIndex(r => r.experience.id === attractionId);
    if (idx === -1) return;
    
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= recs.length) return;
    
    const temp = recs[idx];
    recs[idx] = recs[newIdx];
    recs[newIdx] = temp;
    
    recs[idx].manualMetadata = { ...recs[idx].manualMetadata, source: "manual", manuallyMoved: true, locked: true };
    recs[newIdx].manualMetadata = { ...recs[newIdx].manualMetadata, source: "manual", manuallyMoved: true, locked: true };
    
    updatedItinerary[dayIndex] = { ...updatedItinerary[dayIndex], recommendations: recs };
    
    const recalculated = recalculateAffectedSegment(updatedItinerary, state.profile, dayIndex, Math.min(idx, newIdx));
    const newState = { ...state, itinerary: recalculated, itineraryHistory: history };
    setState(newState);
    saveTravelState(newState);
  };
  
  const handleMoveToDay = (dayNumber: number, attractionId: string, targetDayNumber: number) => {
    if (dayNumber === targetDayNumber) return;
    const history = saveStateToHistory(state);
    const updatedItinerary = [...state.itinerary];
    const sourceDayIndex = updatedItinerary.findIndex(d => d.dayNumber === dayNumber);
    const targetDayIndex = updatedItinerary.findIndex(d => d.dayNumber === targetDayNumber);
    if (sourceDayIndex === -1 || targetDayIndex === -1) return;

    const sourceRecs = [...(updatedItinerary[sourceDayIndex].recommendations || [])];
    const idx = sourceRecs.findIndex(r => r.experience.id === attractionId);
    if (idx === -1) return;

    const item = { ...sourceRecs[idx] };
    item.manualMetadata = { ...item.manualMetadata, source: "manual", manuallyMoved: true, locked: true };
    sourceRecs.splice(idx, 1);
    updatedItinerary[sourceDayIndex] = { ...updatedItinerary[sourceDayIndex], recommendations: sourceRecs };

    const targetRecs = [...(updatedItinerary[targetDayIndex].recommendations || [])];
    targetRecs.push(item);
    updatedItinerary[targetDayIndex] = { ...updatedItinerary[targetDayIndex], recommendations: targetRecs };

    let recalculated = recalculateAffectedSegment(updatedItinerary, state.profile, sourceDayIndex, Math.max(0, idx - 1));
    recalculated = recalculateAffectedSegment(recalculated, state.profile, targetDayIndex, targetRecs.length - 1);

    const newState = { ...state, itinerary: recalculated, itineraryHistory: history };
    setState(newState);
    saveTravelState(newState);
    showSuccess(`Movido para o Dia ${targetDayNumber}`);
  };

  const handleChangeTime = (dayNumber: number, attractionId: string, newTime: string) => {
    const history = saveStateToHistory(state);
    const updatedItinerary = [...state.itinerary];
    const dayIndex = updatedItinerary.findIndex(d => d.dayNumber === dayNumber);
    if (dayIndex === -1) return;
    
    const recs = [...(updatedItinerary[dayIndex].recommendations || [])];
    const idx = recs.findIndex(r => r.experience.id === attractionId);
    if (idx === -1) return;
    
    recs[idx].experience = { ...recs[idx].experience, plannedStartTime: newTime };
    recs[idx].manualMetadata = { ...recs[idx].manualMetadata, source: "manual", manuallyScheduled: true, locked: true };
    
    updatedItinerary[dayIndex] = { ...updatedItinerary[dayIndex], recommendations: recs };
    
    const recalculated = recalculateAffectedSegment(updatedItinerary, state.profile, dayIndex, idx);
    const newState = { ...state, itinerary: recalculated, itineraryHistory: history };
    setState(newState);
    saveTravelState(newState);
    showSuccess("Horário atualizado");
  };

  const handleSwap = async (dayNumber: number, attractionId: string) => {
    const history = saveStateToHistory(state);
    const updatedItinerary = [...state.itinerary];
    const dayIndex = updatedItinerary.findIndex(d => d.dayNumber === dayNumber);
    if (dayIndex === -1) return;
    
    const recs = [...(updatedItinerary[dayIndex].recommendations || [])];
    const idx = recs.findIndex(r => r.experience.id === attractionId);
    if (idx === -1) return;

    // Use findSubstituteExperience
    const { findSubstituteExperience } = await import("@/utils/travelItineraryPartial");
    const substitute = findSubstituteExperience(updatedItinerary, state.profile, dayNumber, attractionId);
       
    if (!substitute) {
      showSuccess("Nenhuma atração extra disponível ou compatível para substituir.");
      return;
    }

    recs[idx] = substitute;

    updatedItinerary[dayIndex] = { ...updatedItinerary[dayIndex], recommendations: recs };
    const recalculated = recalculateAffectedSegment(updatedItinerary, state.profile, dayIndex, idx);
       
    const newState = { ...state, itinerary: recalculated, itineraryHistory: history };
    setState(newState);
    saveTravelState(newState);
    showSuccess("Atração substituída!");
  };
  
  const handleUndo = () => {
    if (!state.itineraryHistory || state.itineraryHistory.length === 0) return;
    const history = [...state.itineraryHistory];
    const previous = history.pop()!;
    const newState = { ...state, itinerary: previous, itineraryHistory: history };
    setState(newState);
    saveTravelState(newState);
    showSuccess("Alteração desfeita!");
  };

  const handleResetItinerary = () => {
    localStorage.removeItem("viagem_dos_sonhos_state");
    const freshState = getTravelState();
    setState(freshState);
    showSuccess("Roteiro reiniciado para o padrão!");
  };

  const currentDayData = state.itinerary.find(d => d.dayNumber === activeDay) || state.itinerary[0];
  const totalCost = state.itinerary.reduce((acc, day) => {
    return acc + day.attractions.reduce((sum, attr) => sum + attr.costUSD, 0);
  }, 0) + state.customExpenses.reduce((sum, exp) => sum + exp.amountUSD, 0);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1E21] flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-[#EAE6DF] bg-[#FAF8F5]/80 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-4 md:px-10">
          <Link to="/" className="flex items-center gap-2 text-[#0D0E10]">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-[#F3EFEA]">
              <Compass className="h-4 w-4 text-[#C5A85C]" strokeWidth={2} />
            </span>
            <span className="font-serif text-lg font-medium tracking-tight">
              Viagem dos Sonhos
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <Link to="/app/board" className="text-[#C5A85C]">Meu Roteiro</Link>
            <Link to="/app/catalog" className="text-slate-600 hover:text-[#0D0E10]">Explorar Atrações</Link>
            <Link to="/app/wallet" className="text-slate-600 hover:text-[#0D0E10]">Orçamento & Gastos</Link>
          </nav>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-1 rounded-full bg-[#0D0E10] px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors"
          >
            Novo Roteiro
          </Link>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="flex-1 mx-auto w-full max-w-[1240px] px-6 py-8 md:px-10 grid gap-8 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
        
        {/* Left Column: Itinerary Timeline */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C5A85C]">Roteiro Inteligente</p>
              <h1 className="font-serif text-3xl md:text-4xl font-light text-[#0D0E10] mt-1">
                Seu dia a dia em <span className="italic">Nova York</span>
              </h1>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleUndo}
                disabled={!state.itineraryHistory || state.itineraryHistory.length === 0}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 disabled:opacity-50 transition-colors"
              >
                <Undo className="h-3.5 w-3.5" />
                Desfazer
              </button>
              <button 
                onClick={handleResetItinerary}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reiniciar
              </button>
            </div>
          </div>

          {/* Day Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {state.itinerary.map((day) => (
              <button
                key={day.dayNumber}
                onClick={() => setActiveDay(day.dayNumber)}
                className={`px-5 py-3 rounded-2xl text-sm font-medium transition-all shrink-0 ${
                  activeDay === day.dayNumber
                    ? "bg-[#0D0E10] text-white shadow-lg"
                    : "bg-white border border-[#EAE6DF] text-slate-600 hover:border-slate-400"
                }`}
              >
                Dia {day.dayNumber}
              </button>
            ))}
            <Link
              to="/app/catalog"
              className="px-4 py-3 rounded-2xl text-sm font-medium bg-[#F3EFEA] text-[#C5A85C] hover:bg-[#e9e3da] shrink-0 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Adicionar Atração
            </Link>
          </div>

          {/* Active Day Timeline */}
          <div className="bg-white rounded-3xl border border-[#EAE6DF] p-6 md:p-8 space-y-8 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FAF8F5] text-[#C5A85C] font-serif text-lg font-semibold">
                  {activeDay}
                </span>
                <div>
                  <h3 className="font-serif text-xl font-medium text-[#0D0E10]">Programação do Dia</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Rota otimizada para menor caminhada</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#C5A85C] bg-[#FAF8F5] px-3 py-1.5 rounded-full">
                <Sparkles className="h-3 w-3" /> Rota Inteligente
              </span>
            </div>

            {currentDayData && currentDayData.attractions.length > 0 ? (
              <div className="relative border-l-2 border-[#EAE6DF] ml-4 pl-6 space-y-8">
                {currentDayData.attractions.map((attr, idx) => {
                  const rec = currentDayData.recommendations?.find(r => r.experience.id === attr.id);
                  return (
                    <div key={attr.id} className="relative group">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[31px] top-1.5 grid h-4 w-4 place-items-center rounded-full bg-white border-2 border-[#C5A85C] group-hover:bg-[#C5A85C] transition-colors" />

                      <div className="grid gap-4 md:grid-cols-[120px_1fr] items-start">
                        {/* Attraction Image */}
                        <div className="aspect-[4/3] md:aspect-square rounded-xl overflow-hidden bg-slate-100 border border-[#EAE6DF] relative">
                          <img src={attr.image} alt={attr.name} className="h-full w-full object-cover" />
                          {rec && (
                            <div className="absolute top-2 right-2">
                              <MatchScoreBadge score={rec.finalScore} />
                            </div>
                          )}
                        </div>

                        {/* Attraction Details */}
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C5A85C] flex items-center gap-1">
                                {attr.categoryLabel}
                                {rec?.manualMetadata?.locked && (
                                  <span className="bg-slate-100 text-slate-500 px-1 py-0.5 rounded text-[9px] flex items-center gap-0.5">
                                    <Lock className="w-2 h-2" /> Fixado
                                  </span>
                                )}
                                {rec?.manualMetadata?.source === "manual" && !rec?.manualMetadata?.locked && (
                                  <span className="bg-slate-100 text-slate-500 px-1 py-0.5 rounded text-[9px]">
                                    Manual
                                  </span>
                                )}
                              </span>
                              <h4 className="font-serif text-lg font-medium text-[#0D0E10] mt-0.5">
                                {attr.name}
                              </h4>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              <button
                                onClick={() => handleMove(activeDay, attr.id, -1)}
                                className="text-slate-300 hover:text-[#C5A85C] p-1 transition-colors"
                                title="Mover para cima"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleMove(activeDay, attr.id, 1)}
                                className="text-slate-300 hover:text-[#C5A85C] p-1 transition-colors"
                                title="Mover para baixo"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleToggleLock(activeDay, attr.id)}
                                className={`p-1 transition-colors ${rec?.manualMetadata?.locked ? 'text-[#C5A85C]' : 'text-slate-300 hover:text-[#C5A85C]'}`}
                                title="Fixar / Soltar"
                              >
                                {rec?.manualMetadata?.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => handleSwap(activeDay, attr.id)}
                                className="text-slate-300 hover:text-[#C5A85C] p-1 transition-colors"
                                title="Substituir"
                              >
                                <Replace className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveAttraction(activeDay, attr.id)}
                                className="text-slate-300 hover:text-red-500 p-1 transition-colors"
                                title="Remover do roteiro"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              
                              <select 
                                className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1 text-slate-500 h-6 outline-none"
                                value={activeDay}
                                onChange={(e) => handleMoveToDay(activeDay, attr.id, Number(e.target.value))}
                                title="Mover para outro dia"
                              >
                                {state.itinerary.map(d => (
                                  <option key={d.dayNumber} value={d.dayNumber}>Dia {d.dayNumber}</option>
                                ))}
                              </select>

                            </div>
                          </div>

                          <p className="text-xs text-slate-500 leading-relaxed">{attr.description}</p>

                          {rec && (
                            <>
                              <ConciergeExplanation 
                                justification={rec.explanation.humanJustification}
                                reasons={rec.explanation.reasons}
                              />
                              <ExperienceWarning 
                                warnings={[
                                  ...rec.explanation.warnings,
                                  ...(rec.manualMetadata?.conflict?.restrictions?.messages || []),
                                  ...(rec.manualMetadata?.conflict?.logistics?.messages || []),
                                  ...(attr.logisticsEvaluation?.warnings?.map(w => w.message) || []),
                                  ...(attr.logisticsEvaluation?.blockers?.map(b => b.message) || []),
                                  ...(attr.logisticsEvaluation?.suggestedAdjustment ? [`Sugestão: ${attr.logisticsEvaluation.suggestedAdjustment.reason}`] : [])
                                ]} 
                                isBlocker={
                                  rec.restrictions?.allowed === false || 
                                  attr.logisticsEvaluation?.feasible === false || 
                                  !!rec.manualMetadata?.conflict
                                } 
                              />
                            </>
                          )}

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-300" />
                              {attr.neighborhood}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-slate-300" />
                              {attr.plannedStartTime && attr.plannedEndTime 
                                ? <span className="font-medium text-slate-700 flex items-center gap-1">
                                    <input 
                                      type="time" 
                                      className="bg-transparent border-b border-slate-200 outline-none text-slate-700 w-16 text-center" 
                                      value={attr.plannedStartTime} 
                                      onChange={(e) => handleChangeTime(activeDay, attr.id, e.target.value)}
                                    />
                                    - {attr.plannedEndTime}
                                  </span>
                                : <span>{attr.durationHours}h · {attr.bestTime}</span>
                              }
                            </span>
                            <span className="flex items-center gap-0.5 font-medium text-slate-600">
                              Custo: {attr.costUSD === 0 ? "Grátis" : `U$ ${attr.costUSD}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <p className="text-slate-400 text-sm">Nenhuma atração agendada para este dia.</p>
                <Link
                  to="/app/catalog"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#0D0E10] px-5 py-2.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors"
                >
                  <Plus className="h-4 w-4" /> Adicionar Atrações
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Summary & Checklist */}
        <div className="space-y-6">
          {/* Trip Summary Card */}
          <div className="bg-[#0D0E10] text-white rounded-3xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#C5A85C]/10 blur-2xl" />
            
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C5A85C]">Resumo da Viagem</p>
              <h3 className="font-serif text-2xl font-light">Nova York dos Sonhos</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Duração</p>
                <p className="font-serif text-lg font-light mt-0.5">{state.profile.days} dias</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Estilo</p>
                <p className="font-serif text-lg font-light mt-0.5 capitalize">
                  {state.profile.style === "couple" ? "Em Casal" : state.profile.style}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Orçamento</p>
                <p className="font-serif text-lg font-light mt-0.5 text-[#C5A85C]">{state.profile.budget}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Custo Estimado</p>
                <p className="font-serif text-lg font-light mt-0.5 text-[#C5A85C]">U$ {totalCost}</p>
              </div>
            </div>

            <Link
              to="/app/wallet"
              className="w-full inline-flex items-center justify-between rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-3 text-xs font-medium text-white transition-colors"
            >
              <span>Ver detalhamento financeiro</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Checklist Card */}
          <div className="bg-white rounded-3xl border border-[#EAE6DF] p-6 md:p-8 space-y-6 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-4">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-[#C5A85C]" />
                <h3 className="font-serif text-lg font-medium text-[#0D0E10]">Preparativos</h3>
              </div>
              <span className="text-xs text-slate-400">
                {state.checklist.filter(i => i.done).length} de {state.checklist.length} concluídos
              </span>
            </div>

            <div className="space-y-3">
              {state.checklist.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleToggleChecklist(item.id)}
                  className="w-full flex items-start gap-3 text-left group"
                >
                  <span className="shrink-0 mt-0.5 text-slate-400 group-hover:text-[#C5A85C] transition-colors">
                    {item.done ? (
                      <CheckSquare className="h-4 w-4 text-[#C5A85C]" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </span>
                  <span className={`text-xs leading-relaxed ${item.done ? "line-through text-slate-400" : "text-slate-600"}`}>
                    {item.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}