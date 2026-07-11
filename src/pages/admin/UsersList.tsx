import React, { useState } from 'react';
import { Search, Edit2, Trash2, Mail, Calendar, Map, CheckCircle2, XCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Define types for our mock data
interface Itinerary {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'draft';
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
  status: 'active' | 'inactive';
  itineraries: Itinerary[];
}

const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Eleanor Shellstrop',
    email: 'eleanor@example.com',
    avatar: 'https://i.pravatar.cc/150?u=1',
    joinDate: '2023-11-15',
    status: 'active',
    itineraries: [
      { id: 'i1', destination: 'Paris, France', startDate: '2024-05-10', endDate: '2024-05-20', status: 'completed' },
      { id: 'i2', destination: 'Tokyo, Japan', startDate: '2024-10-01', endDate: '2024-10-15', status: 'active' }
    ]
  },
  {
    id: '2',
    name: 'Chidi Anagonye',
    email: 'chidi@example.com',
    avatar: 'https://i.pravatar.cc/150?u=2',
    joinDate: '2024-01-10',
    status: 'active',
    itineraries: [
      { id: 'i3', destination: 'Athens, Greece', startDate: '2024-08-12', endDate: '2024-08-26', status: 'draft' }
    ]
  },
  {
    id: '3',
    name: 'Tahani Al-Jamil',
    email: 'tahani@example.com',
    avatar: 'https://i.pravatar.cc/150?u=3',
    joinDate: '2023-09-05',
    status: 'inactive',
    itineraries: []
  },
  {
    id: '4',
    name: 'Jason Mendoza',
    email: 'jason@example.com',
    avatar: 'https://i.pravatar.cc/150?u=4',
    joinDate: '2024-02-28',
    status: 'active',
    itineraries: [
      { id: 'i4', destination: 'Jacksonville, FL', startDate: '2024-07-04', endDate: '2024-07-10', status: 'active' },
      { id: 'i5', destination: 'Miami, FL', startDate: '2024-12-25', endDate: '2024-12-31', status: 'draft' }
    ]
  }
];

export default function UsersList() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = MOCK_USERS.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-vf-bg overflow-hidden">
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-vf-border z-10 shrink-0">
        <div>
          <h1 className="text-lg font-black text-vf-black tracking-tight flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" /> Gestão de Usuários
          </h1>
          <p className="text-[11px] text-vf-text-3 font-semibold">Gerencie os usuários da plataforma e seus roteiros.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-vf-text-3 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              type="text" 
              placeholder="Buscar por nome ou email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64 h-9 text-[13px]"
            />
          </div>
          <Button variant="lime" size="sm">
            Adicionar Usuário
          </Button>
        </div>
      </div>

      {/* ── Table / Grid ── */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[1200px] mx-auto bg-white rounded-xl border border-vf-border shadow-vf-sm overflow-hidden flex flex-col">
          <table className="w-full text-left border-collapse">
            <thead className="bg-vf-muted sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-vf-text-3 w-10">Avatar</th>
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-vf-text-3">Usuário</th>
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-vf-text-3">Status</th>
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-vf-text-3">Data de Entrada</th>
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-vf-text-3">Roteiros</th>
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-vf-text-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vf-border">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-vf-muted/50 transition-colors">
                  <td className="px-5 py-3">
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-vf-border" />
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-bold text-[13px] text-vf-black">{user.name}</div>
                    <div className="text-[11px] text-vf-text-3">{user.email}</div>
                  </td>
                  <td className="px-5 py-3">
                    {user.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100">
                        <XCircle className="w-3.5 h-3.5" /> Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-[12px] font-semibold text-vf-text-2">
                    {new Date(user.joinDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[12px] font-bold text-vf-black bg-vf-muted px-2 py-0.5 rounded-md">
                      {user.itineraries.length} Roteiros
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="w-8 h-8 text-vf-text-3 hover:text-vf-black">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8 text-vf-text-3 hover:text-rose-600 hover:bg-rose-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-vf-text-3 text-sm">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
