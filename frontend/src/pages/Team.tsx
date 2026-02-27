import { UserPlus, Mail, Shield, User, Trash2, Edit3, Search } from 'lucide-react';
import { mockTeamMembers } from '../mockData';
import { getRoleLabel } from '../utils';

export default function Team() {
  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* HEADER SIMPLE & PRO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-slate-800 tracking-tight">
            Liste de <span className="font-semibold text-slate-900">l'équipe</span>
          </h1>
          <p className="text-slate-500 text-sm">Gérez les accès et les collaborateurs de votre instance Crediro</p>
        </div>
        
        <button className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center gap-2 active:scale-95">
          <UserPlus className="w-4 h-4" />
          Inviter un membre
        </button>
      </div>

      {/* STATS SIMPLES (Cartes blanches comme le Dashboard) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {[
    { label: "Membres Actifs", value: mockTeamMembers.filter(m => m.status === 'active').length, icon: <User className="w-5 h-5" />, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Administrateurs", value: mockTeamMembers.filter(m => m.role === 'admin').length, icon: <Shield className="w-5 h-5" />, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Analystes", value: mockTeamMembers.filter(m => m.role === 'analyst').length, icon: <Edit3 className="w-5 h-5" />, color: "text-slate-500", bg: "bg-slate-50" }
  ].map((stat, i) => (
    <div 
      key={i} 
      className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1"
    >
      <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-inner`}>
        {stat.icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">{stat.label}</p>
        <p className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
      </div>
    </div>
  ))}
</div>

      {/* TABLEAU PROPRE & LISIBLE */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Rechercher un membre..." 
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
                />
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Membre</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rôle</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mockTeamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-xs uppercase">
                          {member.name.split(' ').map((n) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{member.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {member.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-blue-50 text-blue-600">
                      {getRoleLabel(member.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className={`text-xs font-medium ${member.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {member.status === 'active' ? 'Actif' : 'Inactif'}
                        </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-blue-600 transition-all">
                            <Edit3 className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-rose-500 transition-all">
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