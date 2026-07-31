import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Compass, MapPin, Calendar, Heart, Bookmark, FolderCheck,
  FileText, Map, Sparkles, Settings, LogOut, ChevronRight, User, Swords
} from 'lucide-react';
import { TripSpaceProfile } from '@/types/tripSpace.types';
import { useConsumerAuth } from '@/contexts/ConsumerAuthProvider';

interface TripSpaceSidebarProps {
  profile: TripSpaceProfile;
  tripId: string;
}

export function TripSpaceSidebar({ profile, tripId }: TripSpaceSidebarProps) {
  const { signOut } = useConsumerAuth();
  const navigate = useNavigate();

  const location = useLocation();

  const menuItems = [
    { id: 'minha_viagem', label: 'Minha viagem', icon: Compass, to: '/minhas-viagens', isHash: false },
    { id: 'roteiro', label: 'Roteiro', icon: Calendar, to: `#roteiro`, isHash: true },
    { id: 'mapa', label: 'Mapa', icon: Map, to: `#mapa`, isHash: true },
    { id: 'preparativos', label: 'Preparativos', icon: FolderCheck, to: `#preparativos`, isHash: true },
    { id: 'documentos', label: 'Documentos', icon: FileText, to: `#documentos`, isHash: true },
    { id: 'campanha', label: 'Campanha', icon: Swords, to: `#campanha`, isHash: true, disabled: true },
    { id: 'ideias', label: 'Ideias', icon: Sparkles, to: `#ideias`, isHash: true, disabled: true },
    { id: 'reservas', label: 'Reservas', icon: Bookmark, to: `#reservas`, isHash: true, disabled: true },
    { id: 'ia_concierge', label: 'IA Concierge', icon: Sparkles, to: `#concierge`, isHash: true, disabled: true },
  ];

  const currentHash = location.hash || '#roteiro';

  return (
    <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col justify-between p-6 shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto">
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
            const isActive = item.isHash ? currentHash === item.to : location.pathname === item.to;

            if (item.isHash) {
              if (item.disabled) {
                return (
                  <div
                    key={item.id}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-slate-300 cursor-not-allowed"
                    title="Em breve"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-slate-300" />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">Breve</span>
                  </div>
                );
              }

              return (
                <a
                  key={item.id}
                  href={item.to}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                    isActive
                      ? 'bg-lime-300 text-slate-950 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </a>
              );
            }

            return (
              <Link
                key={item.id}
                to={item.to}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                  isActive
                    ? 'bg-lime-300 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-6 border-t border-slate-100 space-y-4">

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
