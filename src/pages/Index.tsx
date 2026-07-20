"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Compass,
  Heart,
  Landmark,
  UtensilsCrossed,
  Coffee,
  Trees,
  ShoppingBag,
  Palette,
  Mountain,
  Wine,
  Building2,
  Sparkles,
  MapPin,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Attraction } from "@/utils/travelState";
import { ExperienceRepository } from "@/repositories";
import { useConsumerAuth } from "@/contexts/ConsumerAuthProvider";

const HERO_IMAGE = "/hero-ny.webp";

const CATEGORY_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  culture: { icon: Landmark, color: "#8E5CB5" },
  food: { icon: UtensilsCrossed, color: "#D98A6C" },
  views: { icon: Mountain, color: "#4A7BB0" },
  nature: { icon: Trees, color: "#4E8054" },
  shopping: { icon: ShoppingBag, color: "#B55C75" },
  classic: { icon: Sparkles, color: "#8A9A86" }
};

const PILLARS = [
  {
    kicker: "01",
    title: "Compatibilidade.",
    body: "Descubra quais atrações, restaurantes e experiências combinam com o seu perfil — cada lugar recebe um match a partir do que você ama.",
    icon: Sparkles,
  },
  {
    kicker: "02",
    title: "Roteiro Inteligente.",
    body: "Passeios organizados na melhor ordem, reduzindo deslocamentos e deixando você aproveitar cada dia sem se preocupar com logística.",
    icon: MapPin,
  },
  {
    kicker: "03",
    title: "Orçamento Inteligente.",
    body: "Acompanhe os custos em USD e BRL em tempo real e receba sugestões para economizar sem abrir mão do que realmente vale a pena viver.",
    icon: Wallet,
  },
];

