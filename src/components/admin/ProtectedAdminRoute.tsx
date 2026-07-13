import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function ProtectedAdminRoute() {
  const { session, isLoading } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-[#F0F2F5]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-4 border-slate-300 border-t-[#E2F18A] animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Validando sessão...</p>
        </div>
      </div>
    );
  }

  // TODO S1C/S1D:
  // Atualmente qualquer sessão autenticada acessa o Admin.
  // Substituir por verificação segura de public.is_admin() após aplicação da migration 000006 e bootstrap do primeiro administrador.
  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
