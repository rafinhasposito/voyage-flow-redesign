"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Compass,
  Heart,
  Landmark,
  UtensilsCrossed,
  Mountain,
  Trees,
  ShoppingBag,
  Sparkles,
  MapPin,
  Wallet,
  CheckCircle2,
  Ticket,
  Star,
  type LucideIcon,
} from "lucide-react";
import { TravelExperience } from "@/utils/travelState";
import { ExperienceRepository } from "@/repositories";
import { useConsumerAuth } from "@/contexts/ConsumerAuthProvider";

const CATEGORY_ICONS: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  culture: { icon: Landmark, color: "#8E5CB5", label: "Arte & Cultura" },
  food: { icon: UtensilsCrossed, color: "#D98A6C", label: "Gastronomia" },
  views: { icon: Mountain, color: "#4A7BB0", label: "Mirantes" },
  nature: { icon: Trees, color: "#4E8054", label: "Parques" },
  shopping: { icon: ShoppingBag, color: "#B55C75", label: "Compras" },
  classic: { icon: Sparkles, color: "#8A9A86", label: "Clássicos" }
};

const normalizeCategory = (raw: string): string => {
  const norm = (raw || "").toLowerCase();
  if (norm.includes('cultura') || norm.includes('museu') || norm.includes('museum') || norm.includes('art')) return 'culture';
  if (norm.includes('gastronomia') || norm.includes('food') || norm.includes('restaurant')) return 'food';
  if (norm.includes('mirante') || norm.includes('view') || norm.includes('observatory')) return 'views';
  if (norm.includes('parque') || norm.includes('nature') || norm.includes('park')) return 'nature';
  if (norm.includes('compra') || norm.includes('shopping')) return 'shopping';
  return 'classic';
};

