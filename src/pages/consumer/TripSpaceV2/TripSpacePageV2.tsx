import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Compass, AlertCircle, Sparkles, Calendar, User } from 'lucide-react';
import { useTripSpaceData } from '../TripSpace/useTripSpaceData';
import { TripSpaceSidebar } from '../TripSpace/TripSpaceSidebar';
import { TripHeader } from '../TripSpace/TripHeader';
import { DayWorkspaceV2 } from './DayWorkspaceV2';
import { TripContextSidebar } from '../TripSpace/TripContextSidebar';
import { TripPreparations } from '../TripSpace/TripPreparations';
import { TripMapViewV2 } from './TripMapViewV2';
import { TripSpaceErrorBoundary } from '../TripSpace/TripSpaceErrorBoundary';
import { BottomNavBar } from '../TripSpace/BottomNavBar';
import { MobileMoreDrawer } from '../TripSpace/MobileMoreDrawer';
import { TripHeroHeaderV2 } from './components/TripHeroHeaderV2';
import { TripScheduleNavV2, TripViewMode } from './components/TripScheduleNavV2';
import { WeeklyOverviewGridV2 } from './components/WeeklyOverviewGridV2';
export default function TripSpacePageV2() {
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
  const [viewMode, setViewMode] = useState<TripViewMode>('diario');
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
        <p className="font-extrabold text-slate-800 text-lg mb-1">Preparando seu espaço da viagem (V2)...</p>
        <p className="text-xs text-slate-500 font-medium">Carregando a nova interface experimental.</p>
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

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex">
      <TripSpaceSidebar
        profile={data.profile}
        tripId={data.tripId}
      />

      <div className="flex-1 max-w-[1400px] w-full mx-auto p-4 md:p-8 flex flex-col gap-8 overflow-x-hidden pb-28 md:pb-12">
        
        {/* HERO HEADER V2 COM FOTO DO DESTINO E DESIGN BENTO */}
        <TripHeroHeaderV2
          data={data}
          activeDay={activeDay}
          onAddActivity={() => {
            setActiveModule('roteiro');
            window.dispatchEvent(new CustomEvent('OPEN_ADD_EXPERIENCE_MODAL', { detail: { day: activeDay } }));
          }}
          onOptimize={previewRegeneration}
        />

        {/* NAVEGADOR E SELETOR DE VISÃO (DIA / SEMANA / MAPA) */}
        <TripScheduleNavV2
          days={data.days}
          activeDay={activeDay}
          onDayChange={setActiveDay}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <div className="flex-1 mt-2">
          {activeModule === 'roteiro' && (
            <div className="w-full">
              {viewMode === 'semanal' && (
                <TripSpaceErrorBoundary sectionName="Visão Semanal V2">
                  <WeeklyOverviewGridV2 
                    days={data.days} 
                    onSelectDay={(dayNum) => {
                      setActiveDay(dayNum);
                      setViewMode('diario');
                    }}
                  />
                </TripSpaceErrorBoundary>
              )}

              {viewMode === 'mapa' && (
                <TripSpaceErrorBoundary sectionName="Mapa Completo">
                  <TripMapViewV2 data={data} activeDay={activeDay} onDaySelect={(dayNum) => setActiveDay(dayNum)} />
                </TripSpaceErrorBoundary>
              )}

              {viewMode === 'diario' && (
                <div className="w-full">
                  <TripSpaceErrorBoundary sectionName="Roteiro do Dia (V2)">
                    <DayWorkspaceV2
                      tripId={data.tripId}
                      userId={(data as any).userId}
                      days={data.days}
                      activeDay={activeDay}
                      onDayChange={(d) => setActiveDay(d)}
                      basecamp={data.basecamp}
                      catalog={data.catalog}
                      onToggleLock={handleToggleLock}
                      onCreateDraft={createDraft}
                      onExecuteDirectAction={executeDirectAction}
                      onCommitDraft={commitDraft}
                      onClearDraft={clearDraft}
                      editDraft={editDraft}
                      draftLoading={draftLoading}
                    />
                  </TripSpaceErrorBoundary>
                </div>
              )}
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
              <TripMapViewV2
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
    </div>
  );
}
