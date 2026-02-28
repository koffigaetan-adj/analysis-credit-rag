import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  TrendingUp,
  ListTodo,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const menuItems = [
  { path: '/dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
  { path: '/new', label: 'Nouvelle Analyse', icon: FileText },
  { path: '/history', label: 'Historique', icon: ListTodo },
  { path: '/team', label: 'Équipe', icon: Users },
];

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Initialisation du thème
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark');
  });

  // Effet pour appliquer le thème au document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-slate-950 border-r border-slate-900 transition-all duration-300 ease-in-out z-50 flex flex-col ${isCollapsed ? 'w-20' : 'w-64'
        }`}
    >
      {/* BOUTON TOGGLE (RÉDUIRE/AGRANDIR) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-500 transition-colors z-[60]"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* LOGO SECTION */}
      <div className={`p-6 mb-4 flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/20">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        {!isCollapsed && (
          <div className="animate-in fade-in duration-500">
            <h1 className="text-white font-bold text-lg tracking-tight leading-none italic">Flux<span className="text-blue-400">ia</span></h1>
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1">Analytics</p>
          </div>
        )}
      </div>

      {/* NAVIGATION PRINCIPALE */}
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group ${isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 font-semibold'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white font-medium'
                } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'group-hover:text-blue-400'}`} />
              {!isCollapsed && (
                <span className="text-sm tracking-tight animate-in fade-in slide-in-from-left-2">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* SECTION BASSE */}
      <div className="px-4 pb-6 space-y-1">
        <div className="h-px bg-slate-900 mb-4 mx-2" />

        {/* BOUTON DARK MODE TOGGLE */}
        <button
          onClick={() => setIsDark(!isDark)}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-slate-400 hover:bg-slate-900 hover:text-white font-medium ${isCollapsed ? 'justify-center' : ''
            }`}
        >
          {isDark ? (
            <Sun className="w-5 h-5 shrink-0 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 shrink-0" />
          )}
          {!isCollapsed && <span className="text-sm">{isDark ? 'Mode Clair' : 'Mode Sombre'}</span>}
        </button>

        <Link
          to="/settings"
          className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-slate-400 hover:bg-slate-900 hover:text-white font-medium ${isCollapsed ? 'justify-center' : ''
            } ${location.pathname === '/settings' ? 'bg-slate-900 text-white' : ''}`}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="text-sm">Paramètres</span>}
        </Link>

        {/* DÉCONNEXION */}
        {!isCollapsed && (
          <div className="mt-6 p-4 bg-slate-900/50 rounded-[24px] border border-slate-900 animate-in zoom-in-95">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 text-rose-500 text-xs font-bold hover:text-rose-400 transition-colors w-full"
            >
              <LogOut className="w-4 h-4" /> Déconnexion
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}