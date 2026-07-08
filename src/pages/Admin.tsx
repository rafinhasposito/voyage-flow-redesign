"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Compass, Plus, Trash2, Edit3, Save, RotateCcw, 
  Image as ImageIcon, DollarSign, Clock, Sparkles, MapPin, Check,
  Search, ExternalLink, Zap, Brain, RefreshCw, AlertCircle
} from "lucide-react";
import { getStoredAttractions, saveStoredAttractions, DEFAULT_ATTRACTIONS, Attraction } from "@/utils/travelState";
import { showSuccess, showError } from "@/utils/toast";
import { enrichmentService, autoFillAttractionForm, calculateMatchScore, EnrichedAttractionData, MatchScoreBreakdown } from "@/services/enrichmentService";

const CATEGORY_OPTIONS = [
  { id: "culture", label: "Arte & Cultura" },
  { id: "food", label: "Gastronomia" },
  { id: "views", label: "Vistas & Mirantes" },
  { id: "nature", label: "Natureza & Parques" },
  { id: "shopping", label: "Compras" },
  { id: "classic", label: "Clássicos Imperdíveis" }
];

// Perfil padrão para cálculo de match score no admin
const DEFAULT_PROFILE_FOR_SCORING = {
  style: "couple" as const,
  interests: ["culture", "food", "views", "classic"],
  budget: "$$" as const,
  days: 4,
  startDate: new Date().toISOString().split("T")[0]
};

