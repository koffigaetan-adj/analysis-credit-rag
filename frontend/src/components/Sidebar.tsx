import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  ListTodo,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  LifeBuoy,
  ShieldCheck,
  X,
  MessageSquare,
  Activity
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isOpenMobile?: boolean;
  setIsOpenMobile?: (value: boolean) => void;
}

const menuItems = [
  { path: '/dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
  { path: '/new', label: 'Nouvelle Analyse', icon: FileText },
  { path: '/history', label: 'Historique', icon: ListTodo },
  { path: '/prediction', label: 'Prédiction', icon: Activity },
  { path: '/chat', label: 'Assistant Chat', icon: MessageSquare },
  { path: '/team', label: 'Équipe', icon: Users },
];

// Tooltip réutilisable — s'affiche uniquement en desktop réduit
function Tooltip({ label }: { label: string }) {
  return (
    <div className="
      hidden lg:block
      absolute left-full top-1/2 -translate-y-1/2 ml-3
      px-3 py-1.5
      bg-slate-800 text-white text-xs font-medium rounded-lg
      shadow-xl border border-slate-700
      whitespace-nowrap pointer-events-none
      opacity-0 group-hover/tooltip:opacity-100
      translate-x-1 group-hover/tooltip:translate-x-0
      transition-all duration-150 z-[100]
    ">
      {label}
      <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
    </div>
  );
}

// Lien de navigation principal
function NavItem({
  to, icon: Icon, label, isActive, isCollapsed, onClick,
}: {
  to: string; icon: React.ElementType; label: string;
  isActive: boolean; isCollapsed: boolean; onClick?: () => void;
}) {
  return (
    <div className="relative group/tooltip">
      <Link
        to={to}
        onClick={onClick}
        className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group
          ${isActive
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 font-semibold'
            : 'text-slate-400 hover:bg-slate-900 hover:text-white font-medium'}
          ${isCollapsed ? 'lg:justify-center' : ''}
        `}
      >
        <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'group-hover:text-blue-400'}`} />
        {/* Label : toujours visible sur mobile, caché en desktop réduit */}
        <span className={`text-sm tracking-tight whitespace-nowrap animate-in fade-in slide-in-from-left-2
          ${isCollapsed ? 'lg:hidden' : ''}
        `}>
          {label}
        </span>
      </Link>
      {isCollapsed && <Tooltip label={label} />}
    </div>
  );
}

