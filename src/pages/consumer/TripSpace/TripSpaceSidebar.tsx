import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Compass, MapPin, Calendar, Heart, Bookmark, FolderCheck, 
  FileText, Map, Sparkles, Settings, LogOut, ChevronRight, User
} from 'lucide-react';
import { TripSpaceProfile } from '@/types/tripSpace.types';
import { useConsumerAuth } from '@/contexts/ConsumerAuthProvider';

interface TripSpaceSidebarProps {
  profile: TripSpaceProfile;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TripSpaceSidebar({ profile, activeTab, onTabChange }: TripSpaceSidebarProps) {
  const { signOut } = useConsumerAuth();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'minha_viagem', label: 'Minha viagem', icon: Compass },
    { id: 'roteiro', label: 'Roteiro', icon: Calendar },
    { id: 'ideias', label: 'Ideias', icon: Heart },
    { id: 'reservas', label: 'Reservas', icon: Bookmark },
    { id: 'preparativos', label: 'Preparativos', icon: FolderCheck },
    { id: 'documentos', label: 'Documentos', icon: FileText },
    { id: 'mapa', label: 'Mapa', icon: Map },
    { id: 'concierge', label: 'IA Concierge', icon: Sparkles },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-6 shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto">
      <div>
        {/* Brand */}
        <Link to="/minhas-viagens" className="flex items-center gap-2.5 mb-8 group">
          <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5 text-lime-400" />
          </div>
          <span className="font-extrabold text-xl text-slate-900 tracking-tight">Voyage Flow</span>
        </Link>

        {/* Menu Nav */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                  isActive
                    ? 'bg-lime-300 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-6 border-t border-slate-100 space-y-4">
        {/* Voyage Premium Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-lime-400/10 rounded-full blur-xl" />
          <div className="flex items-center gap-2 text-lime-400 font-extrabold text-xs mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Voyage Premium</span>
          </div>
          <p className="text-xs text-slate-300 mb-3">Concierge 24/7 e experiências exclusivas.</p>
          <button className="bg-lime-400 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-lime-500 transition-colors w-full">
            Saiba mais
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 shrink-0 overflow-hidden">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-slate-500" />
              )}
            </div>
            <div className="truncate">
              <p className="text-xs font-extrabold text-slate-900 truncate">{profile.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{profile.email || 'Conta Gratuita'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button 
              onClick={() => navigate('/minhas-viagens')}
              title="Minhas viagens"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={signOut}
              title="Sair"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
