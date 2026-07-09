import React from "react";
import { Link } from "react-router-dom";
import { Compass, Map, Users } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-light text-[#0D0E10]">Dashboard</h1>
        <p className="text-slate-500 mt-1">Bem-vindo ao painel de curadoria do Concierge.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#EAE6DF] shadow-sm flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-[#F3EFEA] flex items-center justify-center text-[#C5A85C] shrink-0">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Experiências</p>
            <p className="font-serif text-2xl text-[#0D0E10]">24</p>
            <Link to="/admin/experiences" className="text-xs text-[#C5A85C] font-medium hover:underline mt-2 inline-block">Gerenciar catálogo</Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#EAE6DF] shadow-sm flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <Map className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Destinos</p>
            <p className="font-serif text-2xl text-[#0D0E10]">1</p>
            <p className="text-xs text-slate-400 mt-2">Nova York (Ativo)</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#EAE6DF] shadow-sm flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Usuários</p>
            <p className="font-serif text-2xl text-[#0D0E10]">-</p>
            <p className="text-xs text-slate-400 mt-2">Em breve (Fase 3.2)</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl border border-[#EAE6DF] p-6 mt-8">
        <h2 className="font-serif text-xl mb-4">Migração Supabase (Fase 3.1)</h2>
        <p className="text-sm text-slate-600 mb-4">
          O projeto está em processo de migração. Atualmente o schema de dados já está estruturado para suportar o banco de dados.
        </p>
        <ul className="text-sm space-y-2 text-slate-500 list-disc list-inside">
          <li>SDK do Supabase instalado.</li>
          <li>Tipagens geradas.</li>
          <li>Layout administrativo configurado.</li>
          <li>(Próximo Passo) Conectar visualmente as telas ao banco real.</li>
        </ul>
      </div>
    </div>
  );
}
