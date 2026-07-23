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
import { TripMapView } from './TripMapView';

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
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="font-extrabold text-slate-800 text-lg mb-1">Ops! Ocorreu um erro.</p>
        <p className="text-sm text-slate-500 font-medium mb-4">{error || "Não foi possível carregar o roteiro."}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-slate-900 text-white rounded-full font-bold">Voltar</button>
      </div>
    );
  }

  const navItems = [
    { id: 'visao-geral', label: 'Visão Geral' },
    { id: 'roteiro', label: 'Roteiro' },
    { id: 'descobertas', label: 'Descobertas' },
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
            <TripMapView
              data={data}
              activeDay={activeDay}
              onDaySelect={setActiveDay}
            />
          )}
        </div>
      </div>
    </div>
  );
}
