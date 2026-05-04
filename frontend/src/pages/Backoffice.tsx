import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Users, LayoutDashboard,
  Plus, CheckCircle2, XCircle, Edit2,
  Lock, Loader2, LogOut, AlertTriangle, Search, Filter, ShieldCheck,
  Terminal, RefreshCw, Trash2, ChevronDown, ChevronUp, Clock, Wifi
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoSvg from '../images/logocompletoffice.svg';
import TwoFactorSettingsModal from '../components/TwoFactorSettingsModal';

type TabType = 'dashboard' | 'establishments' | 'users' | 'logs';

interface Est {
  id: string;
  name: string;
  address?: string;
  status: string;
  primary_color?: string;
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
  const [backofficeUser, setBackofficeUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('backoffice_user') || '{}'); } catch { return {}; }
  });

  const refreshUserInfo = () => {
    try {
      const updated = JSON.parse(localStorage.getItem('backoffice_user') || '{}');
      setBackofficeUser(updated);
    } catch (e) {
      console.error(e);
    }
  };

  // Dynamically update tab title + favicon for backoffice
  useEffect(() => {
    const prevTitle = document.title;
    const prevFavicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const prevHref = prevFavicon?.href;

    document.title = 'Kaïs Backoffice';
    if (prevFavicon) prevFavicon.href = '/logobackoffice.svg';

    return () => {
      document.title = prevTitle;
      if (prevFavicon && prevHref) prevFavicon.href = prevHref;
    };
  }, []);

  useEffect(() => {
    if (!token) navigate('/backoffice/login');
  }, [token, navigate]);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [establishments, setEstablishments] = useState<Est[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Filtres utilisateurs ---
  const [searchUsr, setSearchUsr] = useState('');
  const [filterEst, setFilterEst] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // --- States Logs ---
  interface LogEntry {
    id: number;
    level: string;
    logger_name: string;
    message: string;
    source: string | null;
    traceback: string | null;
    method: string | null;
    path: string | null;
    status_code: number | null;
    created_at: string;
  }
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsFilter, setLogsFilter] = useState('ALL');
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsAutoRefresh, setLogsAutoRefresh] = useState(false);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [logStats, setLogStats] = useState<Record<string, number>>({});

  // --- States Établissement ---
  const [showEstModal, setShowEstModal] = useState(false);
  const [editingEst, setEditingEst] = useState<Est | null>(null);
  const [estForm, setEstForm] = useState({ name: '', address: '', primary_color: '#E73919' });
  const [estError, setEstError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);

  // --- States Utilisateur ---
  const [showUsrModal, setShowUsrModal] = useState(false);
  const [editingUsr, setEditingUsr] = useState<Member | null>(null);
  const [usrForm, setUsrForm] = useState({
    first_name: '', last_name: '', email: '', tempPwd: '', role: 'ANALYST', establishment: ''
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

  // --- Logs ---
  const fetchLogs = useCallback(async (filter = logsFilter) => {
    setLogsLoading(true);
    try {
      const levelParam = filter !== 'ALL' ? `?level=${filter}&limit=200` : '?limit=200';
      const [logsRes, statsRes] = await Promise.all([
        fetch(`${API}/auth/logs${levelParam}`, { headers }),
        fetch(`${API}/auth/logs/stats`, { headers }),
      ]);
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.logs || []);
        setLogsTotal(data.total || 0);
      }
      if (statsRes.ok) setLogStats(await statsRes.json());
    } catch (err) { console.error(err); }
    finally { setLogsLoading(false); }
  }, [API, headers, logsFilter]);

  useEffect(() => {
    if (activeTab === 'logs' && token) fetchLogs(logsFilter);
  }, [activeTab, logsFilter]);

  useEffect(() => {
    if (!logsAutoRefresh || activeTab !== 'logs') return;
    const interval = setInterval(() => fetchLogs(logsFilter), 30000);
    return () => clearInterval(interval);
  }, [logsAutoRefresh, activeTab, logsFilter]);

  const clearLogs = async () => {
    if (!confirm('Supprimer tous les logs affichés ?')) return;
    const levelParam = logsFilter !== 'ALL' ? `?level=${logsFilter}` : '';
    await fetch(`${API}/auth/logs${levelParam}`, { method: 'DELETE', headers });
    fetchLogs(logsFilter);
  };

  // Stats
  const activeUsers = members.filter(m => m.is_active).length;

  // Membres filtrés
  const filteredMembers = members.filter(m => {
    const search = searchUsr.toLowerCase();
    const matchSearch = !search ||
      m.first_name.toLowerCase().includes(search) ||
      m.last_name.toLowerCase().includes(search) ||
      m.email.toLowerCase().includes(search);
    const matchEst = !filterEst || m.establishment === filterEst;
    const matchRole = !filterRole || m.role === filterRole;
    const matchStatus = !filterStatus ||
      (filterStatus === 'active' && m.is_active) ||
      (filterStatus === 'inactive' && !m.is_active);
    return matchSearch && matchEst && matchRole && matchStatus;
  });

  // --- Handlers Établissement ---
  const openNewEstModal = () => {
    setEditingEst(null);
    setEstForm({ name: '', address: '', primary_color: '#E73919' });
    setEstError('');
    setShowEstModal(true);
  };

  const openEditEstModal = (est: Est) => {
    setEditingEst(est);
    setEstForm({ name: est.name, address: est.address || '', primary_color: est.primary_color || '#E73919' });
    setEstError('');
    setShowEstModal(true);
  };

  const handleSaveEst = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstError('');
    setIsSubmitting(true);
    try {
      const url = editingEst ? `${API}/auth/establishments/${editingEst.id}` : `${API}/auth/establishments`;
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

  const handleUploadPolicy = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingEst) return;
    setIsSubmitting(true);
    setEstError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API}/auth/establishments/${editingEst.id}/policy`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }, // no Content-Type for FormData
        body: formData
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail); }
      alert(`Politique RAG mise à jour avec succès pour ${editingEst.name} !`);
    } catch (err: any) { setEstError(err.message); }
    finally { setIsSubmitting(false); }
  };

  const handleDeletePolicy = async () => {
    if (!editingEst || !confirm("Réinitaliser la politique aux règles par défaut ?")) return;
    setIsSubmitting(true);
    setEstError('');
    try {
      const res = await fetch(`${API}/auth/establishments/${editingEst.id}/policy`, {
        method: 'DELETE', headers
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail); }
      alert(`Politique RAG réinitialisée pour ${editingEst.name} !`);
    } catch (err: any) { setEstError(err.message); }
    finally { setIsSubmitting(false); }
  };

  // --- Handlers Utilisateur ---
  const openNewUsrModal = () => {
    setEditingUsr(null);
    setUsrForm({ first_name: '', last_name: '', email: '', tempPwd: '', role: 'ANALYST', establishment: '' });
    setUsrError('');
    setShowUsrModal(true);
  };

  const openEditUsrModal = (usr: Member) => {
    setEditingUsr(usr);
    setUsrForm({
      first_name: usr.first_name,
      last_name: usr.last_name,
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
    try {
      if (editingUsr) {
        const res = await fetch(`${API}/auth/backoffice/users/${editingUsr.id}`, {
          method: 'PUT', headers,
          body: JSON.stringify({
            first_name: usrForm.first_name,
            last_name: usrForm.last_name,
            email: usrForm.email,
            role: usrForm.role,
            establishment: usrForm.establishment || null,
            sexe: editingUsr.id ? undefined : 'M',
            poste: undefined
          })
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Erreur lors de la mise à jour'); }
      } else {
        const res = await fetch(`${API}/auth/backoffice/users`, {
          method: 'POST', headers,
          body: JSON.stringify({
            first_name: usrForm.first_name,
            last_name: usrForm.last_name,
            email: usrForm.email,
            password: usrForm.tempPwd || 'TempPass123!',
            role: usrForm.role,
            establishment: usrForm.establishment || null,
            sexe: 'M',
            poste: 'Data Analyst'
          })
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Erreur lors de la création'); }
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
    ADMIN: 'text-indigo-400 border-indigo-700 bg-indigo-500/10',
    ANALYST: 'text-slate-400 border-slate-700 bg-slate-800/50',
  };

  const uniqueRoles = [...new Set(members.map(m => m.role))];

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
          <span className="text-[10px]" style={{ color: '#a89fdb' }}>{backofficeUser.role || 'SYSTEM_ADMIN'}</span>
        </div>

        <nav className="flex-1 p-3 space-y-1 mt-2">
          {([
            { id: 'dashboard', icon: LayoutDashboard, label: 'Vue Globale' },
            { id: 'establishments', icon: Building2, label: 'Établissements' },
            { id: 'users', icon: Users, label: 'Comptes & Accès' },
            { id: 'logs', icon: Terminal, label: 'Logs Système' },
          ] as const).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={activeTab === id ? { background: 'rgba(100,92,165,0.12)', color: '#a89fdb', borderColor: 'rgba(100,92,165,0.3)' } : {}}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm border ${
                activeTab === id ? 'font-semibold' : 'border-transparent hover:bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {id === 'logs' && (logStats['ERROR'] || 0) + (logStats['CRITICAL'] || 0) > 0 && (
                <span className="ml-auto text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded-full">
                  {(logStats['ERROR'] || 0) + (logStats['CRITICAL'] || 0)}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-1">
          <button
            onClick={() => setShow2FAModal(true)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-sm ${backofficeUser.two_factor_enabled ? 'text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'}`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4" />
              Sécurité 2FA
            </div>
            {backofficeUser.two_factor_enabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            )}
          </button>
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
              {activeTab === 'users' && "Gestion des Utilisateurs"}
              {activeTab === 'logs' && 'Logs & Monitoring Système'}
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              {activeTab === 'logs' ? `${logsTotal} entrée(s) enregistrée(s) — données en temps réel.` : 'Administration système — données en temps réel.'}
            </p>
          </div>
          <div>
            {activeTab === 'establishments' && (
              <button onClick={openNewEstModal} className="text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm hover:opacity-90 transition-all" style={{ background: '#645CA5' }}>
                <Plus className="w-4 h-4" /> Nouvel établissement
              </button>
            )}
            {activeTab === 'users' && (
              <button onClick={openNewUsrModal} className="text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm hover:opacity-90 transition-all" style={{ background: '#645CA5' }}>
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
              {/* LOGS SYSTÈME */}
              {activeTab === 'logs' && (() => {
                const LEVEL_STYLES: Record<string, string> = {
                  CRITICAL: 'bg-red-500/20 text-red-300 border-red-500/40',
                  ERROR:    'bg-rose-500/20 text-rose-300 border-rose-500/40',
                  WARNING:  'bg-amber-500/20 text-amber-300 border-amber-500/40',
                  INFO:     'bg-blue-500/20 text-blue-300 border-blue-500/40',
                  DEBUG:    'bg-slate-500/20 text-slate-400 border-slate-600',
                };
                const LEVEL_DOT: Record<string, string> = {
                  CRITICAL: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]',
                  ERROR:    'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]',
                  WARNING:  'bg-amber-400',
                  INFO:     'bg-blue-400',
                  DEBUG:    'bg-slate-500',
                };
                return (
                  <div className="space-y-4">
                    {/* Stats rapides */}
                    <div className="grid grid-cols-5 gap-3">
                      {['CRITICAL','ERROR','WARNING','INFO','DEBUG'].map(lvl => (
                        <button
                          key={lvl}
                          onClick={() => setLogsFilter(lvl)}
                          className={`p-3 rounded-xl border text-center transition-all ${logsFilter === lvl ? LEVEL_STYLES[lvl] : 'bg-[#121927] border-slate-800/60 hover:border-slate-700'}`}
                        >
                          <p className={`text-lg font-light ${logsFilter === lvl ? '' : 'text-slate-300'}`}>{logStats[lvl] || 0}</p>
                          <p className="text-[9px] uppercase tracking-widest text-slate-500 mt-1">{lvl}</p>
                        </button>
                      ))}
                    </div>

                    {/* Barre de contrôle */}
                    <div className="bg-[#121927] border border-slate-800/60 rounded-xl p-4 flex flex-wrap gap-3 items-center">
                      <Terminal className="w-4 h-4 text-slate-500 shrink-0" />

                      {/* Filtre niveau */}
                      <select
                        value={logsFilter}
                        onChange={e => setLogsFilter(e.target.value)}
                        className="px-3 py-2 bg-[#0F1523] border border-slate-700 rounded-lg text-sm text-slate-300 outline-none focus:border-[#645CA5] transition-all"
                      >
                        <option value="ALL">Tous les niveaux</option>
                        <option value="CRITICAL">CRITICAL</option>
                        <option value="ERROR">ERROR</option>
                        <option value="WARNING">WARNING</option>
                        <option value="INFO">INFO</option>
                        <option value="DEBUG">DEBUG</option>
                      </select>

                      {/* Auto-refresh */}
                      <button
                        onClick={() => setLogsAutoRefresh(v => !v)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${logsAutoRefresh ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-[#0F1523] text-slate-400 border-slate-700 hover:border-slate-500'}`}
                      >
                        <Wifi className="w-3.5 h-3.5" />
                        {logsAutoRefresh ? 'Live (30s)' : 'Auto-refresh'}
                      </button>

                      {/* Rafraîchir */}
                      <button
                        onClick={() => fetchLogs(logsFilter)}
                        disabled={logsLoading}
                        className="flex items-center gap-2 px-3 py-2 bg-[#0F1523] border border-slate-700 hover:border-slate-500 rounded-lg text-xs text-slate-300 transition-all"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
                        Rafraîchir
                      </button>

                      <span className="text-xs text-slate-500 ml-auto">{logs.length} / {logsTotal} log(s)</span>

                      {/* Vider */}
                      <button
                        onClick={clearLogs}
                        className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 rounded-lg text-xs text-rose-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Vider
                      </button>
                    </div>

                    {/* Tableau des logs */}
                    <div className="bg-[#121927] border border-slate-800/60 rounded-xl overflow-hidden">
                      {logsLoading && logs.length === 0 ? (
                        <div className="flex h-32 items-center justify-center gap-3 text-slate-500">
                          <Loader2 className="w-5 h-5 animate-spin" /> Chargement des logs...
                        </div>
                      ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-600">
                          <Terminal className="w-10 h-10 mb-3 opacity-30" />
                          <p className="text-sm">Aucun log enregistré pour ce filtre.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-800/50">
                          {logs.map(log => (
                            <div key={log.id} className="transition-colors hover:bg-slate-800/20">
                              {/* Ligne principale */}
                              <div
                                className="flex items-start gap-3 px-5 py-3 cursor-pointer"
                                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                              >
                                {/* Dot niveau */}
                                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${LEVEL_DOT[log.level] || 'bg-slate-500'}`} />

                                {/* Badge niveau */}
                                <span className={`text-[9px] font-black uppercase tracking-wider border px-2 py-0.5 rounded shrink-0 ${LEVEL_STYLES[log.level] || LEVEL_STYLES['DEBUG']}`}>
                                  {log.level}
                                </span>

                                {/* Message */}
                                <p className="flex-1 text-slate-300 text-xs font-mono leading-relaxed break-all">
                                  {log.message}
                                </p>

                                {/* Meta */}
                                <div className="flex items-center gap-3 shrink-0 text-right">
                                  {log.method && log.status_code && (
                                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                                      log.status_code >= 500 ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                                      log.status_code >= 400 ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                                      'text-slate-500 border-slate-700'
                                    }`}>
                                      {log.method} {log.status_code}
                                    </span>
                                  )}
                                  <div className="flex items-center gap-1 text-slate-600 text-[9px]">
                                    <Clock className="w-2.5 h-2.5" />
                                    {log.created_at ? new Date(log.created_at).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' }) : '—'}
                                  </div>
                                  {(log.traceback || log.path) && (
                                    expandedLog === log.id
                                      ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                                      : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                  )}
                                </div>
                              </div>

                              {/* Détails expandables */}
                              {expandedLog === log.id && (
                                <div className="px-5 pb-4 space-y-3 animate-fade-in">
                                  {log.source && (
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                      <span className="text-slate-600">Source :</span>
                                      <span className="font-mono text-slate-400">{log.source}</span>
                                    </div>
                                  )}
                                  {log.logger_name && (
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                      <span className="text-slate-600">Logger :</span>
                                      <span className="font-mono text-slate-400">{log.logger_name}</span>
                                    </div>
                                  )}
                                  {log.path && (
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                      <span className="text-slate-600">Endpoint :</span>
                                      <span className="font-mono text-slate-400">{log.method} {log.path}</span>
                                    </div>
                                  )}
                                  {log.traceback && (
                                    <div>
                                      <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1.5">Traceback complet</p>
                                      <pre className="text-[10px] font-mono text-red-300/80 bg-red-950/20 border border-red-900/30 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                                        {log.traceback}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

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
                        const active = members.filter(m => m.establishment === est.name && m.is_active).length;
                        const color = est.primary_color || '#645CA5';
                        return (
                          <div key={est.id} className="flex items-center justify-between p-4 bg-[#0F1523] rounded-xl border border-slate-800/40">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                              <span className="text-slate-200 font-medium text-sm">{est.name}</span>
                              {est.status !== 'active' && (
                                <span className="text-[10px] text-rose-400 border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.5 rounded-full">Suspendu</span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-slate-400">{count} membre{count !== 1 ? 's' : ''}</span>
                              <span className="text-emerald-500">{active} actif{active !== 1 ? 's' : ''}</span>
                            </div>
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
                            <td className="px-5 py-4 text-slate-200 font-medium">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: est.primary_color || '#645CA5' }} />
                                {est.name}
                              </div>
                            </td>
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
                <div className="space-y-4">
                  {/* Barre de filtres */}
                  <div className="bg-[#121927] border border-slate-800/60 rounded-xl p-4 flex flex-wrap gap-3 items-center">
                    <Filter className="w-4 h-4 text-slate-500 shrink-0" />

                    {/* Recherche texte */}
                    <div className="relative flex-1 min-w-[180px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Nom, email…"
                        value={searchUsr}
                        onChange={e => setSearchUsr(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-[#0F1523] border border-slate-700 rounded-lg text-sm text-slate-300 outline-none focus:border-[#645CA5] transition-all"
                      />
                    </div>

                    {/* Filtre établissement */}
                    <select
                      value={filterEst}
                      onChange={e => setFilterEst(e.target.value)}
                      className="px-3 py-2 bg-[#0F1523] border border-slate-700 rounded-lg text-sm text-slate-300 outline-none focus:border-[#645CA5] transition-all"
                    >
                      <option value="">Tous les établissements</option>
                      {establishments.map(est => (
                        <option key={est.id} value={est.name}>{est.name}</option>
                      ))}
                    </select>

                    {/* Filtre rôle */}
                    <select
                      value={filterRole}
                      onChange={e => setFilterRole(e.target.value)}
                      className="px-3 py-2 bg-[#0F1523] border border-slate-700 rounded-lg text-sm text-slate-300 outline-none focus:border-[#645CA5] transition-all"
                    >
                      <option value="">Tous les rôles</option>
                      {uniqueRoles.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>

                    {/* Filtre statut */}
                    <select
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                      className="px-3 py-2 bg-[#0F1523] border border-slate-700 rounded-lg text-sm text-slate-300 outline-none focus:border-[#645CA5] transition-all"
                    >
                      <option value="">Tous les statuts</option>
                      <option value="active">Actifs</option>
                      <option value="inactive">Suspendus</option>
                    </select>

                    {/* Compteur */}
                    <span className="text-xs text-slate-500 ml-auto">
                      {filteredMembers.length} / {members.length} utilisateur{members.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Tableau */}
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
                        {filteredMembers.length === 0 && (
                          <tr><td colSpan={5} className="p-8 text-center text-slate-500">Aucun utilisateur trouvé avec ces filtres.</td></tr>
                        )}
                        {filteredMembers.map(usr => (
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
              {editingEst ? "Modifier l'établissement" : 'Nouvel établissement'}
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
                  className="w-full bg-[#0F1523] border border-slate-700 text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#645CA5] transition-all"
                  placeholder="Ex: Agence Nord" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Adresse</label>
                <input type="text" value={estForm.address} onChange={e => setEstForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full bg-[#0F1523] border border-slate-700 text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#645CA5] transition-all"
                  placeholder="Adresse complète" />
              </div>

              {/* Color Picker */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-slate-400">Couleur thème du logiciel</label>
                  <button
                    type="button"
                    onClick={() => setEstForm(f => ({ ...f, primary_color: '#E73919' }))}
                    className="text-[10px] text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors"
                  >
                    ↺ Couleur par défaut
                  </button>
                </div>
                <div className="flex items-center gap-4 p-3 bg-[#0F1523] border border-slate-700 rounded-lg">
                  <input
                    type="color"
                    value={estForm.primary_color}
                    onChange={e => setEstForm(f => ({ ...f, primary_color: e.target.value }))}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent p-0.5"
                    title="Choisir la couleur"
                  />
                  <div>
                    <p className="text-white text-sm font-medium" style={{ color: estForm.primary_color }}>
                      Aperçu — Couleur de l'établissement
                    </p>
                    <p className="text-slate-500 text-xs font-mono mt-0.5">{estForm.primary_color}</p>
                  </div>
                  <span
                    className="ml-auto text-xs px-3 py-1.5 rounded-lg font-medium text-white"
                    style={{ background: estForm.primary_color }}
                  >
                    Bouton
                  </span>
                </div>
                <p className="text-slate-600 text-[10px] mt-1.5">Cette couleur sera appliquée automatiquement pour tous les membres de cet établissement.</p>
              </div>

              {editingEst && (
                <div className="border-t border-slate-700/50 pt-4 mt-2">
                  <label className="block text-xs font-medium text-slate-300 mb-2">Politique de Crédit (RAG IA)</label>
                  <p className="text-[10px] text-slate-500 mb-3 leading-tight">
                    Ajoutez un document (PDF/TXT) contenant les règles d'octroi de crédit. L'Intelligence Artificielle s'appuiera dessus pour analyser tous les dossiers de cette agence.
                  </p>
                  <div className="flex gap-2">
                    <label className="flex-1 text-center cursor-pointer px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors border border-slate-600">
                      Uploader un fichier
                      <input type="file" accept=".pdf,.txt" className="hidden" onChange={handleUploadPolicy} disabled={isSubmitting} />
                    </label>
                    <button type="button" onClick={handleDeletePolicy} disabled={isSubmitting}
                      className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium rounded-lg transition-colors border border-rose-500/20">
                      Réinitialiser
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEstModal(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-white rounded-lg font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-all" style={{ background: '#645CA5' }}>
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

              {/* Prénom + Nom séparés */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Prénom *</label>
                  <input required type="text" value={usrForm.first_name} onChange={e => setUsrForm(f => ({ ...f, first_name: e.target.value }))}
                    className="w-full bg-[#0F1523] border border-slate-700 text-white px-3 py-2.5 rounded-lg outline-none focus:border-[#645CA5] transition-all"
                    placeholder="Jean" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Nom *</label>
                  <input required type="text" value={usrForm.last_name} onChange={e => setUsrForm(f => ({ ...f, last_name: e.target.value }))}
                    className="w-full bg-[#0F1523] border border-slate-700 text-white px-3 py-2.5 rounded-lg outline-none focus:border-[#645CA5] transition-all"
                    placeholder="Dupont" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Email *</label>
                <input required type="email" value={usrForm.email} onChange={e => setUsrForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-[#0F1523] border border-slate-700 text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#645CA5] transition-all"
                  placeholder="jean.dupont@email.com" />
              </div>

              {!editingUsr && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Mot de passe provisoire</label>
                  <input type="text" value={usrForm.tempPwd} onChange={e => setUsrForm(f => ({ ...f, tempPwd: e.target.value }))}
                    className="w-full bg-[#0F1523] border border-slate-700 text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#645CA5] transition-all font-mono"
                    placeholder="Laisser vide → TempPass123!" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Rôle *</label>
                  <select value={usrForm.role} onChange={e => setUsrForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full bg-[#0F1523] border border-slate-700 text-white px-3 py-2.5 rounded-lg outline-none focus:border-[#645CA5] transition-all">
                    <option value="ANALYST">Analyste</option>
                    <option value="ADMIN">Administrateur</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Établissement</label>
                  <select value={usrForm.establishment} onChange={e => setUsrForm(f => ({ ...f, establishment: e.target.value }))}
                    className="w-full bg-[#0F1523] border border-slate-700 text-white px-3 py-2.5 rounded-lg outline-none focus:border-[#645CA5] transition-all">
                    <option value="">— Aucun —</option>
                    {establishments.map(est => (
                      <option key={est.id} value={est.name}>{est.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowUsrModal(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-white rounded-lg font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-all" style={{ background: '#645CA5' }}>
                  {isSubmitting ? 'Enregistrement...' : (editingUsr ? 'Sauvegarder' : 'Créer le compte')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <TwoFactorSettingsModal
        isOpen={show2FAModal}
        onClose={() => { setShow2FAModal(false); refreshUserInfo(); }}
        isBackoffice={true}
      />
    </div>
  );
}
