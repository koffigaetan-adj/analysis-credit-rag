import { Bell, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg border-b border-slate-100 dark:border-slate-800 px-8 py-3 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* ESPACE GAUCHE (Vide pour le moment) */}
        <div className="flex items-center gap-2">
        </div>

        {/* ACTIONS DROITE */}
        <div className="flex items-center gap-6">

          {/* NOTIFICATIONS */}
          <button className="relative p-2.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-2xl transition-all duration-300 group">
            <Bell className="w-5 h-5 transition-transform group-hover:rotate-12" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
          </button>

          {/* PROFIL UTILISATEUR */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 p-1.5 pl-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-[20px] border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all duration-300"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight transition-colors">Sophie Dubois</p>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter transition-colors">Administrateur</p>
              </div>

              <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden transition-all">
                <span className="text-slate-600 dark:text-slate-300 font-bold text-xs uppercase">SD</span>
              </div>

              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* DROPDOWN MENU */}
            {showDropdown && (
              <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-2 mb-2 border-b border-slate-50 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compte</p>
                </div>

                <a href="#" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition-colors">
                  Mon profil
                </a>
                <a href="#" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition-colors">
                  Paramètres
                </a>

                <div className="my-2 border-t border-slate-50 dark:border-slate-800"></div>

                <a
                  href="/login"
                  className="flex items-center px-4 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                >
                  Déconnexion
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}