"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Compass, Calendar, MapPin, Clock, DollarSign, Sparkles, 
  CheckSquare, Square, Plus, Trash2, ArrowRight, ChevronRight, 
  Briefcase, Award, RefreshCw, Heart
} from "lucide-react";
import { getTravelState, saveTravelState, Attraction, ItineraryDay } from "@/utils/travelState";
import { showSuccess } from "@/utils/toast";

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

  const handleRemoveAttraction = (dayNumber: number, attractionId: string) => {
    const updatedItinerary = state.itinerary.map(day => {
      if (day.dayNumber === dayNumber) {
        return {
          ...day,
          attractions: day.attractions.filter(a => a.id !== attractionId)
        };
      }
      return day;
    });
    const newState = { ...state, itinerary: updatedItinerary };
    setState(newState);
    saveTravelState(newState);
    showSuccess("Atração removida do roteiro!");
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
            <button 
              onClick={handleResetItinerary}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reiniciar Roteiro
            </button>
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
                {currentDayData.attractions.map((attr, idx) => (
                  <div key={attr.id} className="relative group">
                    {/* Timeline Dot */}
                    <span className="absolute -left-[31px] top-1.5 grid h-4 w-4 place-items-center rounded-full bg-white border-2 border-[#C5A85C] group-hover:bg-[#C5A85C] transition-colors" />

                    <div className="grid gap-4 md:grid-cols-[120px_1fr] items-start">
                      {/* Attraction Image */}
                      <div className="aspect-[4/3] md:aspect-square rounded-xl overflow-hidden bg-slate-100 border border-[#EAE6DF]">
                        <img src={attr.image} alt={attr.name} className="h-full w-full object-cover" />
                      </div>

                      {/* Attraction Details */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C5A85C]">
                              {attr.categoryLabel}
                            </span>
                            <h4 className="font-serif text-lg font-medium text-[#0D0E10] mt-0.5">
                              {attr.name}
                            </h4>
                          </div>
                          <button
                            onClick={() => handleRemoveAttraction(activeDay, attr.id)}
                            className="text-slate-300 hover:text-red-500 p-1 transition-colors"
                            title="Remover do roteiro"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed">{attr.description}</p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-300" />
                            {attr.neighborhood}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-300" />
                            {attr.durationHours}h · {attr.bestTime}
                          </span>
                          <span className="flex items-center gap-0.5 font-medium text-slate-600">
                            Custo: {attr.costUSD === 0 ? "Grátis" : `U$ ${attr.costUSD}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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