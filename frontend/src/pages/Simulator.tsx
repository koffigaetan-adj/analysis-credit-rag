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


  // Composant Slider Réutilisable (identique à l'original)
  const RangeSlider = ({ label, value, min, max, step, unit, onChange, icon: Icon }: any) => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
           <Icon className="w-5 h-5 icon-primary" /> {label}
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

  // ─── Helpers couleur ────────────────────────────────────────────────────────
  const pdColorClass = pd > 15 ? 'danger' : pd > 5 ? 'warn' : 'safe';
  const pdColor      = pd > 15 ? '#f43f5e' : pd > 5 ? '#f59e0b' : '#10b981';
  const scoreColor   = score < 50 ? '#f43f5e' : score < 70 ? '#f59e0b' : '#10b981';
  const dscrColor    = dscr < 1.0 ? '#f43f5e' : dscr < 1.2 ? '#f59e0b' : '#10b981';
  const levierColor  = levier > 6 ? '#f43f5e' : levier > 4 ? '#f59e0b' : '#10b981';

  // Segments de jauge (20 segments)
  const segments = Array.from({ length: 20 }, (_, i) => ({
    active: score >= (i + 1) * 5,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20 mt-8 animate-fade-in font-sans">

      {/* HEADER — identique */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Activity className="w-5 h-5 icon-primary" /> Simulateur de Crédit
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

        {/* COLONNE GAUCHE: SLIDERS — identique */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-6">
              <Settings2 className="w-5 h-5 text-indigo-500" /> Données de l'Entreprise
            </h2>
            <RangeSlider label="Chiffre d'Affaires" value={ca} min={10000} max={5000000} step={10000} unit="€" onChange={setCa} icon={Banknote} />
            <RangeSlider label="Marge EBITDA" value={marge} min={-10} max={40} step={1} unit="%" onChange={setMarge} icon={Percent} />
            <RangeSlider label="Dette existante" value={detteBase} min={0} max={2000000} step={10000} unit="€" onChange={setDetteBase} icon={TrendingDown} />
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-emerald-500" /> Scénario de Financement
            </h2>
            <RangeSlider label="Montant Demandé" value={montantPret} min={0} max={1000000} step={10000} unit="€" onChange={setMontantPret} icon={Banknote} />
            <RangeSlider label="Durée d'amortissement" value={duree} min={12} max={120} step={12} unit="mois" onChange={setDuree} icon={Activity} />
            <RangeSlider label="Taux d'intérêt" value={taux} min={0} max={15} step={0.1} unit="%" onChange={setTaux} icon={Percent} />
          </div>
        </div>

        {/* COLONNE DROITE: RÉSULTATS */}
        <div className="lg:col-span-7 space-y-8">

          {/* ── Main KPI — redesigné ── */}
          <div className={`rounded-3xl p-8 border shadow-xl transition-all duration-500 relative overflow-hidden backdrop-blur-xl transform hover:-translate-y-1 ${
            pd > 15 ? 'bg-rose-50/90 border-rose-200 dark:bg-rose-900/40 dark:border-rose-800/40' :
            pd > 5  ? 'bg-orange-50/90 border-orange-200 dark:bg-orange-900/40 dark:border-orange-800/40' :
            'bg-emerald-50/90 border-emerald-200 dark:bg-emerald-900/40 dark:border-emerald-800/40'
          }`}>
            <ShieldAlert className={`absolute -right-10 -top-10 w-64 h-64 opacity-[0.03] ${pd > 10 ? 'text-rose-500' : 'text-emerald-500'}`} />

            <div className="relative z-10">
              {/* Titre + badge statut */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Probabilité de Défaut (1 an)
                </h3>
                <span
                  className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border"
                  style={{
                    color: pdColor,
                    borderColor: pdColor + '55',
                    background: pdColor + '15',
                  }}
                >
                  {pd > 15 ? '⚠ Risque élevé' : pd > 5 ? '~ Surveillance' : '✓ Risque faible'}
                </span>
              </div>

              {/* Chiffre PD + arc gauge SVG */}
              <div className="flex items-center gap-8">
                {/* Arc gauge */}
                <div className="relative flex-shrink-0" style={{ width: 140, height: 80 }}>
                  <svg width="140" height="80" viewBox="0 0 140 80">
                    {/* Track */}
                    <path
                      d="M 10 75 A 60 60 0 0 1 130 75"
                      fill="none" stroke="currentColor"
                      strokeWidth="10" strokeLinecap="round"
                      className="text-slate-200 dark:text-slate-700"
                    />
                    {/* Fill — stroke-dasharray trick */}
                    <path
                      d="M 10 75 A 60 60 0 0 1 130 75"
                      fill="none"
                      stroke={pdColor}
                      strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${(pd / 100) * 188} 188`}
                      style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(.4,0,.2,1), stroke 0.5s' }}
                      filter={`drop-shadow(0 0 6px ${pdColor}88)`}
                    />
                    {/* Valeur centrale */}
                    <text x="70" y="68" textAnchor="middle" fontSize="22" fontWeight="800"
                      fill={pdColor} style={{ transition: 'fill 0.5s', fontFamily: 'inherit' }}>
                      {pd.toFixed(1)}%
                    </text>
                  </svg>
                </div>

                {/* Score barre + segments */}
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Score</span>
                    <span className="text-lg font-black" style={{ color: scoreColor }}>{score}<span className="text-sm font-normal text-slate-400">/100</span></span>
                  </div>

                  {/* Barre principale */}
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3" style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${score}%`,
                        background: `linear-gradient(90deg, ${scoreColor}99, ${scoreColor})`,
                        boxShadow: `0 0 8px ${scoreColor}66`,
                      }}
                    />
                  </div>

                  {/* Segments de jauge */}
                  <div className="flex gap-[2px]">
                    {segments.map((seg, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm transition-all duration-300"
                        style={{
                          height: i % 4 === 0 ? 8 : 5,
                          background: seg.active ? scoreColor : 'rgba(0,0,0,0.08)',
                          opacity: seg.active ? (0.4 + (i / 20) * 0.6) : 1,
                          boxShadow: seg.active ? `0 0 4px ${scoreColor}55` : 'none',
                          transition: 'background 0.4s, box-shadow 0.4s',
                        }}
                      />
                    ))}
                  </div>

                  {/* Ticks */}
                  <div className="flex justify-between mt-1">
                    {['0', '25', '50', '75', '100'].map(v => (
                      <span key={v} className="text-[9px] text-slate-400 font-mono">{v}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Sub KPIs — redesignés ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* DSCR */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Ratio DSCR</p>
                  <div className="text-2xl font-bold" style={{ color: dscrColor }}>
                    {dscr > 50 ? '> 50' : dscr.toFixed(2)}x
                  </div>
                </div>
                <div className={`p-3 rounded-2xl ${dscr < 1.2 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                  <Activity className="w-6 h-6" />
                </div>
              </div>
              {/* Barre de progression stylée */}
              <div className="space-y-1">
                <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (Math.min(dscr, 3) / 3) * 100)}%`,
                      background: `linear-gradient(90deg, ${dscrColor}88, ${dscrColor})`,
                      boxShadow: `0 0 6px ${dscrColor}44`,
                    }}
                  />
                </div>
                {/* Repères */}
                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>0</span>
                  <span style={{ color: '#f59e0b' }}>1.2×</span>
                  <span style={{ color: '#10b981' }}>2.0×</span>
                  <span>3×</span>
                </div>
              </div>
            </div>

            {/* LEVIER */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Levier (Dette/EBITDA)</p>
                  <div className="text-2xl font-bold" style={{ color: levierColor }}>
                    {levier > 50 ? '> 50' : levier.toFixed(1)}x
                  </div>
                </div>
                <div className={`p-3 rounded-2xl ${levier > 4 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                  <TrendingDown className="w-6 h-6" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (Math.min(levier, 8) / 8) * 100)}%`,
                      background: `linear-gradient(90deg, ${levierColor}88, ${levierColor})`,
                      boxShadow: `0 0 6px ${levierColor}44`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>0</span>
                  <span style={{ color: '#10b981' }}>2×</span>
                  <span style={{ color: '#f59e0b' }}>4×</span>
                  <span style={{ color: '#f43f5e' }}>6×+</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Graphique Plotly — paramètres visuels améliorés, logique identique ── */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Trajectoire du Cash Flow Libre</h3>
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
                        return val >= 0
                          ? (dscr > 1.2 ? '#10b981' : '#f59e0b')
                          : '#f43f5e';
                      }),
                      opacity: 0.88,
                      line: { width: 0 },
                    },
                    // Arrondir les coins (Plotly supporte via customdata trick — on garde simple)
                  }
                ]}
                layout={{
                  autosize: true,
                  margin: { t: 18, l: 52, r: 12, b: 36 },
                  paper_bgcolor: 'transparent',
                  plot_bgcolor: 'transparent',
                  font: { color: '#94a3b8', size: 11 },
                  bargap: 0.35,
                  xaxis: {
                    showgrid: false,
                    zeroline: false,
                    tickfont: { size: 11, color: '#94a3b8' },
                    showline: false,
                  },
                  yaxis: {
                    showgrid: true,
                    gridcolor: 'rgba(148,163,184,0.12)',
                    gridwidth: 1,
                    zeroline: true,
                    zerolinecolor: 'rgba(148,163,184,0.35)',
                    zerolinewidth: 1.5,
                    tickfont: { size: 10, color: '#94a3b8' },
                    showline: false,
                  },
                  hoverlabel: {
                    bgcolor: '#1e293b',
                    bordercolor: 'rgba(255,255,255,0.1)',
                    font: { color: '#f1f5f9', size: 12 },
                  },
                  shapes: [
                    // Ligne zéro mise en valeur
                    {
                      type: 'line',
                      x0: -0.5, x1: 4.5,
                      y0: 0, y1: 0,
                      line: { color: 'rgba(148,163,184,0.3)', width: 1, dash: 'dot' },
                    }
                  ],
                }}
                useResizeHandler
                style={{ width: '100%', height: '100%' }}
                config={{ displayModeBar: false, responsive: true }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-4 text-center">
              Simulation indicative de la marge disponible après amortissement du prêt testé.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}