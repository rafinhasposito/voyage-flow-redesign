import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Compass, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ConsumerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate("/minhas-viagens");
    } catch (err: any) {
      setError(err.message || "Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white mb-4">
            <Compass className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900">Entrar no Voyage Flow</h1>
          <p className="text-sm text-slate-500 mt-2">Acesse suas viagens planejadas.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border-slate-200 p-3 text-sm focus:border-slate-900 focus:ring-slate-900" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border-slate-200 p-3 text-sm focus:border-slate-900 focus:ring-slate-900" 
            />
          </div>
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          
          <Button type="submit" className="w-full h-12 rounded-xl text-base bg-lime-400 hover:bg-lime-500 text-lime-950 font-bold" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Ainda não tem conta? <Link to="/cadastro" className="text-slate-900 font-medium hover:underline">Criar agora</Link>
        </p>
      </div>
    </div>
  );
}
