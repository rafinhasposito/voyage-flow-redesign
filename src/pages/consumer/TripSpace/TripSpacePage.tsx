import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Compass, AlertCircle, Sparkles, Calendar, User } from 'lucide-react';
import { useTripSpaceData } from './useTripSpaceData';
import { TripSpaceSidebar } from './TripSpaceSidebar';
import { TripHeader } from './TripHeader';
import { DayWorkspace } from './DayWorkspace';
import { TripContextSidebar } from './TripContextSidebar';
import { TripCollections } from './TripCollections';
import { TripPreparations } from './TripPreparations';
import { TripMapView } from './TripMapView';
import { TripSpaceErrorBoundary } from './TripSpaceErrorBoundary';
import { BottomNavBar } from './BottomNavBar';
import { MobileMoreDrawer } from './MobileMoreDrawer';

export default function TripSpacePage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();

  const { 
    data, loading, error, activeDay, setActiveDay, reloadData,
    handleToggleLock, createDraft, commitDraft, clearDraft, editDraft, draftLoading, executeDirectAction,
    regenerateItinerary, previewRegeneration
  } = useTripSpaceData(tripId);

  const [activeModule, setActiveModule] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'roteiro';
  });
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);

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
      {/* Left Sidebar Navigation */}
      <TripSpaceSidebar
        profile={data.profile}
        tripId={data.tripId}
      />

      <div className="flex-1 max-w-[1400px] w-full mx-auto p-4 md:p-8 flex flex-col gap-6 overflow-x-hidden pb-24 md:pb-8">

        {/* Compact mobile header */}
        <div className="md:hidden -mb-2">
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight truncate">{data.destinationName}</h1>
          <p className="text-xs font-bold text-slate-500 truncate">
            {data.startDate && data.endDate ? `${data.startDate} a ${data.endDate}` : 'Datas a definir'} · {data.travelersCount} viajantes
          </p>
        </div>

        {/* Clean Header (Print 1 Style) — desktop only, mobile uses the compact header above */}
        <div className="hidden md:flex md:flex-row md:items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              Seu canto da viagem
            </h1>
            <p className="text-slate-500 font-medium text-sm md:text-base max-w-xl mb-4">
              Aqui sua viagem ganha vida. Organize, ajuste e descubra o melhor de cada momento.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                {data.destinationName}
              </span>
              <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {data.startDate && data.endDate ? `${data.startDate} a ${data.endDate}` : 'Datas a definir'}
              </span>
              <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {data.travelersCount} viajantes
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
             <button
               onClick={() => {
                 setActiveModule('roteiro');
                 window.dispatchEvent(new CustomEvent('OPEN_ADD_EXPERIENCE_MODAL', { detail: { day: activeDay } }));
               }}
               className="bg-lime-400 text-slate-950 font-extrabold text-sm px-5 py-2.5 rounded-full hover:bg-lime-500 transition-colors shadow-sm flex items-center gap-2"
             >
               <Sparkles className="w-4 h-4" />
               Adicionar ao Dia {activeDay}
             </button>
             <button
               onClick={previewRegeneration}
               className="bg-white border border-slate-200 text-slate-700 font-extrabold text-sm px-5 py-2.5 rounded-full hover:bg-slate-50 transition-colors shadow-sm"
             >
               Recalcular roteiro
             </button>
          </div>
        </div>

        {/* Main Content Area based on activeModule */}
        <div className="flex-1">

          {activeModule === 'roteiro' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              <div className="xl:col-span-8 min-w-0">
                <TripSpaceErrorBoundary sectionName="Roteiro do Dia">
                  <DayWorkspace
                    tripId={data.tripId}
                    userId={(data as any).userId}
                    days={data.days}
                    activeDay={activeDay}
                    onDayChange={setActiveDay}
                    basecamp={data.basecamp}
                    catalog={data.catalog}
                    onToggleLock={handleToggleLock}
                    onCreateDraft={createDraft}
                    onCommitDraft={commitDraft}
                    onExecuteDirectAction={executeDirectAction}
                    onClearDraft={clearDraft}
                    editDraft={editDraft}
                    draftLoading={draftLoading}
                  />
                </TripSpaceErrorBoundary>
              </div>
              <div className="hidden xl:block xl:col-span-4 min-w-0">
                <div className="sticky top-8">
                  <TripSpaceErrorBoundary sectionName="Painel Lateral" inline>
                    <TripContextSidebar data={data} activeDay={activeDay} onModuleChange={setActiveModule} />
                  </TripSpaceErrorBoundary>
                </div>
              </div>
            </div>
          )}

          {activeModule === 'descobertas' && (
            <TripSpaceErrorBoundary sectionName="Descobertas">
              <div className="max-w-5xl">
                <TripCollections
                  savedIdeas={data.savedIdeas}
                  maybeIdeas={data.maybeIdeas}
                  recommendations={data.recommendations}
                  onAddIdea={(ideaId) => executeDirectAction({ action: 'ADD', sourceExperienceId: ideaId, targetDay: activeDay } as any)}
                />
              </div>
            </TripSpaceErrorBoundary>
          )}

          {activeModule === 'carteira' && (
            <TripSpaceErrorBoundary sectionName="Carteira">
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
            </TripSpaceErrorBoundary>
          )}

          {activeModule === 'preparativos' && (
            <TripSpaceErrorBoundary sectionName="Preparativos">
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
            </TripSpaceErrorBoundary>
          )}

          {activeModule === 'documentos' && (
            <TripSpaceErrorBoundary sectionName="Documentos">
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
            </TripSpaceErrorBoundary>
          )}

          {activeModule === 'mapa' && (
            <TripSpaceErrorBoundary sectionName="Mapa">
              <TripMapView
                data={data}
                activeDay={activeDay}
                onDaySelect={setActiveDay}
              />
            </TripSpaceErrorBoundary>
          )}
        </div>
      </div>

      <BottomNavBar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        onAddClick={() => {
          setActiveModule('roteiro');
          window.dispatchEvent(new CustomEvent('OPEN_ADD_EXPERIENCE_MODAL', { detail: { day: activeDay } }));
        }}
        onMoreClick={() => setIsMoreDrawerOpen(true)}
      />

      <MobileMoreDrawer
        isOpen={isMoreDrawerOpen}
        onClose={() => setIsMoreDrawerOpen(false)}
        onNavigate={(moduleId) => setActiveModule(moduleId)}
        onRecalculate={previewRegeneration}
      />
    </div>
  );
}
