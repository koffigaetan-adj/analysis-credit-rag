import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, CheckCircle, AlertCircle, Loader2, Trash2,
  ArrowRight, ArrowLeft, Euro, Mail, User, CreditCard, Sparkles, Building2, Briefcase
} from 'lucide-react';

import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';

// --- CONFIGURATION MÉTIER ---
const DOC_TYPES = {
  // Particuliers
  id: { id: 'id_client', label: "Pièce d'identité" },
  domicile: { id: 'domicile', label: "Justificatif de domicile" },
  paie: { id: 'paie', label: "3 derniers bulletins de salaire" },
  impot: { id: 'impot', label: "Dernier avis d'imposition" },
  rib: { id: 'rib', label: "RIB" },
  releves: { id: 'releves', label: "3 derniers relevés bancaires" },
  amortissement: { id: 'amortissement', label: "Tableaux d'amortissement" },

  // Entreprises (Nouveau)
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
    companyName: '' // Nouveau pour entreprise
  });

  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- LOGIQUE DYNAMIQUE DES DOCUMENTS ---
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

  // Reset le type de crédit quand on change de catégorie
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
      setError("Le nom de l'entreprise est obligatoire.");
      return;
    }
    if (!clientInfo.fullName || !clientInfo.amount || !clientInfo.email) {
      setError("Veuillez remplir les champs obligatoires.");
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
      setError(`Pièces manquantes : ${missingDocs.map(d => d.label).join(', ')}`);
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

      const response = await fetch('http://127.0.0.1:8000/analyze_dashboard/', { method: 'POST', body: formData });
      const result = await response.json();

      const config = activeCategory === 'particulier' ? CREDIT_TYPES_PARTICULIER : CREDIT_TYPES_ENTREPRISE;

      navigate('/analysis/new', {
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
    } catch { setError("Erreur de connexion avec l'IA de scoring."); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 px-6 mt-10 animate-fade-in">

      {/* HEADER SECTION */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-light text-slate-800 tracking-tight">
          Nouveau <span className="font-semibold text-slate-900">Dossier {activeCategory === 'entreprise' ? 'PRO' : 'Client'}</span>
        </h1>
        <div className="mt-6 flex justify-center items-center gap-6">
          <div className={`flex items-center gap-3 transition-colors ${step >= 1 ? 'text-blue-600' : 'text-slate-300'}`}>
            <span className={`w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-semibold ${step >= 1 ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-slate-200'}`}>1</span>
            <span className="text-sm font-medium">Anamnèse</span>
          </div>
          <div className="w-12 h-px bg-slate-200"></div>
          <div className={`flex items-center gap-3 transition-colors ${step >= 2 ? 'text-blue-600' : 'text-slate-300'}`}>
            <span className={`w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-semibold ${step >= 2 ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-slate-200'}`}>2</span>
            <span className="text-sm font-medium">Documents ({currentDocs.length})</span>
          </div>
        </div>
      </div>

      {step === 1 ? (
        <div className="bg-white rounded-[32px] shadow-[0_20px_60px_rgb(0,0,0,0.03)] border border-slate-50 p-10 animate-fade-in">

          {/* CATEGORY SWITCHER */}
          <div className="flex justify-center mb-10">
            <div className="bg-slate-50 p-1.5 rounded-2xl inline-flex border border-slate-100 shadow-inner">
              <button onClick={() => handleCategoryChange('particulier')} className={`px-8 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${activeCategory === 'particulier' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                <User className="w-4 h-4 inline mr-2" /> Particulier
              </button>
              <button onClick={() => handleCategoryChange('entreprise')} className={`px-8 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${activeCategory === 'entreprise' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                <Building2 className="w-4 h-4 inline mr-2" /> Entreprise
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* GAUCHE : IDENTITÉ */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-500" /> Profil Demandeur
              </h3>
              <div className="space-y-4">
                {activeCategory === 'entreprise' && (
                  <div className="group animate-in slide-in-from-top-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase">Dénomination Sociale<span className="text-red-300">*</span></label>
                    <input type="text" name="companyName" value={clientInfo.companyName} onChange={handleInfoChange} placeholder="ex: SARL Techpro" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all outline-none text-sm font-semibold" />
                  </div>
                )}
                <div className="group">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase">{activeCategory === 'entreprise' ? 'Représentant Légal' : 'Nom Complet'}<span className="text-red-300">*</span></label>
                  <input type="text" name="fullName" value={clientInfo.fullName} onChange={handleInfoChange} placeholder="Jean Dupont" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all outline-none text-sm" />
                </div>
                <div className="group">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase">Email<span className="text-red-300">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-4 w-4 h-4 text-slate-300" />
                    <input type="email" name="email" value={clientInfo.email} onChange={handleInfoChange} placeholder="contact@email.com" className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none text-sm" />
                  </div>
                </div>
                <div className="group">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase">Téléphone</label>
                  <PhoneInput international defaultCountry="FR" value={clientInfo.phone} onChange={(v: any) => setClientInfo({ ...clientInfo, phone: v || '' })} className="flex px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-2xl focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 transition-all" />
                </div>
              </div>
            </div>

            {/* DROITE : CRÉDIT */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-500" /> Engagement
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase">Objet du financement<span className="text-red-300">*</span></label>
                  <select name="creditType" value={clientInfo.creditType} onChange={handleInfoChange} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none text-sm font-semibold text-slate-700">
                    {Object.entries(activeCategory === 'particulier' ? CREDIT_TYPES_PARTICULIER : CREDIT_TYPES_ENTREPRISE).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase">Montant Requis (€)<span className="text-red-300">*</span></label>
                  <div className="relative">
                    <Euro className="absolute right-5 top-4 text-slate-300 w-5 h-5" />
                    <input type="number" name="amount" value={clientInfo.amount} onChange={handleInfoChange} placeholder="50000" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none text-sm font-bold text-slate-800" />
                  </div>
                </div>
                {activeCategory === 'particulier' && (
                  <label className="flex items-center gap-4 p-4 bg-blue-50/30 border border-blue-100/50 rounded-2xl cursor-pointer hover:bg-blue-50 transition-colors">
                    <input type="checkbox" name="hasCredits" checked={clientInfo.hasCredits} onChange={handleInfoChange} className="w-5 h-5 text-blue-600 rounded-lg border-slate-200" />
                    <div>
                      <p className="text-sm font-bold text-slate-700 tracking-tight text-[10px]">Passif existant ?</p>
                      <p className="text-[10px] text-slate-400">Inclure les tableaux d'amortissement en cours.</p>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>

          {error && <div className="mt-8 text-red-500 text-xs font-bold bg-red-50 p-4 rounded-2xl flex items-center gap-3 border border-red-100 animate-shake uppercase tracking-wider"><AlertCircle className="w-4 h-4" />{error}</div>}

          <div className="mt-12 flex justify-end">
            <button onClick={validateStep1} className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-sm font-bold hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-100 transition-all duration-300 flex items-center gap-3 group shadow-lg">
              Suivant <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      ) : (
        /* STEP 2 : DOCUMENTS */
        <div className="bg-white rounded-[32px] shadow-[0_20px_60px_rgb(0,0,0,0.03)] border border-slate-50 overflow-hidden animate-fade-in">
          <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-50 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                <FileText className="w-5 h-5 text-blue-500" /> Justificatifs Requis
              </h3>
              <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">
                Profil : {activeCategory === 'entreprise' ? 'PRO' : 'PART'} — {currentDocs.length} pièces
              </p>
            </div>
            <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[11px] font-black uppercase tracking-widest border border-blue-100 shadow-sm">
              {Object.keys(files).length} / {currentDocs.length} Fournis
            </div>
          </div>

          <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
            {currentDocs.map((doc) => {
              const docFiles = files[doc.id] || [];
              const isProvided = docFiles.length > 0;
              return (
                <div key={doc.id} className={`p-5 border-2 rounded-[24px] transition-all duration-300 ${isProvided ? 'bg-emerald-50/20 border-emerald-100' : 'bg-slate-50/30 border-slate-100 hover:border-blue-100 hover:bg-white shadow-sm'}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${isProvided ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300 border border-slate-100'}`}>
                      {isProvided ? <CheckCircle className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                    </div>
                    <p className={`text-xs font-bold uppercase tracking-tight leading-tight ${isProvided ? 'text-emerald-700' : 'text-slate-600'}`}>{doc.label}</p>
                  </div>

                  <div className="space-y-2">
                    {docFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-2.5 px-4 rounded-xl border border-slate-100 shadow-sm animate-scale-in">
                        <span className="text-[10px] text-slate-700 font-bold truncate max-w-[80%]">{file.name}</span>
                        <button onClick={() => removeFile(doc.id, idx)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                    <div className="relative group">
                      <input type="file" multiple accept="application/pdf,image/*" onChange={(e) => handleFileSelect(doc.id, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <button className={`w-full py-2.5 border-2 border-dashed rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isProvided ? 'border-emerald-200 text-emerald-600 bg-white' : 'border-slate-200 text-slate-400 bg-white group-hover:border-blue-300 group-hover:text-blue-500'}`}>
                        {isProvided ? "+ Ajouter" : "Importer"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center">
            <button onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <button onClick={handleAnalyze} disabled={loading} className={`px-10 py-4 rounded-2xl text-sm font-bold text-white shadow-xl transition-all flex items-center gap-3 ${loading ? 'bg-slate-300' : 'bg-blue-600 hover:bg-emerald-500 hover:shadow-emerald-100'}`}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Analyser avec l'IA</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}