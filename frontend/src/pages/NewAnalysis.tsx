import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, CheckCircle, Loader2, Trash2,
  ArrowRight, ArrowLeft, Euro, Mail, User, CreditCard, Sparkles, Building2, Briefcase
} from 'lucide-react';
import AnimatedModal from '../components/AnimatedModal';

import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';

// --- CONFIGURATION MÉTIER ---
const DOC_TYPES = {
  id: { id: 'id_client', label: "Pièce d'identité" },
  domicile: { id: 'domicile', label: "Justificatif de domicile" },
  paie: { id: 'paie', label: "3 derniers bulletins de salaire" },
  impot: { id: 'impot', label: "Dernier avis d'imposition" },
  rib: { id: 'rib', label: "RIB" },
  releves: { id: 'releves', label: "3 derniers relevés bancaires" },
  amortissement: { id: 'amortissement', label: "Tableaux d'amortissement" },
  kbis: { id: 'kbis', label: "Extrait KBIS (-3 mois)" },
  statuts: { id: 'statuts', label: "Statuts mis à jour" },
  bilan1: { id: 'bilan_n', label: "Bilan Complet (Année N)" },
  bilan2: { id: 'bilan_n1', label: "Bilan Complet (Année N-1)" },
  liasse: { id: 'liasse_fiscale', label: "Liasse Fiscale" },
  releves_pro: { id: 'releves_pro', label: "3 derniers relevés bancaires PRO" }
};

const CREDIT_TYPES_PARTICULIER = {
  'personnel': { label: 'Prêt Personnel', docs: [DOC_TYPES.id, DOC_TYPES.domicile, DOC_TYPES.paie, DOC_TYPES.impot, DOC_TYPES.rib, DOC_TYPES.releves] },
  'affecte': { label: 'Prêt Affecté', docs: [DOC_TYPES.id, DOC_TYPES.domicile, DOC_TYPES.paie, DOC_TYPES.impot, DOC_TYPES.rib, DOC_TYPES.releves] },
  'renouvelable': { label: 'Crédit Renouvelable', docs: [DOC_TYPES.id, DOC_TYPES.domicile, DOC_TYPES.paie, DOC_TYPES.impot, DOC_TYPES.rib, DOC_TYPES.releves] }
};

const CREDIT_TYPES_ENTREPRISE = {
  'tresorerie': { label: 'Besoin de Trésorerie', docs: [DOC_TYPES.kbis, DOC_TYPES.statuts, DOC_TYPES.bilan1, DOC_TYPES.bilan2, DOC_TYPES.releves_pro, DOC_TYPES.rib] },
  'investissement': { label: 'Prêt Investissement', docs: [DOC_TYPES.kbis, DOC_TYPES.bilan1, DOC_TYPES.bilan2, DOC_TYPES.releves_pro, DOC_TYPES.rib] },
  'bail': { label: 'Crédit-Bail / Leasing', docs: [DOC_TYPES.kbis, DOC_TYPES.bilan1, DOC_TYPES.releves_pro, DOC_TYPES.rib] }
};

type CategoryType = 'particulier' | 'entreprise';

