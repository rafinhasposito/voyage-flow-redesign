import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Catalog from "./pages/Catalog";
import Wallet from "./pages/Wallet";
import NotFound from "./pages/NotFound";

// Admin
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ExperiencesList from "./pages/admin/ExperiencesList";
import HotelsList from "./pages/admin/HotelsList";
import QualityDashboard from "./pages/admin/QualityDashboard";
import ExperienceEditor from "./pages/admin/ExperienceEditor";
import DestinationsList from "./pages/admin/DestinationsList";
import DestinationEditor from "./pages/admin/DestinationEditor";
import Import from "./pages/admin/Import";
import UsersList from "./pages/admin/UsersList";
import PricingManager from "./pages/admin/PricingManager";
import FeaturedDashboard from "./pages/admin/FeaturedDashboard";


import React, { useEffect } from "react";
import { ExperienceRepository } from "@/repositories";

// ── Coming Soon placeholder ───────────────────────────────────────────────────
function ComingSoon({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-8">
      <div className="text-5xl mb-4">{icon}</div>
      <div className="rounded-[28px] p-8 max-w-md"
        style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
        <div className="inline-flex items-center gap-1.5 bg-[#E2F18A] px-3 py-1 rounded-full mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-black/60">Em breve</span>
        </div>
        <h2 className="text-xl font-black text-[#0F1117] tracking-tight">{title}</h2>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    ExperienceRepository.initialize();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/app/board" element={<Dashboard />} />
          <Route path="/app/catalog" element={<Catalog />} />
          <Route path="/app/wallet" element={<Wallet />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            
            <Route path="destinations" element={<DestinationsList />} />
            <Route path="destinations/new" element={<DestinationEditor />} />
            <Route path="destinations/:id" element={<DestinationEditor />} />

            <Route path="experiences" element={<ExperiencesList />} />
            <Route path="experiences/new" element={<ExperienceEditor />} />
            <Route path="experiences/:id" element={<ExperienceEditor />} />
            
            <Route path="hotels" element={<HotelsList />} />
            <Route path="quality" element={<QualityDashboard />} />
            <Route path="import" element={<Import />} />
            
            <Route path="users" element={<UsersList />} />
            <Route path="pricing" element={<PricingManager />} />
            <Route path="featured" element={<FeaturedDashboard />} />

            {/* Modules in development */}
            <Route path="restaurants" element={<ComingSoon title="Restaurantes" desc="Módulo dedicado para gerenciar restaurantes com campos específicos: culinária, faixa de preço, reserva e links de afiliado." icon="🍽" />} />
            <Route path="events" element={<ComingSoon title="Eventos" desc="Gerenciamento de eventos sazonais, shows, exposições e experiências temporárias com datas e disponibilidade." icon="🎉" />} />
            <Route path="tags" element={<ComingSoon title="Taxonomia de Tags" desc="Biblioteca de tags usadas pelo engine de IA para fazer matching entre experiências e perfis de viajantes." icon="🏷" />} />
            <Route path="personas" element={<ComingSoon title="Personas" desc="Perfis psicográficos dos viajantes (Explorador Visual, Curador, Slow Traveler...) que direcionam o matching da IA." icon="🧐" />} />
            <Route path="analytics" element={<ComingSoon title="Analytics" desc="Insights de uso, cliques em links de afiliados, conversões e performance por experiência e destino." icon="📊" />} />
          </Route>


          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;