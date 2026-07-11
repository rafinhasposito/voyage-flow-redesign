import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Library, Hotel, Map, Activity, UploadCloud,
  Users, Tag, Star, Globe, ChevronRight, Settings, LogOut,
  Compass, PanelLeftClose, PanelLeftOpen, Utensils, Calendar,
  BarChart2, Brain, Link2, DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Nav item types ───────────────────────────────────────────────────────────
interface NavSection {
  label: string;
  items: NavItem[];
}
interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  soon?: boolean;
}

const navigation: NavSection[] = [
  {
    label: 'Geral',
    items: [
      { name: 'Dashboard',     href: '/admin/dashboard',      icon: LayoutDashboard },
      { name: 'Analytics',     href: '/admin/analytics',      icon: BarChart2,  soon: true },
    ]
  },
  {
    label: 'Conteúdo',
    items: [
      { name: 'Catálogo',      href: '/admin/experiences',             icon: Library },
      { name: 'Hospedagens',   href: '/admin/experiences?type=Hotel',  icon: Hotel },
      { name: 'Restaurantes',  href: '/admin/experiences?type=restaurant', icon: Utensils },
      { name: 'Eventos',       href: '/admin/experiences?type=event',  icon: Calendar },
      { name: 'Destinos',      href: '/admin/destinations',            icon: Globe },
      { name: 'Importar URL',  href: '/admin/import',                  icon: UploadCloud },
    ]
  },
  {
    label: 'Inteligência',
    items: [
      { name: 'Qualidade',     href: '/admin/quality',        icon: Activity },
      { name: 'Tags',          href: '/admin/tags',           icon: Tag,        soon: true },
      { name: 'Personas',      href: '/admin/personas',       icon: Brain,      soon: true },
    ]
  },
  {
    label: 'Revenue',
    items: [
      { name: 'Afiliados',     href: '/admin/pricing',        icon: Link2 },
      { name: 'Destaques',     href: '/admin/featured',       icon: Star },
      { name: 'Preços',        href: '/admin/pricing',        icon: DollarSign, soon: true },
    ]
  },
  {
    label: 'Controle',
    items: [
      { name: 'Usuários',      href: '/admin/users',          icon: Users },
    ]
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    const [path, search] = href.split('?');
    if (location.pathname !== path) return false;
    if (href === '/admin/dashboard' && location.pathname !== '/admin/dashboard') return false;
    if (search) {
      return location.search.includes(search);
    }
    // Se não tem search, só é ativo se a rota não tiver um '?type=' que pertença a outro item
    return !location.search.includes('type=');
  };
  return (
    <div className="flex h-screen" style={{ background: '#F0F2F5' }}>
      
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'flex flex-col h-full transition-all duration-300 ease-in-out flex-shrink-0',
          collapsed ? 'w-[68px]' : 'w-[220px]'
        )}
        style={{ background: 'transparent' }}
      >
        {/* Logo */}
        <Link 
          to="/admin/dashboard"
          className={cn(
            'flex items-center h-16 px-4 flex-shrink-0 hover:opacity-85 transition-opacity',
            collapsed ? 'justify-center' : 'gap-2.5'
          )}
        >
          <div className="w-8 h-8 rounded-[14px] flex items-center justify-center flex-shrink-0"
            style={{ background: '#E2F18A' }}>
            <Compass className="w-4 h-4 text-black" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-black text-[#0F1117] text-sm tracking-tight leading-none">Voyage Flow</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">CMS</p>
            </div>
          )}
        </Link>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-5 overflow-y-auto">
          {navigation.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 px-3 mb-1.5">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <NavLink
                      key={item.name}
                      to={item.soon ? '#' : item.href}
                      title={collapsed ? item.name : undefined}
                      onClick={item.soon ? (e) => e.preventDefault() : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-full transition-all duration-200 font-semibold text-sm relative group',
                        collapsed ? 'px-0 py-2.5 justify-center' : 'px-3.5 py-2.5',
                        active
                          ? 'text-[#0F1117]'
                          : 'text-slate-500 hover:text-[#0F1117]',
                        item.soon && 'opacity-50 cursor-not-allowed'
                      )}
                      style={active ? { background: '#E2F18A' } : {}}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                      {!collapsed && (
                        <span className="flex-1 truncate">{item.name}</span>
                      )}
                      {!collapsed && item.soon && (
                        <span className="text-[9px] font-black bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full">
                          SOON
                        </span>
                      )}
                      {collapsed && item.soon && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-slate-300 rounded-full" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={cn('px-3 pb-5 space-y-0.5', collapsed && 'flex flex-col items-center')}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-all text-sm font-semibold w-full"
            title={collapsed ? 'Expandir' : 'Recolher'}
          >
            {collapsed
              ? <PanelLeftOpen className="w-4 h-4 flex-shrink-0" />
              : <><PanelLeftClose className="w-4 h-4 flex-shrink-0" /><span>Recolher</span></>
            }
          </button>
          <Link
            to="/"
            className={cn(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-all text-sm font-semibold',
              collapsed && 'justify-center'
            )}
            title={collapsed ? 'Sair do Admin' : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Sair</span>}
          </Link>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex items-center px-6 justify-between flex-shrink-0 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-300">/</span>
            <span className="text-sm font-bold text-[#0F1117] capitalize">
              {location.pathname.split('/admin/')[1]?.split('/')[0] || 'dashboard'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-xs font-bold text-slate-400 hover:text-[#0F1117] transition-colors"
            >
              Ver Site →
            </Link>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-black"
              style={{ background: '#E2F18A' }}>
              RG
            </div>
          </div>
        </header>

        {/* Page content — sem wrapper extra */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
