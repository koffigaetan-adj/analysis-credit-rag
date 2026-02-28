import { Bell, Lock, User, Building, ShieldCheck, Mail, Save, X, ChevronRight } from 'lucide-react';

export default function Settings() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12 animate-fade-in text-left">
      
      {/* HEADER PRINCIPAL */}
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Paramètres</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Gérez votre compte, votre sécurité et vos préférences d'application.
        </p>
      </div>

      <div className="space-y-16">
        
        {/* SECTION PROFIL : TEXTE À GAUCHE / INPUTS À DROITE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100">Profil</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 pr-4 leading-relaxed">
              Vos informations publiques et l'adresse email utilisée pour les communications officielles.
            </p>
          </div>
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-all overflow-hidden">
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Nom complet</label>
                  <input type="text" defaultValue="Sophie Dubois" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Email</label>
                  <input type="email" defaultValue="sophie@crediro.ai" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION NOTIFICATIONS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100">Préférences</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 pr-4 leading-relaxed">
              Contrôlez les notifications et les rapports que vous recevez.
            </p>
          </div>
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              <div className="p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Alertes d'IA</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              </div>
              <div className="p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Rapports Hebdo</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION SÉCURITÉ & ORGANISATION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100">Accès & Sécurité</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 pr-4 leading-relaxed">
              Sécurisez votre compte et gérez l'affiliation de votre établissement.
            </p>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-4 tracking-tighter">Établissement</h3>
              <p className="text-sm font-bold text-slate-800 dark:text-white mb-2">Banque Centrale de Paris</p>
              <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold uppercase">
                <ShieldCheck className="w-3.5 h-3.5" /> Licence Pro
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-2 tracking-tighter">Mot de passe</h3>
              <button className="flex items-center justify-between w-full text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                Modifier maintenant <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ACTION BAR : FLOTTANTE OU FIXE EN BAS */}
      <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-end items-center gap-4">
        <button className="text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all">
          Annuler
        </button>
        <button className="px-8 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-lg font-bold text-sm shadow-xl shadow-slate-200 dark:shadow-none hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
          <Save className="w-4 h-4" />
          Enregistrer les changements
        </button>
      </div>
    </div>
  );
}