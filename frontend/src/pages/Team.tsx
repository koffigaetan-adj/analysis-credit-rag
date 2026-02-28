import { UserPlus, Mail, Shield, User, Trash2, Edit3, Search } from 'lucide-react';
import { mockTeamMembers } from '../mockData';
import { getRoleLabel } from '../utils';

export default function Team() {
  return (
    <div className="space-y-6 animate-fade-in text-left pb-20">
      {/* HEADER SIMPLE & PRO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-slate-800 dark:text-slate-100 tracking-tight transition-colors">
            Liste de <span className="font-semibold text-slate-900 dark:text-white">l'équipe</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Gérez les accès et les collaborateurs de votre instance Fluxia</p>
        </div>
        
        <button className="px-5 py-2.5 bg-blue-600 dark:bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 dark:hover:bg-blue-500 shadow-lg shadow-blue-100 dark:shadow-blue-900/20 transition-all flex items-center gap-2 active:scale-95">
          <UserPlus className="w-4 h-4" />
          Inviter un membre
        </button>
      </div>

      {/* STATS SIMPLES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Membres Actifs", value: mockTeamMembers.filter(m => m.status === 'active').length, icon: <User className="w-5 h-5" />, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Administrateurs", value: mockTeamMembers.filter(m => m.role === 'admin').length, icon: <Shield className="w-5 h-5" />, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Analystes", value: mockTeamMembers.filter(m => m.role === 'analyst').length, icon: <Edit3 className="w-5 h-5" />, color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-800/50" }
        ].map((stat, i) => (
          <div 
            key={i} 
            className="bg-white dark:bg-slate-900 rounded-[24px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all duration-300 hover:shadow-xl dark:hover:shadow-blue-900/10 hover:-translate-y-1"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-inner`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-0.5">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* TABLEAU PROPRE & LISIBLE */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-950/30 transition-colors">
            <div className="relative w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600 transition-colors group-focus-within:text-blue-500" />
                <input 
                  type="text" 
                  placeholder="Rechercher un membre..." 
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-slate-200 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600" 
                />
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Membre</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Rôle</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {mockTeamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-default">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-blue-500 font-bold text-xs uppercase">
                          {member.name.split(' ').map((n) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{member.name}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {member.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-transparent dark:border-blue-800">
                      {getRoleLabel(member.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                        <span className={`text-xs font-medium ${member.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`}>
                            {member.status === 'active' ? 'Actif' : 'Inactif'}
                        </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm rounded-lg text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all">
                            <Edit3 className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-500 transition-all">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}