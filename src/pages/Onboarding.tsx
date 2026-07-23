"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Compass, ArrowRight, ArrowLeft, Sparkles, 
  Users, User, Heart, Baby, DollarSign, 
  Calendar, Check, MapPin, Landmark, Utensils, Eye, ShoppingBag
} from "lucide-react";
import { getTravelState, saveTravelState, generateSmartItinerary, UserProfile } from "@/utils/travelState";
import { showSuccess } from "@/utils/toast";

const INTERESTS_OPTIONS = [
  { id: "culture", label: "Arte & Museus", icon: Landmark, desc: "The Met, MoMA, galerias de arte" },
  { id: "food", label: "Gastronomia", icon: Utensils, desc: "De fatias de pizza a estrelas Michelin" },
  { id: "views", label: "Mirantes & Vistas", icon: Eye, desc: "Top of the Rock, Summit, vistas aéreas" },
  { id: "nature", label: "Parques & Natureza", icon: Compass, desc: "Central Park, High Line, jardins" },
  { id: "shopping", label: "Compras & Moda", icon: ShoppingBag, desc: "SoHo, Quinta Avenida, outlets" },
  { id: "classic", label: "Clássicos de NY", icon: Sparkles, desc: "Estátua da Liberdade, Times Square" }
];

const STYLE_OPTIONS = [
  { id: "solo", label: "Viajante Solo", icon: User, desc: "Liberdade total para explorar no seu ritmo" },
  { id: "couple", label: "Em Casal", icon: Heart, desc: "Momentos românticos e jantares especiais" },
  { id: "family", label: "Com a Família", icon: Baby, desc: "Atrações divertidas e ritmo confortável para todos" },
  { id: "friends", label: "Grupo de Amigos", icon: Users, desc: "Vida noturna, fotos incríveis e muita energia" }
];