export default function Index() {
  const [attractions, setAttractions] = useState<TravelExperience[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { user, signOut } = useConsumerAuth();

  const loadExperiences = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await ExperienceRepository.getAll();

      const mapped = data
        .filter(r => r.image || (r.images && r.images.length > 0)) // Real experiences with images
        .map(row => {
          const normCat = normalizeCategory(row.category);
          return {
            ...row,
            normalizedCategory: normCat,
            categoryLabel: CATEGORY_ICONS[normCat]?.label || row.categoryLabel || row.category
          };
        });

      console.log(`[Home] Carregadas ${data.length} experiências reais. Com imagens: ${mapped.length}`);
      setAttractions(mapped);
    } catch (err) {
      console.error("Failed to load real catalog on Index:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExperiences();
  }, []);

  const toggleFav = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filtro de Coleção
  const filtered = selectedCategory === "all"
    ? attractions
    : attractions.filter((a: any) => a.normalizedCategory === selectedCategory);

  const visibleAttractions = filtered.slice(0, 8);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900 font-sans selection:bg-lime-200 selection:text-lime-950 overflow-x-hidden">
      <SiteNav user={user} signOut={signOut} />
      <Hero user={user} />

      {/* 2. Collection Section */}
      <section id="descobrir" className="mx-auto max-w-7xl px-4 sm:px-6 py-20 md:py-32">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C5A85C] mb-4 flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> Sua coleção de descobertas
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-slate-900 leading-tight">
              Cada lugar, uma <span className="font-medium text-slate-900 relative whitespace-nowrap">
                figurinha
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-lime-400" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 0" stroke="currentColor" strokeWidth="4" fill="transparent"/></svg>
              </span><br/> para colecionar.
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-slate-600">
            Descubra cantos, sabores e vistas. Salve os que te chamarem — o roteiro se monta em torno da sua coleção.
          </p>
        </div>

        {/* Category Chips */}
        <div className="flex flex-wrap gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`shrink-0 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
              selectedCategory === "all"
                ? "bg-lime-400 text-lime-950 shadow-sm border border-lime-400"
                : "bg-white border border-slate-200 text-slate-600 hover:border-lime-400 hover:text-lime-900"
            }`}
          >
            Tudo
          </button>
          {Object.entries(CATEGORY_ICONS).map(([key, val]) => {
            const isSelected = selectedCategory === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`shrink-0 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                  isSelected
                    ? "bg-lime-400 text-lime-950 shadow-sm border border-lime-400"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {val.label}
              </button>
            );
          })}
        </div>

        {/* Grid de Experiências */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white border border-slate-200 rounded-[24px] overflow-hidden">
                <div className="bg-slate-200 aspect-[4/5] w-full"></div>
                <div className="p-5">
                  <div className="h-5 bg-slate-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : hasError ? (
          <div className="flex flex-col items-center justify-center py-20 bg-red-50/50 rounded-[32px] border border-red-100 text-red-600">
            <Compass className="h-10 w-10 mb-4 opacity-70" />
            <p className="font-bold text-lg mb-2">Não foi possível carregar as experiências.</p>
            <button onClick={loadExperiences} className="px-6 py-2.5 bg-red-600 text-white rounded-full font-bold text-sm hover:bg-red-700 transition-colors">
              Tentar novamente
            </button>
          </div>
        ) : visibleAttractions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white/50 rounded-[32px] border border-slate-200 text-slate-500 border-dashed">
            <Compass className="h-12 w-12 mb-4 opacity-30" />
            <p className="font-medium text-slate-600">Nenhuma experiência encontrada para esta categoria.</p>
            <button onClick={() => setSelectedCategory("all")} className="mt-4 text-sm font-bold text-lime-700 underline">
              Ver todas as experiências
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {visibleAttractions.map((place: any) => {
              const normCat = place.normalizedCategory;
              const catInfo = CATEGORY_ICONS[normCat] || { icon: Compass, color: "#C5A85C", label: place.category };
              const Icon = catInfo.icon;
              const favorited = favorites.has(place.id);

              const badgeContent = user ? (
                <>
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-80 mb-0.5 text-lime-950">Match</span>
                  <span className="text-[13px] font-black text-lime-950">{place.matchScore || "90"}%</span>
                </>
              ) : (
                <>
                  <Star className="w-3 h-3 mb-0.5 fill-lime-950 text-lime-950" />
                  <span className="text-[11px] font-black text-lime-950">{place.rating || "4.8"}</span>
                </>
              );

              return (
                <Link
                  to="/minhas-viagens/nova"
                  key={place.id}
                  className="group relative flex flex-col overflow-hidden rounded-[24px] bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-lime-400"
                >
                  <div className="relative aspect-[4/5] overflow-hidden p-2 pb-0">
                     <div className="w-full h-full rounded-t-[16px] overflow-hidden relative bg-slate-100">
                        <img
                          src={place.image || (place.images && place.images[0])}
                          alt={`Imagem de ${place.name}`}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                     </div>
                    {/* Badge */}
                    <div className="absolute left-4 top-4 bg-lime-400 px-2.5 py-1 rounded-xl shadow-sm border border-lime-300 flex flex-col items-center leading-none">
                      {badgeContent}
                    </div>

                    {/* Favorite */}
                    <button
                      type="button"
                      aria-label="Salvar experiência"
                      onClick={(e) => toggleFav(place.id, e)}
                      className="absolute right-4 top-4 h-9 w-9 rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-white flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-10 focus:outline-none focus:ring-2 focus:ring-lime-500"
                    >
                      <Heart className={`h-4 w-4 transition-all ${favorited ? "fill-red-500 text-red-500" : "text-slate-400"}`} strokeWidth={favorited ? 0 : 2} />
                    </button>
                  </div>

                  <div className="px-5 py-4 flex flex-col flex-1">
                    <h3 className="font-display font-bold text-lg text-slate-900 leading-tight mb-2 group-hover:text-lime-700 transition-colors">
                      {place.name}
                    </h3>
                    <p className="text-xs text-slate-500 mb-3 font-medium flex items-center gap-1">
                       <MapPin className="w-3 h-3" /> {place.neighborhood || "Nova York"}
                    </p>
                    <div className="mt-auto flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                      <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider" style={{ color: catInfo.color }}>
                         <Icon className="w-3.5 h-3.5" />
                         {catInfo.label}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Manifesto */}
      <section className="bg-white border-y border-slate-200">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-20 text-center md:py-32">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C5A85C] mb-6 flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5" /> A viagem começa antes do avião
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-slate-900 leading-[1.1] tracking-tight">
            Colecione <span className="italic opacity-90 border-b-2 border-[#C5A85C]/30 pb-1">momentos,</span>
            <br />
            não check-lists.
          </h2>
        </div>
      </section>

      {/* 4. Como a IA pensa */}
      <section id="pilares" className="mx-auto max-w-7xl px-4 sm:px-6 py-20 md:py-32">
        <div className="grid gap-12 md:grid-cols-2 md:items-end mb-16">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">
              Como a IA pensa
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-slate-900 leading-tight">
              Três gestos. <br className="hidden sm:block"/>
              <span className="font-bold">Uma viagem inteira.</span>
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-slate-600 md:justify-self-end">
            Nenhuma planilha, nenhuma aba aberta às três da manhã. Só o essencial, tratado com o cuidado de uma revista de viagens.
          </p>
        </div>

        <div className="grid gap-6 md:gap-8 md:grid-cols-3">
          {[
            {
              num: "01",
              title: "Compatibilidade.",
              desc: "Descubra quais atrações, restaurantes e experiências combinam com o seu perfil — cada lugar recebe um match a partir do que você ama.",
              icon: Sparkles
            },
            {
              num: "02",
              title: "Roteiro Inteligente.",
              desc: "Passeios organizados na melhor ordem, reduzindo deslocamentos e deixando você aproveitar cada dia sem se preocupar com logística.",
              icon: MapPin
            },
            {
              num: "03",
              title: "Orçamento Inteligente.",
              desc: "Acompanhe os custos em USD e BRL em tempo real e receba sugestões para economizar sem abrir mão do que realmente vale a pena viver.",
              icon: Wallet
            }
          ].map((item, i) => (
            <div key={i} className="flex flex-col bg-white border border-slate-200 rounded-[32px] p-8 md:p-10 hover:shadow-md transition-shadow relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 transition-opacity group-hover:opacity-10 pointer-events-none">
                 <item.icon className="w-32 h-32 text-slate-900" />
               </div>
               <div className="flex items-start justify-between mb-8 relative z-10">
                 <span className="text-5xl font-display font-light text-lime-600 tracking-tighter">{item.num}</span>
                 <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                   <item.icon className="w-4 h-4 text-slate-500" />
                 </div>
               </div>
               <h3 className="text-xl font-bold font-display text-slate-900 mb-4 relative z-10">{item.title}</h3>
               <p className="text-slate-600 leading-relaxed flex-1 text-sm relative z-10">{item.desc}</p>

               <div className="mt-10 flex gap-2 relative z-10">
                 <div className={`h-1 rounded-full w-1/3 ${i === 0 ? 'bg-lime-400' : 'bg-slate-100'}`}></div>
                 <div className={`h-1 rounded-full w-1/3 ${i === 1 ? 'bg-lime-400' : 'bg-slate-100'}`}></div>
                 <div className={`h-1 rounded-full w-1/3 ${i === 2 ? 'bg-lime-400' : 'bg-slate-100'}`}></div>
               </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Duas viagens */}
      <section id="viagens" className="bg-slate-900 text-white py-20 md:py-32 border-t border-slate-950 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
          <div className="max-w-2xl mb-12 md:mb-16">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C5A85C] mb-4 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> Duas viagens possíveis
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-light leading-tight text-white">
              Do bolso curto ao luxo <br className="hidden sm:block"/><span className="italic opacity-90 text-white">que a gente merece.</span>
            </h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-300">
              O mesmo perfil, duas curadorias. Diga só quanto quer gastar — nós recalculamos matches, hotéis e restaurantes para caber exatamente no seu orçamento.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Eco Card - Fotográfico */}
            <div className="relative rounded-[32px] overflow-hidden flex flex-col group min-h-[480px]">
               {/* Imagem de Fundo Real */}
               <div className="absolute inset-0 bg-slate-900">
                 <img
                   src="https://images.unsplash.com/photo-1541341852026-613d5cfb4007?q=80&w=1200&auto=format&fit=crop"
                   alt="Táxi amarelo em Nova York"
                   loading="lazy"
                   className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent"></div>
               </div>

               {/* Accent highlight */}
               <div className="absolute top-0 left-0 w-full h-1 bg-lime-400 z-20"></div>

               <div className="p-8 md:p-10 flex-1 flex flex-col justify-end relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                     <div className="w-12 h-12 rounded-full bg-lime-400 text-lime-950 flex items-center justify-center shrink-0 shadow-lg">
                        <Wallet className="w-5 h-5" />
                     </div>
                     <div>
                        <h3 className="font-display font-bold text-2xl text-white">Econômico inteligente</h3>
                        <p className="text-lime-400 text-[11px] font-bold uppercase tracking-widest mt-1">Uma NY viva por menos.</p>
                     </div>
                  </div>
                  <p className="text-white/90 leading-relaxed mb-8 text-[15px] max-w-md font-medium">
                    Bagels no Russ & Daughters, fatia no Joe's Pizza, pôr do sol de graça na Brooklyn Bridge. Roteiro afiado, sem turismo genérico.
                  </p>
                  <ul className="space-y-4 mb-8 text-white/80 text-sm font-medium">
                     <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-lime-400 shrink-0"/> Ace Hotel · Midtown</li>
                     <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-lime-400 shrink-0"/> Katz's, High Line, Central Park</li>
                  </ul>
               </div>

               <div className="p-6 bg-black/40 backdrop-blur-sm border-t border-white/10 flex items-center justify-between relative z-10 mx-4 mb-4 rounded-[20px]">
                  <span className="text-[10px] uppercase tracking-widest text-white/80 font-bold hidden sm:block">Curadoria para seu ritmo</span>
                  <Link to="/minhas-viagens/nova" className="bg-lime-400 hover:bg-lime-500 text-lime-950 px-6 py-3 rounded-full text-sm font-bold transition-colors inline-flex items-center gap-1.5 focus:outline-none focus:ring-4 focus:ring-lime-400/50">
                     Ver no Roteiro <ArrowRight className="w-4 h-4" />
                  </Link>
               </div>
            </div>

            {/* Lux Card - Fotográfico */}
            <div className="relative rounded-[32px] overflow-hidden flex flex-col group min-h-[480px]">
               {/* Imagem de Fundo Real */}
               <div className="absolute inset-0 bg-slate-900">
                 <img
                   src="https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=1200&auto=format&fit=crop"
                   alt="Restaurante chique em Nova York"
                   loading="lazy"
                   className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent"></div>
               </div>

               {/* Accent highlight */}
               <div className="absolute top-0 left-0 w-full h-1 bg-pink-400 z-20"></div>

               <div className="p-8 md:p-10 flex-1 flex flex-col justify-end relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                     <div className="w-12 h-12 rounded-full bg-pink-400 text-pink-950 flex items-center justify-center shrink-0 shadow-lg">
                        <Sparkles className="w-5 h-5" />
                     </div>
                     <div>
                        <h3 className="font-display font-bold text-2xl text-white">Luxo merecido</h3>
                        <p className="text-pink-400 text-[11px] font-bold uppercase tracking-widest mt-1">A NY que se lembra.</p>
                     </div>
                  </div>
                  <p className="text-white/90 leading-relaxed mb-8 text-[15px] max-w-md font-medium">
                    Suíte com vista para a ponte, Le Bernardin ao entardecer, Guggenheim reservado só para o casal. Cada dia, um momento cinematográfico.
                  </p>
                  <ul className="space-y-4 mb-8 text-white/80 text-sm font-medium">
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-pink-400 shrink-0"/> 1 Hotel Brooklyn Bridge</li>
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-pink-400 shrink-0"/> Le Bernardin, Carbone, MoMA</li>
                  </ul>
               </div>

               <div className="p-6 bg-black/40 backdrop-blur-sm border-t border-white/10 flex items-center justify-between relative z-10 mx-4 mb-4 rounded-[20px]">
                  <span className="text-[10px] uppercase tracking-widest text-white/80 font-bold hidden sm:block">Curadoria para seu ritmo</span>
                  <Link to="/minhas-viagens/nova" className="bg-pink-400 hover:bg-pink-500 text-pink-950 px-6 py-3 rounded-full text-sm font-bold transition-colors inline-flex items-center gap-1.5 focus:outline-none focus:ring-4 focus:ring-pink-400/50">
                     Ver no Roteiro <ArrowRight className="w-4 h-4" />
                  </Link>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CTA final */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="relative overflow-hidden rounded-[40px] bg-white border border-slate-200 px-6 py-20 text-center md:px-16 md:py-28 shadow-sm">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>

          <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-1/3 -translate-y-1/3 hidden md:block">
             <Compass className="w-96 h-96" />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C5A85C] mb-6 flex items-center justify-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> Pronto quando você estiver
            </p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-slate-900 leading-[1.1] tracking-tight mb-6">
              Sua viagem merece <br />
              <span className="font-bold">um planejamento à altura.</span>
            </h2>
            <p className="text-base text-slate-600 mb-10 leading-relaxed max-w-lg mx-auto">
              Alguns minutos para montar seu roteiro. Uma vida inteira para lembrar do que ele desenhou.
            </p>
            <Link
              to="/minhas-viagens/nova"
              className="inline-flex items-center gap-2 rounded-full bg-lime-400 px-8 py-4 text-base font-bold text-lime-950 shadow-md transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-lime-400/50"
            >
              Planejar minha viagem
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col md:flex-row items-center justify-between gap-8 px-6 py-12 text-sm text-slate-600">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex items-center gap-2 text-slate-900">
               <Compass className="h-5 w-5 text-lime-500" />
               <span className="font-display text-lg font-bold tracking-tight">
                 Voyage Flow
               </span>
            </div>
            <span className="hidden md:inline text-slate-300">|</span>
            <span className="text-slate-500 text-xs md:text-sm">Planejamento inteligente com IA</span>
          </div>
          <nav className="flex flex-wrap justify-center items-center gap-6 font-medium text-xs md:text-sm">
            <a href="#descobrir" className="hover:text-slate-900 transition-colors focus:outline-none focus:underline focus:text-slate-900 rounded">Descobrir</a>
            <a href="#pilares" className="hover:text-slate-900 transition-colors focus:outline-none focus:underline focus:text-slate-900 rounded">Como funciona</a>
            <a href="#viagens" className="hover:text-slate-900 transition-colors focus:outline-none focus:underline focus:text-slate-900 rounded">Duas viagens</a>
            <Link to="/admin" className="text-pink-600 hover:text-pink-700 font-bold focus:outline-none focus:ring-2 focus:ring-pink-500 rounded px-2 py-1">Admin</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function SiteNav({ user, signOut }: { user: any, signOut: () => void }) {
  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-6">
        <Link to="/" className="flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-lime-500 rounded p-1">
          <Compass className="h-7 w-7 text-slate-900 group-hover:text-lime-500 transition-colors" />
          <span className="font-display text-xl font-bold tracking-tight text-slate-900">
            Voyage Flow
          </span>
        </Link>
        <div className="flex items-center gap-8 font-medium">
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#descobrir" className="hover:text-slate-900 transition-colors focus:outline-none focus:underline focus:text-slate-900 rounded">Descobrir</a>
            <a href="#pilares" className="hover:text-slate-900 transition-colors focus:outline-none focus:underline focus:text-slate-900 rounded">Como funciona</a>
            <a href="#viagens" className="hover:text-slate-900 transition-colors focus:outline-none focus:underline focus:text-slate-900 rounded">Duas viagens</a>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            {user ? (
              <>
                <Link to="/minhas-viagens" className="hidden sm:block text-sm text-slate-600 hover:text-slate-900 transition-colors font-bold focus:outline-none focus:underline rounded">
                  Minhas Viagens
                </Link>
                <Link
                  to="/minhas-viagens/nova"
                  className="rounded-full bg-lime-400 px-5 sm:px-6 py-2 sm:py-2.5 text-[13px] sm:text-sm font-bold text-lime-950 transition-transform hover:scale-105 shadow-sm focus:outline-none focus:ring-4 focus:ring-lime-400/50"
                >
                  Criar viagem
                </Link>
                <button onClick={signOut} className="hidden sm:block text-xs font-bold text-slate-400 hover:text-red-500 transition-colors ml-2 uppercase tracking-widest focus:outline-none focus:underline rounded p-1">
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900 hidden sm:block transition-colors font-bold focus:outline-none focus:underline rounded">
                  Entrar
                </Link>
                <Link
                  to="/minhas-viagens/nova"
                  className="inline-flex items-center gap-1.5 rounded-full bg-lime-400 px-5 sm:px-6 py-2 sm:py-2.5 text-[13px] sm:text-sm font-bold text-lime-950 transition-transform hover:scale-105 shadow-sm focus:outline-none focus:ring-4 focus:ring-lime-400/50"
                >
                  Criar minha viagem <ArrowRight className="w-3.5 h-3.5"/>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function Hero({ user }: { user: any }) {
  return (
    <section className="relative pt-28 sm:pt-32 pb-16 md:pt-44 md:pb-24 overflow-hidden border-b border-slate-200">
      {/* Soft background glow */}
      <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-lime-400/10 blur-3xl opacity-50"></div>
         <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-pink-400/5 blur-3xl opacity-50"></div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side: Copy */}
        <div className="max-w-xl relative z-20">
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-light text-slate-900 leading-[1.05] tracking-tight mb-6 sm:mb-8">
            Sua viagem <br/>
            <span className="font-bold text-slate-900">organizada do <br className="hidden sm:block"/>seu jeito<span className="text-lime-500">.</span></span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 sm:mb-10 font-medium">
            Conte seus planos, preferências e reservas. O Voyage Flow cria um roteiro inteligente, editável e pronto para acompanhar você durante a viagem.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/minhas-viagens/nova"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-lime-400 px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-lime-950 transition-transform hover:scale-105 shadow-sm focus:outline-none focus:ring-4 focus:ring-lime-400/50"
            >
              Criar minha viagem
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
            <a
              href="#descobrir"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white border border-slate-200 px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-slate-700 transition-colors hover:bg-slate-50 shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              <Sparkles className="h-4 w-4 text-[#C5A85C]" />
              Sua coleção de descobertas
            </a>
          </div>
        </div>

        {/* Right Side: Visual Mockup (Hidden on Mobile) */}
        <div className="relative h-[450px] sm:h-[550px] hidden lg:block mt-10">

           {/* Connecting Line */}
           <svg className="absolute top-1/4 right-32 w-48 h-64 text-slate-200" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4">
              <path d="M 0,0 C 50,20 80,60 100,100" />
           </svg>

           {/* Mockup 1: Roteiro Day View */}
           <div className="absolute right-24 top-0 w-[320px] bg-white rounded-[24px] shadow-2xl border border-slate-100 p-5 z-20 hover:-translate-y-1 transition-transform duration-300">
              <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                 <div>
                    <h4 className="font-display font-bold text-slate-900 text-[15px]">Roteiro - Nova York</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">12 — 18 de mai · 2 pessoas</p>
                 </div>
                 <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 cursor-pointer">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Editar</span>
                 </div>
              </div>
              <div className="flex justify-between mb-5 text-[10px] font-bold border-b border-slate-100 pb-2">
                 <div className="text-slate-400 text-center flex-1">DIA 1<br/><span className="text-[9px] font-medium opacity-70">Seg 12</span></div>
                 <div className="text-lime-900 border-b-[3px] border-lime-400 pb-2 text-center flex-1">DIA 2<br/><span className="text-[9px] font-medium opacity-70">Ter 13</span></div>
                 <div className="text-slate-400 text-center flex-1">DIA 3<br/><span className="text-[9px] font-medium opacity-70">Qua 14</span></div>
                 <div className="text-slate-400 text-center flex-1">DIA 4<br/><span className="text-[9px] font-medium opacity-70">Qui 15</span></div>
              </div>
              <div className="space-y-4 relative">
                 <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-slate-100"></div>
                 {[
                   { time: "09:30", title: "Café da manhã", desc: "Russ & Daughters", img: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=100&auto=format&fit=crop" },
                   { time: "11:00", title: "MoMA", desc: "Arte moderna", img: "https://images.unsplash.com/photo-1541097240366-07971df06e89?q=80&w=100&auto=format&fit=crop" },
                   { time: "13:30", title: "Almoço", desc: "Joe's Pizza", img: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=100&auto=format&fit=crop" },
                 ].map((i, idx) => (
                    <div key={idx} className="flex gap-3 relative z-10">
                       <div className="w-8 text-[9px] font-bold text-slate-400 pt-1 text-right pr-1">{i.time}</div>
                       <div className="w-2.5 h-2.5 rounded-full bg-lime-400 ring-[3px] ring-white mt-1 shrink-0 shadow-sm"></div>
                       <div className="flex-1 flex items-center gap-3">
                          <div className="flex-1">
                             <p className="text-[13px] font-bold text-slate-900">{i.title}</p>
                             <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{i.desc}</p>
                          </div>
                          <img src={i.img} className="w-10 h-10 rounded-[10px] object-cover shadow-sm border border-slate-100" alt="Localização" />
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Mockup 2: Wallet */}
           <div className="absolute right-0 top-16 w-[260px] bg-slate-900 rounded-[24px] shadow-2xl border border-slate-800 p-6 z-10 hover:-translate-y-1 transition-transform duration-300">
              <div className="flex justify-between items-center mb-5">
                 <div>
                    <h5 className="text-white font-bold text-sm">Carteira de Viagem</h5>
                    <p className="text-slate-400 text-[10px] font-medium">Tudo sob controle</p>
                 </div>
              </div>
              <div className="bg-slate-800 rounded-[20px] p-5 mb-5 border border-slate-700 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet className="w-16 h-16 text-white"/></div>
                 <p className="text-slate-300 text-[11px] mb-1 font-medium relative z-10">Saldo Total Estimado</p>
                 <p className="text-white font-display text-3xl font-light relative z-10 mb-1 tracking-tight">USD 1.250<span className="text-slate-400 text-2xl">,00</span></p>
              </div>
              <div className="flex justify-between items-center">
                 <div className="bg-lime-400 text-lime-950 text-[11px] font-bold rounded-full py-2.5 px-5 shadow-sm">
                    Ver detalhes
                 </div>
                 <div className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center text-slate-400">
                    <ArrowRight className="w-3.5 h-3.5" />
                 </div>
              </div>
           </div>

           {/* Mockup 3: Boarding Pass */}
           <div className="absolute right-12 bottom-0 w-[280px] bg-pink-50 rounded-[24px] shadow-xl border border-pink-100 p-5 z-30 hover:-translate-y-1 transition-transform duration-300">
              <div className="flex items-center justify-between mb-4 border-b border-pink-200/50 pb-3">
                 <span className="text-pink-900 font-display font-bold text-[13px] tracking-tight">VOYAGE FLOW</span>
                 <span className="text-[9px] font-bold text-pink-700/80 uppercase tracking-widest bg-pink-100 px-2 py-0.5 rounded-full">Boarding Pass</span>
              </div>
              <div className="flex items-center justify-between mb-5 px-1">
                 <div>
                    <div className="text-4xl font-light font-display text-pink-950 tracking-tighter">GRU</div>
                    <div className="text-[11px] text-pink-700/60 font-medium mt-1">São Paulo</div>
                 </div>
                 <div className="flex flex-col items-center gap-1">
                    <Ticket className="w-5 h-5 text-pink-300 transform -rotate-45" />
                 </div>
                 <div className="text-right">
                    <div className="text-4xl font-light font-display text-pink-950 tracking-tighter">JFK</div>
                    <div className="text-[11px] text-pink-700/60 font-medium mt-1">Nova York</div>
                 </div>
              </div>
              <div className="flex justify-between items-center bg-white rounded-[16px] p-4 border border-pink-100/50 shadow-sm">
                 <div className="space-y-1">
                    <div className="text-[9px] text-pink-700/50 uppercase font-bold tracking-wider">Assento</div>
                    <div className="font-display font-bold text-lg text-pink-950">12A</div>
                 </div>
                 <div className="space-y-1">
                    <div className="text-[9px] text-pink-700/50 uppercase font-bold tracking-wider">Gate</div>
                    <div className="font-display font-bold text-lg text-pink-950">A18</div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Decorative Bottom Bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-16 md:mt-12 hidden md:block">
        <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 px-10 py-5 shadow-sm text-sm font-bold text-slate-600 uppercase tracking-wider text-[11px]">
           <div className="flex items-center gap-3"><Sparkles className="w-4 h-4 text-lime-600"/> IA que entende você</div>
           <div className="w-px h-4 bg-slate-200"></div>
           <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-lime-600"/> Roteiros editáveis</div>
           <div className="w-px h-4 bg-slate-200"></div>
           <div className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-lime-600"/> Tudo em um só lugar</div>
           <div className="w-px h-4 bg-slate-200"></div>
           <div className="flex items-center gap-3"><Compass className="w-4 h-4 text-lime-600"/> Acompanhe na viagem</div>
        </div>
      </div>
    </section>
  );
}
