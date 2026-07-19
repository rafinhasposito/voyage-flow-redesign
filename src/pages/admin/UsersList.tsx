import React, { useState, useEffect } from 'react';
import { Search, Shield, AlertTriangle, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Database } from '@/types/supabase.types';

type AdminUser = Database['public']['Tables']['admin_users']['Row'];

export default function UsersList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminUsers() {
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('*');
        
        if (error) throw error;
        setAdminUsers(data || []);
      } catch (err: any) {
        toast.error('Erro ao carregar administradores: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadAdminUsers();
  }, []);

  const filteredUsers = adminUsers.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-vf-bg overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-vf-border z-10 shrink-0">
        <div>
          <h1 className="text-lg font-black text-vf-black tracking-tight flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" /> Gestão de Usuários
          </h1>
          <p className="text-[11px] text-vf-text-3 font-semibold">Consumidores (B2C) e Administradores (B2B).</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-vf-text-3 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              type="text" 
              placeholder="Buscar email ou ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64 h-9 text-[13px]"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[1000px] mx-auto space-y-6">
          
          <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm">Lacuna Crítica de Backend Documentada</h3>
              <p className="text-xs mt-1 opacity-80 leading-relaxed">
                Consultas seguras e em massa à tabela <code>auth.users</code> do Supabase requerem acesso administrativo via Edge Function ou Backend com Service Role. 
                Nenhum endpoint está disponível para buscar consumidores (B2C). A tabela de perfis de consumidores também está ausente. 
                Listando abaixo apenas os usuários administrativos expostos publicamente na tabela <code>admin_users</code>.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-vf-border shadow-vf-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-vf-border/50 bg-[#F7F7F2] flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-black text-vf-black">Administradores e Curadores ({adminUsers.length})</h3>
            </div>
            
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="text-center py-10 text-slate-400 font-bold text-sm">Carregando usuários...</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white sticky top-0 z-10 shadow-sm border-b border-vf-border">
                    <tr>
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-vf-text-3">Email (ID)</th>
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-vf-text-3">Role</th>
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-vf-text-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-vf-border bg-white">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-[#F7F7F2]/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-[13px] text-vf-black">{user.email}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{user.id}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-100">
                            {user.role_id}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border ${
                            user.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                            {user.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-10 text-center text-vf-text-3 font-bold text-sm">
                          Nenhum usuário administrativo encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