export default function Index() {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
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
      const published = data.filter(r => r.status === 'published' && r.media_urls?.length);
      const mapped = published.map(row => ({
        ...row,
        id: row.id,
        name: row.title,
        category: row.category,
        categoryLabel: row.category,
        description: row.description,
        emotionalDescription: row.short_description || row.description,
        image: row.media_urls && row.media_urls.length > 0 ? row.media_urls[0] : "",
        images: row.media_urls || [],
        costLevel: row.base_cost > 100 ? "$$$" : row.base_cost > 30 ? "$$" : "$",
        costUSD: row.base_cost,
        neighborhood: row.neighborhood || "Desconhecido",
        coordinates: { lat: row.location_lat || 0, lng: row.location_lng || 0 },
        matchScore: 90,
        durationHours: row.duration_minutes ? row.duration_minutes / 60 : 2,
        bestTime: "Qualquer horário",
        bestTimeOfDay: ["morning", "afternoon", "evening"],
        recommendedSeasons: ["all"],
        isIndoor: row.indoor_outdoor === "indoor",
        weatherCompatibility: ["all"],
        physicalEnergyRequired: row.energy_level || "low",
        exclusivityLevel: row.exclusivity_level || "accessible",
        dressCode: row.dress_code || "casual",
        reservationRequired: row.reservation_required || false,
        availability: "Disponível",
        accessibility: row.wheelchair_accessible ? ["wheelchair"] : [],
        rating: row.rating || 4.5,
        affiliateLink: row.booking_url,
        provider: "Provider",
        tags: row.tags || [],
        personaWeights: typeof row.intelligence_metadata === 'object' && row.intelligence_metadata && 'personaWeights' in row.intelligence_metadata 
          ? row.intelligence_metadata.personaWeights 
          : { explorador_visual: 0.5, curador_experiencias: 0.5, descobridor: 0.5, aproveitador: 0.5, slow_traveler: 0.5 },
        companionshipCompatibility: typeof row.intelligence_metadata === 'object' && row.intelligence_metadata && 'companionshipCompatibility' in row.intelligence_metadata 
          ? row.intelligence_metadata.companionshipCompatibility 
          : { solo: 0.5, couple: 0.5, family: 0.5, friends: 0.5 }
      }));
      setAttractions(mapped as unknown as Attraction[]);
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

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = selectedCategory === "all"
    ? attractions
    : attractions.filter((a) => a.category === selectedCategory);
  
  const visibleAttractions = filtered.slice(0, 6);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1E21] flex flex-col">
      <SiteNav />
      <Hero />
      
      {/* Collection Section */}
      <section id="descobrir" className="mx-auto max-w-[1240px] px-6 pt-8 pb-24 md:px-10 md:pt-16 md:pb-32">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              <span className="text-[#C5A85C]">✦</span> Sua coleção de descobertas
            </p>
            <h2 className="mt-3 font-serif text-4xl font-light leading-[1.05] text-[#0D0E10] md:text-5xl">
              Cada lugar,
              <br />
              <span className="italic text-slate-700">uma figurinha para colecionar.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-slate-500 md:text-base">
            Descubra cantos, sabores e vistas de Nova York. Salve os que te chamarem — o roteiro se monta em torno da sua coleção.
          </p>
        </div>

        {/* Category Chips */}
        <div className="mt-8 -mx-6 overflow-x-auto px-6 md:mx-0 md:px-0">
          <div className="flex min-w-max items-center gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all ${
                selectedCategory === "all"
                  ? "border-[#0D0E10] bg-[#0D0E10] text-white shadow-md"
                  : "border-[#EAE6DF] bg-white/70 text-slate-600 hover:border-slate-400 hover:bg-white"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Tudo
            </button>
            {Object.entries(CATEGORY_ICONS).map(([key, val]) => {
              const Icon = val.icon;
              const isSelected = selectedCategory === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all ${
                    isSelected
                      ? "border-[#0D0E10] bg-[#0D0E10] text-white shadow-md"
                      : "border-[#EAE6DF] bg-white/70 text-slate-600 hover:border-slate-400 hover:bg-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" style={!isSelected ? { color: val.color } : undefined} />
                  {key === "culture" && "Arte & Cultura"}
                  {key === "food" && "Gastronomia"}
                  {key === "views" && "Mirantes"}
                  {key === "nature" && "Parques"}
                  {key === "shopping" && "Compras"}
                  {key === "classic" && "Clássicos"}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="mt-10 flex flex-col items-center justify-center py-20 text-slate-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mb-4"></div>
            <p>Carregando experiências incríveis...</p>
          </div>
        ) : hasError ? (
          <div className="mt-10 flex flex-col items-center justify-center py-20 bg-red-50 rounded-3xl border border-red-100 text-red-600">
            <Compass className="h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium text-lg">Não foi possível carregar as experiências.</p>
            <button onClick={loadExperiences} className="mt-4 px-6 py-2 bg-red-100 rounded-full font-medium hover:bg-red-200 transition-colors">
              Tentar novamente
            </button>
          </div>
        ) : visibleAttractions.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center py-20 bg-slate-100 rounded-3xl border border-slate-200 text-slate-500">
            <Compass className="h-12 w-12 mb-4 opacity-30" />
            <p className="font-medium text-lg">Nenhuma experiência encontrada nesta categoria.</p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleAttractions.map((place) => {
            const catInfo = CATEGORY_ICONS[place.category] || { icon: Compass, color: "#C5A85C" };
            const Icon = catInfo.icon;
            const favorited = favorites.has(place.id);

            return (
              <article
                key={place.id}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-[#EAE6DF] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 shadow-sm hover:shadow-md"
              >
                {/* Photo */}
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={place.image}
                    alt={place.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 mix-blend-overlay transition-opacity duration-500 group-hover:opacity-70"
                    style={{
                      background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.35) 45%, rgba(255,220,160,0.2) 55%, transparent 70%)",
                    }}
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
                    style={{ background: "linear-gradient(to top, rgba(13,13,13,0.35), transparent)" }}
                  />

                  {/* Category badge */}
                  <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/25 px-2.5 py-1 backdrop-blur-md">
                    <Icon className="h-3.5 w-3.5" strokeWidth={2.25} style={{ color: catInfo.color }} />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: catInfo.color }}>
                      {place.categoryLabel}
                    </span>
                  </div>

                  {/* Favorite Button */}
                  <button
                    type="button"
                    onClick={() => toggleFav(place.id)}
                    className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-white/40 bg-white/25 backdrop-blur-md transition-transform hover:scale-110 active:scale-95"
                  >
                    <Heart className={`h-4 w-4 transition-all ${favorited ? "fill-current text-red-500" : "text-white"}`} strokeWidth={2} />
                  </button>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col p-5">
                  <div aria-hidden className="h-px w-8" style={{ backgroundColor: catInfo.color }} />
                  <h3 className="mt-3 font-serif text-xl font-medium leading-tight text-[#0D0E10]">
                    {place.name}
                  </h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                    {place.neighborhood}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{place.description}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-[#EAE6DF] bg-[#F3EFEA]/50 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.14em] text-slate-500">
                      {place.bestTime}
                    </span>
                    <span className="rounded-full border border-[#EAE6DF] bg-[#F3EFEA]/50 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.14em] text-slate-500">
                      {place.costLevel}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
          </div>
        )}
      </section>

      <Feeling />
      <Pillars />
      <TwoWays />
      <Closing />
      <SiteFooter />
    </div>
  );
}

function SiteNav() {
  const { user, signOut } = useConsumerAuth();
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-6 md:px-10">
        <Link to="/" className="flex items-center gap-2">
          <Compass className="h-6 w-6 text-[#0D0E10]" />
          <span className="font-display text-xl font-bold tracking-tight text-[#0D0E10]">
            Voyage Flow
          </span>
        </Link>
        <div className="flex items-center gap-3 md:gap-5">
          {user ? (
            <>
              <Link
                to="/minhas-viagens"
                className="text-sm font-medium tracking-wide text-slate-600 transition-colors hover:text-[#0D0E10]"
              >
                Minhas Viagens
              </Link>
              <Link
                to="/minhas-viagens/nova"
                className="hidden md:inline-flex items-center justify-center rounded-full bg-[#0D0E10] px-5 py-2.5 text-sm font-semibold tracking-wide text-white transition-all hover:bg-slate-800"
              >
                Criar nova viagem
              </Link>
              <button onClick={signOut} className="text-sm font-medium text-slate-500 hover:text-red-500 transition-colors">
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden text-sm font-medium tracking-wide text-slate-600 transition-colors hover:text-[#0D0E10] md:block"
              >
                Entrar
              </Link>
              <Link
                to="/cadastro"
                className="inline-flex items-center justify-center rounded-full bg-[#0D0E10] px-5 py-2.5 text-sm font-semibold tracking-wide text-white transition-all hover:bg-slate-800"
              >
                Criar minha viagem
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const { user } = useConsumerAuth();
  return (
    <section className="relative overflow-hidden bg-[#0D0E10] px-6 py-32 md:py-40">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="font-display text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-7xl">
          Sua viagem organizada do seu jeito.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/90 md:text-xl font-light">
          Conte seus planos, preferências e reservas. O Voyage Flow cria um roteiro inteligente, editável e pronto para acompanhar você durante a viagem.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {user ? (
            <Link
              to="/minhas-viagens/nova"
              className="group flex h-14 items-center justify-center gap-2 rounded-full bg-white px-8 font-semibold text-[#0D0E10] transition-all hover:scale-105 hover:bg-slate-50"
            >
              Criar minha viagem
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          ) : (
            <Link
              to="/cadastro"
              className="group flex h-14 items-center justify-center gap-2 rounded-full bg-white px-8 font-semibold text-[#0D0E10] transition-all hover:scale-105 hover:bg-slate-50"
            >
              Criar minha viagem
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function Feeling() {
  return (
    <section className="border-y border-[#EAE6DF] bg-[#F3EFEA]/30">
      <div className="mx-auto max-w-[1240px] px-6 py-16 text-center md:px-10 md:py-20">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
          <span className="text-[#C5A85C]">✦</span> A viagem começa antes do avião
        </p>
        <h2 className="mx-auto mt-4 max-w-3xl font-serif text-3xl font-light leading-[1.1] text-[#0D0E10] md:text-5xl">
          Colecione momentos,
          <br />
          <span className="italic text-slate-700">não check-lists.</span>
        </h2>
      </div>
    </section>
  );
}

function Pillars() {
  return (
    <section id="pilares" className="mx-auto max-w-[1240px] px-6 py-24 md:px-10 md:py-32">
      <div className="grid gap-10 md:grid-cols-[minmax(0,0.6fr)_minmax(0,1fr)] md:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
            Como a IA pensa
          </p>
          <h2 className="mt-3 font-serif text-4xl font-light leading-[1.05] text-[#0D0E10] md:text-5xl">
            Três gestos.
            <br />
            <span className="italic text-slate-700">Uma viagem inteira.</span>
          </h2>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-slate-500 md:text-base">
          Nenhuma planilha, nenhuma aba aberta às três da manhã. Só o essencial,
          tratado com o cuidado de uma revista de viagens.
        </p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {PILLARS.map((p) => (
          <article
            key={p.kicker}
            className="group relative flex flex-col rounded-3xl border border-[#EAE6DF] bg-[#F3EFEA]/30 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:bg-white"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-serif text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
                {p.kicker}
              </span>
              <p.icon
                className="h-4 w-4 text-slate-400 transition-colors group-hover:text-[#C5A85C]"
                strokeWidth={1.75}
              />
            </div>
            <h3 className="mt-8 font-serif text-2xl font-medium leading-tight text-[#0D0E10]">
              {p.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{p.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function TwoWays() {
  return (
    <section
      id="viagens"
      className="border-t border-[#EAE6DF] bg-[#F3EFEA]/20 py-24 md:py-32"
    >
      <div className="mx-auto max-w-[1240px] px-6 md:px-10">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
            Duas viagens possíveis
          </p>
          <h2 className="mt-3 font-serif text-4xl font-light leading-[1.05] text-[#0D0E10] md:text-5xl">
            Do bolso curto
            <br />
            <span className="italic text-slate-700">
              ao luxo que a gente merece.
            </span>
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-slate-500 md:text-base">
            O mesmo perfil, duas curadorias. Diga só quanto quer gastar — nós
            recalculamos matches, hotéis e restaurantes para caber exatamente no
            seu orçamento.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <TripCard
            tag="Econômico inteligente"
            title="Uma NY viva por menos."
            body="Bagels no Russ & Daughters, fatia no Joe's Pizza, pôr do sol de graça na Brooklyn Bridge. Roteiro afiado, sem turismo genérico."
            bullets={[
              "Ace Hotel · Midtown",
              "Katz's, High Line, Central Park",
              "Metrô + caminhada",
            ]}
          />
          <TripCard
            tag="Luxo merecido"
            title="A NY que se lembra."
            body="Suíte com vista para a ponte, Le Bernardin ao entardecer, Guggenheim reservado só para o casal. Cada dia, um momento cinematográfico."
            bullets={[
              "1 Hotel Brooklyn Bridge",
              "Le Bernardin, Carbone, MoMA",
              "Transfer + concierge",
            ]}
            accent
          />
        </div>
      </div>
    </section>
  );
}

function TripCard({
  tag,
  title,
  body,
  bullets,
  accent,
}: {
  tag: string;
  title: string;
  body: string;
  bullets: string[];
  accent?: boolean;
}) {
  return (
    <article
      className={
        "relative flex flex-col overflow-hidden rounded-3xl border p-8 md:p-10 " +
        (accent
          ? "border-slate-800 bg-[#0D0E10] text-white"
          : "border-[#EAE6DF] bg-white text-slate-700")
      }
    >
      <div className="flex items-center justify-between">
        <span
          className={
            "text-[10.5px] font-medium uppercase tracking-[0.22em] " +
            (accent ? "text-[#C5A85C]" : "text-slate-400")
          }
        >
          {tag}
        </span>
      </div>
      <h3
        className={
          "mt-8 font-serif text-3xl font-light leading-tight md:text-4xl " +
          (accent ? "text-white" : "text-[#0D0E10]")
        }
      >
        {title}
      </h3>
      <p
        className={
          "mt-4 max-w-md text-sm leading-relaxed " +
          (accent ? "text-white/75" : "text-slate-500")
        }
      >
        {body}
      </p>
      <ul className="mt-8 space-y-2 text-sm">
        {bullets.map((b) => (
          <li
            key={b}
            className={
              "flex items-center gap-3 " + (accent ? "text-white/85" : "text-slate-700")
            }
          >
            <span
              aria-hidden
              className={
                "h-px w-4 " + (accent ? "bg-[#C5A85C]" : "bg-slate-300")
              }
            />
            {b}
          </li>
        ))}
      </ul>
      <div
        className={
          "mt-10 flex items-end justify-between border-t pt-6 " +
          (accent ? "border-white/10" : "border-[#EAE6DF]")
        }
      >
        <p
          className={
            "text-[10.5px] font-medium uppercase tracking-[0.18em] " +
            (accent ? "text-white/60" : "text-slate-400")
          }
        >
          Curadoria feita para o seu ritmo
        </p>
        <Link
          to="/minhas-viagens/nova"
          className={
            "inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-medium transition-colors " +
            (accent
              ? "bg-[#C5A85C] text-white hover:bg-[#b3964f]"
              : "bg-[#0D0E10] text-white hover:bg-slate-800")
          }
        >
          Ver no Roteiro
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </div>
    </article>
  );
}

function Closing() {
  return (
    <section id="planejar" className="mx-auto max-w-[1240px] px-6 py-24 md:px-10 md:py-32">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0D0E10] px-8 py-16 text-white md:px-16 md:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl bg-[#C5A85C]/20"
        />
        <div className="relative grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
              <span className="text-[#C5A85C]">✦</span> Pronto quando você estiver
            </p>
            <h2 className="mt-4 font-serif text-4xl font-light leading-[1.02] md:text-6xl">
              Sua viagem
              <br />
              <span className="italic">merece um planejamento à altura.</span>
            </h2>
          </div>
          <div className="flex flex-col items-start gap-6 md:items-end md:text-right">
            <p className="max-w-sm text-sm leading-relaxed text-white/75">
              Alguns minutos para montar seu roteiro. Uma vida inteira para
              lembrar do que ele desenhou.
            </p>
            <Link
              to="/minhas-viagens/nova"
              className="group inline-flex items-center gap-2 rounded-full bg-[#C5A85C] px-6 py-3 text-sm font-medium text-white shadow-[0_18px_40px_-16px_rgba(197,168,92,0.55)] transition-transform hover:-translate-y-0.5"
            >
              Planejar minha viagem
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-[#EAE6DF]">
      <div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-6 px-6 py-10 text-sm text-slate-400 md:flex-row md:items-center md:px-10">
        <div className="flex items-center gap-2 text-[#0D0E10]">
          <Compass className="h-4 w-4" strokeWidth={1.75} />
          <span className="font-serif text-base font-medium tracking-tight text-[#0D0E10]">
            Viagem dos Sonhos
          </span>
          <span className="hidden text-slate-400 md:inline">
            · Planejamento inteligente com IA
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/admin" className="hover:text-[#0D0E10] transition-colors">Admin</Link>
          <a href="#descobrir" className="hover:text-[#0D0E10] transition-colors">
            Descobrir
          </a>
          <a href="#pilares" className="hover:text-[#0D0E10] transition-colors">
            Como funciona
          </a>
          <a href="#viagens" className="hover:text-[#0D0E10] transition-colors">
            Duas viagens
          </a>
        </div>
      </div>
    </footer>
  );
}