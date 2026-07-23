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
    handleToggleLock, createDraft, commitDraft, clearDraft, editDraft, draftLoading,
    regenerateItinerary, previewRegeneration
  } = useTripSpaceData(tripId);

  const [activeModule, setActiveModule] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'roteiro';
  });

  useEffect(() => {
    window.location.hash = activeModule;
  }, [activeModule]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) setActiveModule(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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

  const navItems = [
    { id: 'visao-geral', label: 'Visão Geral' },
    { id: 'roteiro', label: 'Roteiro' },
    { id: 'descobertas', label: 'Descobertas' },
    { id: 'carteira', label: 'Carteira' },
    { id: 'preparativos', label: 'Preparativos' },
    { id: 'documentos', label: 'Documentos' },
    { id: 'mapa', label: 'Mapa' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex">
      {/* Left Sidebar Navigation (We can use it just for app-level nav or logo) */}
      <TripSpaceSidebar
        profile={data.profile}
        tripId={data.tripId}
      />

      <div className="flex-1 max-w-7xl mx-auto p-6 md:p-8 flex flex-col gap-6">
        <TripHeader data={data} onRegenerate={previewRegeneration} />

        {/* Module Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                activeModule === item.id
                  ? 'bg-white border border-slate-200 border-b-white text-slate-900 -mb-[9px] z-10'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Main Content Area based on activeModule */}
        <div className="flex-1">
          {activeModule === 'visao-geral' && (
            <div className="max-w-3xl">
              <TripContextSidebar data={data} isOverviewMode={true} />
            </div>
          )}

          {activeModule === 'roteiro' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              <div className="xl:col-span-8 min-w-0">
                <DayWorkspace
                  tripId={data.tripId}
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
              </div>
              <div className="xl:col-span-4 min-w-0">
                <div className="sticky top-8">
                  <TripContextSidebar data={data} />
                </div>
              </div>
            </div>
          )}

          {activeModule === 'descobertas' && (
            <div className="max-w-5xl">
              <TripCollections
                savedIdeas={data.savedIdeas}
                maybeIdeas={data.maybeIdeas}
                recommendations={data.recommendations}
                onAddIdea={(ideaId) => createDraft({ action: 'ADD', experienceId: ideaId, targetDay: activeDay })}
              />
            </div>
          )}

          {activeModule === 'carteira' && (
            <div className="max-w-4xl">
              <TripPreparations
                activeTabOverride="reservations"
                tripId={data.tripId}
                checklist={data.checklist}
                reservations={data.reservations}
                documents={data.documents}
                onChecklistUpdate={reloadData}
              />
            </div>
          )}

          {activeModule === 'preparativos' && (
            <div className="max-w-4xl">
              <TripPreparations
                activeTabOverride="checklist"
                tripId={data.tripId}
                checklist={data.checklist}
                reservations={data.reservations}
                documents={data.documents}
                onChecklistUpdate={reloadData}
              />
            </div>
          )}

          {activeModule === 'documentos' && (
            <div className="max-w-4xl">
              <TripPreparations
                activeTabOverride="documents"
                tripId={data.tripId}
                checklist={data.checklist}
                reservations={data.reservations}
                documents={data.documents}
                onChecklistUpdate={reloadData}
              />
            </div>
          )}

          {activeModule === 'mapa' && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <h2 className="text-xl font-bold text-slate-800 mb-2">Mapa Completo (Em breve)</h2>
              <p className="text-sm text-slate-500">Visualização geográfica de todas as atrações.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