// Lien de la section basse
function BottomNavItem({
  to, icon: Icon, label, isActive, isCollapsed, onClick,
}: {
  to: string; icon: React.ElementType; label: string;
  isActive: boolean; isCollapsed: boolean; onClick?: () => void;
}) {
  return (
    <div className="relative group/tooltip">
      <Link
        to={to}
        onClick={onClick}
        className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all font-medium
          ${isActive ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}
          ${isCollapsed ? 'lg:justify-center' : ''}
        `}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <span className={`text-sm whitespace-nowrap ${isCollapsed ? 'lg:hidden' : ''}`}>
          {label}
        </span>
      </Link>
      {isCollapsed && <Tooltip label={label} />}
    </div>
  );
}

export default function Sidebar({ isCollapsed, setIsCollapsed, isOpenMobile = false, setIsOpenMobile }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const closeMobileSidebar = () => setIsOpenMobile && setIsOpenMobile(false);

  return (
    <>
      {/* OVERLAY MOBILE */}
      {isOpenMobile && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={closeMobileSidebar}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen bg-slate-950 border-r border-slate-900 transition-all duration-300 ease-in-out z-50 flex flex-col
          lg:translate-x-0 ${isOpenMobile ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'lg:w-20 w-64' : 'w-64'}`}
      >
        {/* BOUTON FERMER MOBILE */}
        <button
          onClick={closeMobileSidebar}
          className="lg:hidden absolute top-6 right-4 p-2 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* BOUTON TOGGLE DESKTOP */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-10 w-6 h-6 bg-blue-600 text-white rounded-full items-center justify-center shadow-lg hover:bg-blue-500 transition-colors z-[60]"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* LOGO */}
        <div className={`p-6 mb-4 flex items-center gap-3 ${isCollapsed ? 'lg:justify-center' : ''}`}>
          {/* Desktop réduit : icône seule */}
          <div className={`${isCollapsed ? 'hidden lg:flex' : 'hidden'} w-10 h-10 items-center justify-center shrink-0`}>
            <img src="/logo_kais.svg" alt="Kaïs Logo" className="w-8 h-8 object-contain" />
          </div>
          {/* Logo complet : desktop étendu + toujours sur mobile */}
          <div className={`animate-in fade-in duration-500 flex justify-left w-full pl-4
            ${isCollapsed ? 'lg:hidden' : ''}
          `}>
            <img src="/Logocomplet.svg" alt="Kaïs Analytics" className="h-12 object-contain" />
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => {
            if (item.path === '/team' && user?.role === 'ANALYST') return null;
            return (
              <NavItem
                key={item.path}
                to={item.path}
                icon={item.icon}
                label={item.label}
                isActive={location.pathname === item.path}
                isCollapsed={isCollapsed}
                onClick={closeMobileSidebar}
              />
            );
          })}
        </nav>

        {/* SECTION BASSE */}
        <div className="px-4 pb-6 space-y-1">
          <div className="h-px bg-slate-900 mb-4 mx-2" />

          {/* DARK MODE avec tooltip */}
          <div className="relative group/tooltip">
            <button
              onClick={() => setIsDark(!isDark)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-slate-400 hover:bg-slate-900 hover:text-white font-medium
                ${isCollapsed ? 'lg:justify-center' : ''}
              `}
            >
              {isDark ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
              <span className={`text-sm whitespace-nowrap ${isCollapsed ? 'lg:hidden' : ''}`}>
                {isDark ? 'Mode Clair' : 'Mode Sombre'}
              </span>
            </button>
            {isCollapsed && <Tooltip label={isDark ? 'Mode Clair' : 'Mode Sombre'} />}
          </div>

          <BottomNavItem
            to="/settings" icon={Settings} label="Paramètres"
            isActive={location.pathname === '/settings'}
            isCollapsed={isCollapsed} onClick={closeMobileSidebar}
          />
          <BottomNavItem
            to="/help" icon={LifeBuoy} label="Centre d'aide"
            isActive={location.pathname === '/help'}
            isCollapsed={isCollapsed} onClick={closeMobileSidebar}
          />
          <BottomNavItem
            to="/privacy" icon={ShieldCheck} label="Confidentialité & RGPD"
            isActive={location.pathname === '/privacy'}
            isCollapsed={isCollapsed} onClick={closeMobileSidebar}
          />

          {/* DÉCONNEXION — carte visible sur mobile + desktop étendu */}
          <div className={`mt-6 p-4 bg-slate-900/50 rounded-[24px] border border-slate-900 animate-in zoom-in-95
            ${isCollapsed ? 'lg:hidden' : ''}
          `}>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="flex items-center gap-2 text-rose-500 text-xs font-bold hover:text-rose-400 transition-colors w-full"
            >
              <LogOut className="w-4 h-4" /> Déconnexion
            </button>
          </div>

          {/* DÉCONNEXION — icône seule en desktop réduit avec tooltip */}
          {isCollapsed && (
            <div className="hidden lg:block relative group/tooltip mt-2">
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="w-full flex justify-center px-4 py-3 rounded-2xl transition-all text-rose-500 hover:bg-slate-900 hover:text-rose-400"
              >
                <LogOut className="w-5 h-5 shrink-0" />
              </button>
              <div className="
                absolute left-full top-1/2 -translate-y-1/2 ml-3
                px-3 py-1.5
                bg-slate-800 text-rose-400 text-xs font-medium rounded-lg
                shadow-xl border border-slate-700
                whitespace-nowrap pointer-events-none
                opacity-0 group-hover/tooltip:opacity-100
                translate-x-1 group-hover/tooltip:translate-x-0
                transition-all duration-150 z-[100]
              ">
                Déconnexion
                <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}