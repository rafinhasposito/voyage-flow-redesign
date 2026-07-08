"use client";

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Compass, Search, Filter, Sparkles, Plus, Check, 
  MapPin, Clock, DollarSign, Landmark, Utensils, Eye, ShoppingBag
} from "lucide-react";
import { getTravelState, saveTravelState, ALL_ATTRACTIONS, Attraction } from "@/utils/travelState";
import { showSuccess } from "@/utils/toast";

const CATEGORIES = [
  { id: "all", label: "Todos", icon: Compass },
  { id: "culture", label: "Arte & Cultura", icon: Landmark },
  { id: "food", label: "Gastronomia", icon: Utensils },
  { id: "views", label: "Mirantes", icon: Eye },
  { id: "nature", label: "Parques", icon: Compass },
  { id: "shopping", label: "Compras", icon: ShoppingBag }
];

export default function Catalog() {
  const [state, setState] = useState(getTravelState());
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState(1);

  const handleAddAttraction = (attraction: Attraction) => {
    // Verifica se a atração já está no roteiro
    const alreadyAdded = state.itinerary.some(day => 
      day.attractions.some(a => a.id === attraction.id)
    );

    if (alreadyAdded) {
      showSuccess("Esta atração já está no seu roteiro!");
      return;
    }

    const updatedItinerary = state.itinerary.map(day => {
      if (day.dayNumber === selectedDay) {
        return {
          ...day,
          attractions: [...day.attractions, attraction]
        };
      }
      return day;
    });

    const newState = { ...state, itinerary: updatedItinerary };
    setState(newState);
    saveTravelState(newState);
    showSuccess(`${attraction.name} adicionada ao Dia ${selectedDay}!`);
  };

  const filteredAttractions = ALL_ATTRACTIONS.filter(attr => {
    const matchesCategory = selectedCategory === "all" || attr.category === selectedCategory;
    const matchesSearch = attr.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          attr.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          attr.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
            <Link to="/app/board" className="text-slate-600 hover:text-[#0D0E10]">Meu Roteiro</Link>
            <Link to="/app/catalog" className="text-[#C5A85C]">Explorar Atrações</Link>
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

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-[1240px] px-6 py-8 md:px-10 space-y-8">
        
        {/* Header Copy */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C5A85C]">Curadoria Exclusiva</p>
          <h1 className="font-serif text-3xl md:text-4xl font-light text-[#0D0E10]">
            Explore o melhor de <span className="italic">Nova York</span>
          </h1>
          <p className="text-sm text-slate-500 max-w-xl">
            Selecione as atrações que mais combinam com você e adicione-as diretamente ao seu roteiro inteligente.
          </p>
        </div>

        {/* Search and Day Selector */}
        <div className="grid gap-4 md:grid-cols-[1fr_auto] items-center bg-white p-4 rounded-3xl border border-[#EAE6DF] shadow-[0_10px_30px_-15px_rgba(0,0,0,0.02)]">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por atração, bairro ou palavra-chave..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl pl-11 pr-4 py-3 text-sm text-[#0D0E10] focus:outline-none focus:border-[#C5A85C] focus:ring-1 focus:ring-[#C5A85C]"
            />
          </div>

          {/* Day Selector for Adding */}
          <div className="flex items-center gap-3 bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl px-4 py-2">
            <span className="text-xs font-medium text-slate-500">Adicionar ao Dia:</span>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
              className="bg-transparent text-sm font-semibold text-[#0D0E10] focus:outline-none cursor-pointer"
            >
              {state.itinerary.map(day => (
                <option key={day.dayNumber} value={day.dayNumber}>
                  Dia {day.dayNumber}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium transition-all shrink-0 ${
                  isSelected
                    ? "bg-[#0D0E10] text-white shadow-lg"
                    : "bg-white border border-[#EAE6DF] text-slate-600 hover:border-slate-400"
                }`}
              >
                <Icon className="h-4 w-4" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Attractions Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAttractions.map((attr) => {
            const isAdded = state.itinerary.some(day => 
              day.attractions.some(a => a.id === attr.id)
            );

            return (
              <article 
                key={attr.id}
                className="bg-white rounded-3xl border border-[#EAE6DF] overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300"
              >
                {/* Image & Match Score */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img 
                    src={attr.image} 
                    alt={attr.name} 
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1 text-xs font-semibold text-[#0D0E10] shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-[#C5A85C]" />
                    <span>{attr.matchScore}% Match</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C5A85C]">
                      {attr.categoryLabel}
                    </span>
                    <h3 className="font-serif text-xl font-medium text-[#0D0E10] leading-tight">
                      {attr.name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                      {attr.description}
                    </p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-[#EAE6DF]">
                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-300" />
                        {attr.neighborhood}
                      </span>
                      <span className="font-medium text-slate-600">
                        {attr.costUSD === 0 ? "Grátis" : `U$ ${attr.costUSD}`}
                      </span>
                    </div>

                    {/* Add Button */}
                    <button
                      onClick={() => handleAddAttraction(attr)}
                      disabled={isAdded}
                      className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-medium transition-all ${
                        isAdded
                          ? "bg-[#F3EFEA] text-slate-400 cursor-not-allowed"
                          : "bg-[#0D0E10] text-white hover:bg-slate-800 shadow-md"
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="h-4 w-4 text-[#C5A85C]" />
                          No Roteiro
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Adicionar ao Dia {selectedDay}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

      </main>
    </div>
  );
}