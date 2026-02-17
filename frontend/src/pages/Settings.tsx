import { Bell, Lock, User, Building, ShieldCheck, Mail, Globe, Save, X } from 'lucide-react';

export default function Settings() {
  return (
    <div className="max-w-4xl space-y-8 animate-fade-in text-left pb-20">
      {/* HEADER ÉPURÉ */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Paramètres</h1>
        <p className="text-slate-500 text-sm font-medium">Configurez votre environnement de travail et vos préférences de sécurité.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* SECTION PROFIL */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm">
                <User className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Profil Personnel</h2>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nom complet</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="text"
                  defaultValue="Sophie Dubois"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-semibold text-slate-700"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email Professionnel</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="email"
                  defaultValue="sophie.dubois@crediro.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-semibold text-slate-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION NOTIFICATIONS */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm">
                <Bell className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Préférences de Notification</h2>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="space-y-1">
                <p className="font-medium text-slate-700">Alertes d'analyse IA</p>
                <p className="text-xs text-slate-400 font-medium">Recevoir un email dès qu'un scoring est généré avec succès.</p>
              </div>
              <input type="checkbox" defaultChecked className="w-6 h-6 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer" />
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="space-y-1">
                <p className="font-medium text-slate-700">Rapports de Performance</p>
                <p className="text-xs text-slate-400 font-medium">Résumé hebdomadaire de la santé financière du portefeuille.</p>
              </div>
              <input type="checkbox" defaultChecked className="w-6 h-6 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer" />
            </div>
          </div>
        </div>

        {/* SECTION SÉCURITÉ & ORGANISATION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center gap-3">
                    <Lock className="w-5 h-5 text-rose-500" />
                    <h2 className="text-lg font-bold text-slate-800">Sécurité</h2>
                </div>
                <div className="p-8 flex-1 space-y-6">
                    <button className="w-full py-3 px-4 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">
                        Changer le mot de passe
                    </button>
                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <p className="text-sm font-medium text-slate-700">Double Authentification (2FA)</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Sécurité renforcée active</p>
                        </div>
                        <input type="checkbox" className="w-5 h-5 rounded border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center gap-3">
                    <Building className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-lg font-bold text-slate-800">Organisation</h2>
                </div>
                <div className="p-8 flex-1 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Établissement</label>
                        <input
                            type="text"
                            defaultValue="Banque Centrale de Paris"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-semibold text-slate-700"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-medium uppercase tracking-widest">
                        <ShieldCheck className="w-4 h-4" />
                        Licence Entreprise Active
                    </div>
                </div>
            </div>
        </div>

      </div>

      {/* BOUTONS D'ACTION */}
      <div className="flex justify-end gap-4 pt-4">
        <button className="px-8 py-3.5 rounded-2xl text-slate-500 font-bold text-sm hover:bg-slate-100 transition-all flex items-center gap-2">
          <X className="w-4 h-4" /> Annuler
        </button>
        <button className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95">
          <Save className="w-4 h-4" /> Enregistrer les modifications
        </button>
      </div>
    </div>
  );
}