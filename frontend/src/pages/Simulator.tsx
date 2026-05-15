import React, { useState, useEffect } from 'react';
import { ArrowRight, Activity, Percent, Banknote, ShieldAlert, TrendingDown, TrendingUp, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Plot from 'react-plotly.js';

export default function Simulator() {
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

    const txMensuel = (taux / 100) / 12;
    const mensualite = txMensuel === 0
        ? (montantPret / duree)
        : (montantPret * txMensuel) / (1 - Math.pow(1 + txMensuel, -duree));

    const annuite = mensualite * 12;
    const detteTotale = detteBase + montantPret;

    const calculatedDscr = annuite > 0 ? calculatedEbitda / annuite : 99;
    setDscr(calculatedDscr);

    const calculatedLevier = calculatedEbitda > 0 ? detteTotale / calculatedEbitda : 99;
    setLevier(calculatedLevier);

    // 2. Logic Scoring
    let currentScore = 60;
    if (calculatedDscr < 1.0) currentScore -= 40;
    else if (calculatedDscr < 1.2) currentScore -= 20;
    else if (calculatedDscr >= 2.0) currentScore += 20;
    else if (calculatedDscr >= 1.5) currentScore += 10;
    if (calculatedLevier > 6) currentScore -= 30;
    else if (calculatedLevier > 4) currentScore -= 15;
    else if (calculatedLevier < 2) currentScore += 20;
    if (marge < 3) currentScore -= 20;
    else if (marge > 15) currentScore += 15;
    if (detteTotale > ca) currentScore -= 15;
    currentScore = Math.max(0, Math.min(100, currentScore));
    setScore(currentScore);

    const calculatedPd = Math.max(0.1, Math.min(99.9, 100 * Math.exp(-0.06 * currentScore)));
    setPd(calculatedPd);

  }, [ca, marge, detteBase, montantPret, taux, duree]);


  // Composant Slider Réutilisable — Redesigné pour plus de sobriété
  const RangeSlider = ({ label, value, min, max, step, unit, onChange, icon: Icon }: any) => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
           <Icon className="w-4 h-4 text-slate-400" /> {label}
        </label>
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-600">
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
        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
      />
    </div>
  );

  // ─── Helpers couleur — Tons plus sobres ────────────────────────────────────────
  const pdColor      = pd > 15 ? '#ef4444' : pd > 5 ? '#f59e0b' : '#10b981';
  const scoreColor   = score < 50 ? '#ef4444' : score < 70 ? '#f59e0b' : '#10b981';
  const dscrColor    = dscr < 1.2 ? '#ef4444' : dscr < 1.5 ? '#f59e0b' : '#10b981';
  const levierColor  = levier > 6 ? '#ef4444' : levier > 4 ? '#f59e0b' : '#10b981';

  // Segments de jauge (plus fins)
  const segments = Array.from({ length: 40 }, (_, i) => ({
    active: score >= (i + 1) * 2.5,
  }));

  return (
    <div className="max-w-7xl mx-auto px-6 pb-20 mt-10 animate-fadeIn font-sans">

      {/* HEADER — Plus épuré */}
      <div className="flex items-center justify-between mb-12">
        <div>
        <h1 className="text-3xl font-light text-slate-800 dark:text-slate-100 tracking-tight transition-colors">
            Simulateur de <span className="font-semibold text-slate-900 dark:text-white">Crédit</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Analysez la robustesse financière de vos dossiers sous différents scénarios.
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* COLONNE GAUCHE: SLIDERS */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-7 border border-slate-200 dark:border-slate-700/60 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-8 uppercase tracking-wider">
              <Settings2 className="w-4 h-4 text-indigo-500" /> Données de l'Entreprise
            </h2>
            <RangeSlider label="Chiffre d'Affaires" value={ca} min={10000} max={5000000} step={10000} unit="€" onChange={setCa} icon={Banknote} />
            <RangeSlider label="Marge EBITDA" value={marge} min={-10} max={40} step={1} unit="%" onChange={setMarge} icon={Percent} />
            <RangeSlider label="Dette existante" value={detteBase} min={0} max={2000000} step={10000} unit="€" onChange={setDetteBase} icon={TrendingDown} />
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-7 border border-slate-200 dark:border-slate-700/60 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-8 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Scénario de Financement
            </h2>
            <RangeSlider label="Montant Demandé" value={montantPret} min={0} max={1000000} step={10000} unit="€" onChange={setMontantPret} icon={Banknote} />
            <RangeSlider label="Durée d'amortissement" value={duree} min={12} max={120} step={12} unit="mois" onChange={setDuree} icon={Activity} />
            <RangeSlider label="Taux d'intérêt" value={taux} min={0} max={15} step={0.1} unit="%" onChange={setTaux} icon={Percent} />
          </div>
        </div>

        {/* COLONNE DROITE: RÉSULTATS */}
        <div className="lg:col-span-7 space-y-8">

          {/* ── Main KPI — Redesign Premium ── */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700/60 shadow-sm relative overflow-hidden transition-all duration-300">
            {/* Liseré latéral de statut */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: pdColor }} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Probabilité de Défaut (1 an)
                </h3>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border"
                  style={{
                    color: pdColor,
                    borderColor: pdColor + '33',
                    background: pdColor + '08',
                  }}
                >
                  {pd > 15 ? 'Risque Critique' : pd > 5 ? 'Sous Surveillance' : 'Risque Maîtrisé'}
                </span>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-12">
                {/* Arc gauge minimaliste */}
                <div className="relative flex-shrink-0" style={{ width: 160, height: 90 }}>
                  <svg width="160" height="90" viewBox="0 0 160 90">
                    <path
                      d="M 15 80 A 65 65 0 0 1 145 80"
                      fill="none" stroke="currentColor"
                      strokeWidth="6" strokeLinecap="round"
                      className="text-slate-100 dark:text-slate-700"
                    />
                    <path
                      d="M 15 80 A 65 65 0 0 1 145 80"
                      fill="none"
                      stroke={pdColor}
                      strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={`${(pd / 100) * 204} 204`}
                      style={{ transition: 'stroke-dasharray 1s cubic-bezier(.4,0,.2,1), stroke 0.5s' }}
                    />
                    <text x="80" y="72" textAnchor="middle" fontSize="24" fontWeight="600"
                      fill={pdColor} style={{ transition: 'fill 0.5s', fontFamily: 'inherit' }}>
                      {pd.toFixed(1)}%
                    </text>
                  </svg>
                </div>

                {/* Score barre épurée */}
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-baseline mb-4">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Financial Score</span>
                    <span className="text-3xl font-semibold text-slate-800 dark:text-slate-100">{score}<span className="text-sm font-normal text-slate-400 ml-1">/100</span></span>
                  </div>

                  <div className="h-1 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden mb-5">
                    <div
                      className="h-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${score}%`,
                        backgroundColor: scoreColor,
                      }}
                    />
                  </div>

                  {/* Segments ultra-fins */}
                  <div className="flex gap-[1.5px]">
                    {segments.map((seg, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-full transition-all duration-500"
                        style={{
                          height: 4,
                          background: seg.active ? scoreColor : 'rgba(0,0,0,0.04)',
                          opacity: seg.active ? 1 : 1,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Sub KPIs — Cartes sobres ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* DSCR */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ratio DSCR</p>
                <div className={`p-2 rounded-lg ${dscr < 1.2 ? 'text-red-500 bg-red-50/50' : 'text-emerald-500 bg-emerald-50/50'}`}>
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
                {dscr > 50 ? '> 50' : dscr.toFixed(2)}x
              </div>
              <div className="h-1 bg-slate-50 dark:bg-slate-700/30 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (Math.min(dscr, 3) / 3) * 100)}%`,
                    backgroundColor: dscrColor,
                  }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-slate-400 font-medium mt-2 tracking-tighter">
                <span>0.0</span>
                <span>1.2 (Min)</span>
                <span>2.0 (Cible)</span>
                <span>3.0+</span>
              </div>
            </div>

            {/* LEVIER */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Levier de Dette</p>
                <div className={`p-2 rounded-lg ${levier > 4 ? 'text-red-500 bg-red-50/50' : 'text-emerald-500 bg-emerald-50/50'}`}>
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
                {levier > 50 ? '> 50' : levier.toFixed(1)}x
              </div>
              <div className="h-1 bg-slate-50 dark:bg-slate-700/30 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (Math.min(levier, 8) / 8) * 100)}%`,
                    backgroundColor: levierColor,
                  }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-slate-400 font-medium mt-2 tracking-tighter">
                <span>0.0</span>
                <span>2.0</span>
                <span>4.0</span>
                <span>6.0 (Max)</span>
              </div>
            </div>
          </div>

          {/* ── Graphique Plotly — Tons Ardoise/Émeraude ── */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-7 border border-slate-200 dark:border-slate-700/60 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Capacité d'Autofinancement (Simulation 5 ans)</h3>
            </div>
            <div className="h-64 w-full">
              <Plot
                data={[
                  {
                    x: ['Année 1', 'Année 2', 'Année 3', 'Année 4', 'Année 5'],
                    y: Array.from({ length: 5 }, (_, i) =>
                      ebitda - (((montantPret / duree) * 12) * Math.pow(0.9, i))
                    ),
                    type: 'bar',
                    marker: {
                      color: Array.from({ length: 5 }, (_, i) => {
                        const val = ebitda - (((montantPret / duree) * 12) * Math.pow(0.9, i));
                        return val >= 0 ? '#10b981' : '#ef4444';
                      }),
                      opacity: 0.7,
                    },
                  }
                ]}
                layout={{
                  autosize: true,
                  margin: { t: 10, l: 40, r: 10, b: 30 },
                  paper_bgcolor: 'transparent',
                  plot_bgcolor: 'transparent',
                  font: { color: '#94a3b8', size: 10, family: 'Inter, sans-serif' },
                  bargap: 0.4,
                  xaxis: {
                    showgrid: false,
                    zeroline: false,
                    tickfont: { color: '#64748b' },
                  },
                  yaxis: {
                    showgrid: true,
                    gridcolor: 'rgba(226,232,240,0.4)',
                    zeroline: true,
                    zerolinecolor: 'rgba(226,232,240,0.8)',
                    tickfont: { color: '#64748b' },
                  },
                }}
                useResizeHandler
                style={{ width: '100%', height: '100%' }}
                config={{ displayModeBar: false, responsive: true }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-4 text-center italic">
              Projection basée sur l'EBITDA actuel et l'amortissement du prêt.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}