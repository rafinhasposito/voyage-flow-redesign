import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useConsumerAuth } from "@/contexts/ConsumerAuthProvider";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewTrip() {
  const { user, isLoading } = useConsumerAuth();
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
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-4">
          <Link to="/minhas-viagens">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <span className="font-display font-semibold text-xl text-slate-900">Nova Viagem</span>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12">
        <div className="bg-white rounded-3xl border border-slate-200 p-8">
          <h2 className="text-2xl font-bold font-display text-slate-900 mb-6">Qual será o seu próximo destino?</h2>
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Destino</label>
              <input type="text" placeholder="Ex: Rio de Janeiro" className="w-full rounded-xl border-slate-200 p-3" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chegada</label>
                <input type="date" className="w-full rounded-xl border-slate-200 p-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Partida</label>
                <input type="date" className="w-full rounded-xl border-slate-200 p-3" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hotel / Basecamp</label>
              <input type="text" placeholder="Onde você vai se hospedar?" className="w-full rounded-xl border-slate-200 p-3" />
            </div>

            <div className="pt-4 flex items-center gap-4 border-t border-slate-100">
              <Button type="button" className="rounded-xl flex-1 h-12 text-base" onClick={() => navigate("/onboarding")}>
                Continuar para preferências
              </Button>
            </div>
          </form>
          <p className="text-xs text-slate-400 mt-6 text-center">
            Nesta versão de desenvolvimento, a viagem será passada temporariamente para o estado local.
          </p>
        </div>
      </main>
    </div>
  );
}
