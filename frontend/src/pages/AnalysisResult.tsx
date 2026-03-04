import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, AlertTriangle, Send, Download,
  XCircle, FileText, ShieldCheck,
  AlertOctagon, X, Save, LineChart, Sparkles,
  Trash2, User, Building2
} from 'lucide-react';
import Plot from 'react-plotly.js';
import AnimatedModal from '../components/AnimatedModal';

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
  // Nouveaux champs déterministes
  revenue?: number;
  net_income?: number;
  equity?: number;
  total_debt?: number;
  cash_flow?: number;
  working_capital?: number;
  net_margin_percent?: number;
  debt_to_equity_percent?: number;
  debt_to_revenue_percent?: number;
  taux_endettement_personnel_percent?: number;
  reste_a_vivre_annuel?: number;

  // Anciens champs
  monthly_income?: number;
  monthly_expenses?: number;
  debt_ratio?: number;
  rest_to_live?: number;
  savings_capacity?: number;
  turnover?: number;
  net_profit?: number;
  ebitda?: number;
  debt_to_ebitda?: number;

  // Groq Extract fallback fields Particulier
  revenus_annuels?: number;
  charges_annuelles?: number;
  mensualites_credits?: number;
  epargne_estimee?: number;
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
  const printRef = useRef<HTMLDivElement>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for Email Modal
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSelection, setEmailSelection] = useState<'me' | 'other'>('me');
  const [emailToSend, setEmailToSend] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Set default email efficiently when possible
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('user_info');
      if (rawUser) {
        const ui = JSON.parse(rawUser);
        if (ui.email) {
          setEmailToSend(ui.email);
          setEmailSelection('me');
        } else {
          setEmailSelection('other');
        }
      } else {
        setEmailSelection('other');
      }
    } catch (e) {
      setEmailSelection('other');
    }
  }, []);

  // Détection dynamique du mode sombre pour les graphiques
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    // Forcer le thème clair pour l'impression du rapport documentaire
    const handleBeforePrint = () => {
      if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        document.documentElement.dataset.wasDark = 'true';
      }
    };
    const handleAfterPrint = () => {
      if (document.documentElement.dataset.wasDark === 'true') {
        document.documentElement.classList.add('dark');
        delete document.documentElement.dataset.wasDark;
      }
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      observer.disconnect();
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const handleExport = async () => {
    try {
      // Envoi d'une notification d'exportation
      await fetch(`${import.meta.env.VITE_API_URL}/auth/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: "Analyse exportée",
          message: `L'analyse de ${state?.clientInfo?.fullName} a été téléchargée/imprimée.`,
          type: "INFO"
        })
      });
    } catch (e) {
      console.error("Erreur lors de la création de la notification d'export:", e);
    }
    window.print();
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalEmail = emailSelection === 'me' ? emailToSend : customEmail;
    if (!finalEmail.trim()) return;

    setIsSendingEmail(true);

    try {
      // 1. Generate PDF dynamically (similar to handleExport but returning Blob)
      const element = printRef.current || document.getElementById('section-to-print');
      if (!element) throw new Error("Element non trouvé");

      // Temporarily remove dark mode for PDF generation if active
      const wasDark = document.documentElement.classList.contains('dark');
      if (wasDark) document.documentElement.classList.remove('dark');

      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `Rapport_${clientType}_${clientInfo.fullName.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');

      if (wasDark) document.documentElement.classList.add('dark');

      // 2. Prepare Form Data
      const formData = new FormData();
      formData.append('email', finalEmail);
      formData.append('subject', `Rapport d'Analyse - ${clientInfo.fullName}`);
      formData.append('file', pdfBlob, opt.filename);

      const token = sessionStorage.getItem('token');

      // 3. Send to API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/send-report/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error("Erreur de l'envoi");
      }

      alert('Rapport envoyé avec succès !');
      setIsEmailModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du PDF:', error);
      alert('Une erreur est survenue lors de l\'envoi. Veuillez réessayer.');
    } finally {
      setIsSendingEmail(false);
    }
  };

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-xl text-center border border-slate-100 dark:border-slate-800 font-sans">
          <AlertOctagon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Données manquantes</h2>
          <Link to="/new" className="text-blue-600 dark:text-blue-400 font-medium flex items-center justify-center gap-2 hover:underline mt-4">
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

  // Configuration visuelle des graphiques adaptée au mode
  const plotlyFont = {
    family: 'Inter, sans-serif',
    size: 11,
    color: isDarkMode ? '#94a3b8' : '#64748b'
  };

  const getGaugeConfig = () => {
    let val = 0;
    let r_max = 100;
    let suffix = "%";

    if (isCompany) {
      if (fins.debt_to_equity_percent !== undefined) {
        val = fins.debt_to_equity_percent;
        r_max = 200; // max 200% pour l'endettement sur capitaux propres
        suffix = "%";
      } else {
        val = fins.debt_to_ebitda || 0;
        r_max = 8;
        suffix = "x";
      }
    } else {
      val = fins.taux_endettement_personnel_percent ?? fins.debt_to_revenue_percent ?? fins.debt_ratio ?? 0;
      r_max = 100;
      suffix = "%";
    }

    return {
      data: [{
        type: "indicator",
        mode: "gauge+number",
        value: val,
        number: { suffix, font: { size: 24, color: isDarkMode ? '#f1f5f9' : '#1e293b' } },
        gauge: {
          axis: { range: [0, r_max], tickwidth: 1, tickcolor: isDarkMode ? '#475569' : '#cbd5e1' },
          bar: { color: isDarkMode ? '#3b82f6' : '#1e293b' },
          steps: [
            { range: [0, r_max * 0.33], color: "#10B981" },
            { range: [r_max * 0.33, r_max * 0.66], color: "#F59E0B" },
            { range: [r_max * 0.66, r_max], color: "#EF4444" }
          ],
          bgcolor: isDarkMode ? "#1e293b" : "#f1f5f9"
        }
      }],
      layout: {
        autosize: true,
        margin: { l: 30, r: 30, t: 30, b: 30 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
      }
    };
  };

  const handleDelete = () => {
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/applications/${resultData.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        setDeleteModalOpen(false);
        navigate('/history');
      } else {
        alert("Erreur serveur lors de la suppression.");
      }
    } catch (error) {
      console.error(error);
      alert("Erreur réseau");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (isSaved) return;
    try {
      const payload = {
        fullName: clientInfo.fullName,
        clientType: clientType,
        projectType: state.specificProfile || clientInfo.projectType || "Standard",
        amount: parseFloat((clientInfo.amount || "0").toString().replace(/ /g, "").replace(",", ".")) || 0,
        email: (clientInfo as any).email || null,
        phone: (clientInfo as any).phone || null,
        score: resultData.score,
        decision: decision,
        summary: resultData.ia_summary || resultData.summary || "",
        financials: fins,
        risks: resultData.risks || [],
        opportunities: resultData.opportunities || []
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/applications/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsSaved(true);
      } else {
        alert("Erreur du serveur lors de l'enregistrement.");
      }
    } catch (err) {
      alert("Erreur réseau lors de l'enregistrement.");
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, client_type: clientType, context: JSON.stringify({ analyse: resultData, client: clientInfo }) }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response || "Erreur serveur." }]);
    } catch { setMessages(prev => [...prev, { role: 'assistant', content: "Erreur réseau." }]); } finally { setIsTyping(false); }
  };

  const getDecisionStyle = (dec: string) => {
    if (dec === 'Favorable') return { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-800 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', icon: <CheckCircle className="w-8 h-8 text-emerald-500" /> };
    if (dec === 'Vigilance') return { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-800 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', icon: <AlertTriangle className="w-8 h-8 text-amber-500" /> };
    return { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-800 dark:text-red-400', border: 'border-red-200 dark:border-red-800', icon: <XCircle className="w-8 h-8 text-red-500" /> };
  };

  const decisionStyle = getDecisionStyle(decision);

  return (
    <div className="max-w-7xl mx-auto pb-20 px-6 mt-10 animate-fade-in text-left font-sans print:p-0 print:m-0 print:max-w-none">
      <div id="section-to-print" className="space-y-10 print:space-y-8 print:w-full">

        {/* --- EN-TÊTE D'IMPRESSION (VISIBLE ONLY ON PRINT) --- */}
        <div className="hidden print:block border-b-2 border-slate-200 pb-6 mb-8 pt-4">
          <div className="flex justify-between items-end">
            <div>
              <div className="flex justify-start mb-4">
                <img src="/src/images/Logocompletv2.svg" alt="Kaïs" className="h-12 object-contain" />
              </div>
              <h1 className="text-4xl font-light text-slate-800 tracking-tight">Rapport d'Analyse <span className="font-semibold text-slate-900">Financière</span></h1>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Date de génération</p>
              <p className="text-lg font-medium text-slate-800 flex items-center gap-2 justify-end">
                {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><User className="w-4 h-4" /> Dossier / Entité</p>
              <p className="text-xl font-bold text-slate-800">{clientInfo.fullName}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Building2 className="w-4 h-4" /> Type de Profil</p>
              <p className="text-xl font-bold text-slate-800 capitalize">{isCompany ? 'Entreprise' : 'Particulier'} - {state.specificProfile || clientInfo.projectType || "Standard"}</p>
            </div>
          </div>
        </div>

        {/* HEADER STANDARD */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 print:hidden">
          <div className="space-y-1">
            <button onClick={() => navigate(isHistoryMode ? '/history' : '/new')} className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4 transition-all">
              <ArrowLeft className="w-3.5 h-3.5" /> {isHistoryMode ? 'Historique' : 'Retour'}
            </button>
            <h1 className="text-3xl font-light text-slate-800 dark:text-slate-100 tracking-tight">
              Synthèse <span className="font-semibold text-slate-900 dark:text-white">{isCompany ? 'Entreprise' : 'Client'}</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">{clientInfo.fullName}</p>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all flex items-center gap-2"
              title="Envoyer par email"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Envoyer</span>
            </button>
            <button onClick={handleExport} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all">
              <Download className="w-4 h-4" />
            </button>
            {isHistoryMode ? (
              <button onClick={handleDelete} className="px-6 py-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 rounded-2xl text-sm font-bold hover:bg-rose-600 dark:hover:bg-rose-600 hover:text-white transition-all flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            ) : (
              <button onClick={handleSaveAnalysis} className={`px-6 py-2.5 rounded-2xl text-sm font-medium transition-all shadow-lg flex items-center ${isSaved ? 'bg-emerald-500 text-white' : 'bg-slate-900 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-500'}`}>
                {isSaved ? <CheckCircle className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />} {isSaved ? 'Enregistré' : 'Enregistrer'}
              </button>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-2 print:gap-6">
          <div className={`rounded-[28px] print:rounded-2xl p-6 print:p-6 border shadow-sm print:border-slate-200 hover:shadow-xl dark:hover:shadow-blue-900/10 hover:-translate-y-1.5 transition-all duration-300 group ${decisionStyle.bg} ${decisionStyle.border}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 transition-colors group-hover:text-slate-600 dark:group-hover:text-slate-300">Décision IA</p>
            <div className="flex items-center gap-3">{decisionStyle.icon}<h2 className={`text-2xl font-bold ${decisionStyle.text}`}>{decision}</h2></div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm group hover:shadow-xl dark:hover:shadow-blue-900/10 hover:-translate-y-1.5 transition-all duration-300">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Score Solvabilité</p>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all"><Sparkles className="w-6 h-6 text-blue-600 group-hover:text-white" /></div>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{resultData.score}<span className="text-slate-300 dark:text-slate-600 text-sm ml-1">/100</span></h3>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm group hover:shadow-xl dark:hover:shadow-blue-900/10 hover:-translate-y-1.5 transition-all duration-300">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Fiabilité</p>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all"><ShieldCheck className="w-6 h-6 text-emerald-600 group-hover:text-white" /></div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">{reliability}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm group hover:shadow-xl dark:hover:shadow-blue-900/10 hover:-translate-y-1.5 transition-all duration-300">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Tendance</p>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all"><LineChart className="w-6 h-6 text-indigo-600 group-hover:text-white" /></div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">{trend}</h3>
            </div>
          </div>
        </div>

        {/* GRAPHIQUES RECONSTRUITS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-1 print:gap-8 print:break-inside-avoid">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] print:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm print:border-slate-200 p-8 print:p-8 transition-colors">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-8 print:mb-6">Structure Financière</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[250px]">
              <Plot
                data={getGaugeConfig().data as any}
                layout={{ ...getGaugeConfig().layout, font: plotlyFont } as any}
                style={{ width: "100%", height: "100%" }}
                useResizeHandler
                config={{ displayModeBar: false }}
              />
              <div className="flex flex-col justify-center space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-transparent dark:border-slate-800 transition-colors">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                    {isCompany ? (fins.debt_to_equity_percent !== undefined ? "Dette / Fonds Propres" : "Dette / EBE") : "Ratio Dette"}
                  </p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {isCompany ? (fins.debt_to_equity_percent !== undefined ? `${fins.debt_to_equity_percent}%` : `${fins.debt_to_ebitda || 0}x`) : `${fins.debt_to_revenue_percent ?? fins.debt_ratio ?? 0}%`}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-transparent dark:border-slate-800 transition-colors">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{isCompany ? "Capitaux Propres" : "Épargne estimée"}</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{((isCompany ? fins.equity : (fins.epargne_estimee ?? fins.savings_capacity)) || 0).toLocaleString()} €</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[32px] print:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm print:border-slate-200 p-8 print:p-8 transition-colors print:break-inside-avoid">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-8 print:mb-6">Analyse des Flux</h3>
            <div className="h-[250px] print:h-[280px]">
              <Plot
                data={[{
                  type: "waterfall",
                  measure: ["relative", "relative", "total"],
                  x: isCompany ? ["C.A.", "Charges", "R. Net"] : ["Revenus", "Charges", "Reste à vivre"],
                  y: isCompany
                    ? [fins.revenue ?? fins.turnover ?? 0, -(((fins.revenue ?? fins.turnover) || 0) - ((fins.net_income ?? fins.net_profit) || 0)), fins.net_income ?? fins.net_profit ?? 0]
                    : [
                      (fins.revenus_annuels !== undefined) ? (fins.revenus_annuels / 12) : (fins.revenue ? (fins.revenue / 12) : (fins.monthly_income ?? 0)),
                      -((fins.charges_annuelles !== undefined) ? (fins.charges_annuelles / 12 + (fins.mensualites_credits ?? 0)) : (fins.revenue ? ((fins.revenue - (fins.net_income || 0)) / 12) : (fins.monthly_expenses ?? 0))),
                      (fins.reste_a_vivre_annuel !== undefined) ? (fins.reste_a_vivre_annuel / 12) : ((fins.net_income ? (fins.net_income / 12) : (fins.rest_to_live ?? 0)))
                    ],
                  connector: { line: { color: isDarkMode ? "#334155" : "#e2e8f0" } },
                  decreasing: { marker: { color: "#EF4444" } },
                  increasing: { marker: { color: "#10B981" } },
                  totals: { marker: { color: "#3B82F6" } }
                } as any]}
                layout={{
                  autosize: true,
                  margin: { l: 40, r: 20, t: 10, b: 40 },
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  font: plotlyFont,
                  plot_bgcolor: 'rgba(0,0,0,0)',
                  xaxis: { showgrid: false, tickfont: { color: isDarkMode ? '#64748b' : '#94a3b8' } },
                  yaxis: { showgrid: true, gridcolor: isDarkMode ? '#1e293b' : '#f1f5f9', tickfont: { color: isDarkMode ? '#64748b' : '#94a3b8' } }
                }}
                style={{ width: "100%", height: "100%" }}
                useResizeHandler
                config={{ displayModeBar: false }}
              />
            </div>
          </div>
        </div>

        {/* SYNTHÈSE ET RISQUES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:grid-cols-1 print:gap-8">
          <div className="lg:col-span-2 print:col-span-1 bg-white dark:bg-slate-900 rounded-[32px] print:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm print:border-slate-200 p-10 print:p-8 transition-colors print:break-inside-avoid">
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 print:mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" /> Note d'Audit
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line text-sm italic">
              {resultData.ia_summary || resultData.summary || "Aucune note disponible."}
            </p>
          </div>
          <div className="space-y-6 print:space-y-6 print:grid print:grid-cols-2 print:gap-6 print:space-y-0 print:break-inside-avoid">
            <div className="bg-white dark:bg-slate-900 rounded-[28px] print:rounded-3xl border border-red-50 dark:border-red-500/30 p-6 print:p-6 shadow-sm transition-colors print:h-full">
              <h3 className="text-xs font-bold text-red-500 dark:text-red-400 uppercase mb-4 flex items-center gap-2"><AlertOctagon className="w-4 h-4" /> Risques</h3>
              <ul className="space-y-2">
                {(resultData.risks || []).map((r: any, i: number) => <li key={i} className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">• {r}</li>)}
              </ul>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-[28px] print:rounded-3xl border border-emerald-50 dark:border-emerald-500/30 p-6 print:p-6 shadow-sm transition-colors print:h-full">
              <h3 className="text-xs font-bold text-emerald-500 dark:text-emerald-400 uppercase mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Atouts</h3>
              <ul className="space-y-2">
                {(resultData.opportunities || []).map((o: any, i: number) => <li key={i} className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">✓ {o}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CHATBOT */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end print:hidden">
        {!isChatOpen ? (
          <button onClick={() => setIsChatOpen(true)} className="w-16 h-16 rounded-3xl bg-slate-900 dark:bg-blue-600 text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-all">
            <img src="/src/images/logo_kais.svg" alt="Chat Kaïs" className="w-8 h-8 object-contain filter brightness-0 invert" />
          </button>
        ) : (
          <div className="w-[400px] h-[550px] bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden animate-scale-in origin-bottom-right">
            <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 text-sm font-bold tracking-widest"><img src="/src/images/logo_kais.svg" alt="Kaïs" className="w-5 h-5 object-contain" />Kaïs</div>
              <button onClick={() => setIsChatOpen(false)}><X className="w-5 h-5 opacity-50 hover:opacity-100" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-950">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-700'}`}
                    dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                  />
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-1.5 h-10">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <input value={inputMessage} onChange={e => setInputMessage(e.target.value)} placeholder="Posez une question..." className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-slate-100" />
              <button type="submit" disabled={isTyping} className="p-2 bg-blue-600 rounded-xl text-white hover:bg-blue-700 transition-all"><Send className="w-4 h-4" /></button>
            </form>
          </div>
        )}
      </div>

      {/* DELETE MODAL */}
      <AnimatedModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Supprimer l'analyse"
        message={`Êtes-vous sûr de vouloir supprimer définitivement l'analyse de ${clientInfo.fullName || 'ce dossier'} ? Cette action est irréversible et supprimera tout l'historique lié.`}
        type="danger"
        confirmText={isDeleting ? "Suppression..." : "Oui, supprimer"}
        onConfirm={executeDelete}
        cancelText="Annuler"
      />

      {/* EMAIL MODAL */}
      <AnimatedModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        title="Envoyer le rapport par email"
      >
        <div className="p-6 text-slate-700 dark:text-slate-300">
          <p className="mb-6 text-sm">
            Vous pouvez envoyer ce rapport PDF directement par email.
          </p>

          <form onSubmit={handleSendEmail} className="space-y-6">
            <div className="space-y-3">
              {emailToSend && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="emailTarget"
                    checked={emailSelection === 'me'}
                    onChange={() => setEmailSelection('me')}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">L'envoyer à mon adresse</span>
                </label>
              )}
              {emailSelection === 'me' && emailToSend && (
                <p className="text-xs text-slate-500 ml-7 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                  L'email sera envoyé à : <strong>{emailToSend}</strong>
                </p>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="emailTarget"
                  checked={emailSelection === 'other'}
                  onChange={() => setEmailSelection('other')}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">L'envoyer à une autre adresse</span>
              </label>

              {emailSelection === 'other' && (
                <div className="ml-7 mt-3 animate-fade-in">
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors"
                    placeholder="Ex. client@entreprise.com"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
                disabled={isSendingEmail}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSendingEmail || (emailSelection === 'me' ? !emailToSend : !customEmail.trim())}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingEmail ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </AnimatedModal>

    </div>
  );
}