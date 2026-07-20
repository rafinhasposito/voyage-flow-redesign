import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useConsumerAuth } from "@/contexts/ConsumerAuthProvider";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TripRepository } from "@/repositories/TripRepository";

export default function NewTrip() {
  const { user, isLoading } = useConsumerAuth();
  const navigate = useNavigate();
  
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Carregando Sessão...</div>;
  }

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !startDate || !endDate) {
      setError("Preencha Destino, Chegada e Partida.");
      return;
    }
    
    setError("");
    setIsSaving(true);
    try {
      await TripRepository.createTrip({
        title: `Viagem para ${destination}`,
        destination,
        start_date: startDate,
        end_date: endDate,
        hotel_name: hotelName,
        status: 'planning'
      });
      navigate("/minhas-viagens?saved=true");
    } catch (err: any) {
      console.error(err);
      setError("Não foi possível salvar a viagem. A tabela pode não existir no banco de dados.");
    } finally {
      setIsSaving(false);
    }
  };

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
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mb-6 text-sm">
               {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSave}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Destino</label>
              <input 
                type="text" 
                placeholder="Ex: Rio de Janeiro" 
                className="w-full rounded-xl border-slate-200 p-3 text-slate-900" 
                value={destination}
                onChange={e => setDestination(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chegada</label>
                <input 
                  type="date" 
                  className="w-full rounded-xl border-slate-200 p-3 text-slate-900" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Partida</label>
                <input 
                  type="date" 
                  className="w-full rounded-xl border-slate-200 p-3 text-slate-900" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hotel / Basecamp</label>
              <input 
                type="text" 
                placeholder="Onde você vai se hospedar?" 
                className="w-full rounded-xl border-slate-200 p-3 text-slate-900" 
                value={hotelName}
                onChange={e => setHotelName(e.target.value)}
              />
            </div>

            <div className="pt-4 flex items-center gap-4 border-t border-slate-100">
              <Button type="submit" disabled={isSaving} className="rounded-xl flex-1 h-12 text-base">
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Salvando...</> : "Salvar Viagem"}
              </Button>
            </div>
          </form>
          <p className="text-xs text-slate-400 mt-6 text-center">
            Esta versão tenta salvar diretamente no Supabase. Se o backend estiver bloqueado, exibirá alerta.
          </p>
        </div>
      </main>
    </div>
  );
}