export default function NewAnalysis() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [activeCategory, setActiveCategory] = useState<CategoryType>('particulier');

  const [clientInfo, setClientInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    amount: '',
    creditType: 'personnel',
    hasCredits: false,
    companyName: ''
  });

  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);

  const getCurrentDocs = () => {
    let docs = [];
    if (activeCategory === 'particulier') {
      docs = [...(CREDIT_TYPES_PARTICULIER[clientInfo.creditType as keyof typeof CREDIT_TYPES_PARTICULIER]?.docs || [])];
      if (clientInfo.hasCredits) docs.push(DOC_TYPES.amortissement);
    } else {
      docs = [...(CREDIT_TYPES_ENTREPRISE[clientInfo.creditType as keyof typeof CREDIT_TYPES_ENTREPRISE]?.docs || [])];
    }
    return docs;
  };

  const currentDocs = getCurrentDocs();

  const handleCategoryChange = (cat: CategoryType) => {
    setActiveCategory(cat);
    setClientInfo({ ...clientInfo, creditType: cat === 'particulier' ? 'personnel' : 'tresorerie' });
    setFiles({});
  };

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setClientInfo({ ...clientInfo, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value });
  };

  const validateStep1 = () => {
    if (activeCategory === 'entreprise' && !clientInfo.companyName) {
      setError("Le nom de l'entreprise est obligatoire pour un dossier PRO.");
      setErrorModalOpen(true);
      return;
    }
    if (!clientInfo.fullName || !clientInfo.amount || !clientInfo.email) {
      setError("Veuillez remplir correctement tous les champs obligatoires (Nom, Email, Montant).");
      setErrorModalOpen(true);
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleFileSelect = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => ({ ...prev, [docId]: [...(prev[docId] || []), ...newFiles] }));
    }
  };

  const removeFile = (docId: string, idx: number) => {
    setFiles(prev => {
      const updated = prev[docId].filter((_, i) => i !== idx);
      const newState = { ...prev };
      if (updated.length === 0) delete newState[docId]; else newState[docId] = updated;
      return newState;
    });
  };

  const handleAnalyze = async () => {
    const missingDocs = currentDocs.filter(d => !files[d.id]);
    if (missingDocs.length > 0) {
      setError(`Pièces manquantes :\n${missingDocs.map(d => d.label).join(' \n- ')}`);
      setErrorModalOpen(true);
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(files).forEach(([, fileList]) => {
        fileList.forEach(file => formData.append('files', file));
      });

      formData.append('fullName', clientInfo.fullName);
      formData.append('companyName', clientInfo.companyName || '');
      formData.append('amount', clientInfo.amount);
      formData.append('clientType', activeCategory);
      formData.append('projectType', clientInfo.creditType);
      formData.append('email', clientInfo.email);
      formData.append('phone', clientInfo.phone);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/analyze_dashboard/`, { method: 'POST', body: formData });
      const result = await response.json();
      const config = activeCategory === 'particulier' ? CREDIT_TYPES_PARTICULIER : CREDIT_TYPES_ENTREPRISE;

      navigate('/analysis/result', {
        state: {
          resultData: result,
          clientType: activeCategory,
          specificProfile: (config as any)[clientInfo.creditType]?.label,
          clientInfo: {
            ...clientInfo,
            fullName: activeCategory === 'entreprise' ? `${clientInfo.companyName} (${clientInfo.fullName})` : clientInfo.fullName
          }
        }
      });
    } catch {
      setError("Une erreur inattendue est survenue avec le serveur d'Intelligence Artificielle. Le scoring n'a pas pu aboutir.");
      setErrorModalOpen(true);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 px-6 mt-10 animate-fade-in text-left">

      {/* HEADER SECTION */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-light text-slate-800 dark:text-slate-100 tracking-tight transition-colors">
          Nouveau <span className="font-semibold text-slate-900 dark:text-white">Dossier {activeCategory === 'entreprise' ? 'PRO' : 'Client'}</span>
        </h1>
        <div className="mt-6 flex justify-center items-center gap-6">
          <div className={`flex items-center gap-3 transition-colors ${step >= 1 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-700'}`}>
            <span className={`w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-semibold transition-all ${step >= 1 ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-800'}`}>1</span>
            <span className="text-sm font-medium">Anamnèse</span>
          </div>
          <div className="w-12 h-px bg-slate-200 dark:bg-slate-800"></div>
          <div className={`flex items-center gap-3 transition-colors ${step >= 2 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-700'}`}>
            <span className={`w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-semibold transition-all ${step >= 2 ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-800'}`}>2</span>
            <span className="text-sm font-medium">Documents</span>
          </div>
        </div>
      </div>

      {step === 1 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-50 dark:border-slate-800 p-6 md:p-10 animate-fade-in transition-colors">

          {/* CATEGORY SWITCHER */}
          <div className="flex justify-center mb-10">
            <div className="bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl flex flex-col sm:flex-row border border-slate-100 dark:border-slate-800 shadow-inner w-full sm:w-auto">
              <button onClick={() => handleCategoryChange('particulier')} className={`px-8 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${activeCategory === 'particulier' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                <User className="w-4 h-4 inline mr-2" /> Particulier
              </button>
              <button onClick={() => handleCategoryChange('entreprise')} className={`px-8 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${activeCategory === 'entreprise' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                <Building2 className="w-4 h-4 inline mr-2" /> Entreprise
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-500" /> Profil Demandeur
              </h3>
              <div className="space-y-4">
                {activeCategory === 'entreprise' && (
                  <div className="group animate-in slide-in-from-top-2">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1 uppercase transition-colors">Dénomination Sociale<span className="text-red-400">*</span></label>
                    <input type="text" name="companyName" value={clientInfo.companyName} onChange={handleInfoChange} placeholder="ex: SARL Techpro" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 transition-all outline-none text-sm font-semibold dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600" />
                  </div>
                )}
                <div className="group">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1 uppercase transition-colors">{activeCategory === 'entreprise' ? 'Représentant Légal' : 'Nom Complet'}<span className="text-red-400">*</span></label>
                  <input type="text" name="fullName" value={clientInfo.fullName} onChange={handleInfoChange} placeholder="Jean Dupont" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 transition-all outline-none text-sm dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600" />
                </div>
                <div className="group">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1 uppercase transition-colors">Email<span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-4 w-4 h-4 text-slate-300 dark:text-slate-600" />
                    <input type="email" name="email" value={clientInfo.email} onChange={handleInfoChange} placeholder="contact@email.com" className="w-full pl-11 pr-5 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 transition-all outline-none text-sm dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600" />
                  </div>
                </div>
                <div className="group">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1 uppercase transition-colors">Téléphone</label>
                  <div className="dark:text-white">
                    <PhoneInput international defaultCountry="FR" value={clientInfo.phone} onChange={(v: any) => setClientInfo({ ...clientInfo, phone: v || '' })} className="flex px-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus-within:bg-white dark:focus-within:bg-slate-900 transition-all" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-500" /> Engagement
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1 uppercase transition-colors">Objet du financement<span className="text-red-400">*</span></label>
                  <select name="creditType" value={clientInfo.creditType} onChange={handleInfoChange} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {Object.entries(activeCategory === 'particulier' ? CREDIT_TYPES_PARTICULIER : CREDIT_TYPES_ENTREPRISE).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1 uppercase transition-colors">Montant Requis (€)<span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Euro className="absolute right-5 top-4 text-slate-300 dark:text-slate-600 w-5 h-5" />
                    <input type="number" name="amount" value={clientInfo.amount} onChange={handleInfoChange} placeholder="50000" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-sm font-bold text-slate-800 dark:text-slate-100" />
                  </div>
                </div>
                {activeCategory === 'particulier' && (
                  <label className="flex items-center gap-4 p-4 bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/30 rounded-2xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    <input type="checkbox" name="hasCredits" checked={clientInfo.hasCredits} onChange={handleInfoChange} className="w-5 h-5 text-blue-600 dark:text-blue-400 rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 tracking-tight uppercase">Passif existant ?</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Inclure les tableaux d'amortissement en cours.</p>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>
          <div className="mt-12 flex justify-end">
            <button onClick={validateStep1} className="w-full sm:w-auto justify-center bg-slate-900 dark:bg-blue-600 text-white px-10 py-4 rounded-2xl text-xs font-black  tracking-widest hover:bg-blue-600 dark:hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 flex items-center gap-3 group">
              Suivant <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      ) : (
        /* STEP 2 : DOCUMENTS */
        <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-50 dark:border-slate-800 overflow-hidden animate-fade-in transition-colors">
          <div className="p-6 md:px-10 md:py-8 bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3 uppercase tracking-tight">
                <FileText className="w-5 h-5 text-blue-500" /> Justificatifs Requis
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase font-black tracking-widest">
                Profil : {activeCategory === 'entreprise' ? 'PRO' : 'PART'} — {currentDocs.length} pièces
              </p>
            </div>
            <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-900/30 shadow-sm transition-colors">
              {Object.keys(files).length} / {currentDocs.length} Fournis
            </div>
          </div>

          <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-slate-900 transition-colors">
            {currentDocs.map((doc) => {
              const docFiles = files[doc.id] || [];
              const isProvided = docFiles.length > 0;
              return (
                <div key={doc.id} className={`p-5 border-2 rounded-[24px] transition-all duration-300 ${isProvided ? 'bg-emerald-50/10 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' : 'bg-slate-50/30 dark:bg-slate-950/30 border-slate-100 dark:border-slate-800 hover:border-blue-100 dark:hover:border-blue-900/50 hover:bg-white dark:hover:bg-slate-900'}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all ${isProvided ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-950 text-slate-300 dark:text-slate-700 border border-slate-100 dark:border-slate-800'}`}>
                      {isProvided ? <CheckCircle className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                    </div>
                    <p className={`text-[10px] font-bold uppercase tracking-tight leading-tight transition-colors ${isProvided ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>{doc.label}</p>
                  </div>

                  <div className="space-y-2">
                    {docFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white dark:bg-slate-950 p-2.5 px-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm animate-scale-in">
                        <span className="text-[9px] text-slate-700 dark:text-slate-300 font-bold truncate max-w-[80%]">{file.name}</span>
                        <button onClick={() => removeFile(doc.id, idx)} className="text-slate-300 dark:text-slate-700 hover:text-red-500 dark:hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                    <div className="relative group">
                      <input type="file" multiple accept="application/pdf,image/*" onChange={(e) => handleFileSelect(doc.id, e)} className="absolute inset-0 opacity-0 cursor-pointer" />     
                      <button className={`w-full py-2.5 border-2 border-dashed rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isProvided ? 'border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-950' : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-950 group-hover:border-blue-300 dark:group-hover:border-blue-500 group-hover:text-blue-500'}`}>
                        {isProvided ? "+ Ajouter" : "Importer"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-6 md:px-10 md:py-8 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-50 dark:border-slate-800 flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-4 transition-colors">
            <button onClick={() => setStep(1)} className="justify-center sm:justify-start py-3 sm:py-0 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-[10px] font-black  tracking-widest flex items-center gap-2 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <button onClick={handleAnalyze} disabled={loading} className={`justify-center px-10 py-4 w-full sm:w-auto rounded-2xl text-xs font-black  tracking-widest text-white shadow-xl transition-all flex items-center gap-3 ${loading ? 'bg-slate-300 dark:bg-slate-800' : 'bg-blue-600 dark:bg-blue-600 hover:bg-emerald-500 dark:hover:bg-emerald-600 hover:shadow-emerald-500/20'}`}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Analyser avec l'IA</>}
            </button>
          </div>
        </div>
      )
      }

      {/* MODAL DE CHARGEMENT IA */}
      <AnimatedModal
        isOpen={loading}
        onClose={() => { }} // Ne peut pas être fermé manuellement
        title="Analyse IA en cours"
        message={
          <div className="flex flex-col items-center gap-3">
            <p>Notre IA analyse actuellement les documents financiers et structure le dossier de crédit de <span className="font-bold text-slate-700 dark:text-slate-200">{clientInfo.fullName || 'ce client'}</span>.</p>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-blue-500 w-1/2 animate-[pulse_2s_ease-in-out_infinite] blur-[1px]" />
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-2">Extraction OCR & Calcul des Ratios...</p>
          </div>
        }
        type="loading"
      />

      {/* MODAL D'ERREUR */}
      <AnimatedModal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        title="Attention"
        message={
          <div className="text-slate-600 dark:text-slate-300">
            {error?.includes('\n') ? (
              <ul className="text-left list-disc list-inside mt-2 text-sm">
                <span className="font-semibold block mb-2">{error.split('\n')[0]}</span>
                {error.substring(error.indexOf('\n') + 1).split(' \n- ').map((err, i) => (
                  <li key={i} className="text-slate-500 dark:text-slate-400">{err}</li>
                ))}
              </ul>
            ) : (
              <p>{error}</p>
            )}
          </div>
        }
        type="danger"
        confirmText="Compris"
        onConfirm={() => setErrorModalOpen(false)}
        cancelText="Fermer"
      />
    </div >
  );
}