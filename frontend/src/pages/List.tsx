import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, User, Building2, Eye,
  CheckCircle2, XCircle, Clock, AlertTriangle, Loader2, RefreshCcw,
  Trash2, Plus
} from 'lucide-react';
import AnimatedModal from '../components/AnimatedModal';

export default function Applications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'particulier' | 'entreprise'>('particulier');
  const [searchTerm, setSearchTerm] = useState('');
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // État Modale de Suppression
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState<{ id: number, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/history/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error("Erreur lors de la récupération :", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const confirmDelete = (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation();
    setAppToDelete({ id, name });
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!appToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/applications/${appToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        setApplications(applications.filter(app => app.id !== appToDelete.id));
        setDeleteModalOpen(false);
        setAppToDelete(null);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression");
      alert("Erreur réseau lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredApps = applications.filter(app => {
    const matchesTab = app.client_type === activeTab;
    const matchesSearch = app.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getStatusBadge = (decision: string) => {
    const baseClass = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-colors border";
    switch (decision) {
      case 'Favorable':
        return <span className={`${baseClass} bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800`}><CheckCircle2 className="w-3 h-3" /> Favorable</span>;
      case 'Défavorable':
        return <span className={`${baseClass} bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800`}><XCircle className="w-3 h-3" /> Défavorable</span>;
      case 'Vigilance':
        return <span className={`${baseClass} bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800`}><AlertTriangle className="w-3 h-3" /> Vigilance</span>;
      default:
        return <span className={`${baseClass} bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800`}><Clock className="w-3 h-3" /> Analyse</span>;
    }
  };

  const handleViewAnalysis = (app: any) => {
    const analysisState = {
      resultData: { ...app },
      clientInfo: { fullName: app.full_name, amount: app.amount, email: app.email, phone: app.phone },
      clientType: app.client_type,
      specificProfile: app.project_type,
      isFromPortfolio: true
    };
    navigate('/analysis/result', { state: analysisState });
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 px-6 mt-10 animate-fade-in text-left">

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-light text-slate-800 dark:text-slate-100 tracking-tight transition-colors">
            Historique des <span className="font-semibold text-slate-900 dark:text-white">Analyses</span>
          </h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Consultez et gérez l'ensemble de vos audits clients.</p>
        </div>
        <div className="flex flex-row items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
          <button
            onClick={fetchApplications}
            className="p-3 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm active:scale-95"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/new')}
            className="px-5 py-2.5 bg-blue-600 dark:bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 dark:hover:bg-blue-500 shadow-lg shadow-blue-100 dark:shadow-blue-900/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Analyse
          </button>
        </div>
      </div>

      {/* FILTERS & SEARCH BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-800 p-3 mb-8 flex flex-col lg:flex-row justify-between items-center gap-4 transition-colors">
        <div className="flex bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl w-full lg:w-auto">
          <button onClick={() => setActiveTab('particulier')} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'particulier' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
            <User className="w-4 h-4" /> Particuliers
          </button>
          <button onClick={() => setActiveTab('entreprise')} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'entreprise' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
            <Building2 className="w-4 h-4" /> Entreprises
          </button>
        </div>

        <div className="relative w-full lg:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 focus:border-blue-100 dark:focus:border-blue-900 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-50 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-50 dark:border-slate-800 text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold tracking-[0.1em]">
                <th className="px-8 py-6">Identité Client</th>
                <th className="px-8 py-6">Type de Projet</th>
                <th className="px-8 py-6 text-right">Montant Engagement</th>
                <th className="px-8 py-6 text-center">Indice IA</th>
                <th className="px-8 py-6 text-center">Décision</th>
                <th className="px-8 py-6 text-right">Gestion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {isLoading ? (
                <tr><td colSpan={6} className="py-32 text-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto opacity-20" /></td></tr>
              ) : filteredApps.length > 0 ? (
                filteredApps.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all duration-300 cursor-pointer group"
                    onClick={() => handleViewAnalysis(app)}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold ${app.client_type === 'entreprise' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-500'}`}>
                          {app.full_name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{app.full_name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100/50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg uppercase tracking-tight border border-transparent dark:border-slate-800">{app.project_type || 'N/A'}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{Number(app.amount).toLocaleString()} €</span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`text-sm font-bold ${app.score >= 80 ? 'text-emerald-500' : app.score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                        {app.score}%
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      {getStatusBadge(app.decision)}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-1">
                        <button className="p-2.5 text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => confirmDelete(e, app.id, app.full_name)}
                          className="p-2.5 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-32 text-center">
                    <p className="text-slate-300 dark:text-slate-600 text-sm font-light italic transition-colors">Aucun dossier ne correspond à votre recherche.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatedModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={executeDelete}
        title="Supprimer ce dossier ?"
        message={`Vous êtes sur le point de supprimer définitivement le dossier d'analyse de ${appToDelete?.name}. Cette action est irréversible.`}
        type="danger"
        confirmText="Oui, Supprimer"
        isLoading={isDeleting}
      />
    </div>
  );
}