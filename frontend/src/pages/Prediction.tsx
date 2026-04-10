import React, { useState, useEffect } from 'react';
import { ArrowRight, Activity, Percent, Banknote, ShieldAlert, TrendingDown, TrendingUp, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Plot from 'react-plotly.js';

export default function Prediction() {
  const navigate = useNavigate();

  // --- ÉTATS (SLIDERS) ---
  const [ca, setCa] = useState<number>(1000000);
  const [marge, setMarge] = useState<number>(12); // en %
  const [detteBase, setDetteBase] = useState<number>(200000);

  const [montantPret, setMontantPret] = useState<number>(150000);
  const [taux, setTaux] = useState<number>(5.5); // en %
  const [duree, setDuree] = useState<number>(60); // en mois

  // --- RÉSULTATS CALCULÉS ---
  const [score, setScore] = useState<number>(50);
  const [pd, setPd] = useState<number>(10);
  const [dscr, setDscr] = useState<number>(1.5);
  const [levier, setLevier] = useState<number>(3.0);
  const [ebitda, setEbitda] = useState<number>(0);

  // Moteur de calcul en temps réel
  useEffect(() => {
    // 1. Calculs financiers
    const calculatedEbitda = ca * (marge / 100);
    setEbitda(calculatedEbitda);

    // Mensualité d'un prêt classique : M = P * r / (1 - (1+r)^-n)
    const txMensuel = (taux / 100) / 12;
    const mensualite = txMensuel === 0 
        ? (montantPret / duree) 
        : (montantPret * txMensuel) / (1 - Math.pow(1 + txMensuel, -duree));
    
    const annuite = mensualite * 12;
    const detteTotale = detteBase + montantPret;

    // Ratios
    const calculatedDscr = annuite > 0 ? calculatedEbitda / annuite : 99;
    setDscr(calculatedDscr);

    const calculatedLevier = calculatedEbitda > 0 ? detteTotale / calculatedEbitda : 99;
    setLevier(calculatedLevier);

    // 2. Logic Scoring déterministe
    let currentScore = 60; // base neutre

    // Poids DSCR
    if (calculatedDscr < 1.0) currentScore -= 40;
    else if (calculatedDscr < 1.2) currentScore -= 20;
    else if (calculatedDscr >= 2.0) currentScore += 20;
    else if (calculatedDscr >= 1.5) currentScore += 10;

    // Poids Levier
    if (calculatedLevier > 6) currentScore -= 30;
    else if (calculatedLevier > 4) currentScore -= 15;
    else if (calculatedLevier < 2) currentScore += 20;

    // Poids Marge
    if (marge < 3) currentScore -= 20;
    else if (marge > 15) currentScore += 15;

    // Endettement global rapport au CA
    if (detteTotale > ca) currentScore -= 15;

    // Clamp score
    currentScore = Math.max(0, Math.min(100, currentScore));
    setScore(currentScore);

    // 3. Calcul de la Probabilité de Défaut (Formule exponentielle Kaïs)
    const calculatedPd = Math.max(0.1, Math.min(99.9, 100 * Math.exp(-0.06 * currentScore)));
    setPd(calculatedPd);

  }, [ca, marge, detteBase, montantPret, taux, duree]);


  // Composant Slider Réutilisable
  const RangeSlider = ({ label, value, min, max, step, unit, onChange, icon: Icon }: any) => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
           <Icon className="w-4 h-4 text-blue-500" /> {label}
        </label>
        <span className="text-sm font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg">
          {value.toLocaleString('fr-FR')} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20 mt-8 animate-fade-in font-sans">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-500" /> Stress Test Prédictif
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Simulez instantanément différents scénarios économiques pour tester la robustesse des emprunteurs.
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          Retour <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLONNE GAUCHE: SLIDERS */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Bloc Entreprise */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-6">
              <Settings2 className="w-5 h-5 text-indigo-500" /> Données de l'Entreprise
            </h2>
            <RangeSlider
              label="Chiffre d'Affaires"
              value={ca}
              min={10000}
              max={5000000}
              step={10000}
              unit="€"
              onChange={setCa}
              icon={Banknote}
            />
            <RangeSlider
              label="Marge EBITDA"
              value={marge}
              min={-10}
              max={40}
              step={1}
              unit="%"
              onChange={setMarge}
              icon={Percent}
            />
            <RangeSlider
              label="Dette existante"
              value={detteBase}
              min={0}
              max={2000000}
              step={10000}
              unit="€"
              onChange={setDetteBase}
              icon={TrendingDown}
            />
          </div>

          {/* Bloc Financement */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-emerald-500" /> Scénario de Financement
            </h2>
            <RangeSlider
              label="Montant Demandé"
              value={montantPret}
              min={0}
              max={1000000}
              step={10000}
              unit="€"
              onChange={setMontantPret}
              icon={Banknote}
            />
            <RangeSlider
              label="Durée d'amortissement"
              value={duree}
              min={12}
              max={120}
              step={12}
              unit="mois"
              onChange={setDuree}
              icon={Activity}
            />
            <RangeSlider
              label="Taux d'intérêt"
              value={taux}
              min={0}
              max={15}
              step={0.1}
              unit="%"
              onChange={setTaux}
              icon={Percent}
            />
          </div>

        </div>

        {/* COLONNE DROITE: RÉSULTATS */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Main KPI */}
          <div className={`rounded-3xl p-8 border shadow-sm transition-colors duration-500 relative overflow-hidden ${
            pd > 15 ? 'bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-800/30' : 
            pd > 5 ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800/30' : 
            'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/30'
          }`}>
            {/* Décoration arriere plan */}
            <ShieldAlert className={`absolute -right-10 -top-10 w-64 h-64 opacity-[0.03] ${pd > 10 ? 'text-rose-500' : 'text-emerald-500'}`} />

            <div className="relative z-10 flex flex-col items-center text-center">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Probabilité de Défaut (1 an)</h3>
              <div className="flex items-end justify-center gap-1 mb-6">
                <span className={`text-6xl font-black ${
                  pd > 15 ? 'text-rose-600 dark:text-rose-400' : 
                  pd > 5 ? 'text-orange-600 dark:text-orange-400' : 
                  'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {pd.toFixed(1)}
                </span>
                <span className="text-2xl text-slate-400 font-bold mb-1">%</span>
              </div>
              
              {/* Jauge Score */}
              <div className="w-full max-w-sm">
                <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                  <span>Score: {score}</span>
                  <span>100</span>
                </div>
                <div className="h-4 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={`h-full transition-all duration-700 ease-out ${
                      score < 50 ? 'bg-rose-500' : score < 70 ? 'bg-orange-500' : 'bg-emerald-500'
                    }`} 
                    style={{ width: `${score}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sub KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Ratio DSCR</p>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${
                    dscr < 1.0 ? 'text-rose-500' : dscr < 1.2 ? 'text-orange-500' : 'text-emerald-500'
                  }`}>
                    {dscr > 50 ? '> 50' : dscr.toFixed(2)}x
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-2xl ${dscr < 1.2 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                <Activity className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Levier (Dette/EBITDA)</p>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${
                    levier > 6 ? 'text-rose-500' : levier > 4 ? 'text-orange-500' : 'text-emerald-500'
                  }`}>
                    {levier > 50 ? '> 50' : levier.toFixed(1)}x
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-2xl ${levier > 4 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Graphique d'évolution */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
             <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Trajectoire du Cash Flow Libre</h3>
             <div className="h-64 w-full">
               <Plot
                  data={[
                    {
                      x: ['Année 1', 'Année 2', 'Année 3', 'Année 4', 'Année 5'],
                      y: Array.from({length: 5}, (_, i) => ebitda - (((montantPret/duree)*12) * Math.pow(0.9, i))), // Simulation rapide
                      type: 'bar',
                      marker: { color: ebitda > 0 ? (dscr > 1.2 ? '#10b981' : '#f59e0b') : '#f43f5e' }
                    }
                  ]}
                  layout={{
                    autosize: true,
                    margin: { t: 10, l: 40, r: 10, b: 30 },
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    font: { color: '#94a3b8' },
                    xaxis: { showgrid: false },
                    yaxis: { showgrid: true, gridcolor: '#334155', zeroline: true, zerolinecolor: '#475569' }
                  }}
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                  config={{ displayModeBar: false }}
               />
             </div>
             <p className="text-xs text-slate-400 mt-4 text-center">Simulation indicative de la marge disponible après amortissement du prêt testé.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
