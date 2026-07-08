"use client";

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Compass, DollarSign, TrendingUp, Wallet, Plus, Trash2, 
  ArrowRight, Sparkles, RefreshCw, Percent
} from "lucide-react";
import { getTravelState, saveTravelState } from "@/utils/travelState";
import { showSuccess } from "@/utils/toast";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ["#C5A85C", "#0D0E10", "#8A9A86", "#D98A6C", "#6C8AD9"];

export default function WalletPage() {
  const [state, setState] = useState(getTravelState());
  const [newExpense, setNewExpense] = useState({ category: "Hospedagem", amountUSD: "", description: "" });
  const [exchangeRate, setExchangeRate] = useState(5.15); // Taxa de câmbio simulada USD -> BRL

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.amountUSD || !newExpense.description) return;

    const expense = {
      id: Math.random().toString(),
      category: newExpense.category,
      amountUSD: Number(newExpense.amountUSD),
      description: newExpense.description
    };

    const newState = {
      ...state,
      customExpenses: [...state.customExpenses, expense]
    };

    setState(newState);
    saveTravelState(newState);
    setNewExpense({ category: "Hospedagem", amountUSD: "", description: "" });
    showSuccess("Despesa adicionada com sucesso!");
  };

  const handleRemoveExpense = (id: string) => {
    const newState = {
      ...state,
      customExpenses: state.customExpenses.filter(e => e.id !== id)
    };
    setState(newState);
    saveTravelState(newState);
    showSuccess("Despesa removida!");
  };

  // Calcula custos das atrações agendadas no roteiro
  const attractionsCost = state.itinerary.reduce((acc, day) => {
    return acc + day.attractions.reduce((sum, attr) => sum + attr.costUSD, 0);
  }, 0);

  // Consolida todas as despesas
  const allExpenses = [
    ...state.customExpenses,
    { id: "attr-cost", category: "Atrações", amountUSD: attractionsCost, description: "Ingressos do roteiro" }
  ].filter(e => e.amountUSD > 0);

  const totalUSD = allExpenses.reduce((sum, e) => sum + e.amountUSD, 0);
  const totalBRL = totalUSD * exchangeRate;

  // Agrupa despesas por categoria para o gráfico
  const categoryTotals = allExpenses.reduce((acc: { [key: string]: number }, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amountUSD;
    return acc;
  }, {});

  const chartData = Object.keys(categoryTotals).map(cat => ({
    name: cat,
    value: categoryTotals[cat]
  }));

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
            <Link to="/app/catalog" className="text-slate-600 hover:text-[#0D0E10]">Explorar Atrações</Link>
            <Link to="/app/wallet" className="text-[#C5A85C]">Orçamento & Gastos</Link>
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
      <main className="flex-1 mx-auto w-full max-w-[1240px] px-6 py-8 md:px-10 grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        
        {/* Left Column: Expense List & Add Form */}
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C5A85C]">Controle Financeiro</p>
            <h1 className="font-serif text-3xl md:text-4xl font-light text-[#0D0E10] mt-1">
              Orçamento da <span className="italic">Viagem</span>
            </h1>
          </div>

          {/* Currency Converter Card */}
          <div className="bg-white rounded-3xl border border-[#EAE6DF] p-6 md:p-8 grid gap-6 sm:grid-cols-3 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.02)]">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Total em Dólares</p>
              <p className="font-serif text-3xl font-light text-[#0D0E10]">U$ {totalUSD.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Total Estimado (BRL)</p>
              <p className="font-serif text-3xl font-light text-[#C5A85C]">R$ {Math.round(totalBRL).toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 block">Câmbio Comercial (R$)</label>
              <input
                type="number"
                step="0.01"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(Number(e.target.value))}
                className="w-full bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl px-3 py-1.5 text-sm text-[#0D0E10] focus:outline-none focus:border-[#C5A85C]"
              />
            </div>
          </div>

          {/* Expense List */}
          <div className="bg-white rounded-3xl border border-[#EAE6DF] p-6 md:p-8 space-y-6 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.02)]">
            <h3 className="font-serif text-xl font-medium text-[#0D0E10]">Detalhamento de Despesas</h3>
            
            <div className="divide-y divide-[#EAE6DF]">
              {allExpenses.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm text-[#0D0E10]">{exp.description}</p>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C5A85C] mt-0.5 block">
                      {exp.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-serif text-sm font-medium text-[#0D0E10]">U$ {exp.amountUSD}</p>
                      <p className="text-[10px] text-slate-400">R$ {Math.round(exp.amountUSD * exchangeRate).toLocaleString()}</p>
                    </div>
                    {exp.id !== "attr-cost" && (
                      <button
                        onClick={() => handleRemoveExpense(exp.id)}
                        className="text-slate-300 hover:text-red-500 p-1 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Expense Form */}
          <div className="bg-white rounded-3xl border border-[#EAE6DF] p-6 md:p-8 space-y-6 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.02)]">
            <h3 className="font-serif text-xl font-medium text-[#0D0E10]">Adicionar Nova Despesa</h3>
            
            <form onSubmit={handleAddExpense} className="grid gap-4 sm:grid-cols-3 items-end">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">Categoria</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl px-4 py-3 text-sm text-[#0D0E10] focus:outline-none focus:border-[#C5A85C]"
                >
                  <option value="Hospedagem">Hospedagem</option>
                  <option value="Passagens Aéreas">Passagens Aéreas</option>
                  <option value="Alimentação">Alimentação</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Compras">Compras</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Jantar no Carbone"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl px-4 py-3 text-sm text-[#0D0E10] focus:outline-none focus:border-[#C5A85C]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">Valor (USD)</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0"
                    value={newExpense.amountUSD}
                    onChange={(e) => setNewExpense({ ...newExpense, amountUSD: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl px-4 py-3 text-sm text-[#0D0E10] focus:outline-none focus:border-[#C5A85C]"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#0D0E10] text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Charts & Tips */}
        <div className="space-y-6">
          {/* Expense Distribution Chart */}
          <div className="bg-white rounded-3xl border border-[#EAE6DF] p-6 md:p-8 space-y-6 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.02)]">
            <h3 className="font-serif text-xl font-medium text-[#0D0E10]">Distribuição de Gastos</h3>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `U$ ${value}`} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Smart Saving Tips */}
          <div className="bg-[#0D0E10] text-white rounded-3xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#C5A85C]/10 blur-2xl" />
            
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C5A85C]">Dicas de Economia</p>
              <h3 className="font-serif text-2xl font-light">Como economizar em NY</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/10 text-[#C5A85C]">
                  <Percent className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="font-medium text-sm">MetroCard Ilimitado</p>
                  <p className="text-xs text-slate-400 mt-0.5">Por U$ 34, você viaja ilimitado por 7 dias. Economiza mais de U$ 50 em transporte.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/10 text-[#C5A85C]">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="font-medium text-sm">Dias Gratuitos em Museus</p>
                  <p className="text-xs text-slate-400 mt-0.5">Muitos museus oferecem entrada gratuita ou pague-o-quanto-quiser em dias específicos.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}