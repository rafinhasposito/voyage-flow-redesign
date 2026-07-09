import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Edit3, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase.types";

type ExperienceRow = Database["public"]["Tables"]["experiences"]["Row"];

export default function ExperiencesList() {
  const [experiences, setExperiences] = useState<ExperienceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchExperiences() {
      // In a real implementation this would fetch from Supabase:
      // const { data } = await supabase.from('experiences').select('*');
      // For now, since the DB might be empty, we just simulate loading
      setIsLoading(false);
    }
    fetchExperiences();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-light text-[#0D0E10]">Experiências</h1>
          <p className="text-slate-500 mt-1">Gerencie o catálogo premium de atrações.</p>
        </div>
        <Link 
          to="/admin/experiences/new" 
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0D0E10] text-white px-4 py-2.5 text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Experiência
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-[#EAE6DF] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#EAE6DF] flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar experiências..." 
              className="w-full pl-9 pr-4 py-2 bg-[#FAF8F5] border border-[#EAE6DF] rounded-lg text-sm focus:outline-none focus:border-[#C5A85C]"
            />
          </div>
        </div>
        
        <div className="p-8 text-center text-slate-500">
          {isLoading ? (
            <p>Carregando...</p>
          ) : experiences.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Compass className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-lg font-medium text-[#0D0E10]">Nenhuma experiência encontrada</p>
              <p className="text-sm mt-1 max-w-sm">
                Conecte o banco de dados Supabase e cadastre sua primeira experiência curada para visualizá-la aqui.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF8F5] text-slate-500 font-medium border-y border-[#EAE6DF]">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Custo (USD)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {experiences.map(exp => (
                  <tr key={exp.id} className="border-b border-[#EAE6DF] hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-[#0D0E10]">{exp.title}</td>
                    <td className="px-4 py-3 text-slate-600">{exp.category}</td>
                    <td className="px-4 py-3 text-slate-600">${exp.base_cost}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                        {exp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1.5 text-slate-400 hover:text-[#C5A85C] transition-colors rounded-lg hover:bg-white">
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// Just adding Compass icon here since it's used in the empty state
import { Compass } from "lucide-react";
