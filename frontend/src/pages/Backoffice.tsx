import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, LayoutDashboard, ShieldCheck, 
  Search, Plus, CheckCircle2, XCircle, Edit,
  ArrowLeft, Lock, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Establishment, TeamMember } from '../types';

type TabType = 'dashboard' | 'establishments' | 'users';

export default function Backoffice() {
  const navigate = useNavigate();
  const token = localStorage.getItem('backoffice_token');
  
  useEffect(() => {
    if (!token) {
      navigate('/backoffice/login');
    }
  }, [token, navigate]);
  
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States for forms
  const [showEstModal, setShowEstModal] = useState(false);
  const [newEstName, setNewEstName] = useState('');
  const [newEstAddress, setNewEstAddress] = useState('');
  const [estError, setEstError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showUsrModal, setShowUsrModal] = useState(false);
  const [newUsrName, setNewUsrName] = useState('');
  const [newUsrEmail, setNewUsrEmail] = useState('');
  const [newUsrRole, setNewUsrRole] = useState<'admin' | 'member' | 'analyst'>('analyst');
  const [newUsrEstId, setNewUsrEstId] = useState('');
  const [usrError, setUsrError] = useState('');

  // Fetch Data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [estRes, usrRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/auth/establishments`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/auth/backoffice/users`, { headers })
      ]);
      
      if (estRes.ok) {
        const estData = await estRes.json();
        setEstablishments(estData);
      }
      
      if (usrRes.ok) {
        const usrData = await usrRes.json();
        setMembers(usrData);
      }
    } catch (err) {
      console.error("Erreur de chargement", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Derived stats
  const totalEstablishments = establishments.length;
  const totalUsers = members.length;
  const activeUsers = members.filter(m => m.status === 'active' || m.is_active === true).length;

  // Handlers
  const handleAddEstablishment = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstError('');
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/establishments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newEstName, address: newEstAddress })
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Erreur de création");
      }
      
      await fetchData(); // Refresh
      setShowEstModal(false);
      setNewEstName('');
      setNewEstAddress('');
    } catch (err: any) {
      setEstError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsrError('');
    setIsSubmitting(true);
    
    try {
      // Extraction first_name et last_name
      const parts = newUsrName.split(' ');
      const first_name = parts[0] || 'Inconnu';
      const last_name = parts.slice(1).join(' ') || 'Inconnu';
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/backoffice/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name,
          last_name,
          email: newUsrEmail,
          password: "TempPassword123!", // Mot de passe provisoire
          role: newUsrRole.toUpperCase(),
          establishment: newUsrEstId,
          sexe: "M",
          poste: "Data Analyst"
        })
      });
      
      if (!response.ok) {
         const err = await response.json();
         throw new Error(err.detail || "Erreur lors de l'invitation");
      }
      
      await fetchData();
      setShowUsrModal(false);
      setNewUsrName('');
      setNewUsrEmail('');
      setNewUsrRole('analyst');
      setNewUsrEstId('');
    } catch (err: any) {
      setUsrError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserStatus = async (id: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/backoffice/users/${id}/toggle-status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-300 font-sans flex text-sm selection:bg-blue-500/30">
      
      {/* SIDEBAR ADMIN */}
      <aside className="w-64 bg-[#0F1523] border-r border-slate-800 flex flex-col z-10 shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-blue-500" />
            <h1 className="font-bold text-white tracking-wide">ADMIN SYS</h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'dashboard' ? 'bg-blue-600/10 text-blue-400 font-semibold' : 'hover:bg-slate-800/50 hover:text-white text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Vue Globale
          </button>
          
          <button 
            onClick={() => setActiveTab('establishments')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'establishments' ? 'bg-blue-600/10 text-blue-400 font-semibold' : 'hover:bg-slate-800/50 hover:text-white text-slate-400'
            }`}
          >
            <Building2 className="w-5 h-5" />
            Établissements
          </button>

          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'users' ? 'bg-blue-600/10 text-blue-400 font-semibold' : 'hover:bg-slate-800/50 hover:text-white text-slate-400'
            }`}
          >
            <Users className="w-5 h-5" />
            Comptes & Accès
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => {
              localStorage.removeItem('backoffice_token');
              localStorage.removeItem('backoffice_user');
              navigate('/backoffice/login');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800/50 transition-all font-bold text-xs"
          >
            <Lock className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Abstract Background Effects */}
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

        <header className="px-8 py-6 border-b border-slate-800/50 backdrop-blur-sm z-10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              {activeTab === 'dashboard' && 'Tableau de Bord Système'}
              {activeTab === 'establishments' && 'Gestion des Établissements'}
              {activeTab === 'users' && 'Contrôle d\'Accès Utilisateurs'}
            </h2>
            <p className="text-slate-500 mt-1">Supervision technique et paramétrage du tenant (Base Réelle).</p>
          </div>
          <div className="flex gap-4">
             {activeTab === 'establishments' && (
               <button onClick={() => setShowEstModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
                 <Plus className="w-4 h-4" /> Créer un établissement
               </button>
             )}
             {activeTab === 'users' && (
               <button onClick={() => setShowUsrModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
                 <Plus className="w-4 h-4" /> Inviter un membre
               </button>
             )}
          </div>
        </header>

        <div className="p-8 overflow-y-auto flex-1 z-10">
          
          {isLoading ? (
             <div className="flex w-full h-40 items-center justify-center text-slate-500 gap-3">
                <Loader2 className="w-6 h-6 animate-spin" /> Synchronisation avec la base de données...
             </div>
          ) : (
            <>
              {/* TAB: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#121927] border border-slate-800/60 p-6 rounded-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Building2 className="w-16 h-16" />
                      </div>
                      <h3 className="text-sm font-medium text-slate-500 mb-2">Entités Enregistrées</h3>
                      <p className="text-4xl font-light text-white">{totalEstablishments}</p>
                      <p className="text-xs text-emerald-500 mt-4 flex items-center gap-1">+ {establishments.filter(e => e.status === 'active').length} actifs</p>
                    </div>
                    
                    <div className="bg-[#121927] border border-slate-800/60 p-6 rounded-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users className="w-16 h-16" />
                      </div>
                      <h3 className="text-sm font-medium text-slate-500 mb-2">Comptes Déployés</h3>
                      <p className="text-4xl font-light text-white">{totalUsers}</p>
                      <p className="text-xs text-blue-500 mt-4 flex items-center gap-1">{activeUsers} utilisateurs actifs</p>
                    </div>

                    <div className="bg-[#121927] border border-slate-800/60 p-6 rounded-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <LayoutDashboard className="w-16 h-16" />
                      </div>
                      <h3 className="text-sm font-medium text-slate-500 mb-2">État du Système</h3>
                      <p className="text-4xl font-light text-emerald-400">Opérationnel</p>
                      <p className="text-xs text-emerald-500/50 mt-4 flex items-center gap-1">Connecté à la BD en direct</p>
                    </div>
                  </div>

                  <div className="bg-[#121927] border border-slate-800/60 rounded-2xl p-6">
                    <h3 className="text-lg font-medium text-white mb-6">Répartition par entité</h3>
                    <div className="space-y-4">
                      {establishments.map(est => {
                        const count = members.filter(m => m.establishment === est.id).length;
                        return (
                          <div key={est.id} className="flex items-center justify-between p-4 bg-[#0F1523] rounded-xl border border-slate-800/40">
                            <div className="flex gap-4 items-center">
                              <div className={`w-2 h-2 rounded-full ${est.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              <span className="font-medium text-slate-200">{est.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <Users className="w-4 h-4 text-slate-500" />
                               <span className="text-slate-400">{count} membre{count !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: ESTABLISHMENTS */}
              {activeTab === 'establishments' && (
                <div className="bg-[#121927] border border-slate-800/60 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0F1523] text-slate-500 text-xs uppercase tracking-wider">
                        <th className="p-4 font-medium">Nom de l'entité</th>
                        <th className="p-4 font-medium">Adresse Principale</th>
                        <th className="p-4 font-medium text-center">Création</th>
                        <th className="p-4 font-medium text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {establishments.map(est => (
                        <tr key={est.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="p-4 text-slate-200 font-medium">{est.name}</td>
                          <td className="p-4 text-slate-400">{est.address || 'Non spécifiée'}</td>
                          <td className="p-4 text-slate-400 text-center font-mono text-xs">
                            {est.created_at ? new Date(est.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                              est.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {est.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {establishments.length === 0 && (
                         <tr><td colSpan={4} className="p-8 text-center text-slate-500">Aucun établissement défini.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB: USERS */}
              {activeTab === 'users' && (
                 <div className="bg-[#121927] border border-slate-800/60 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <table className="w-full text-left border-collapse">
                     <thead>
                       <tr className="bg-[#0F1523] text-slate-500 text-xs uppercase tracking-wider">
                         <th className="p-4 font-medium">Utilisateur</th>
                         <th className="p-4 font-medium">Entité Associée</th>
                         <th className="p-4 font-medium">Habilitation</th>
                         <th className="p-4 font-medium text-center">Statut d'Accès</th>
                         <th className="p-4 font-medium text-right">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-800/50">
                       {members.map((usr: any) => {
                         const est = establishments.find(e => e.id === usr.establishment);
                         const isActive = usr.is_active || usr.status === 'active';
                         return (
                           <tr key={usr.id} className="hover:bg-slate-800/20 transition-colors group">
                             <td className="p-4">
                               <div className="text-slate-200 font-medium">{usr.first_name} {usr.last_name}</div>
                               <div className="text-slate-500 text-xs mt-1">{usr.email}</div>
                             </td>
                             <td className="p-4 text-slate-400">
                               {usr.establishment || <span className="text-yellow-500/50">Non assignée</span>}
                             </td>
                             <td className="p-4">
                               <span className="text-xs border border-slate-700 bg-slate-800/50 text-slate-300 px-2 py-1 rounded">
                                 {usr.role?.toUpperCase()}
                               </span>
                             </td>
                             <td className="p-4 text-center">
                               <div className="flex justify-center">
                                 {isActive ? (
                                   <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                 ) : (
                                   <Lock className="w-5 h-5 text-rose-500" />
                                 )}
                               </div>
                             </td>
                             <td className="p-4 text-right">
                               <button 
                                 onClick={() => toggleUserStatus(usr.id)}
                                 className={`text-xs px-3 py-1.5 rounded font-medium opacity-0 group-hover:opacity-100 transition-all ${
                                   isActive ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                 }`}
                               >
                                 {isActive ? 'Suspendre' : 'Activer'}
                               </button>
                             </td>
                           </tr>
                         )
                       })}
                     </tbody>
                   </table>
                 </div>
              )}

            </>
          )}
        </div>
      </main>

      {/* MODAL ESTABLISHMENT */}
      {showEstModal && (
        <div className="fixed inset-0 bg-[#0B0F19]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121927] border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setShowEstModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
              <XCircle className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-semibold text-white mb-6">Nouvel Établissement</h3>
            {estError && <div className="mb-4 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg">{estError}</div>}
            <form onSubmit={handleAddEstablishment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nom (Unique)*</label>
                <input 
                  type="text" 
                  value={newEstName}
                  onChange={(e) => setNewEstName(e.target.value)}
                  className="w-full bg-[#0F1523] border border-slate-800 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="Ex: Succursale Nord"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Adresse</label>
                <input 
                  type="text" 
                  value={newEstAddress}
                  onChange={(e) => setNewEstAddress(e.target.value)}
                  className="w-full bg-[#0F1523] border border-slate-800 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="Adresse complète"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowEstModal(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50">
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL USER */}
      {showUsrModal && (
        <div className="fixed inset-0 bg-[#0B0F19]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121927] border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setShowUsrModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
              <XCircle className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-semibold text-white mb-6">Inviter un Membre</h3>
            {usrError && <div className="mb-4 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg">{usrError}</div>}
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nom complet*</label>
                <input 
                  type="text" 
                  value={newUsrName}
                  onChange={(e) => setNewUsrName(e.target.value)}
                  className="w-full bg-[#0F1523] border border-slate-800 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Adresse Email*</label>
                <input 
                  type="email" 
                  value={newUsrEmail}
                  onChange={(e) => setNewUsrEmail(e.target.value)}
                  className="w-full bg-[#0F1523] border border-slate-800 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="jean.dupont@email.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Habilitation*</label>
                  <select 
                    value={newUsrRole}
                    onChange={(e) => setNewUsrRole(e.target.value as any)}
                    className="w-full bg-[#0F1523] border border-slate-800 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  >
                    <option value="analyst">Analyste</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Entité rattachée*</label>
                  <select 
                    value={newUsrEstId}
                    onChange={(e) => setNewUsrEstId(e.target.value)}
                    className="w-full bg-[#0F1523] border border-slate-800 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  >
                    <option value="" disabled>Sélectionner...</option>
                    {establishments.map(e => (
                      <option key={e.id} value={e.name}>{e.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowUsrModal(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50">
                   {isSubmitting ? 'Envoi...' : 'Inviter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
