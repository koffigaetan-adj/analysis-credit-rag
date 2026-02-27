import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, AlertTriangle, Send, Bot, Download,
  XCircle, FileText, ShieldCheck,
  AlertOctagon, X, Save, LineChart, Sparkles,
  Trash2
} from 'lucide-react';
import Plot from 'react-plotly.js';

// --- TYPES ---
interface ClientInfo {
  fullName: string;
  amount: string | number;
  identifier?: string;
  projectType?: string;
  sector?: string;
  customSector?: string;
}

interface Financials {
  monthly_income?: number;
  monthly_expenses?: number;
  debt_ratio?: number;
  rest_to_live?: number;
  savings_capacity?: number;
  turnover?: number;
  net_profit?: number;
  ebitda?: number;
  equity?: number;
  debt_to_ebitda?: number;
}

interface ResultData {
  id?: number;
  score: number;
  decision?: string;
  payment_reliability?: string;
  account_trend?: string;
  financials?: Financials;
  risks?: string[];
  opportunities?: string[];
  summary?: string;
  ia_summary?: string;
  charts?: { gauge: any; pie: any; };
}

interface LocationState {
  resultData: ResultData;
  clientInfo: ClientInfo;
  clientType: 'particulier' | 'entreprise';
  specificProfile?: string;
  isFromPortfolio?: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AnalysisResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  const chatEndRef = useRef<HTMLDivElement>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (state?.clientInfo?.fullName) {
      const isComp = state.clientType === 'entreprise';
      setMessages([{
        role: 'assistant',
        content: isComp
          ? `Analyse de **${state.clientInfo.fullName}** terminée. Je peux vous éclairer sur la solvabilité de la structure.`
          : `Analyse de **${state.clientInfo.fullName}** terminée. Je suis à votre écoute pour détailler le profil de l'emprunteur.`
      }]);
    }
  }, [state?.clientInfo?.fullName, state?.clientType]);

  if (!state || !state.clientInfo || !state.resultData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-[32px] shadow-xl text-center border border-slate-100 font-sans">
          <AlertOctagon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800">Données manquantes</h2>
          <Link to="/new" className="text-blue-600 font-medium flex items-center justify-center gap-2 hover:underline mt-4">
            <ArrowLeft className="w-4 h-4" /> Retour au formulaire
          </Link>
        </div>
      </div>
    );
  }

  const { resultData, clientInfo, clientType } = state;
  const isHistoryMode = !!resultData.id && (state.isFromPortfolio === true);
  const isCompany = clientType === 'entreprise';

  const fins = resultData.financials || {};
  const decision = resultData.decision || "Vigilance";
  const reliability = resultData.payment_reliability || "Moyen";
  const trend = resultData.account_trend || "Stable";

  const plotlyFont = { family: 'Inter, sans-serif', size: 12, color: '#64748b' };

  // --- LOGIQUE DE RECONSTRUCTION DES GRAPHIQUES ---
  const getGaugeConfig = () => {
    const val = isCompany ? (fins.debt_to_ebitda || 0) : (fins.debt_ratio || 0);
    const r_max = isCompany ? 8 : 100;
    return {
      data: [{
        type: "indicator",
        mode: "gauge+number",
        value: val,
        number: { suffix: isCompany ? "x" : "%", font: { size: 24, color: '#1e293b' } },
        gauge: {
          axis: { range: [0, r_max], tickwidth: 1 },
          bar: { color: "#1e293b" },
          steps: [
            { range: [0, r_max * 0.33], color: "#10B981" },
            { range: [r_max * 0.33, r_max * 0.66], color: "#F59E0B" },
            { range: [r_max * 0.66, r_max], color: "#EF4444" }
          ]
        }
      }],
      layout: { autosize: true, margin: { l: 30, r: 30, t: 30, b: 30 }, paper_bgcolor: 'rgba(0,0,0,0)' }
    };
  };

  const handleDelete = async () => {
    if (window.confirm("Supprimer définitivement cette analyse ?")) {
      try {
        const response = await fetch(`http://127.0.0.1:8000/applications/${resultData.id}`, { method: 'DELETE' });
        if (response.ok) navigate('/history');
      } catch (error) { console.error(error); alert("Erreur réseau"); }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    const userMsg: Message = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, client_type: clientType, context: JSON.stringify({ analyse: resultData, client: clientInfo }) }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response || "Erreur serveur." }]);
    } catch { setMessages(prev => [...prev, { role: 'assistant', content: "Erreur réseau." }]); } finally { setIsTyping(false); }
  };

  const getDecisionStyle = (dec: string) => {
    if (dec === 'Favorable') return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', icon: <CheckCircle className="w-8 h-8 text-emerald-500" /> };
    if (dec === 'Vigilance') return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', icon: <AlertTriangle className="w-8 h-8 text-amber-500" /> };
    return { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', icon: <XCircle className="w-8 h-8 text-red-500" /> };
  };

  const decisionStyle = getDecisionStyle(decision);

  return (
    <div className="max-w-7xl mx-auto pb-20 px-6 mt-10 animate-fade-in text-left font-sans">
      <div id="section-to-print" className="space-y-10">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <button onClick={() => navigate(isHistoryMode ? '/history' : '/new')} className="text-slate-400 hover:text-blue-600 flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4 transition-all">
              <ArrowLeft className="w-3.5 h-3.5" /> {isHistoryMode ? 'Historique' : 'Retour'}
            </button>
            <h1 className="text-3xl font-light text-slate-800 tracking-tight">
              Synthèse <span className="font-semibold text-slate-900">{isCompany ? 'Entreprise' : 'Client'}</span>
            </h1>
            <p className="text-slate-500 font-medium">{clientInfo.fullName}</p>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            <button onClick={() => window.print()} className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 shadow-sm transition-all">
              <Download className="w-4 h-4" />
            </button>
            {isHistoryMode ? (
              <button onClick={handleDelete} className="px-6 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-sm font-bold hover:bg-rose-600 hover:text-white transition-all flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            ) : (
              <button onClick={() => setIsSaved(true)} className={`px-6 py-2.5 rounded-2xl text-sm font-medium transition-all shadow-lg flex items-center ${isSaved ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-blue-600'}`}>
                {isSaved ? <CheckCircle className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />} {isSaved ? 'Enregistré' : 'Enregistrer'}
              </button>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`rounded-[28px] p-6 border shadow-sm ${decisionStyle.bg} ${decisionStyle.border}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Décision IA</p>
            <div className="flex items-center gap-3">{decisionStyle.icon}<h2 className={`text-2xl font-bold ${decisionStyle.text}`}>{decision}</h2></div>
          </div>
          <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm group">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Score Solvabilité</p>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all"><Sparkles className="w-6 h-6 text-blue-600 group-hover:text-white" /></div>
              <h3 className="text-3xl font-bold text-slate-800">{resultData.score}<span className="text-slate-300 text-sm ml-1">/100</span></h3>
            </div>
          </div>
          <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm group">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Fiabilité</p>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all"><ShieldCheck className="w-6 h-6 text-emerald-600 group-hover:text-white" /></div>
              <h3 className="text-xl font-bold text-slate-700">{reliability}</h3>
            </div>
          </div>
          <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm group">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Tendance</p>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all"><LineChart className="w-6 h-6 text-indigo-600 group-hover:text-white" /></div>
              <h3 className="text-xl font-bold text-slate-700">{trend}</h3>
            </div>
          </div>
        </div>

        {/* GRAPHIQUES RECONSTRUITS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Structure Financière</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[250px]">
              <Plot
                data={getGaugeConfig().data as any}
                layout={{ ...getGaugeConfig().layout, font: plotlyFont } as any}
                style={{ width: "100%", height: "100%" }}
                useResizeHandler
                config={{ displayModeBar: false }}
              />
              <div className="flex flex-col justify-center space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{isCompany ? "Dette / EBE" : "Ratio Dette"}</p>
                  <p className="text-2xl font-bold text-slate-800">{isCompany ? `${fins.debt_to_ebitda || 0}x` : `${fins.debt_ratio || 0}%`}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{isCompany ? "Capitaux Propres" : "Épargne estimée"}</p>
                  <p className="text-2xl font-bold text-slate-800">{((isCompany ? fins.equity : fins.savings_capacity) || 0).toLocaleString()} €</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Analyse des Flux</h3>
            <div className="h-[250px]">
              <Plot
                data={[{
                  type: "waterfall",
                  measure: ["relative", "relative", "total"],
                  x: isCompany ? ["C.A.", "Charges", "R. Net"] : ["Revenus", "Charges", "Reste à vivre"],
                  y: isCompany
                    ? [fins.turnover || 0, -((fins.turnover || 0) - (fins.net_profit || 0)), fins.net_profit || 0]
                    : [fins.monthly_income || 0, -(fins.monthly_expenses || 0), fins.rest_to_live || 0],
                  connector: { line: { color: "#e2e8f0" } },
                  decreasing: { marker: { color: "#EF4444" } },
                  increasing: { marker: { color: "#10B981" } },
                  totals: { marker: { color: "#3B82F6" } }
                } as any]}
                layout={{ autosize: true, margin: { l: 40, r: 20, t: 10, b: 40 }, paper_bgcolor: 'white', font: plotlyFont, xaxis: { showgrid: false }, yaxis: { showgrid: true, gridcolor: '#f1f5f9' } }}
                style={{ width: "100%", height: "100%" }}
                useResizeHandler
                config={{ displayModeBar: false }}
              />
            </div>
          </div>
        </div>

        {/* SYNTHÈSE ET RISQUES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-sm p-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" /> Note d'Audit
            </h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm italic">
              {resultData.ia_summary || resultData.summary || "Aucune note disponible."}
            </p>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-[28px] border border-red-50 p-6 shadow-sm">
              <h3 className="text-xs font-bold text-red-500 uppercase mb-4 flex items-center gap-2"><AlertOctagon className="w-4 h-4" /> Risques</h3>
              <ul className="space-y-2">
                {(resultData.risks || []).map((r: any, i: number) => <li key={i} className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">• {r}</li>)}
              </ul>
            </div>
            <div className="bg-white rounded-[28px] border border-emerald-50 p-6 shadow-sm">
              <h3 className="text-xs font-bold text-emerald-500 uppercase mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Atouts</h3>
              <ul className="space-y-2">
                {(resultData.opportunities || []).map((o: any, i: number) => <li key={i} className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">✓ {o}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CHATBOT */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end print:hidden">
        {!isChatOpen ? (
          <button onClick={() => setIsChatOpen(true)} className="w-16 h-16 rounded-3xl bg-slate-900 text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-all">
            <Bot className="w-8 h-8" />
          </button>
        ) : (
          <div className="w-[400px] h-[550px] bg-white rounded-[32px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-scale-in origin-bottom-right">
            <div className="px-6 py-4 bg-slate-900 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest"><Sparkles className="w-4 h-4 text-blue-400" /> Assistant Fluxia</div>
              <button onClick={() => setIsChatOpen(false)}><X className="w-5 h-5 opacity-50 hover:opacity-100" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 shadow-sm border border-slate-100'}`}>{msg.content}</div>
                </div>
              ))}
              {isTyping && <div className="text-[10px] text-slate-400 italic">L'IA analyse votre question...</div>}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
              <input value={inputMessage} onChange={e => setInputMessage(e.target.value)} placeholder="Posez une question..." className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20" />
              <button type="submit" disabled={isTyping} className="p-2 bg-blue-600 rounded-xl text-white hover:bg-blue-700 transition-all"><Send className="w-4 h-4" /></button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}