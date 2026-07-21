import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useConsumerAuth } from "@/contexts/ConsumerAuthProvider";
import { Compass, Plus, LogOut, MapPin, Calendar, MoreVertical, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TripRepository } from "@/repositories/TripRepository";
import { DestinationRepository, DestinationRow } from "@/repositories/DestinationRepository";

export default function MyTrips() {
  const { user, isLoading, signOut } = useConsumerAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [destinations, setDestinations] = useState<Record<string, string>>({});

  // Delete state
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [tripToDelete, setTripToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState(false);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClick = () => setMenuOpenId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      Promise.all([
        TripRepository.getMyTrips(),
        DestinationRepository.getAll()
      ])
        .then(([tripsData, destsData]) => {
            setTrips(tripsData);
            const destMap: Record<string, string> = {};
            destsData.forEach(d => { destMap[d.id] = d.name; });
            setDestinations(destMap);
            setIsFetching(false);
        })
        .catch(err => {
            console.error(err);
            // Ignore o 42P01 ou PGRST205 que é erro de tabela não existente temporario
            setError("Não foi possível carregar as viagens. (A tabela pode ainda não existir remotamente)");
            setIsFetching(false);
        });
    }
  }, [user]);

  const handleDeleteConfirm = async () => {
    if (!tripToDelete) return;
    setIsDeleting(true);
    setDeleteError(false);
    try {
      await TripRepository.deleteTrip(tripToDelete.id);
      setTrips(trips.filter(t => t.id !== tripToDelete.id));
      setTripToDelete(null);
      setDeleteSuccessMsg(true);
      setTimeout(() => setDeleteSuccessMsg(false), 3000);
    } catch (err) {
      console.error(err);
      setDeleteError(true);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Carregando Sessão...</div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="h-6 w-6 text-slate-900" />
          <span className="font-display font-semibold text-xl text-slate-900">Voyage Flow</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600 hidden sm:inline-block">{user.email}</span>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-slate-500">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-display font-bold text-slate-900">Minhas Viagens</h1>
          <Button asChild className="rounded-xl bg-lime-400 hover:bg-lime-500 text-lime-950 font-bold">
            <Link to="/minhas-viagens/nova">
              <Plus className="h-4 w-4 mr-2" /> Nova Viagem
            </Link>
          </Button>
        </div>

        {deleteSuccessMsg && (
          <div className="bg-lime-50 text-lime-800 px-4 py-3 rounded-xl border border-lime-200 mb-6 flex items-center justify-center font-medium animate-in fade-in slide-in-from-top-2">
            Viagem excluída.
          </div>
        )}

        {isFetching ? (
          <div className="flex justify-center p-12 text-slate-500">Carregando suas viagens...</div>
        ) : error ? (
           <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 mb-8">
               <p className="font-medium">Aviso de Banco de Dados</p>
               <p className="text-sm opacity-90">{error}</p>
           </div>
        ) : trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map(trip => (
              <div key={trip.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4 flex justify-between items-start">
                  <div>
                    <h3 className="font-display font-bold text-lg text-slate-900">{trip.title}</h3>
                    <div className="flex items-center text-sm text-slate-500 mt-1">
                      <MapPin className="h-3 w-3 mr-1" /> {destinations[trip.destination] || trip.destination}
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === trip.id ? null : trip.id); }}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors -mr-2 -mt-2"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {menuOpenId === trip.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-10 animate-in fade-in zoom-in-95">
                        <button
                          onClick={() => { setMenuOpenId(null); setTripToDelete(trip); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 font-medium hover:bg-red-50 flex items-center gap-2 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" /> Excluir viagem
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center text-xs text-slate-500 bg-slate-50 rounded-lg p-3 mb-6">
                  <Calendar className="h-3 w-3 mr-2" />
                  <span>
                    {new Date(trip.start_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} a {new Date(trip.end_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </span>
                </div>
                <Button variant="outline" className="w-full rounded-xl" asChild>
                  <Link to={Array.isArray(trip.itinerary) && trip.itinerary.length > 0 ? `/viagens/${trip.id}/roteiro` : `/viagens/${trip.id}/onboarding`}>
                    {Array.isArray(trip.itinerary) && trip.itinerary.length > 0 ? "Abrir meu espaço" : "Continuar planejamento"}
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Compass className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Sua próxima viagem começa aqui.</h2>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Conte como você quer viajar e o Voyage Flow organiza o restante. Roteiros inteligentes e editáveis em segundos.
            </p>
            <Button asChild size="lg" className="rounded-xl bg-lime-400 hover:bg-lime-500 text-lime-950 font-bold">
              <Link to="/minhas-viagens/nova">Criar minha primeira viagem</Link>
            </Button>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {tripToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[24px] shadow-xl max-w-md w-full p-6 animate-in zoom-in-95">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Excluir esta viagem?</h2>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Esta ação removerá a viagem e os dados associados. Ela não poderá ser desfeita.
            </p>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6">
               {tripToDelete.title && <p className="font-bold text-slate-800 mb-1">{tripToDelete.title}</p>}
               <p className="text-sm text-slate-600 flex items-center gap-1.5 mb-1">
                 <MapPin className="w-3.5 h-3.5" /> {destinations[tripToDelete.destination] || tripToDelete.destination}
               </p>
               <p className="text-sm text-slate-600 flex items-center gap-1.5">
                 <Calendar className="w-3.5 h-3.5" /> {new Date(tripToDelete.start_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} a {new Date(tripToDelete.end_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
               </p>
            </div>

            {deleteError && (
              <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium border border-red-100">
                Não foi possível excluir esta viagem. Tente novamente.
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setTripToDelete(null)}
                disabled={isDeleting}
                className="rounded-full px-6"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="rounded-full px-6 bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isDeleting ? 'Excluindo...' : 'Excluir viagem'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
