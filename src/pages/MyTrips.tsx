import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useConsumerAuth } from "@/contexts/ConsumerAuthProvider";
import { Compass, Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MyTrips() {
  const { user, isLoading, signOut } = useConsumerAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Carregando...</div>;
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
          <Button asChild className="rounded-xl">
            <Link to="/minhas-viagens/nova">
              <Plus className="h-4 w-4 mr-2" /> Nova Viagem
            </Link>
          </Button>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center">
          <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Compass className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Sua próxima viagem começa aqui.</h2>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Conte como você quer viajar e o Voyage Flow organiza o restante. Roteiros inteligentes e editáveis em segundos.
          </p>
          <Button asChild size="lg" className="rounded-xl">
            <Link to="/minhas-viagens/nova">Criar minha primeira viagem</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
