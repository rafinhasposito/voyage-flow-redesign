import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Compass, Map, LayoutDashboard, Settings } from "lucide-react";

export default function AdminLayout() {
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Experiências", path: "/admin/experiences", icon: Compass },
    { name: "Destinos", path: "/admin/destinations", icon: Map },
    { name: "Configurações (Engine)", path: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1E21] flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#EAE6DF] bg-white hidden md:flex flex-col">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 text-[#0D0E10]">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-[#F3EFEA]">
              <Compass className="h-4 w-4 text-[#C5A85C]" strokeWidth={2} />
            </span>
            <span className="font-serif text-lg font-medium tracking-tight">
              Concierge Admin
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#F3EFEA] text-[#0D0E10]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[#0D0E10]"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-[#C5A85C]" : "text-slate-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#EAE6DF]">
          <Link to="/app/board" className="text-xs text-slate-500 hover:text-[#0D0E10] font-medium flex items-center gap-2">
             Voltar para o App
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-[#EAE6DF] bg-white flex items-center px-6 md:hidden">
          <span className="font-serif text-lg font-medium tracking-tight">
            Concierge Admin
          </span>
        </header>
        <div className="flex-1 overflow-auto p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