export default function Admin() {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentPreview, setEnrichmentPreview] = useState<EnrichedAttractionData | null>(null);
  const [matchScorePreview, setMatchScorePreview] = useState<MatchScoreBreakdown | null>(null);
  
  // Form State
  const [form, setForm] = useState<Partial<Attraction>>({
    name: "",
    category: "culture",
    description: "",
    image: "",
    costLevel: "$$",
    costUSD: 0,
    neighborhood: "",
    matchScore: 90,
    durationHours: 2,
    bestTime: "Tarde",
    affiliateLink: ""
  });

  useEffect(() => {
    setAttractions(getStoredAttractions());
  }, []);

  const handleResetDefaults = () => {
    if (window.confirm("Tem certeza que deseja restaurar a lista padrão de atrações? Isso apagará suas alterações customizadas.")) {
      saveStoredAttractions(DEFAULT_ATTRACTIONS);
      setAttractions(DEFAULT_ATTRACTIONS);
      showSuccess("Lista padrão restaurada com sucesso!");
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Deseja realmente excluir esta atração?")) {
      const updated = attractions.filter(a => a.id !== id);
      setAttractions(updated);
      saveStoredAttractions(updated);
      showSuccess("Atração excluída com sucesso!");
    }
  };

  const handleEdit = (attr: Attraction) => {
    setEditingId(attr.id);
    setForm(attr);
    setEnrichmentPreview(null);
    setMatchScorePreview(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ============================================
  // ENRIQUECIMENTO AUTOMÁTICO
  // ============================================
  const handleAutoEnrich = async () => {
    if (!form.name || !form.category) {
      showError("Preencha pelo menos o Nome e a Categoria primeiro.");
      return;
    }

    setIsEnriching(true);
    try {
      const enriched = await autoFillAttractionForm(form.name, form.category);
      
      if (enriched) {
        setEnrichmentPreview(enriched as EnrichedAttractionData);
        
        // Calcular match score automático
        const score = calculateMatchScore(
          enriched as EnrichedAttractionData,
          DEFAULT_PROFILE_FOR_SCORING,
          form.category
        );
        setMatchScorePreview(score);

        // Preencher formulário automaticamente
        setForm(prev => ({
          ...prev,
          ...enriched,
          categoryLabel: CATEGORY_OPTIONS.find(c => c.id === form.category)?.label || "Outros"
        }));

        showSuccess("Dados preenchidos automaticamente! Revise e ajuste se necessário.");
      } else {
        showError("Não foi possível enriquecer automaticamente. Tente buscar no GetYourGuide.");
      }
    } catch (error) {
      console.error("Erro no enriquecimento:", error);
      showError("Erro ao buscar dados automáticos.");
    } finally {
      setIsEnriching(false);
    }
  };

  const handleApplyEnrichment = () => {
    if (enrichmentPreview) {
      setForm(prev => ({
        ...prev,
        ...enrichmentPreview,
        categoryLabel: CATEGORY_OPTIONS.find(c => c.id === form.category)?.label || "Outros"
      }));
      setEnrichmentPreview(null);
      showSuccess("Dados de enriquecimento aplicados!");
    }
  };

  const handleSearchGetYourGuide = () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setTimeout(() => {
      const results = Object.values(MOCK_GETYOURGUIDE_RESULTS).filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
      setIsSearching(false);
    }, 1000);
  };

  const handleUseSearchResult = (result: any) => {
    setForm({
      ...form,
      name: result.name,
      description: result.description,
      image: result.image,
      affiliateLink: result.affiliateLink
    });
    setSearchResults([]);
    showSuccess("Informações do GetYourGuide aplicadas! Complete os demais campos.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.image || !form.neighborhood) {
      showError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const categoryLabel = CATEGORY_OPTIONS.find(c => c.id === form.category)?.label || "Outros";

    if (editingId) {
      const updated = attractions.map(a => {
        if (a.id === editingId) {
          return { ...a, ...form, categoryLabel } as Attraction;
        }
        return a;
      });
      setAttractions(updated);
      saveStoredAttractions(updated);
      setEditingId(null);
      showSuccess("Atração atualizada com sucesso!");
    } else {
      const newAttr: Attraction = {
        id: Math.random().toString(36).substring(2, 9),
        name: form.name!,
        category: form.category as any,
        categoryLabel,
        description: form.description!,
        image: form.image!,
        costLevel: form.costLevel as any,
        costUSD: Number(form.costUSD || 0),
        neighborhood: form.neighborhood!,
        matchScore: Number(form.matchScore || 90),
        durationHours: Number(form.durationHours || 2),
        bestTime: form.bestTime || "Tarde",
        affiliateLink: form.affiliateLink || ""
      };
      const updated = [newAttr, ...attractions];
      setAttractions(updated);
      saveStoredAttractions(updated);
      showSuccess("Nova atração adicionada com sucesso!");
    }

    setForm({
      name: "",
      category: "culture",
      description: "",
      image: "",
      costLevel: "$$",
      costUSD: 0,
      neighborhood: "",
      matchScore: 90,
      durationHours: 2,
      bestTime: "Tarde",
      affiliateLink: ""
    });
    setEnrichmentPreview(null);
    setMatchScorePreview(null);
  };

  // Mock GetYourGuide results
  const MOCK_GETYOURGUIDE_RESULTS: Record<string, any> = {
    "central-park": { name: "Central Park Bicycle Tour", description: "Explore o Central Park de bicicleta com guia local.", image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&q=80", price: "A partir de $45", affiliateLink: "https://www.getyourguide.com/central-park-l57/bicycle-tour-tickets-r123456.html" },
    "the-met": { name: "The Met Priority Entrance Ticket", description: "Pule as filas no Metropolitan Museum of Art.", image: "https://images.unsplash.com/photo-1601887389937-0b02c26b6c3c?w=600&q=80", price: "A partir de $30", affiliateLink: "https://www.getyourguide.com/metropolitan-museum-l57/priority-ticket-r234567.html" },
    "top-of-the-rock": { name: "Top of the Rock Sunset Experience", description: "Vista 360° com acesso prioritário ao pôr do sol.", image: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80", price: "A partir de $45", affiliateLink: "https://www.getyourguide.com/top-of-the-rock/sunset-ticket-r345678.html" }
  };

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
              Painel de Controle
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <Link to="/" className="text-slate-600 hover:text-[#0D0E10]">Ver Site</Link>
            <Link to="/app/board" className="text-slate-600 hover:text-[#0D0E10]">Meu Roteiro</Link>
            <Link to="/app/catalog" className="text-slate-600 hover:text-[#0D0E10]">Catálogo</Link>
          </nav>
          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Resetar Padrões
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-[1240px] px-6 py-8 md:px-10 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)]">
        
        {/* Left Column: Add/Edit Form */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#EAE6DF] p-6 md:p-8 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl font-light text-[#0D0E10]">
                {editingId ? "Editar Experiência" : "Nova Experiência"}
              </h2>
              <div className="flex items-center gap-2">
                {/* Auto Enrich Button */}
                <button
                  type="button"
                  onClick={handleAutoEnrich}
                  disabled={isEnriching || !form.name || !form.category}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#C5A85C]/10 text-[#C5A85C] text-xs font-medium hover:bg-[#C5A85C]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <Brain className="h-3.5 w-3.5" />
                  Auto Preencher
                </button>
              </div>
            </div>

            {/* Enrichment Preview */}
            {enrichmentPreview && (
              <div className="mb-6 p-4 bg-[#F0FDF4] border border-[#86EFAC] rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5" />
                    Dados Enriquecidos Encontrados
                  </p>
                  <button
                    onClick={handleApplyEnrichment}
                    className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    Aplicar
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-emerald-800">
                  <div><span className="font-medium">Endereço:</span> {enrichmentPreview.address}</div>
                  <div><span className="font-medium">Bairro:</span> {enrichmentPreview.neighborhood}</div>
                  <div><span className="font-medium">Custo Estimado:</span> U$ {enrichmentPreview.averageCostUSD}</div>
                  <div><span className="font-medium">Avaliação:</span> {enrichmentPreview.rating}/5 ({enrichmentPreview.reviewCount} reviews)</div>
                  <div className="col-span-2"><span className="font-medium">Link Afiliado:</span> {enrichmentPreview.affiliateLink ? "✓ Disponível" : "Não encontrado"}</div>
                </div>
              </div>
            )}

            {/* Match Score Preview */}
            {matchScorePreview && (
              <div className="mb-6 p-4 bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-slate-600 flex items-center gap-1">
                    <Brain className="h-3.5 w-3.5 text-[#C5A85C]" />
                    Match Score Automático: <span className="font-bold text-[#0D0E10]">{matchScorePreview.total}%</span>
                  </p>
                </div>
                <div className="space-y-1.5">
                  {Object.entries(matchScorePreview.factors).map(([key, value]) => {
                    const labels: Record<string, string> = {
                      interestMatch: "Interesses",
                      budgetCompatibility: "Orçamento",
                      styleFit: "Estilo de Viagem",
                      ratingQuality: "Qualidade/Avaliações",
                      logisticsEase: "Logística/Acesso"
                    };
                    const maxValues: Record<string, number> = {
                      interestMatch: 30,
                      budgetCompatibility: 25,
                      styleFit: 20,
                      ratingQuality: 15,
                      logisticsEase: 10
                    };
                    const max = maxValues[key] || 10;
                    const percentage = ((value as number) / (max as number)) * 100;
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-slate-500 w-36">{labels[key]}</span>
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#C5A85C] rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-[#0D0E10] w-10 text-right">
                          {(value as number)}/{max as number}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 text-[10px] text-slate-500 space-y-0.5">
                  {matchScorePreview.explanation.map((exp, i) => (
                    <div key={i} className="flex items-center gap-1">{exp}</div>
                  ))}
                </div>
              </div>
            )}

            {/* GetYourGuide Search */}
            <div className="mb-6 p-4 bg-[#F3EFEA]/50 rounded-2xl border border-[#EAE6DF]">
              <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                <Search className="h-3.5 w-3.5" />
                Buscar no GetYourGuide (Demo)
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: Central Park, Top of the Rock..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-white border border-[#EAE6DF] rounded-xl px-3 py-2 text-sm text-[#0D0E10] focus:outline-none focus:border-[#C5A85C]"
                />
                <button
                  type="button"
                  onClick={handleSearchGetYourGuide}
                  disabled={isSearching}
                  className="px-4 rounded-xl bg-[#0D0E10] text-white text-xs font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {isSearching ? "Buscando..." : "Buscar"}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleUseSearchResult(result)}
                      className="w-full text-left p-3 rounded-xl bg-white border border-[#EAE6DF] hover:border-[#C5A85C] transition-colors"
                    >
                      <p className="font-medium text-sm text-[#0D0E10]">{result.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{result.price}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Nome da Atração *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Empire State Building"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl px-4 py-3 text-sm text-[#0D0E10] focus:outline-none focus:border-[#C5A85C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Categoria *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                    className="w-full bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl px-4 py-3 text-sm text-[#0D0E10] focus:outline-none focus:border-[#C5A85C]"
                  >
                    {CATEGORY_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Bairro / Região *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Midtown Manhattan"
                    value={form.neighborhood}
                    onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl px-4 py-3 text-sm text-[#0D0E10] focus:outline-none focus:border-[#C5A85C]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Descrição Curta *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Descreva a experiência de forma inspiradora..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl px-4 py-3 text-sm text-[#0D0E10] focus:outline-none focus:border-[#C5A85C] resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">URL da Imagem *</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl px-4 py-3 text-sm text-[#0D0E10] focus:outline-none focus:border-[#C5A85C]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Link de Afiliado (GetYourGuide/Viator/Tiqets)</label>
                <input
                  type="url"
                  placeholder="https://www.getyourguide.com/..."
                  value={form.affiliateLink}
                  onChange={(e) => setForm({ ...form, affiliateLink: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl px-4 py-3 text-sm text-[#0D0E10] focus:outline-none focus:border-[#C5A85C]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Link para reserva direta no roteiro final. Preenchido automaticamente se disponível.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Nível de Custo</label>
                  <select
                    value={form.costLevel}
                    onChange={(e) => setForm({ ...form, costLevel: e.target.value as any })}
                    className="w-full bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl px-4 py-3 text-sm text-[#0D0E10] focus:outline-none focus:border-[#C5A85C]"
                  >
                    <option value="$">$ (Grátis/Barato)</option>
                    <option value="$$">$$ (Moderado)</option>
                    <option value="$$$">$$$ (Caro)</option>
                    <option value="$$$$">$$$$ (Luxo)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Custo (USD)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.costUSD}
                    onChange={(e) => setForm({ ...form, costUSD: Number(e.target.value) })}
                    className="w-full bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl px-4 py-3 text-sm text-[#0D0E10] focus:outline-none focus:border-[#C5A85C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Match Score (%)</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    placeholder="90"
                    value={form.matchScore}
                    onChange={(e) => setForm({ ...form, matchScore: Number(e.target.value) })}
                    className="w-full bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl px-4 py-3 text-sm text-[#0D0E10] focus:outline-none focus:border-[#C5A85C]"
                  />
                  {matchScorePreview && (
                    <p className="text-[10px] text-[#C5A85C] mt-1">Sugerido: {matchScorePreview.total}%</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Duração (Horas)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="2"
                    value={form.durationHours}
                    onChange={(e) => setForm({ ...form, durationHours: Number(e.target.value) })}
                    className="w-full bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl px-4 py-3 text-sm text-[#0D0E10] focus:outline-none focus:border-[#C5A85C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Melhor Horário</label>
                  <input
                    type="text"
                    placeholder="Ex: Pôr do sol, Manhã"
                    value={form.bestTime}
                    onChange={(e) => setForm({ ...form, bestTime: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl px-4 py-3 text-sm text-[#0D0E10] focus:outline-none focus:border-[#C5A85C]"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0D0E10] text-white py-3 text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {editingId ? "Salvar Alterações" : "Adicionar Experiência"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setForm({
                        name: "",
                        category: "culture",
                        description: "",
                        image: "",
                        costLevel: "$$",
                        costUSD: 0,
                        neighborhood: "",
                        matchScore: 90,
                        durationHours: 2,
                        bestTime: "Tarde",
                        affiliateLink: ""
                      });
                      setEnrichmentPreview(null);
                      setMatchScorePreview(null);
                    }}
                    className="px-4 rounded-2xl border border-[#EAE6DF] text-slate-500 hover:bg-slate-50 text-sm"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Attractions List */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#EAE6DF] p-6 md:p-8 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl font-light text-[#0D0E10]">
                Experiências Cadastradas
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {attractions.length} itens
              </span>
            </div>

            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
              {attractions.map(attr => (
                <div 
                  key={attr.id} 
                  className="flex gap-4 p-4 rounded-2xl border border-[#EAE6DF] hover:border-slate-300 transition-all bg-[#FAF8F5]/50"
                >
                  <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-[#EAE6DF]">
                    <img src={attr.image} alt={attr.name} className="h-full w-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif text-base font-medium text-[#0D0E10] truncate">
                        {attr.name}
                      </h3>
                      <div className="flex items-center gap-1 shrink-0">
                        {attr.affiliateLink && (
                          <a
                            href={attr.affiliateLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-[#C5A85C] hover:bg-white rounded-lg transition-colors"
                            title="Ver link de afiliado"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleEdit(attr)}
                          className="p-1.5 text-slate-400 hover:text-[#C5A85C] hover:bg-white rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(attr.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 truncate mt-0.5">{attr.description}</p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] text-slate-400 font-medium">
                      <span className="text-[#C5A85C] uppercase tracking-wider">{attr.categoryLabel}</span>
                      <span>•</span>
                      <span>{attr.neighborhood}</span>
                      <span>•</span>
                      <span className="text-slate-600">{attr.costUSD === 0 ? "Grátis" : `U$ ${attr.costUSD}`}</span>
                      <span>•</span>
                      <span className="text-[#C5A85C] font-bold">Match: {attr.matchScore}%</span>
                      {attr.affiliateLink && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 flex items-center gap-0.5">
                            <ExternalLink className="h-2.5 w-2.5" />
                            Afiliado
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}