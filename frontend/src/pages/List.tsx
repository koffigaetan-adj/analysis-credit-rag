import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ArrowUpRight, User, Building2, Eye,
  CheckCircle2, XCircle, Clock, AlertTriangle, Loader2, RefreshCcw,
  Trash2, Filter
} from 'lucide-react';

export default function Applications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'particulier' | 'entreprise'>('particulier');
  const [searchTerm, setSearchTerm] = useState('');
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/history/');
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

  const handleDelete = async (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation();
    if (window.confirm(`Supprimer définitivement le dossier de ${name} ?`)) {
      try {
        const response = await fetch(`http://127.0.0.1:8000/applications/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setApplications(applications.filter(app => app.id !== id));
        }
      } catch (error) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  const filteredApps = applications.filter(app => {
    const matchesTab = app.client_type === activeTab;
    const matchesSearch = app.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getStatusBadge = (decision: string) => {
    const baseClass = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-colors";
    switch (decision) {
      case 'Favorable':
        return <span className={`${baseClass} bg-emerald-50 text-emerald-600 border border-emerald-100`}><CheckCircle2 className="w-3 h-3" /> Favorable</span>;
      case 'Défavorable':
        return <span className={`${baseClass} bg-red-50 text-red-600 border border-red-100`}><XCircle className="w-3 h-3" /> Défavorable</span>;
      case 'Vigilance':
        return <span className={`${baseClass} bg-amber-50 text-amber-600 border border-amber-100`}><AlertTriangle className="w-3 h-3" /> Vigilance</span>;
      default:
        return <span className={`${baseClass} bg-blue-50 text-blue-600 border border-blue-100`}><Clock className="w-3 h-3" /> Analyse</span>;
    }
  };

  const handleViewAnalysis = (app: any) => {
    const analysisState = {
      resultData: { ...app },
      clientInfo: { fullName: app.full_name, amount: app.amount, email: app.email, phone: app.phone },
      clientType: app.client_type,
      specificProfile: app.project_type,
      isFromPortfolio: true // <--- FLAG CRUCIAL POUR CACHER LE BOUTON ENREGISTRER
    };
    navigate('/analysis/new', { state: analysisState });
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 px-6 mt-10 animate-fade-in">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-light text-slate-800 tracking-tight">
            Historique des <span className="font-semibold text-slate-900">Analyses</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Consultez et gérez l'ensemble de vos audits clients.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchApplications} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-500 hover:border-blue-100 transition-all shadow-sm active:scale-95">
            <RefreshCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => navigate('/new')} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-medium hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-100 transition-all duration-300">
            <ArrowUpRight className="w-4 h-4" /> Nouveau Dossier
          </button>
        </div>
      </div>

      {/* FILTERS & SEARCH BAR */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-50 p-3 mb-8 flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex bg-slate-50 p-1.5 rounded-2xl w-full lg:w-auto">
          <button onClick={() => setActiveTab('particulier')} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'particulier' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
            <User className="w-4 h-4" /> Particuliers
          </button>
          <button onClick={() => setActiveTab('entreprise')} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'entreprise' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
            <Building2 className="w-4 h-4" /> Entreprises
          </button>
        </div>
        
        <div className="relative w-full lg:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
          <input 
            type="text" 
            placeholder="Rechercher un client..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 text-sm focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-100 outline-none transition-all placeholder:text-slate-300" 
          />
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-[32px] shadow-[0_20px_60px_rgb(0,0,0,0.03)] border border-slate-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] uppercase text-slate-400 font-bold tracking-[0.1em]">
                <th className="px-8 py-6">Identité Client</th>
                <th className="px-8 py-6">Type de Projet</th>
                <th className="px-8 py-6 text-right">Montant Engagement</th>
                <th className="px-8 py-6 text-center">Indice IA</th>
                <th className="px-8 py-6 text-center">Décision</th>
                <th className="px-8 py-6 text-right">Gestion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={6} className="py-32 text-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto opacity-20" /></td></tr>
              ) : filteredApps.length > 0 ? (
                filteredApps.map((app) => (
                  <tr 
                    key={app.id} 
                    className="hover:bg-slate-50/80 transition-all duration-300 cursor-pointer group" 
                    onClick={() => handleViewAnalysis(app)}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold ${app.client_type === 'entreprise' ? 'bg-indigo-50 text-indigo-500' : 'bg-blue-50 text-blue-500'}`}>
                          {app.full_name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">{app.full_name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100/50 px-2.5 py-1 rounded-lg uppercase tracking-tight">{app.project_type || 'N/A'}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className="text-sm font-semibold text-slate-700">{Number(app.amount).toLocaleString()} €</span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`text-sm font-medium ${app.score >= 80 ? 'text-emerald-500' : app.score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                        {app.score}%
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      {getStatusBadge(app.decision)}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-1">
                        <button className="p-2.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all">
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, app.id, app.full_name)}
                          className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
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
                    <p className="text-slate-300 text-sm font-light italic">Aucun dossier ne correspond à votre recherche.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}