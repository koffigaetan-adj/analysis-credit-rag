import { Bell, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-3 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* TITRE OU LOGO (Puisque la barre de recherche est enlevée) */}
        <div className="flex items-center gap-2">
          
          
        </div>

        {/* ACTIONS DROITE */}
        <div className="flex items-center gap-6">
          
          {/* NOTIFICATIONS */}
          <button className="relative p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all duration-300 group">
            <Bell className="w-5 h-5 transition-transform group-hover:rotate-12" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>

          {/* PROFIL UTILISATEUR */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 p-1.5 pl-3 hover:bg-slate-50 rounded-[20px] border border-transparent hover:border-slate-100 transition-all duration-300"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-tight">Sophie Dubois</p>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">Administrateur</p>
              </div>

              <div className="w-9 h-9 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden group-hover:shadow-md transition-all">
                <span className="text-slate-600 font-bold text-xs uppercase">SD</span>
              </div>
              
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* DROPDOWN MENU */}
            {showDropdown && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-2 mb-2 border-b border-slate-50">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compte</p>
                </div>
                
                <a href="#" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                  Mon profil
                </a>
                <a href="#" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                  Paramètres
                </a>
                
                <div className="my-2 border-t border-slate-50"></div>
                
                <a
                  href="/login"
                  className="flex items-center px-4 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors"
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