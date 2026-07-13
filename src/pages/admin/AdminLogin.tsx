import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getSafeAdminRedirect } from '@/lib/adminAuthUtils';
import { Compass, Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const { session, isLoading: sessionLoading, authError, signIn, clearError } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = getSafeAdminRedirect(location.state);

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F0F2F5]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (session) {
    return <Navigate to={from} replace />;
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (authError) clearError();
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (authError) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!email || !password) {
      // Usaremos o próprio estado authError disparando signIn com valores vazios?
      // O provider fará a chamada normal ou podemos não disparar se não passar pela validação.
      // É mais prático só não submeter e avisar visualmente ou via state local. Mas
      // "limpar erro antes de nova submissão" está no requirement.
      clearError();
      return;
    }

    setIsSubmitting(true);
    const success = await signIn(email, password);
    setIsSubmitting(false);

    if (success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F0F2F5] p-4">
      <div className="w-full max-w-sm bg-white rounded-[28px] shadow-sm p-8 border border-slate-100" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-[18px] flex items-center justify-center mb-4" style={{ background: '#E2F18A' }}>
            <Compass className="w-6 h-6 text-black" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-[#0F1117] tracking-tight">Voyage Flow</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Admin CMS</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {authError && (
            <div className="p-3 text-sm font-semibold text-red-600 bg-red-50 rounded-xl text-center">
              {authError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={handleEmailChange}
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E2F18A] focus:border-transparent transition-all disabled:opacity-50 text-sm"
              placeholder="admin@voyageflow.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700" htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={handlePasswordChange}
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E2F18A] focus:border-transparent transition-all disabled:opacity-50 text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email || !password}
            className="w-full mt-6 bg-[#0F1117] hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Entrar no Painel'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
