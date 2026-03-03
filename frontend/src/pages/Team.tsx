import { UserPlus, Mail, Shield, User, Trash2, Edit3, Search, X, Lock, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

// Interfaces pour le typage
interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  establishment?: string;
  email: string;
  role: string;
  avatar_url?: string;
  is_active: boolean;
  is_first_login: boolean;
}

export default function Team() {
  const { user, token } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // États pour les modales
  const [editingUser, setEditingUser] = useState<TeamMember | null>(null);
  const [deletingUser, setDeletingUser] = useState<TeamMember | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [adminPassword, setAdminPassword] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Formulaires
  const [editForm, setEditForm] = useState({ prenom: '', nom: '', email: '', role: 'ANALYST', establishment: '' });
  const [createForm, setCreateForm] = useState({ prenom: '', nom: '', email: '', role: 'ANALYST', password: '', establishment: '' });

  // Récupérer les utilisateurs
  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:8000/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erreur lors de la récupération des utilisateurs');
      const data = await res.json();

      // ADMIN and SUPER_ADMIN will fetch users and see everyone
      setMembers(data);

    } catch (err) {
      console.error(err);
      setErrorMsg("Impossible de charger les membres.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  // Actions
  const handleEditClick = (member: TeamMember) => {
    setEditingUser(member);
    setEditForm({ prenom: member.first_name, nom: member.last_name, email: member.email, role: member.role, establishment: member.establishment || '' });
    setModalError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setModalError(null);
    setModalLoading(true);
    try {
      const payload = {
        first_name: editForm.prenom.trim(),
        last_name: editForm.nom.trim(),
        establishment: editForm.establishment.trim(),
        email: editForm.email,
        role: editForm.role
      };
      const res = await fetch(`http://localhost:8000/auth/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Erreur de mise à jour");
      }

      await fetchUsers(); // Recharger la liste
      setEditingUser(null);
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteClick = (member: TeamMember) => {
    setDeletingUser(member);
    setAdminPassword('');
    setModalError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    if (!adminPassword) {
      setModalError("Veuillez saisir votre mot de passe pour confirmer.");
      return;
    }
    setModalError(null);
    setModalLoading(true);

    try {
      const res = await fetch(`http://localhost:8000/auth/users/${deletingUser.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: adminPassword })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Erreur de suppression");
      }

      await fetchUsers();
      setDeletingUser(null);
      setAdminPassword('');
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/auth/users/${userId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Erreur lors de la modification du statut');
      await fetchUsers();
    } catch (err: any) {
      console.error(err);
      // Optionnel : afficher une erreur via toast si implémenté
    }
  };

  // Formatage du rôle
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Administrateur';
      case 'ADMIN': return 'Administrateur';
      default: return 'Analyste';
    }
  };

  const handleCreateUser = async () => {
    setModalError(null);
    setModalLoading(true);
    try {
      const payload = {
        first_name: createForm.prenom.trim(),
        last_name: createForm.nom.trim(),
        establishment: createForm.establishment.trim(),
        email: createForm.email,
        password: createForm.password,
        role: createForm.role
      };

      const res = await fetch('http://localhost:8000/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Erreur lors de la création");
      }

      await fetchUsers();
      setShowCreateModal(false);
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  if (user?.role === 'ANALYST') {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-slate-500 animate-in fade-in">
        <Shield className="w-20 h-20 mb-6 text-slate-200 dark:text-slate-800" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Accès Non Autorisé</h2>
        <p className="mt-2 text-sm max-w-sm text-center">Vous n'avez pas les permissions nécessaires pour accéder à la gestion d'équipe. Veuillez contacter un administrateur.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 px-6 mt-10 space-y-6 animate-fade-in text-left">
      {/* HEADER SIMPLE & PRO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-slate-800 dark:text-slate-100 tracking-tight transition-colors">
            Liste de <span className="font-semibold text-slate-900 dark:text-white">l'équipe</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Gérez les accès et les collaborateurs de votre instance Fluxia</p>
        </div>

        <button
          onClick={() => {
            setShowCreateModal(true);
            setCreateForm({ prenom: '', nom: '', email: '', role: 'ANALYST', password: '', establishment: '' });
            setModalError(null);
          }}
          className="px-5 py-2.5 bg-blue-600 dark:bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 dark:hover:bg-blue-500 shadow-lg shadow-blue-100 dark:shadow-blue-900/20 transition-all flex items-center gap-2 active:scale-95">
          <UserPlus className="w-4 h-4" />
          Inviter un membre
        </button>
      </div>

      {/* STATS SIMPLES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Membres", value: members.length, icon: <User className="w-5 h-5" />, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Super Admins", value: members.filter(m => m.role === 'SUPER_ADMIN').length, icon: <Shield className="w-5 h-5" />, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
          { label: "Administrateurs", value: members.filter(m => m.role === 'ADMIN').length, icon: <Shield className="w-5 h-5" />, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Analystes", value: members.filter(m => m.role === 'ANALYST').length, icon: <Edit3 className="w-5 h-5" />, color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-800/50" }
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
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Membre</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Rôle</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {isLoading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">Chargement des membres...</td></tr>
              ) : errorMsg ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-sm font-bold text-rose-500">{errorMsg}</td></tr>
              ) : members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-default">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-sm overflow-hidden">
                        {member.avatar_url ? (
                          <img src={`http://localhost:8000${member.avatar_url}`} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-blue-500 font-bold text-xs uppercase">
                            {member.first_name[0]}{member.last_name[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {member.first_name} {member.last_name}
                          {member.id === user?.id && <span className="text-slate-400 font-normal ml-1">(Vous)</span>}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {member.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-[11px] font-semibold rounded-lg border ${member.role === 'SUPER_ADMIN' ? 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-400' : member.role === 'ADMIN' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}>
                      {getRoleLabel(member.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {/* Pastille de couleur */}
                      <div className={`w-2 h-2 rounded-full ${!member.is_active ? 'bg-rose-500' : member.is_first_login ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${!member.is_active ? 'text-rose-600 dark:text-rose-400' : member.is_first_login ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {!member.is_active ? 'Inactif' : member.is_first_login ? 'Invitation en cours' : 'Actif'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">

                      {/* Bouton Toggle Status (uniquement super admin ou admin et pas soi-même, admin restreint aux analystes) */}
                      {member.id !== user?.id && (
                        user?.role === 'SUPER_ADMIN' ||
                        (user?.role === 'ADMIN' && member.role === 'ANALYST')
                      ) && (
                          <button
                            onClick={() => handleToggleStatus(member.id)}
                            className={`p-2 rounded-lg transition-all ${member.is_active ? 'text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30' : 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}`}
                            title={member.is_active ? "Désactiver ce compte" : "Réactiver ce compte"}
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        )}

                      {/* Bouton Modifier (uniquement super admin ou admin restreint aux analystes, ou soi-même) */}
                      {(
                        user?.role === 'SUPER_ADMIN' ||
                        member.id === user?.id ||
                        (user?.role === 'ADMIN' && member.role === 'ANALYST')
                      ) && (
                          <button
                            onClick={() => handleEditClick(member)}
                            className="p-2 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm rounded-lg text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                            title="Modifier les infos"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                      {/* Bouton Supprimer (uniquement super admin ou admin restreint aux analystes, pas soi-même) */}
                      {member.id !== user?.id && (
                        user?.role === 'SUPER_ADMIN' ||
                        (user?.role === 'ADMIN' && member.role === 'ANALYST')
                      ) && (
                          <button
                            onClick={() => handleDeleteClick(member)}
                            className="p-2 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-500 transition-all"
                            title="Supprimer ce membre"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL : ÉDITION MEMBRE */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-500" />
                Modifier le membre
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Prénom</label>
                  <input
                    type="text"
                    value={editForm.prenom}
                    onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Nom</label>
                  <input
                    type="text"
                    value={editForm.nom}
                    onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>

              {user?.role === 'SUPER_ADMIN' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Établissement</label>
                  <input
                    type="text"
                    value={editForm.establishment}
                    onChange={(e) => setEditForm({ ...editForm, establishment: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Rôle</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  disabled={editingUser.role === 'SUPER_ADMIN'}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  <option value="ANALYST">Analyste</option>
                  {user?.role === 'SUPER_ADMIN' && (
                    <>
                      <option value="ADMIN">Administrateur</option>
                      <option value="SUPER_ADMIN">Super Administrateur</option>
                    </>
                  )}
                </select>
                {editingUser.role === 'SUPER_ADMIN' && (
                  <p className="text-[10px] text-amber-500 mt-1 ml-1">Le rôle d'un Super Administrateur ne peut pas être modifié.</p>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                disabled={modalLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={modalLoading || !editForm.prenom || !editForm.nom || !editForm.email}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-md hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {modalLoading ? 'Sauvegarde...' : <><Save className="w-4 h-4" /> Enregistrer</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL : SUPPRESSION MEMBRE (REQUIERT MDP) */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-rose-100 dark:border-rose-900/30 flex justify-between items-center bg-rose-50/50 dark:bg-rose-900/10">
              <h3 className="text-lg font-bold text-rose-600 dark:text-rose-500 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Supprimer {deletingUser.first_name} ?
              </h3>
              <button
                onClick={() => setDeletingUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Cette action est réversible, mais supprimera définitivement l'accès de cet utilisateur au système. <br />
                <strong>Veuillez entrer votre mot de passe pour confirmer.</strong>
              </p>

              {modalError && (
                <div className="p-3 mb-4 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  {modalError}
                </div>
              )}

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Votre mot de passe"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmDelete()}
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-rose-500/50 outline-none transition-all"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                disabled={modalLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={modalLoading || !adminPassword}
                className="px-6 py-2 bg-rose-600 text-white rounded-lg font-bold text-sm shadow-md shadow-rose-500/20 hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {modalLoading ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL : CRÉATION MEMBRE */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-blue-50/30 dark:bg-blue-900/10">
              <h3 className="text-lg font-bold text-blue-600 dark:text-blue-500 flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Inviter un membre
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Créez un compte pour un nouveau collaborateur. Il devra modifier son mot de passe à la première connexion.
              </p>

              {modalError && (
                <div className="p-3 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Prénom</label>
                  <input
                    type="text"
                    value={createForm.prenom}
                    onChange={(e) => setCreateForm({ ...createForm, prenom: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Nom</label>
                  <input
                    type="text"
                    value={createForm.nom}
                    onChange={(e) => setCreateForm({ ...createForm, nom: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>

              {user?.role === 'SUPER_ADMIN' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Établissement</label>
                  <input
                    type="text"
                    value={createForm.establishment}
                    onChange={(e) => setCreateForm({ ...createForm, establishment: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Mot de passe provisoire</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Devra être modifié à la connexion"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Rôle</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                >
                  <option value="ANALYST">Analyste</option>
                  {user?.role === 'SUPER_ADMIN' && (
                    <>
                      <option value="ADMIN">Administrateur</option>
                      <option value="SUPER_ADMIN">Super Administrateur</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                disabled={modalLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleCreateUser}
                disabled={modalLoading || !createForm.prenom || !createForm.nom || !createForm.email || !createForm.password}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-md hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {modalLoading ? 'Création...' : <><UserPlus className="w-4 h-4" /> Créer le compte</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}