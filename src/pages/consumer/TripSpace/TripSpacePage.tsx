import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Compass, AlertCircle, Sparkles } from 'lucide-react';
import { useTripSpaceData } from './useTripSpaceData';
import { TripSpaceSidebar } from './TripSpaceSidebar';
import { TripHeader } from './TripHeader';
import { DayWorkspace } from './DayWorkspace';
import { TripContextSidebar } from './TripContextSidebar';
import { TripCollections } from './TripCollections';
import { TripPreparations } from './TripPreparations';

export default function TripSpacePage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();

  const { 
    data, loading, error, activeDay, setActiveDay, reloadData,
    handleToggleLock, createDraft, commitDraft, clearDraft, editDraft, draftLoading 
  } = useTripSpaceData(tripId);

  // Handle custom events from child components that don't have direct prop access
  useEffect(() => {
    const handleCreateDraft = (e: any) => {
      if (e.detail) createDraft(e.detail);
    };
    window.addEventListener('CREATE_EDIT_DRAFT', handleCreateDraft);
    return () => window.removeEventListener('CREATE_EDIT_DRAFT', handleCreateDraft);
  }, [createDraft]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCF8] p-6 text-center">
        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-lime-400 mb-4 shadow-lg animate-pulse">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="font-extrabold text-slate-800 text-lg mb-1">Preparando seu espaço da viagem...</p>
        <p className="text-xs text-slate-500 font-medium">Carregando suas informações e o roteiro inteligente.</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCF8] p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900 mb-2">{error || "Viagem não encontrada."}</h1>
        <p className="text-xs text-slate-500 mb-6 font-medium">Verifique se o endereço da viagem está correto ou volte para suas viagens.</p>
        <button
          onClick={() => navigate('/minhas-viagens')}
          className="bg-slate-900 text-white text-xs font-extrabold px-6 py-3 rounded-full hover:bg-slate-800 transition-colors"
        >
          Voltar para Minhas Viagens
        </button>
      </div>
    );
  }

  if (!data.days || data.days.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCF8] p-6 text-center">
        <div className="w-12 h-12 bg-lime-100 rounded-full flex items-center justify-center text-lime-700 mb-4">
          <Compass className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900 mb-2">Seu roteiro ainda não foi criado.</h1>
        <p className="text-xs text-slate-500 mb-6 font-medium">Conclua o onboarding para gerar seu roteiro de viagem personalizado.</p>
        <button
          onClick={() => navigate(`/viagens/${data.tripId}/onboarding`)}
          className="bg-lime-400 text-slate-950 text-xs font-extrabold px-6 py-3 rounded-full hover:bg-lime-500 transition-colors"
        >
          Continuar onboarding
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex">
      {/* 1. Left Sidebar Navigation */}
      <TripSpaceSidebar
        profile={data.profile}
        tripId={data.tripId}
      />

      {/* 2. Main Page Layout */}
      <div className="flex-1 max-w-7xl mx-auto p-6 md:p-8 grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Center & Left Content (Col 1-8) */}
        <main className="xl:col-span-8 min-w-0">
          <TripHeader data={data} />

          {/* Day Workspace (Timeline & Map & Quick Adjustments) */}
          <DayWorkspace
            days={data.days}
            activeDay={activeDay}
            onDayChange={setActiveDay}
            basecamp={data.basecamp}
            onToggleLock={handleToggleLock}
            onCreateDraft={createDraft}
            onCommitDraft={commitDraft}
            onClearDraft={clearDraft}
            editDraft={editDraft}
            draftLoading={draftLoading}
          />

          {/* Collections (Saved Ideas & Suggestions) */}
          <TripCollections
            savedIdeas={data.savedIdeas}
            recommendations={data.recommendations}
          />

          {/* Preparations, Wallet & Documents */}
          <TripPreparations
            tripId={data.tripId}
            checklist={data.checklist}
            reservations={data.reservations}
            documents={data.documents}
            onChecklistUpdate={reloadData}
          />
        </main>

        {/* 3. Right Context Sidebar (Col 9-12) */}
        <div className="xl:col-span-4 min-w-0">
          <div className="sticky top-8">
            <TripContextSidebar data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
