import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Library, Hotel, Map, Activity, UploadCloud,
  Users, Tag, Star, Globe, Settings, LogOut,
  Compass, PanelLeftClose, PanelLeftOpen, Utensils, Calendar,
  BarChart2, Brain, Link2, DollarSign, XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminAuth } from '@/hooks/useAdminAuth';

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
      { name: 'Analytics',     href: '/admin/analytics',      icon: BarChart2 },
    ]
  },
  {
    label: 'Conteúdo',
    items: [
      { name: 'Catálogo',      href: '/admin/experiences',             icon: Library },
      { name: 'Hospedagens',   href: '/admin/lodgings',                icon: Hotel },
      { name: 'Restaurantes',  href: '/admin/restaurants',             icon: Utensils },
      { name: 'Eventos',       href: '/admin/events',                  icon: Calendar },
      { name: 'Destinos',      href: '/admin/destinations',            icon: Globe },
      { name: 'Importar URL',  href: '/admin/import',                  icon: UploadCloud },
    ]
  },
  {
    label: 'Inteligência',
    items: [
      { name: 'Qualidade',     href: '/admin/quality',        icon: Activity },
      { name: 'IA Concierge',  href: '/admin/ia',             icon: Brain },
      { name: 'Tags',          href: '/admin/tags',           icon: Tag },
      { name: 'Personas',      href: '/admin/personas',       icon: Users },
      { name: 'Regras do Motor',href: '/admin/rules',         icon: Settings },
    ]
  },
  {
    label: 'Receita',
    items: [
      { name: 'Parceiros',     href: '/admin/partners',       icon: Briefcase },
      { name: 'Afiliados',     href: '/admin/pricing',        icon: Percent },
      { name: 'Vendas',        href: '/admin/sales',          icon: CreditCard },
    ]
  },
  {
    label: 'Controle',
    items: [
      { name: 'Usuários',      href: '/admin/users',          icon: Users },
      { name: 'Configurações', href: '/admin/settings',       icon: Settings },
    ]
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { signOut, authError, clearError } = useAdminAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    const success = await signOut();
    if (!success) {
      setIsSigningOut(false);
    }
    // Se sucesso, a sessão fica null e o ProtectedAdminRoute redireciona.
  };

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
    <div className="flex h-screen bg-[#F7F7F2] font-sans text-[#171717]">
      
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'flex flex-col h-full bg-white transition-all duration-300 ease-in-out flex-shrink-0 border-r border-[#171717]/10 z-20 shadow-sm relative',
          collapsed ? 'w-[72px]' : 'w-[240px]'
        )}
      >
        {/* Logo */}
        <Link 
          to="/admin/dashboard"
          className={cn(
            'flex items-center h-16 px-4 flex-shrink-0 hover:opacity-85 transition-opacity border-b border-[#171717]/5',
            collapsed ? 'justify-center' : 'gap-3'
          )}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#171717] shadow-sm">
            <Compass className="w-4 h-4 text-[#D7F24B]" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-black text-[#171717] text-[15px] tracking-tight leading-none">Voyage Flow</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#171717]/50 mt-1">Admin</p>
            </div>
          )}
        </Link>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {navigation.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#171717]/40 px-3 mb-2">
                  {section.label}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <NavLink
                      key={item.name}
                      to={item.soon ? '#' : item.href}
                      title={collapsed ? item.name : undefined}
                      onClick={item.soon ? (e) => e.preventDefault() : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-xl transition-all duration-200 font-semibold text-[13px] relative group border border-transparent',
                        collapsed ? 'px-0 py-3 justify-center' : 'px-3 py-2.5',
                        active
                          ? 'text-[#171717] bg-[#D7F24B] shadow-sm border-[#171717]/10'
                          : 'text-[#171717]/60 hover:text-[#171717] hover:bg-[#171717]/5',
                        item.soon && 'opacity-50 cursor-not-allowed hover:bg-transparent'
                      )}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" strokeWidth={active ? 2.5 : 2} />
                      {!collapsed && (
                        <span className="flex-1 truncate">{item.name}</span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={cn('p-4 border-t border-[#171717]/10 space-y-2 bg-[#F7F7F2]/50', collapsed && 'flex flex-col items-center p-3')}>
          {authError && !collapsed && (
            <div className="flex items-center justify-between bg-red-50 text-red-600 text-[11px] font-bold p-2 mb-2 rounded-lg border border-red-100">
              <span className="flex-1">{authError}</span>
              <button onClick={clearError} className="p-1 hover:bg-red-100 rounded-md">
                <XCircle className="w-3 h-3" />
              </button>
            </div>
          )}

          {!collapsed && (
             <div className="flex items-center gap-3 mb-2 px-2">
                <div className="w-8 h-8 rounded-full bg-[#BDF4D6] flex items-center justify-center text-[10px] font-black text-[#171717] border border-[#171717]/10 shadow-sm shrink-0">
                  ADM
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-[#171717] truncate">Administrador</p>
                  <p className="text-[10px] text-[#171717]/50 truncate">admin@voyageflow.com</p>
                </div>
             </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-[#171717]/50 hover:text-[#171717] hover:bg-white transition-all text-[12px] font-semibold w-full shadow-sm border border-transparent hover:border-[#171717]/10"
            title={collapsed ? 'Expandir' : 'Recolher'}
          >
            {collapsed
              ? <PanelLeftOpen className="w-4 h-4 flex-shrink-0" />
              : <><PanelLeftClose className="w-4 h-4 flex-shrink-0" /><span>Recolher Menu</span></>
            }
          </button>
          
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-[#171717]/50 hover:text-red-600 hover:bg-red-50 transition-all text-[12px] font-semibold w-full border border-transparent hover:border-red-100',
              collapsed && 'justify-center',
              isSigningOut && 'opacity-50 cursor-not-allowed'
            )}
            title={collapsed ? 'Sair do Admin' : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>{isSigningOut ? 'Saindo...' : 'Sair da Conta'}</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10">
        {/* Page content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
