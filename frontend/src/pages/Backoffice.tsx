import React, { useState, useEffect } from 'react';
import {
  Building2, Users, LayoutDashboard,
  Plus, CheckCircle2, XCircle, Edit2,
  Lock, Loader2, LogOut, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoSvg from '../images/logocompletoffice.svg';

type TabType = 'dashboard' | 'establishments' | 'users';

interface Est {
  id: string;
  name: string;
  address?: string;
  status: string;
  created_at?: string;
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  establishment?: string;
  is_active: boolean;
  status?: string;
  created_at?: string;
}

export default function Backoffice() {
  const navigate = useNavigate();
  const token = localStorage.getItem('backoffice_token');
  const backofficeUser = (() => {
    try { return JSON.parse(localStorage.getItem('backoffice_user') || '{}'); } catch { return {}; }
  })();

  useEffect(() => {
    if (!token) navigate('/backoffice/login');
  }, [token, navigate]);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [establishments, setEstablishments] = useState<Est[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- States Établissement ---
  const [showEstModal, setShowEstModal] = useState(false);
  const [editingEst, setEditingEst] = useState<Est | null>(null);
  const [estForm, setEstForm] = useState({ name: '', address: '' });
  const [estError, setEstError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- States Utilisateur ---
  const [showUsrModal, setShowUsrModal] = useState(false);
  const [editingUsr, setEditingUsr] = useState<Member | null>(null);
  const [usrForm, setUsrForm] = useState({
    name: '', email: '', tempPwd: '', role: 'ANALYST', establishment: ''
  });
  const [usrError, setUsrError] = useState('');

  const API = import.meta.env.VITE_API_URL;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [estRes, usrRes] = await Promise.all([
        fetch(`${API}/auth/establishments`, { headers }),
        fetch(`${API}/auth/backoffice/users`, { headers }),
      ]);
      if (estRes.ok) setEstablishments(await estRes.json());
      if (usrRes.ok) setMembers(await usrRes.json());
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { if (token) fetchData(); }, [token]);

  // Stats
  const activeUsers = members.filter(m => m.is_active).length;

  // --- Handlers Établissement ---
  const openNewEstModal = () => {
    setEditingEst(null);
    setEstForm({ name: '', address: '' });
    setEstError('');
    setShowEstModal(true);
  };

  const openEditEstModal = (est: Est) => {
    setEditingEst(est);
    setEstForm({ name: est.name, address: est.address || '' });
    setEstError('');
    setShowEstModal(true);
  };

  const handleSaveEst = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstError('');
    setIsSubmitting(true);
    try {
      const url = editingEst
        ? `${API}/auth/establishments/${editingEst.id}`
        : `${API}/auth/establishments`;
      const method = editingEst ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(estForm) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail); }
      await fetchData();
      setShowEstModal(false);
    } catch (err: any) { setEstError(err.message); }
    finally { setIsSubmitting(false); }
  };

  const toggleEstStatus = async (est: Est) => {
    try {
      await fetch(`${API}/auth/establishments/${est.id}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ status: est.status === 'active' ? 'inactive' : 'active' })
      });
      await fetchData();
    } catch (err) { console.error(err); }
  };

  // --- Handlers Utilisateur ---
  const openNewUsrModal = () => {
    setEditingUsr(null);
    setUsrForm({ name: '', email: '', tempPwd: '', role: 'ANALYST', establishment: '' });
    setUsrError('');
    setShowUsrModal(true);
  };

  const openEditUsrModal = (usr: Member) => {
    setEditingUsr(usr);
    setUsrForm({
      name: `${usr.first_name} ${usr.last_name}`,
      email: usr.email,
      tempPwd: '',
      role: usr.role,
      establishment: usr.establishment || ''
    });
    setUsrError('');
    setShowUsrModal(true);
  };

  const handleSaveUsr = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsrError('');
    setIsSubmitting(true);
    const parts = usrForm.name.trim().split(' ');
    const first_name = parts[0] || 'Inconnu';
    const last_name = parts.slice(1).join(' ') || 'Inconnu';
    try {
      if (editingUsr) {
        const res = await fetch(`${API}/auth/backoffice/users/${editingUsr.id}`, {
          method: 'PUT', headers,
          body: JSON.stringify({ first_name, last_name, email: usrForm.email, role: usrForm.role, establishment: usrForm.establishment, sexe: 'M', poste: 'Data Analyst', password: 'unchanged' })
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.detail); }
      } else {
        const res = await fetch(`${API}/auth/users`, {
          method: 'POST', headers,
          body: JSON.stringify({ first_name, last_name, email: usrForm.email, password: usrForm.tempPwd || 'TempPass123!', role: usrForm.role, establishment: usrForm.establishment, sexe: 'M', poste: 'Data Analyst' })
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.detail); }
      }
      await fetchData();
      setShowUsrModal(false);
    } catch (err: any) { setUsrError(err.message); }
    finally { setIsSubmitting(false); }
  };

  const toggleUserStatus = async (usr: Member) => {
    try {
      await fetch(`${API}/auth/backoffice/users/${usr.id}/toggle-status`, { method: 'PUT', headers });
      await fetchData();
    } catch (err) { console.error(err); }
  };

  const logout = () => {
    localStorage.removeItem('backoffice_token');
    localStorage.removeItem('backoffice_user');
    navigate('/backoffice/login');
  };

  const ROLE_COLORS: Record<string, string> = {
    SUPER_ADMIN: 'text-purple-400 border-purple-700 bg-purple-500/10',
    ADMIN: 'text-blue-400 border-blue-700 bg-blue-500/10',
    ANALYST: 'text-slate-400 border-slate-700 bg-slate-800/50',
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-300 font-sans flex text-sm">

      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0F1523] border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-800 flex items-center justify-center">
          <img src={logoSvg} alt="Kaïs Backoffice" className="h-10 w-auto" />
        </div>

        <div className="p-3 border-b border-slate-800/50 mx-3 mt-3 rounded-xl bg-slate-800/30">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Connecté en tant que</p>
          <p className="text-slate-200 font-medium text-xs mt-0.5 truncate">{backofficeUser.name || 'Admin'}</p>
          <span className="text-[10px] text-blue-400">{backofficeUser.role || 'SYSTEM_ADMIN'}</span>
        </div>

        <nav className="flex-1 p-3 space-y-1 mt-2">
          {([
            { id: 'dashboard', icon: LayoutDashboard, label: 'Vue Globale' },
            { id: 'establishments', icon: Building2, label: 'Établissements' },
            { id: 'users', icon: Users, label: 'Comptes & Accès' },
          ] as const).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={activeTab === id ? { background: 'rgba(100,92,165,0.12)', color: '#a89fdb', borderColor: 'rgba(100,92,165,0.3)' } : {}}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm border ${
                activeTab === id
                  ? 'font-semibold'
                  : 'border-transparent hover:bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-8 py-5 border-b border-slate-800/50 flex justify-between items-center bg-[#0B0F19]/80 backdrop-blur-sm">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {activeTab === 'dashboard' && 'Vue Globale'}
              {activeTab === 'establishments' && 'Gestion des Établissements'}
              {activeTab === 'users' && "Contrôle d'Accès Utilisateurs"}
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">Administration système — données en temps réel.</p>
          </div>
          <div>
            {activeTab === 'establishments' && (
              <button onClick={openNewEstModal} className="text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all text-sm hover:opacity-90" style={{ background: '#645CA5' }}>
                <Plus className="w-4 h-4" /> Nouvel établissement
              </button>
            )}
            {activeTab === 'users' && (
              <button onClick={openNewUsrModal} className="text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all text-sm hover:opacity-90" style={{ background: '#645CA5' }}>
                <Plus className="w-4 h-4" /> Créer un compte
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center text-slate-500 gap-3">
              <Loader2 className="w-5 h-5 animate-spin" /> Chargement des données...
            </div>
          ) : (
            <>
              {/* DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-5">
                    {[
                      { label: 'Établissements', value: establishments.length, sub: `${establishments.filter(e => e.status === 'active').length} actifs`, icon: Building2, color: '#a89fdb' },
                      { label: 'Comptes Utilisateurs', value: members.length, sub: `${activeUsers} actifs`, icon: Users, color: '#34d399' },
                      { label: 'Comptes Inactifs', value: members.length - activeUsers, sub: 'accès suspendus', icon: Lock, color: '#f87171' },
                    ].map(({ label, value, sub, icon: Icon, color }) => (
                      <div key={label} className="bg-[#121927] border border-slate-800/60 p-6 rounded-xl flex items-start justify-between">
                        <div>
                          <p className="text-slate-500 text-xs mb-2">{label}</p>
                          <p className="text-3xl font-light" style={{ color }}>{value}</p>
                          <p className="text-xs text-slate-500 mt-2">{sub}</p>
                        </div>
                        <Icon className="w-8 h-8 opacity-20" style={{ color }} />
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#121927] border border-slate-800/60 rounded-xl p-6">
                    <h3 className="text-white font-medium mb-4">Membres par établissement</h3>
                    <div className="space-y-3">
                      {establishments.length === 0 && <p className="text-slate-500 text-sm">Aucun établissement.</p>}
                      {establishments.map(est => {
                        const count = members.filter(m => m.establishment === est.name).length;
                        const pct = members.length > 0 ? (count / members.length) * 100 : 0;
                        return (
                          <div key={est.id} className="flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${est.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className="text-slate-300 w-48 truncate text-sm">{est.name}</span>
                            <div className="flex-1 bg-slate-800 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: '#645CA5' }} />
                            </div>
                            <span className="text-slate-400 text-xs w-16 text-right">{count} membre{count !== 1 ? 's' : ''}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ÉTABLISSEMENTS */}
              {activeTab === 'establishments' && (
                <div className="bg-[#121927] border border-slate-800/60 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#0F1523] text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                        <th className="px-5 py-3 font-medium">Établissement</th>
                        <th className="px-5 py-3 font-medium">Adresse</th>
                        <th className="px-5 py-3 font-medium">Membres</th>
                        <th className="px-5 py-3 font-medium">Créé le</th>
                        <th className="px-5 py-3 font-medium text-center">Statut</th>
                        <th className="px-5 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {establishments.length === 0 && (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-500">Aucun établissement enregistré.</td></tr>
                      )}
                      {establishments.map(est => {
                        const count = members.filter(m => m.establishment === est.name).length;
                        return (
                          <tr key={est.id} className="hover:bg-slate-800/20 transition-colors group">
                            <td className="px-5 py-4 text-slate-200 font-medium">{est.name}</td>
                            <td className="px-5 py-4 text-slate-400 text-sm">{est.address || <span className="text-slate-600 italic">Non renseignée</span>}</td>
                            <td className="px-5 py-4 text-slate-400 text-sm">{count} membre{count !== 1 ? 's' : ''}</td>
                            <td className="px-5 py-4 text-slate-500 text-xs font-mono">
                              {est.created_at ? new Date(est.created_at).toLocaleDateString('fr-FR') : '—'}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <button onClick={() => toggleEstStatus(est)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border transition-all ${
                                est.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${est.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                {est.status === 'active' ? 'Actif' : 'Suspendu'}
                              </button>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button
                                onClick={() => openEditEstModal(est)}
                                className="opacity-0 group-hover:opacity-100 transition-all inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                              >
                                <Edit2 className="w-3 h-3" /> Modifier
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* UTILISATEURS */}
              {activeTab === 'users' && (
                <div className="bg-[#121927] border border-slate-800/60 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#0F1523] text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                        <th className="px-5 py-3 font-medium">Utilisateur</th>
                        <th className="px-5 py-3 font-medium">Établissement</th>
                        <th className="px-5 py-3 font-medium">Rôle</th>
                        <th className="px-5 py-3 font-medium text-center">Accès</th>
                        <th className="px-5 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {members.length === 0 && (
                        <tr><td colSpan={5} className="p-8 text-center text-slate-500">Aucun utilisateur.</td></tr>
                      )}
                      {members.map(usr => (
                        <tr key={usr.id} className="hover:bg-slate-800/20 transition-colors group">
                          <td className="px-5 py-4">
                            <div className="text-slate-200 font-medium">{usr.first_name} {usr.last_name}</div>
                            <div className="text-slate-500 text-xs mt-0.5">{usr.email}</div>
                          </td>
                          <td className="px-5 py-4 text-sm">
                            {usr.establishment
                              ? <span className="text-slate-300">{usr.establishment}</span>
                              : <span className="text-amber-600/70 italic text-xs">Non assigné</span>
                            }
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-[10px] border px-2 py-1 rounded font-bold uppercase ${ROLE_COLORS[usr.role] || ROLE_COLORS['ANALYST']}`}>
                              {usr.role}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            {usr.is_active
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500 inline" />
                              : <AlertTriangle className="w-4 h-4 text-amber-500 inline" />
                            }
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => openEditUsrModal(usr)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                              >
                                <Edit2 className="w-3 h-3" /> Modifier
                              </button>
                              <button
                                onClick={() => toggleUserStatus(usr)}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ${
                                  usr.is_active
                                    ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                }`}
                              >
                                {usr.is_active ? 'Suspendre' : 'Activer'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* MODAL ÉTABLISSEMENT */}
      {showEstModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121927] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setShowEstModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
              <XCircle className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-white mb-5">
              {editingEst ? 'Modifier l\'établissement' : 'Nouvel établissement'}
            </h3>
            {estError && (
              <div className="mb-4 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {estError}
              </div>
            )}
            <form onSubmit={handleSaveEst} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nom (unique) *</label>
                <input required type="text" value={estForm.name} onChange={e => setEstForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-[#0F1523] border border-slate-700 text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-all"
                  placeholder="Ex: Agence Nord" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Adresse</label>
                <input type="text" value={estForm.address} onChange={e => setEstForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full bg-[#0F1523] border border-slate-700 text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-all"
                  placeholder="Adresse complète" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEstModal(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-white rounded-lg font-medium transition-all text-sm disabled:opacity-50 hover:opacity-90" style={{ background: '#645CA5' }}>
                  {isSubmitting ? 'Enregistrement...' : (editingEst ? 'Sauvegarder' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL UTILISATEUR */}
      {showUsrModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121927] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setShowUsrModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
              <XCircle className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-white mb-5">
              {editingUsr ? 'Modifier le compte' : 'Créer un compte'}
            </h3>
            {usrError && (
              <div className="mb-4 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {usrError}
              </div>
            )}
            <form onSubmit={handleSaveUsr} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nom complet *</label>
                <input required type="text" value={usrForm.name} onChange={e => setUsrForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-[#0F1523] border border-slate-700 text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-all"
                  placeholder="Prénom Nom" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Email *</label>
                <input required type="email" value={usrForm.email} onChange={e => setUsrForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-[#0F1523] border border-slate-700 text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-all"
                  placeholder="prenom.nom@email.com" />
              </div>
              {!editingUsr && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Mot de passe provisoire</label>
                  <input type="text" value={usrForm.tempPwd} onChange={e => setUsrForm(f => ({ ...f, tempPwd: e.target.value }))}
                    className="w-full bg-[#0F1523] border border-slate-700 text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-all font-mono"
                    placeholder="Laisser vide → TempPass123!" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Rôle *</label>
                  <select value={usrForm.role} onChange={e => setUsrForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full bg-[#0F1523] border border-slate-700 text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-all">
                    <option value="ANALYST">Analyste</option>
                    <option value="ADMIN">Administrateur</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Établissement</label>
                  <select value={usrForm.establishment} onChange={e => setUsrForm(f => ({ ...f, establishment: e.target.value }))}
                    className="w-full bg-[#0F1523] border border-slate-700 text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-all">
                    <option value="">— Aucun —</option>
                    {establishments.map(est => (
                      <option key={est.id} value={est.name}>{est.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowUsrModal(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-white rounded-lg font-medium transition-all text-sm disabled:opacity-50 hover:opacity-90" style={{ background: '#645CA5' }}>
                  {isSubmitting ? 'Enregistrement...' : (editingUsr ? 'Sauvegarder' : 'Créer le compte')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