const BUDGET_OPTIONS = [
  { id: "$", label: "Econômico", desc: "Foco em atrações gratuitas, metrô e lanches deliciosos" },
  { id: "$$", label: "Moderado", desc: "Equilíbrio perfeito entre conforto, museus e boas refeições" },
  { id: "$$$", label: "Conforto", desc: "Hotéis bem localizados, jantares especiais e mirantes premium" },
  { id: "$$$$", label: "Luxo Merecido", desc: "Experiências exclusivas, alta gastronomia e transfers privados" }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({
    style: "couple",
    interests: ["culture", "food", "views", "classic"],
    budget: "$$",
    days: 4,
    startDate: new Date().toISOString().split("T")[0]
  });

  const handleStyleSelect = (style: any) => {
    setProfile({ ...profile, style });
  };

  const handleInterestToggle = (interestId: string) => {
    const current = [...profile.interests];
    if (current.includes(interestId)) {
      setProfile({ ...profile, interests: current.filter(i => i !== interestId) });
    } else {
      setProfile({ ...profile, interests: [...current, interestId] });
    }
  };

  const handleBudgetSelect = (budget: any) => {
    setProfile({ ...profile, budget });
  };

  const handleDaysChange = (days: number) => {
    setProfile({ ...profile, days: Math.max(1, Math.min(7, days)) });
  };

  const handleFinish = () => {
    const state = getTravelState();
    const smartItinerary = generateSmartItinerary(profile);
    
    // Atualiza o estado global
    state.profile = profile;
    state.itinerary = smartItinerary;
    
    // Atualiza despesas estimadas com base no orçamento escolhido
    let multiplier = 1;
    if (profile.budget === "$") multiplier = 0.6;
    if (profile.budget === "$$$") multiplier = 1.8;
    if (profile.budget === "$$$$") multiplier = 3.5;

    state.customExpenses = [
      { id: "e1", category: "Hospedagem", amountUSD: Math.round(200 * profile.days * multiplier), description: "Hotel selecionado para seu perfil" },
      { id: "e2", category: "Passagens Aéreas", amountUSD: 1200, description: "Voo ida e volta estimado" },
      { id: "e3", category: "Alimentação", amountUSD: Math.round(60 * profile.days * multiplier), description: "Alimentação e lanches" },
      { id: "e4", category: "Atrações", amountUSD: Math.round(40 * profile.days * (multiplier * 0.8)), description: "Ingressos e passeios" }
    ];

    saveTravelState(state);
    showSuccess("Roteiro inteligente gerado com sucesso!");
    navigate("/viagens/e8f37583-d42e-49b9-8e04-042e69f2b09c/roteiro");
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1E21] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#EAE6DF] bg-[#FAF8F5]/80 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <span className="grid h-8 w-8 place-items-center rounded-md bg-[#F3EFEA]">
              <Compass className="h-4 w-4 text-[#C5A85C]" strokeWidth={2} />
            </span>
            <span className="font-serif text-lg font-medium tracking-tight text-[#0D0E10]">
              Viagem dos Sonhos
            </span>
          </div>
          <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            Passo {step} de 5
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-[#EAE6DF] h-1">
        <div 
          className="bg-[#C5A85C] h-1 transition-all duration-500" 
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[700px] bg-white rounded-3xl border border-[#EAE6DF] p-8 md:p-12 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)]">
          
          {/* STEP 1: Estilo de Viagem */}
          {step === 1 && (
            <div className="space-y-8">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C5A85C]">Começando a jornada</p>
                <h2 className="font-serif text-3xl md:text-4xl font-light text-[#0D0E10] leading-tight">
                  Quem vai embarcar nessa <span className="italic">aventura</span> com você?
                </h2>
                <p className="text-sm text-slate-500">Isso nos ajuda a selecionar o ritmo ideal e as melhores atrações.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {STYLE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = profile.style === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleStyleSelect(opt.id as any)}
                      className={`flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-200 ${
                        isSelected 
                          ? "border-[#C5A85C] bg-[#FAF8F5] ring-1 ring-[#C5A85C]" 
                          : "border-[#EAE6DF] hover:border-slate-400 hover:bg-slate-50/50"
                      }`}
                    >
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                        isSelected ? "bg-[#C5A85C] text-white" : "bg-[#F3EFEA] text-slate-600"
                      }`}>
                        <Icon className="h-5 w-5" strokeWidth={1.75} />
                      </span>
                      <div>
                        <p className="font-medium text-[#0D0E10]">{opt.label}</p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Detalhes do Grupo */}
          {step === 2 && (
            <div className="space-y-8">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C5A85C]">Perfil dos Viajantes</p>
                <h2 className="font-serif text-3xl md:text-4xl font-light text-[#0D0E10] leading-tight">
                  Como é o seu <span className="italic">grupo</span>?
                </h2>
                <p className="text-sm text-slate-500">Isso nos ajuda a garantir que os passeios sejam adequados e seguros para todos (opcional).</p>
              </div>

              <div className="space-y-6">
                {/* Quantidade de Pessoas */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tamanho do Grupo</label>
                  <div className="flex items-center justify-between bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl p-4">
                    <button 
                      onClick={() => setProfile({ ...profile, groupSize: Math.max(1, (profile.groupSize || 1) - 1) })}
                      className="h-10 w-10 rounded-xl bg-white border border-[#EAE6DF] flex items-center justify-center font-bold text-lg hover:bg-slate-50"
                    >
                      -
                    </button>
                    <div className="text-center">
                      <span className="font-serif text-3xl font-light text-[#0D0E10]">{profile.groupSize || 1}</span>
                      <span className="text-sm text-slate-500 ml-2">{(profile.groupSize || 1) === 1 ? "pessoa" : "pessoas"}</span>
                    </div>
                    <button 
                      onClick={() => setProfile({ ...profile, groupSize: (profile.groupSize || 1) + 1 })}
                      className="h-10 w-10 rounded-xl bg-white border border-[#EAE6DF] flex items-center justify-center font-bold text-lg hover:bg-slate-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Presença de Crianças */}
                  <div className="flex flex-col gap-2 p-5 rounded-2xl border border-[#EAE6DF]">
                    <div>
                      <p className="font-medium text-[#0D0E10]">Viajando com crianças?</p>
                      <p className="text-xs text-slate-500 mt-1">Apenas passeios family-friendly</p>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button 
                        onClick={() => setProfile({ ...profile, hasChildren: true })}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${profile.hasChildren === true ? 'bg-[#C5A85C] text-white border-[#C5A85C]' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                      >Sim</button>
                      <button 
                        onClick={() => setProfile({ ...profile, hasChildren: undefined })}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${profile.hasChildren === undefined ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                      >Não Informar</button>
                      <button 
                        onClick={() => setProfile({ ...profile, hasChildren: false })}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${profile.hasChildren === false ? 'bg-[#0D0E10] text-white border-[#0D0E10]' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                      >Não</button>
                    </div>
                  </div>

                  {/* Cadeira de Rodas */}
                  <div className="flex flex-col gap-2 p-5 rounded-2xl border border-[#EAE6DF]">
                    <div>
                      <p className="font-medium text-[#0D0E10]">Acessibilidade</p>
                      <p className="text-xs text-slate-500 mt-1">Necessita de cadeira de rodas</p>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button 
                        onClick={() => setProfile({ ...profile, wheelchairRequired: true })}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${profile.wheelchairRequired === true ? 'bg-[#C5A85C] text-white border-[#C5A85C]' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                      >Sim</button>
                      <button 
                        onClick={() => setProfile({ ...profile, wheelchairRequired: undefined })}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${profile.wheelchairRequired === undefined ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                      >Não Informar</button>
                      <button 
                        onClick={() => setProfile({ ...profile, wheelchairRequired: false })}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${profile.wheelchairRequired === false ? 'bg-[#0D0E10] text-white border-[#0D0E10]' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                      >Não</button>
                    </div>
                  </div>
                </div>

                {/* Idade Mínima */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Idade do mais jovem (Opcional)</label>
                  <input 
                    type="number"
                    min="0"
                    max="120"
                    placeholder="Ex: 12"
                    value={profile.passengerAge || ""}
                    onChange={(e) => setProfile({ ...profile, passengerAge: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl p-4 text-[#0D0E10] focus:outline-none focus:border-[#C5A85C] focus:ring-1 focus:ring-[#C5A85C]"
                  />
                  <p className="text-[10px] text-slate-400">Ajuda a evitar passeios com restrições etárias.</p>
                </div>

              </div>
            </div>
          )}

          {/* STEP 3: Interesses */}
          {step === 3 && (
            <div className="space-y-8">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C5A85C]">Personalização</p>
                <h2 className="font-serif text-3xl md:text-4xl font-light text-[#0D0E10] leading-tight">
                  O que faz seu coração bater <span className="italic">mais forte</span> ao viajar?
                </h2>
                <p className="text-sm text-slate-500">Selecione tudo o que você gostaria de incluir no seu roteiro.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {INTERESTS_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = profile.interests.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleInterestToggle(opt.id)}
                      className={`flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-200 ${
                        isSelected 
                          ? "border-[#C5A85C] bg-[#FAF8F5] ring-1 ring-[#C5A85C]" 
                          : "border-[#EAE6DF] hover:border-slate-400 hover:bg-slate-50/50"
                      }`}
                    >
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                        isSelected ? "bg-[#C5A85C] text-white" : "bg-[#F3EFEA] text-slate-600"
                      }`}>
                        <Icon className="h-5 w-5" strokeWidth={1.75} />
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-[#0D0E10]">{opt.label}</p>
                          {isSelected && <Check className="h-4 w-4 text-[#C5A85C]" strokeWidth={2.5} />}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Orçamento */}
          {step === 4 && (
            <div className="space-y-8">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C5A85C]">Planejamento Financeiro</p>
                <h2 className="font-serif text-3xl md:text-4xl font-light text-[#0D0E10] leading-tight">
                  Qual é o <span className="italic">estilo de orçamento</span> planejado?
                </h2>
                <p className="text-sm text-slate-500">Nossa IA ajustará as sugestões de hotéis, restaurantes e passeios.</p>
              </div>

              <div className="space-y-3">
                {BUDGET_OPTIONS.map((opt) => {
                  const isSelected = profile.budget === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleBudgetSelect(opt.id as any)}
                      className={`w-full flex items-center justify-between p-5 rounded-2xl border text-left transition-all duration-200 ${
                        isSelected 
                          ? "border-[#C5A85C] bg-[#FAF8F5] ring-1 ring-[#C5A85C]" 
                          : "border-[#EAE6DF] hover:border-slate-400 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-[#0D0E10]">{opt.label}</p>
                        <p className="text-xs text-slate-500 leading-relaxed">{opt.desc}</p>
                      </div>
                      <span className={`font-serif text-lg font-semibold px-3 py-1 rounded-lg ${
                        isSelected ? "bg-[#C5A85C] text-white" : "bg-[#F3EFEA] text-slate-600"
                      }`}>
                        {opt.id}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Duração e Data */}
          {step === 5 && (
            <div className="space-y-8">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C5A85C]">Logística</p>
                <h2 className="font-serif text-3xl md:text-4xl font-light text-[#0D0E10] leading-tight">
                  Por quantos dias você quer <span className="italic">explorar</span> Nova York?
                </h2>
                <p className="text-sm text-slate-500">Defina a duração ideal e a data estimada de partida.</p>
              </div>

              <div className="space-y-6">
                {/* Days Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Duração da Viagem</label>
                  <div className="flex items-center justify-between bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl p-4">
                    <button 
                      onClick={() => handleDaysChange(profile.days - 1)}
                      className="h-10 w-10 rounded-xl bg-white border border-[#EAE6DF] flex items-center justify-center font-bold text-lg hover:bg-slate-50"
                    >
                      -
                    </button>
                    <div className="text-center">
                      <span className="font-serif text-3xl font-light text-[#0D0E10]">{profile.days}</span>
                      <span className="text-sm text-slate-500 ml-2">{profile.days === 1 ? "dia" : "dias"}</span>
                    </div>
                    <button 
                      onClick={() => handleDaysChange(profile.days + 1)}
                      className="h-10 w-10 rounded-xl bg-white border border-[#EAE6DF] flex items-center justify-center font-bold text-lg hover:bg-slate-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Date Picker */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Data de Partida</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={profile.startDate}
                      onChange={(e) => setProfile({ ...profile, startDate: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl p-4 text-[#0D0E10] focus:outline-none focus:border-[#C5A85C] focus:ring-1 focus:ring-[#C5A85C]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-12 pt-6 border-t border-[#EAE6DF] flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#0D0E10] transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="inline-flex items-center gap-2 rounded-full bg-[#0D0E10] px-6 py-3 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="inline-flex items-center gap-2 rounded-full bg-[#C5A85C] px-6 py-3 text-sm font-medium text-white hover:bg-[#b3964f] transition-colors shadow-[0_10px_25px_-5px_rgba(197,168,92,0.4)]"
              >
                Gerar Roteiro Inteligente
                <Sparkles className="h-4 w-4" />
              </button>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}