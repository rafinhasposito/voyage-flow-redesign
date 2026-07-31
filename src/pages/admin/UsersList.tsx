import React, { useState, useEffect } from 'react';
import { Search, Shield, AlertTriangle, Users, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Database } from '@/types/supabase.types';
import { AdminHeader } from '@/components/admin/AdminHeader';

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
    <div className="flex flex-col h-full bg-[#F7F7F2] font-sans overflow-auto selection:bg-[#D7F24B] selection:text-[#171717]">
      <AdminHeader
        title="Gestão de Usuários"
        subtitle="Administração central de Consumidores (B2C), Curadores e Desenvolvedores B2B."
        icon={<Users className="w-4 h-4 text-[#171717]" />}
        badgeText="Módulo de Controle"
        gradient="from-[#E2D1C3] to-[#FDFCFB]" // Beige/White gradient for Users
        loading={loading}
        metrics={[
          { label: 'Administradores', value: adminUsers.length, color: 'bg-white/40' },
          { label: 'Consumidores App', value: '-', color: 'bg-indigo-500/10 text-indigo-900 border-indigo-500/20' },
        ]}
        actions={
          <div className="flex items-center gap-2 bg-white/40 backdrop-blur-md rounded-xl p-1 border border-white/40 shadow-sm relative w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171717]/40" />
            <input 
              type="text"
              placeholder="Buscar email ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 h-10 bg-transparent border-0 text-[13px] font-bold text-[#171717] placeholder:text-[#171717]/40 outline-none"
            />
          </div>
        }
      />

      <div className="flex-1 p-8">
        <div className="max-w-[1200px] mx-auto space-y-6">
          
          <div className="bg-amber-50 text-amber-800 p-6 rounded-3xl border border-amber-200 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
               <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-black text-lg text-amber-900">Lacuna Crítica de Backend Documentada</h3>
              <p className="text-sm mt-1 text-amber-800/80 font-medium leading-relaxed">
                Consultas seguras e em massa à tabela <code className="bg-amber-100/50 px-1.5 py-0.5 rounded text-xs font-mono font-bold">auth.users</code> do Supabase requerem acesso administrativo via Edge Function ou Backend com Service Role. 
                Nenhum endpoint está disponível para buscar consumidores (B2C). A tabela de perfis de consumidores também está ausente. 
                Listando abaixo apenas os usuários administrativos expostos publicamente na tabela <code className="bg-amber-100/50 px-1.5 py-0.5 rounded text-xs font-mono font-bold">admin_users</code>.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#171717]/5 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="p-6 border-b border-[#171717]/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                <Shield className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-xl font-black text-[#171717]">Administradores e Curadores ({adminUsers.length})</h3>
            </div>
            
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full p-8">
                  <div className="text-[#171717]/40 font-bold text-sm">Sincronizando banco de dados...</div>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#171717]/5 sticky top-0 z-10 shadow-sm border-b border-[#171717]/5">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#171717]/40">Email (ID)</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#171717]/40">Role</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#171717]/40">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#171717]/5">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-[#171717]/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-[14px] text-[#171717]">{user.email}</div>
                          <div className="text-[11px] text-[#171717]/40 font-mono mt-1 select-all">{user.id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Ativo</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-[#171717]/40 font-bold text-sm">
                          Nenhum usuário correspondente.
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
