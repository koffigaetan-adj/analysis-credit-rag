import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, AlertTriangle, Send, Bot, Download,
  XCircle, FileText, ShieldCheck,
  AlertOctagon, MessageCircle, X, Save, PiggyBank, LineChart, Sparkles,
  BarChart3
} from 'lucide-react';
import Plot from 'react-plotly.js';

// --- TYPES MIS À JOUR POUR LE MODE ENTREPRISE ---
interface ClientInfo {
  fullName: string;
  amount: string | number;
  identifier?: string;
  projectType?: string;
  sector?: string;
  customSector?: string;
}

interface Financials {
  // Particulier
  monthly_income?: number;
  monthly_expenses?: number;
  debt_ratio?: number;
  rest_to_live?: number;
  savings_capacity?: number;
  // Entreprise
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          ? `Analyse financière de l'entité **${state.clientInfo.fullName}** terminée. Je peux vous éclairer sur la solvabilité de la structure.`
          : `Analyse de **${state.clientInfo.fullName}** terminée. Je suis à votre écoute pour détailler le profil de l'emprunteur.`
      }]);
    }
  }, [state?.clientInfo?.fullName, state?.clientType]);

  if (!state || !state.clientInfo || !state.resultData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-[32px] shadow-xl text-center border border-slate-100">
          <AlertOctagon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800">Données manquantes</h2>
          <Link to="/new" className="text-blue-600 font-medium flex items-center justify-center gap-2 hover:underline">
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
        body: JSON.stringify({
          message: userMsg.content,
          client_type: clientType,
          context: JSON.stringify({ analyse: resultData, client: clientInfo })
        }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Service indisponible." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const getDecisionStyle = (dec: string) => {
    if (dec === 'Favorable') return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', icon: <CheckCircle className="w-8 h-8 text-emerald-500" /> };
    if (dec === 'Vigilance') return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', icon: <AlertTriangle className="w-8 h-8 text-amber-500" /> };
    return { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', icon: <XCircle className="w-8 h-8 text-red-500" /> };
  };

  const decisionStyle = getDecisionStyle(decision);
  const plotlyFont = { family: 'Arial, sans-serif', size: 12, color: '#334155' };

  return (
    <div className="max-w-7xl mx-auto pb-20 px-6 mt-10 animate-fade-in relative font-sans text-left">
      <div id="section-to-print" className="space-y-10">

        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <button
              onClick={() => isHistoryMode ? navigate('/history') : navigate('/new')}
              className="text-slate-400 hover:text-blue-500 flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4 transition-all print:hidden"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> {isHistoryMode ? 'Historique' : 'Retour'}
            </button>
            <h1 className="text-3xl font-light text-slate-800 tracking-tight not-italic">
              Synthèse <span className="font-semibold text-slate-900">{isCompany ? 'Entreprise' : 'Client'}</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium mt-2 not-italic">
              {isCompany ? 'Raison Sociale' : 'Client'} : <span className="text-slate-600 font-semibold">{clientInfo.fullName}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 print:hidden">
            <button onClick={() => window.print()} className="px-5 py-2.5 bg-white border border-slate-100 rounded-2xl text-slate-500 hover:bg-slate-50 shadow-sm transition-all">
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsSaved(true)}
              className={`px-6 py-2.5 rounded-2xl text-sm font-medium transition-all shadow-lg flex items-center
                  ${isSaved ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-slate-900 text-white hover:bg-blue-600'}`}
            >
              {isSaved ? <><CheckCircle className="w-4 h-4 mr-2" /> Enregistré</> : <><Save className="w-4 h-4 mr-2" /> Enregistrer</>}
            </button>
          </div>
        </div>

        {/* KPIs - ADAPTATION DYNAMIQUE */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`rounded-[28px] p-6 border transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 ${decisionStyle.bg} ${decisionStyle.border}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 not-italic">Décision IA</p>
            <div className="flex items-center gap-3">
              {decisionStyle.icon}
              <h2 className={`text-2xl font-bold not-italic ${decisionStyle.text}`}>{decision}</h2>
            </div>
          </div>

          <div className="bg-white rounded-[28px] p-6 border border-slate-100 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 group">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 not-italic">Indice de Solvabilité</p>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <Sparkles className="w-6 h-6 text-blue-600 group-hover:text-white" />
              </div>
              <h3 className="text-3xl font-bold text-slate-800 tracking-tight not-italic">{resultData.score}<span className="text-slate-300 text-sm ml-1 font-medium">/100</span></h3>
            </div>
          </div>

          <div className="bg-white rounded-[28px] p-6 border border-slate-100 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 group">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 not-italic">Fiabilité Paiements</p>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                <ShieldCheck className="w-6 h-6 text-emerald-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 not-italic">{reliability}</h3>
            </div>
          </div>

          <div className="bg-white rounded-[28px] p-6 border border-slate-100 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 group">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 not-italic">Tendance Cash-Flow</p>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                <LineChart className={`w-6 h-6 group-hover:text-white ${trend === 'En hausse' ? 'text-indigo-600' : 'text-slate-400'}`} />
              </div>
              <h3 className="text-xl font-bold text-slate-700 not-italic">{trend}</h3>
            </div>
          </div>
        </div>

        {/* GRAPHIQUES & RATIOS PRO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-[32px] border border-slate-50 shadow-sm p-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 not-italic">
              {isCompany ? "Structure Financière & Solvabilité" : "Structure de la Dette"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[250px]">
              {resultData.charts?.gauge && <Plot data={resultData.charts.gauge.data} layout={{ ...resultData.charts.gauge.layout, font: plotlyFont, margin: { l: 20, r: 20, t: 10, b: 20 }, autosize: true }} style={{ width: "100%", height: "100%" }} useResizeHandler config={{ displayModeBar: false, responsive: true }} />}
              <div className="flex flex-col justify-center space-y-4">
                {/* Ratios spécifiques Corporate */}
                {isCompany ? (
                  <>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ratio Dette / EBE</p>
                      <p className="text-2xl font-bold text-slate-800">{fins.debt_to_ebitda}x</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fonds Propres</p>
                      <p className="text-2xl font-bold text-slate-800">{(fins.equity || 0).toLocaleString()} €</p>
                    </div>
                  </>
                ) : (
                  resultData.charts?.pie && <Plot data={resultData.charts.pie.data} layout={{ ...resultData.charts.pie.layout, font: plotlyFont, margin: { l: 20, r: 20, t: 10, b: 20 }, autosize: true }} style={{ width: "100%", height: "100%" }} useResizeHandler config={{ displayModeBar: false, responsive: true }} />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-50 shadow-sm p-8 flex flex-col">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 not-italic">Flux & Performance</h3>
            <div className="flex-1 w-full h-[230px]">
              <Plot
                data={[{
                  type: "waterfall", measure: ["relative", "relative", "total"],
                  x: isCompany ? ["C.A.", "Charges", "Résultat Net"] : ["Revenus", "Charges", "Reste à vivre"],
                  y: isCompany
                    ? [fins.turnover ?? 0, -((fins.turnover ?? 0) - (fins.net_profit ?? 0)), fins.net_profit ?? 0]
                    : [fins.monthly_income ?? 0, -(fins.monthly_expenses ?? 0), fins.rest_to_live ?? 0],
                  text: isCompany
                    ? [`+${fins.turnover?.toLocaleString()}€`, `-${(fins.turnover! - fins.net_profit!)?.toLocaleString()}€`, `${fins.net_profit?.toLocaleString()}€`]
                    : [`+${fins.monthly_income ?? 0}€`, `-${fins.monthly_expenses ?? 0}€`, `${fins.rest_to_live ?? 0}€`],
                  textposition: "inside", textfont: { family: 'Arial', color: 'white', size: 12, weight: 'bold' },
                  connector: { line: { color: "#F1F5F9" } },
                  decreasing: { marker: { color: "#EF4444" } }, increasing: { marker: { color: "#10B981" } }, totals: { marker: { color: "#3B82F6" } }
                } as any]}
                layout={{
                  autosize: true, margin: { l: 40, r: 20, t: 10, b: 40 }, paper_bgcolor: 'white',
                  font: plotlyFont, xaxis: { showgrid: false },
                  yaxis: { showgrid: true, gridcolor: '#F8FAF9' }
                }}
                style={{ width: "100%", height: "100%" }} useResizeHandler config={{ displayModeBar: false, responsive: true }}
              />
            </div>
            <div className="mt-6 p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-3 not-italic">
                {isCompany ? <><BarChart3 className="w-6 h-6 text-indigo-500" /> EBITDA / EBE</> : <><PiggyBank className="w-6 h-6 text-emerald-500" /> Épargne IA</>}
              </span>
              <span className="text-lg font-semibold text-slate-700 not-italic">
                {isCompany ? fins.ebitda?.toLocaleString() : fins.savings_capacity} € {isCompany && <span className="text-[10px] text-slate-300 font-normal">/ an</span>}
              </span>
            </div>
          </div>
        </div>

        {/* TEXTE SYNTHESE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20 text-slate-800">
          <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-50 shadow-sm p-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2 not-italic"><FileText className="w-5 h-5 text-blue-400" /> Note d'Audit Analyste</h3>
            <div className="text-sm text-slate-600 leading-relaxed font-normal not-italic whitespace-pre-line">{resultData.summary}</div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-[28px] border border-red-50 p-6 shadow-sm">
              <h3 className="text-[13px] font-bold text-red-400 uppercase mb-4 flex items-center gap-2 not-italic"><AlertOctagon className="w-4 h-4" /> Risques</h3>
              <ul className="space-y-2">{resultData.risks?.map((r, i) => <li key={i} className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-50 leading-snug">• {r}</li>)}</ul>
            </div>
            <div className="bg-white rounded-[28px] border border-emerald-50 p-6 shadow-sm">
              <h3 className="text-[13px] font-bold text-emerald-400 uppercase mb-4 flex items-center gap-2 not-italic"><CheckCircle className="w-4 h-4" /> Atouts</h3>
              <ul className="space-y-2">{resultData.opportunities?.map((o, i) => <li key={i} className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-50 leading-snug">✓ {o}</li>)}</ul>
            </div>
          </div>
        </div>
      </div>

      {/* CHATBOT */}
      <div className="fixed bottom-10 right-10 z-50 print:hidden flex flex-col items-end">
        {!isChatOpen && (
          <button onClick={() => setIsChatOpen(true)} className="w-16 h-16 rounded-[24px] bg-slate-900 text-white shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group">
            <MessageCircle className="w-7 h-7 group-hover:rotate-12 transition-transform" />
          </button>
        )}
        {isChatOpen && (
          <div className="w-[400px] h-[600px] bg-white rounded-[32px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden mb-4 animate-scale-in">
            <div className="px-6 py-5 bg-slate-900 flex items-center justify-between text-white">
              <div className="flex items-center gap-3"><Bot className="w-5 h-5 text-blue-400" /><h3 className="text-sm font-medium not-italic">Assistant Analyste</h3></div>
              <button onClick={() => setIsChatOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50 text-slate-700">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-[20px] text-sm leading-relaxed not-italic ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none shadow-md' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none shadow-sm'}`}>
                    {msg.content.split(/(\*\*.*?\*\*)/g).map((part, index) => part.startsWith('**') && part.endsWith('**') ? <strong key={index} className="font-bold">{part.replace(/\*\*/g, '')}</strong> : part)}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] p-4 rounded-[20px] text-sm leading-relaxed not-italic bg-white border border-slate-100 text-slate-500 rounded-tl-none shadow-sm italic">
                    L'assistant rédige...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-5 bg-white border-t flex gap-2">
              <input value={inputMessage} onChange={e => setInputMessage(e.target.value)} placeholder="Posez votre question..." className="flex-1 px-5 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all not-italic" />
              <button type="submit" className="p-3 bg-blue-600 rounded-2xl text-white hover:bg-blue-700 shadow-lg"><Send className="w-4 h-4" /></button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}