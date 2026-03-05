import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  FileText, ArrowRight, Building2, Wallet,
  Plus, RefreshCcw, Activity, Zap, User,
  PieChartIcon
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Détection du mode sombre pour les graphiques
  const isDark = document.documentElement.classList.contains('dark');

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/history/`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Erreur stats dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // --- CALCULS ---
  const totalDossiers = data.length;
  const totalAmount = data.reduce((sum: number, app: any) => sum + Number(app.amount), 0);
  const prosCount = data.filter((app: any) => app.client_type === 'entreprise').length;
  const partCount = data.filter((app: any) => app.client_type === 'particulier').length;
  const favorableCount = data.filter((app: any) => app.decision === 'Favorable').length;
  const acceptanceRate = totalDossiers > 0 ? (favorableCount / totalDossiers) * 100 : 0;

  const pieData = [
    { name: 'Particuliers', value: partCount, color: isDark ? '#3b82f6' : '#60A5FA' },
    { name: 'Entreprises', value: prosCount, color: isDark ? '#6366f1' : '#818CF8' },
  ];

  const barData = [
    { name: 'Sept', volume: Math.floor(totalDossiers * 0.4) },
    { name: 'Oct', volume: Math.floor(totalDossiers * 0.6) },
    { name: 'Nov', volume: Math.floor(totalDossiers * 0.5) },
    { name: 'Déc', volume: Math.floor(totalDossiers * 0.8) },
    { name: 'Jan', volume: Math.floor(totalDossiers * 0.9) },
    { name: 'Fév', volume: totalDossiers },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 px-6 mt-10 animate-fade-in text-left">

      {/* HEADER ACTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-light text-slate-800 dark:text-slate-100 tracking-tight">
            Vue <span className="font-semibold text-slate-900 dark:text-white">d'ensemble</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            Analyse en temps réel du portefeuille crédit
          </p>
        </div>
        <div className="flex flex-row items-center gap-4 w-full md:w-auto">
          <button
            onClick={fetchStats}
            className="p-3 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm active:scale-95"
          >
            <RefreshCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/new"
            className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-slate-900 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-medium shadow-lg transition-all text-sm sm:text-base whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Analyse
          </Link>
        </div>
      </div>

      {/* --- BLOCS KPI --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { id: 'audits', label: 'Audits', val: totalDossiers, sub: 'Dossiers analysés', icon: FileText, color: 'blue' },
          { id: 'mix', label: 'RÉPARTITION', val: '', sub: '', icon: PieChartIcon, color: 'purple' },
          { id: 'volume', label: 'Volume', val: `${(totalAmount / 1000000).toFixed(2)} M€`, sub: 'Volume total', icon: Wallet, color: 'emerald' },
          { id: 'accept', label: 'Acceptation', val: `${acceptanceRate.toFixed(0)}%`, sub: "Taux d'acceptation", icon: Zap, color: 'amber' }

        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-[24px] p-6 border border-slate-50 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-blue-900/10 hover:-translate-y-1.5 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors bg-${kpi.color}-50 dark:bg-${kpi.color}-900/20 text-${kpi.color}-500 group-hover:bg-${kpi.color}-500 group-hover:text-white`}>
                <kpi.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</span>
            </div>

            {kpi.id === 'mix' ? (
              <div className="flex items-center gap-6 mt-1">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-500" /> {prosCount}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-1">PRO</span>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-500" /> {partCount}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-1">PART</span>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-3xl font-semibold text-slate-800 dark:text-white tracking-tight">{kpi.val}</h3>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 font-medium">{kpi.sub}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* --- GRAPHIQUES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-50 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">Typologie Clients</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-8">Répartition du portefeuille</p>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={index} fill={entry.color} strokeWidth={0} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '16px', border: 'none', color: isDark ? '#fff' : '#000' }}
                  itemStyle={{ color: isDark ? '#cbd5e1' : '#475569' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-6">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Area Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-50 dark:border-slate-800 shadow-sm lg:col-span-2 overflow-hidden">
          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">Activité</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-8">Volume mensuel des analyses</p>
          <div className="h-[300px] w-full -ml-4 sm:ml-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={barData}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#117fe6ff" stopOpacity={isDark ? 0.3 : 0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} strokeOpacity={isDark ? 0.3 : 0.6} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 11 }} dy={10} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- TABLEAU --- */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-50 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-medium text-slate-800 dark:text-white">Analyses Récentes</h3>
          <Link to="/history" className="text-blue-500 text-sm font-medium hover:underline flex items-center gap-1">
            Portfolio complet <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <th className="px-8 py-4 text-left">Client</th>
                <th className="px-8 py-4 text-left">Projet</th>
                <th className="px-8 py-4 text-right">Montant</th>
                <th className="px-8 py-4 text-center">Score IA</th>
                <th className="px-8 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {data.slice(0, 5).map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold ${app.client_type === 'entreprise' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-500'}`}>
                        {app.full_name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{app.full_name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-xs text-slate-400 dark:text-slate-500 font-medium uppercase">{app.project_type}</td>
                  <td className="px-8 py-5 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">{Number(app.amount).toLocaleString()} €</td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${app.score >= 80 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
                      app.score >= 50 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600'
                      }`}>
                      {app.score}/100
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button
                      onClick={() => navigate('/analysis/result', {
                        state: {
                          resultData: app,
                          clientInfo: { fullName: app.full_name, amount: app.amount },
                          clientType: app.client_type,
                          isFromPortfolio: true
                        }
                      })}
                      className="p-2 text-slate-300 dark:text-slate-600 hover:text-blue-500 transition-colors"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
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