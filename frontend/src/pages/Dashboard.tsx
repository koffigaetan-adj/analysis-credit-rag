import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  FileText, ArrowRight, Building2, User, Wallet, 
  CheckCircle2, Plus, RefreshCcw, Activity, Zap, TrendingUp
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- RÉCUPÉRATION DES DONNÉES RÉELLES ---
  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/history/');
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

  // --- CALCULS DES INDICATEURS ---
  const totalDossiers = data.length;
  const totalAmount = data.reduce((sum, app) => sum + Number(app.amount), 0);
  const prosCount = data.filter(app => app.client_type === 'entreprise').length;
  const partCount = data.filter(app => app.client_type === 'particulier').length;
  const favorableCount = data.filter(app => app.decision === 'Favorable').length;
  const acceptanceRate = totalDossiers > 0 ? (favorableCount / totalDossiers) * 100 : 0;

  const pieData = [
    { name: 'Particuliers', value: partCount, color: '#60A5FA' },
    { name: 'Entreprises', value: prosCount, color: '#818CF8' },
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
    <div className="max-w-7xl mx-auto space-y-10 pb-20 px-6 mt-10 animate-fade-in">
      
      {/* HEADER ACTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-light text-slate-800 tracking-tight">
            Vue <span className="font-semibold text-slate-900">d'ensemble</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" /> 
            Analyse en temps réel du portefeuille crédit
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchStats}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm active:scale-95"
          >
            <RefreshCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Link 
            to="/new" 
            className="flex items-center gap-2 bg-slate-900 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl font-medium shadow-lg shadow-slate-200 transition-all hover:-translate-y-1 active:translate-y-0"
          >
            <Plus className="w-5 h-5" />
            Nouveau Dossier
          </Link>
        </div>
      </div>

      {/* --- BLOC KPI AVEC EFFET D'OMBRE ET HOVER --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI: Total Dossiers */}
        <div className="bg-white rounded-[24px] p-6 border border-slate-50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:-translate-y-1.5 transition-all duration-300 group cursor-default">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Audits</span>
          </div>
          <h3 className="text-3xl font-semibold text-slate-800 tracking-tight">{totalDossiers}</h3>
          <p className="text-slate-400 text-xs mt-1 font-medium">Dossiers analysés</p>
        </div>

        {/* KPI: Volume Financier */}
        <div className="bg-white rounded-[24px] p-6 border border-slate-50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:-translate-y-1.5 transition-all duration-300 group cursor-default">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">+4%</span>
          </div>
          <h3 className="text-3xl font-semibold text-slate-800 tracking-tight">{(totalAmount / 1000000).toFixed(2)} M€</h3>
          <p className="text-slate-400 text-xs mt-1 font-medium">Volume financier total</p>
        </div>

        {/* KPI: Mix Client */}
        <div className="bg-white rounded-[24px] p-6 border border-slate-50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:-translate-y-1.5 transition-all duration-300 group cursor-default">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secteur</div>
          </div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-semibold text-slate-700">{prosCount} Entreprises</span>
            <span className="text-xs text-slate-400">{partCount} Part.</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-400 transition-all duration-1000" style={{ width: `${(prosCount / totalDossiers) * 100}%` }} />
          </div>
        </div>

        {/* KPI: Acceptation */}
        <div className="bg-white rounded-[24px] p-6 border border-slate-50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:-translate-y-1.5 transition-all duration-300 group cursor-default">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
              <Zap className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Score IA</span>
          </div>
          <h3 className="text-3xl font-semibold text-slate-800 tracking-tight">{acceptanceRate.toFixed(0)}%</h3>
          <p className="text-slate-400 text-xs mt-1 font-medium">Taux d'acceptation</p>
        </div>
      </div>

      {/* --- GRAPHIQUES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Graphique 1: Pie Chart */}
        <div className="bg-white rounded-[32px] p-8 border border-slate-50 shadow-sm lg:col-span-1">
          <h3 className="text-lg font-medium text-slate-800 mb-2">Typologie Clients</h3>
          <p className="text-sm text-slate-400 mb-8">Répartition du portefeuille</p>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={index} fill={entry.color} strokeWidth={0} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-6">
             {pieData.map(item => (
               <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-medium text-slate-500">{item.name}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Graphique 2: Area Chart */}
        <div className="bg-white rounded-[32px] p-8 border border-slate-50 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-medium text-slate-800">Activité Commerciale</h3>
              <p className="text-sm text-slate-400">Volume mensuel des analyses</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={barData}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} dy={10} />
                <YAxis hide />
                <Tooltip cursor={{ stroke: '#f63ba2ff', strokeWidth: 1 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.05)' }} />
                <Area type="monotone" dataKey="volume" stroke="#3b4ef6ff" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- TABLEAU DERNIERS DOSSIERS --- */}
      <div className="bg-white rounded-[32px] border border-slate-50 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-lg font-medium text-slate-800">Analyses Récentes</h3>
          <Link to="/List" className="text-blue-500 text-sm font-medium hover:underline flex items-center gap-1 group">
            Portfolio complet <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-4 text-left">Client</th>
                <th className="px-8 py-4 text-left">Projet</th>
                <th className="px-8 py-4 text-right">Montant</th>
                <th className="px-8 py-4 text-center">Score IA</th>
                <th className="px-8 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.slice(0, 5).map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold ${app.client_type === 'entreprise' ? 'bg-indigo-50 text-indigo-500' : 'bg-blue-50 text-blue-500'}`}>
                        {app.full_name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{app.full_name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-xs text-slate-400 font-medium uppercase tracking-tight">{app.project_type}</td>
                  <td className="px-8 py-5 text-right text-sm font-semibold text-slate-700">{Number(app.amount).toLocaleString()} €</td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                      app.score >= 80 ? 'bg-emerald-50 text-emerald-600' : 
                      app.score >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {app.score}/100
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button onClick={() => navigate('/analysis/new', { state: { resultData: app, clientInfo: { fullName: app.full_name, amount: app.amount }, clientType: app.client_type, isFromPortfolio: true }})} className="p-2 text-slate-300 hover:text-blue-500 transition-colors">
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