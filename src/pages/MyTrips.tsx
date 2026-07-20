import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useConsumerAuth } from "@/contexts/ConsumerAuthProvider";
import { Compass, Plus, LogOut, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TripRepository } from "@/repositories/TripRepository";

export default function MyTrips() {
  const { user, isLoading, signOut } = useConsumerAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      TripRepository.getMyTrips()
        .then(data => {
            setTrips(data);
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
                <div className="mb-4">
                  <h3 className="font-display font-bold text-lg text-slate-900">{trip.title}</h3>
                  <div className="flex items-center text-sm text-slate-500 mt-1">
                    <MapPin className="h-3 w-3 mr-1" /> {trip.destination}
                  </div>
                </div>
                <div className="flex items-center text-xs text-slate-500 bg-slate-50 rounded-lg p-3 mb-6">
                  <Calendar className="h-3 w-3 mr-2" />
                  <span>{new Date(trip.start_date).toLocaleDateString()} a {new Date(trip.end_date).toLocaleDateString()}</span>
                </div>
                <Button variant="outline" className="w-full rounded-xl" asChild>
                  <Link to={`/viagens/${trip.id}/roteiro`}>Abrir Roteiro</Link>
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
    </div>
  );
}
