import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Send,
  Loader2
} from 'lucide-react';

export default function AnalysisDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'summary' | 'financials' | 'chat'>('summary');
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- CHARGEMENT DES VRAIES DONNÉES DEPUIS L'API ---
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/history/`);
        const data = await response.json();
        // On trouve le dossier spécifique par son ID
        const currentApp = data.find((a: any) => a.id === parseInt(id || '0'));
        setApplication(currentApp);
      } catch (error) {
        console.error("Erreur lors du chargement des détails:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!application) {
    return <div className="p-20 text-center text-gray-500 dark:text-gray-400">Dossier non trouvé dans la base de données.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/portfolio')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
            {application.full_name}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Type: {application.project_type} • ID: #{application.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLONNE GAUCHE : DOCUMENT */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Analyse Documentaire</h2>
            </div>

            {/* RÉSUMÉ IA (IA_SUMMARY) */}
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3">Synthèse Décisionnelle</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium italic">
                "{application.ia_summary || "Aucune synthèse disponible pour ce dossier."}"
              </p>
            </div>

            <div className="aspect-video bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
              <div className="text-center z-10">
                <FileText className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Visualiseur PDF sécurisé</p>
              </div>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : SCORES & TABS */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Score IA</h2>
              <div className={`px-4 py-2 rounded-xl font-black text-xl shadow-sm ${application.score >= 70 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                application.score >= 40 ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}>
                {application.score}/100
              </div>
            </div>

            {/* TABS MENU */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6">
              {['summary', 'financials', 'chat'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                >
                  {tab === 'summary' ? 'Analyse' : tab === 'financials' ? 'Données' : 'Assistant'}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: RISQUES ET ATOUTS */}
            {activeTab === 'summary' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Atouts du dossier</h3>
                  </div>
                  <ul className="space-y-3">
                    {application.opportunities?.length > 0 ? application.opportunities.map((opt: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm font-bold text-slate-700 dark:text-slate-300 bg-emerald-50/50 dark:bg-emerald-500/10 p-3 rounded-xl border border-emerald-100/50 dark:border-emerald-500/20">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{opt}</span>
                      </li>
                    )) : <p className="text-xs text-slate-400 dark:text-slate-500 italic">Aucun atout listé.</p>}
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingDown className="w-4 h-4 text-rose-500" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Points de Vigilance</h3>
                  </div>
                  <ul className="space-y-3">
                    {application.risks?.length > 0 ? application.risks.map((risk: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm font-bold text-slate-700 dark:text-slate-300 bg-rose-50/50 dark:bg-rose-500/10 p-3 rounded-xl border border-rose-100/50 dark:border-rose-500/20">
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span>{risk}</span>
                      </li>
                    )) : <p className="text-xs text-slate-400 dark:text-slate-500 italic">Aucun risque listé.</p>}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'financials' && (
              <div className="space-y-3 animate-in slide-in-from-bottom-2">
                {Object.entries(application.financials || {}).map(([key, val]: any, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-tight">{key.replace('_', ' ')}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{typeof val === 'number' ? val.toLocaleString() : val}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="space-y-4 animate-in slide-in-from-bottom-2">
                <div className="h-64 overflow-y-auto space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-blue-50 dark:border-slate-700">
                    Posez vos questions sur la solvabilité de {application.full_name}.
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Question..."
                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button className="p-3 bg-slate-900 dark:bg-blue-600 text-white rounded-xl hover:bg-blue-600 dark:hover:bg-blue-700 transition-all">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ACTIONS FINALES */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 p-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 text-center">Décision Finale</h3>
            <div className="flex flex-col gap-3">
              <button className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" /> Approuver le Crédit
              </button>
              <button className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all flex items-center justify-center gap-2">
                <XCircle className="w-4 h-4" /> Rejeter le Dossier
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}