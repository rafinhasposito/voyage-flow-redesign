import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Catalog from "./pages/Catalog";
import Wallet from "./pages/Wallet";
import NotFound from "./pages/NotFound";

import { ConsumerAuthProvider } from "./contexts/ConsumerAuthProvider";
import ConsumerLogin from "./pages/ConsumerLogin";
import ConsumerSignup from "./pages/ConsumerSignup";
import MyTrips from "./pages/MyTrips";
import NewTrip from "./pages/NewTrip";
import TripOnboardingContainer from "./pages/consumer/TripOnboarding/TripOnboardingContainer";
import TripWallet from "./pages/consumer/TripWallet/TripWallet";
import TripWorkspace from "./pages/consumer/Workspace/TripWorkspace";
import TripSpacePage from "./pages/consumer/TripSpace/TripSpacePage";

import { AdminAuthProvider } from "./contexts/AdminAuthProvider";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ExperiencesList from "./pages/admin/ExperiencesList";
import QualityDashboard from "./pages/admin/QualityDashboard";
import ExperienceEditor from "./pages/admin/ExperienceEditor";
import DestinationsList from "./pages/admin/DestinationsList";
import DestinationEditor from "./pages/admin/DestinationEditor";
import Import from "./pages/admin/Import";
import UsersList from "./pages/admin/UsersList";
import PricingManager from "./pages/admin/PricingManager";
import FeaturedDashboard from "./pages/admin/FeaturedDashboard";
import Tags from "./pages/admin/Tags";
import Personas from "./pages/admin/Personas";
import EngineRules from "./pages/admin/EngineRules";
import IAConcierge from "./pages/admin/IAConcierge";
import Partners from "./pages/admin/Partners";
import Sales from "./pages/admin/Sales";
import Settings from "./pages/admin/Settings";
import Analytics from "./pages/admin/Analytics";

import React, { useEffect } from "react";
import { ExperienceRepository } from "@/repositories";



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
          <Route path="/" element={
            <ConsumerAuthProvider>
              <Index />
            </ConsumerAuthProvider>
          } />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/app/board" element={<Dashboard />} />
          <Route path="/app/catalog" element={<Catalog />} />
          <Route path="/app/wallet" element={<Wallet />} />
          
          {/* Consumer Auth Routes */}
          <Route path="/login" element={<ConsumerLogin />} />
          <Route path="/cadastro" element={<ConsumerSignup />} />

          {/* Protected Consumer Routes (Minhas Viagens) */}
          <Route path="/minhas-viagens" element={
            <ConsumerAuthProvider>
              <MyTrips />
            </ConsumerAuthProvider>
          } />
          <Route path="/minhas-viagens/nova" element={
            <ConsumerAuthProvider>
              <NewTrip />
            </ConsumerAuthProvider>
          } />
          <Route path="/viagens/:tripId/onboarding" element={
            <ConsumerAuthProvider>
              <TripOnboardingContainer />
            </ConsumerAuthProvider>
          } />
          <Route path="/viagens/:tripId/carteira" element={
            <ConsumerAuthProvider>
              <TripWallet />
            </ConsumerAuthProvider>
          } />
          <Route path="/viagens/:tripId/roteiro" element={
            <ConsumerAuthProvider>
              <TripSpacePage />
            </ConsumerAuthProvider>
          } />
          
          {/* Admin Routes with Auth Context Wrapper */}
          <Route path="/admin" element={
            <AdminAuthProvider>
              <Outlet />
            </AdminAuthProvider>
          }>
            {/* Public Admin Routes */}
            <Route path="login" element={<AdminLogin />} />
            
            {/* Protected Admin Routes */}
            <Route element={<ProtectedAdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />

                <Route path="destinations" element={<DestinationsList />} />
                <Route path="destinations/new" element={<DestinationEditor />} />
                <Route path="destinations/:id" element={<DestinationEditor />} />

                <Route path="experiences" element={<ExperiencesList />} />
                <Route path="experiences/new" element={<ExperienceEditor />} />
                <Route path="experiences/:id" element={<ExperienceEditor />} />
                <Route path="quality" element={<QualityDashboard />} />
                <Route path="import" element={<Import />} />

                <Route path="users" element={<UsersList />} />
                <Route path="pricing" element={<PricingManager />} />
                <Route path="featured" element={<FeaturedDashboard />} />

                <Route path="lodgings" element={<ExperiencesList fixedType="hotel" fixedTitle="Hospedagens" fixedDescription="Gerencie o inventário de hotéis e basecamps." fixedIcon={<span className="text-sm">🏨</span>} />} />
                <Route path="restaurants" element={<ExperiencesList fixedType="restaurant" fixedTitle="Restaurantes" fixedDescription="Gerencie o inventário de restaurantes, culinária e reservas." fixedIcon={<span className="text-sm">🍽</span>} />} />
                <Route path="events" element={<ExperiencesList fixedType="event" fixedTitle="Eventos" fixedDescription="Gerencie o inventário de eventos sazonais, shows e experiências temporárias." fixedIcon={<span className="text-sm">🎉</span>} />} />
                <Route path="tags" element={<Tags />} />
                <Route path="personas" element={<Personas />} />
                <Route path="rules" element={<EngineRules />} />
                <Route path="ia" element={<IAConcierge />} />
                <Route path="partners" element={<Partners />} />
                <Route path="sales" element={<Sales />} />
                <Route path="users" element={<UsersList />} />
                <Route path="settings" element={<Settings />} />
                <Route path="analytics" element={<Analytics />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;