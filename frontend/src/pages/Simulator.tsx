import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingDown, TrendingUp, DollarSign, Activity } from 'lucide-react';

// ─── Design: Dark financial terminal · obsidian + neon gold ───────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500;700&display=swap');

  :root {
    --bg:       #0B0F19; /* BG main de Kaïs Analytics */
    --s1:       #0F1523; /* Surface 1 */
    --s2:       #121927; /* Surface 2 */
    --border:   rgba(255,255,255,0.06);
    --borderHi: rgba(255,255,255,0.15);
    
    /* Intégration de la couleur dynamique de l'établissement */
    --gold:     var(--kais-primary);
    --goldDim:  color-mix(in srgb, var(--kais-primary) 12%, transparent);
    --goldGlow: color-mix(in srgb, var(--kais-primary) 22%, transparent);
    
    /* Couleurs de statut */
    --green:    #10b981; /* emerald-500 */
    --red:      #f43f5e; /* rose-500 */
    --amber:    #f59e0b; /* amber-500 */
    
    /* Textes façon Slate */
    --tx1:      #f8fafc; /* slate-50 */
    --tx2:      #94a3b8; /* slate-400 */
    --tx3:      #64748b; /* slate-500 */
  }
  .r *{box-sizing:border-box;margin:0;padding:0}
  .r{
    font-family:'Syne',sans-serif;
    background:var(--bg);
    color:var(--tx1);
    min-height:100vh;
    position:relative;
  }

  /* bg glows */
  .r::before,.r::after{
    content:'';position:fixed;border-radius:50%;pointer-events:none;z-index:0;
  }
  .r::before{
    top:-25%;right:-15%;width:650px;height:650px;
    background:radial-gradient(circle, color-mix(in srgb, var(--kais-primary) 6%, transparent) 0%, transparent 65%);
  }
  .r::after{
    bottom:-20%;left:-10%;width:500px;height:500px;
    background:radial-gradient(circle,rgba(16,185,129,0.025) 0%,transparent 65%);
  }

  .wrap{position:relative;z-index:1;max-width:1300px;margin:0 auto;padding:38px 28px 80px}

  /* ── HEADER ── */
  .hdr{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:44px;animation:fadeUp .45s ease both}
  .eyebrow{
    font-family:'JetBrains Mono',monospace;
    font-size:9.5px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;
    color:var(--gold);display:flex;align-items:center;gap:8px;margin-bottom:10px;
  }
  .eyebrow::before{content:'';width:18px;height:1px;background:var(--gold)}
  .htitle{font-size:34px;font-weight:800;letter-spacing:-.025em;line-height:.95}
  .hsub{font-size:12.5px;color:var(--tx2);margin-top:10px;line-height:1.65;max-width:340px;font-weight:400}
  .backbtn{
    display:flex;align-items:center;gap:7px;
    padding:9px 16px;background:var(--s1);border:1px solid var(--borderHi);
    border-radius:8px;color:var(--tx2);font-family:'Syne',sans-serif;
    font-size:11px;font-weight:600;letter-spacing:.07em;cursor:pointer;
    text-transform:uppercase;transition:all .2s;
  }
  .backbtn:hover{color:var(--gold);border-color:var(--gold);background:var(--goldDim)}

  /* ── LAYOUT ── */
  .grid{display:grid;grid-template-columns:420px 1fr;gap:7px}
  @media(max-width:960px){.grid{grid-template-columns:1fr}}

  /* ── PANEL ── */
  .p{
    background:var(--s1);border:1px solid var(--border);
    border-radius:16px;overflow:hidden;position:relative;
    transition:border-color .25s;
  }
  .p:hover{border-color:var(--borderHi)}
  .pi{padding:26px 28px}

  /* ── LEFT COLUMN ── */
  .lcol{display:flex;flex-direction:column;gap:7px}
  .ptitle{
    font-family:'JetBrains Mono',monospace;
    font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;
    color:var(--tx3);margin-bottom:22px;display:flex;align-items:center;gap:7px;
  }
  .ptitle-icon{color:var(--gold);opacity:.75}

  /* sliders */
  .si{margin-bottom:19px}
  .si:last-child{margin-bottom:0}
  .srow{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
  .slabel{font-size:12px;font-weight:600;color:var(--tx2)}
  .sval{
    font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;
    color:var(--gold);background:var(--goldDim);
    padding:2px 8px;border-radius:4px;border:1px solid rgba(240,180,41,.18);
  }
  input[type=range]{
    -webkit-appearance:none;width:100%;height:2px;
    background:rgba(255,255,255,.07);border-radius:1px;outline:none;cursor:pointer;
  }
  input[type=range]::-webkit-slider-thumb{
    -webkit-appearance:none;width:13px;height:13px;border-radius:50%;
    background:var(--gold);border:2px solid var(--bg);
    box-shadow:0 0 7px var(--goldGlow);cursor:pointer;
    transition:transform .15s,box-shadow .15s;
  }
  input[type=range]:hover::-webkit-slider-thumb{transform:scale(1.35);box-shadow:0 0 14px var(--goldGlow)}

  /* ── RIGHT COLUMN ── */
  .rcol{display:flex;flex-direction:column;gap:7px}

  /* PD hero */
  .pd-hero{background:var(--s2);border-color:var(--borderHi)}
  .pd-body{
    padding:32px 34px;display:flex;align-items:center;gap:36px;
    justify-content:space-between;flex-wrap:wrap;
  }
  .badge{
    display:inline-flex;align-items:center;gap:6px;
    padding:4px 11px;border-radius:4px;border:1px solid;
    font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;
    letter-spacing:.14em;text-transform:uppercase;margin-bottom:14px;
    transition:all .45s;
  }
  .badge.safe{background:rgba(16,185,129,.07);color:var(--green);border-color:rgba(16,185,129,.25)}
  .badge.warn{background:rgba(245,158,11,.07);color:var(--amber);border-color:rgba(245,158,11,.25)}
  .badge.danger{background:rgba(244,63,94,.07);color:var(--red);border-color:rgba(244,63,94,.25)}
  path {
    stroke-width: 1.5; /* affiner pour garder l'élégance Kaïs */
  }
  .badge-dot{width:5px;height:5px;border-radius:50%;background:currentColor;animation:blink 1.6s infinite}
  @keyframes blink{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.65)}}

  .pd-num{
    font-family:'JetBrains Mono',monospace;
    font-size:82px;font-weight:700;line-height:.88;letter-spacing:-.04em;
    transition:color .45s;
  }
  .pd-num.safe{color:var(--green)}
  .pd-num.warn{color:var(--amber)}
  .pd-num.danger{color:var(--red)}
  .pd-unit{font-size:26px;font-weight:300;opacity:.45;margin-left:2px}
  .pd-desc{font-size:11.5px;color:var(--tx2);margin-top:11px;line-height:1.5}

  /* score gauge */
  .gauge-side{min-width:260px}
  .g-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:9px}
  .g-label{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--tx2);letter-spacing:.1em;text-transform:uppercase}
  .g-val{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;color:var(--gold)}
  .g-track{height:5px;background:rgba(255,255,255,.05);border-radius:3px;overflow:hidden}
  .g-fill{height:100%;border-radius:3px;transition:width .65s cubic-bezier(.4,0,.2,1),background .45s}
  .g-fill.safe{background:linear-gradient(90deg,#009955,var(--green))}
  .g-fill.warn{background:linear-gradient(90deg,#c06000,var(--amber))}
  .g-fill.danger{background:linear-gradient(90deg,#aa1030,var(--red))}
  .g-ticks{display:flex;justify-content:space-between;margin-top:5px}
  .g-tick{font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--tx3)}

  .segs{display:flex;gap:3px;margin-top:18px}
  .seg{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.04);transition:background .35s}

  .mini-rats{display:flex;gap:10px;margin-top:18px}
  .mini-rat{
    flex:1;padding:9px 10px;background:rgba(255,255,255,.025);
    border-radius:8px;border:1px solid var(--border);
  }
  .mr-key{font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--tx3);letter-spacing:.1em;margin-bottom:4px}
  .mr-val{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700}

  /* KPI row */
  .krow{display:grid;grid-template-columns:1fr 1fr;gap:7px}
  .kpi{padding:22px 24px}
  .ktop{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px}
  .kicon{
    width:38px;height:38px;border-radius:9px;display:flex;align-items:center;justify-content:center;
    border:1px solid;transition:all .3s;
  }
  .kicon.good{background:rgba(16,185,129,.07);border-color:rgba(16,185,129,.2);color:var(--green)}
  .kicon.mid{background:rgba(245,158,11,.07);border-color:rgba(245,158,11,.2);color:var(--amber)}
  .kicon.bad{background:rgba(244,63,94,.07);border-color:rgba(244,63,94,.2);color:var(--red)}
  .ktag{
    font-family:'JetBrains Mono',monospace;font-size:8.5px;color:var(--tx3);
    padding:3px 6px;background:rgba(255,255,255,.03);border-radius:3px;border:1px solid var(--border);
  }
  .kval{font-family:'JetBrains Mono',monospace;font-size:30px;font-weight:700;line-height:1;letter-spacing:-.025em;transition:color .35s}
  .kname{font-size:11px;color:var(--tx2);margin-top:6px;font-weight:500}
  .kbar{height:2px;background:rgba(255,255,255,.05);border-radius:1px;margin-top:14px;overflow:hidden}
  .kbar-fill{height:100%;border-radius:1px;transition:width .65s cubic-bezier(.4,0,.2,1)}

  /* EBITDA */
  .eb-panel{padding:22px 24px}
  .eb-row{display:flex;align-items:center;justify-content:space-between;gap:16px}
  .eb-label{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--tx3);letter-spacing:.12em;text-transform:uppercase;margin-bottom:7px}
  .eb-amount{font-family:'JetBrains Mono',monospace;font-size:26px;font-weight:700;transition:color .4s}
  .eb-sub{font-size:11px;color:var(--tx2);margin-top:4px}
  .eb-bars{display:flex;align-items:flex-end;gap:5px;height:48px}
  .eb-b{width:20px;border-radius:3px 3px 0 0;transition:height .55s cubic-bezier(.4,0,.2,1),background .4s}

  /* CF CHART */
  .cf-panel{flex:1;padding:24px 26px}
  .cf-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
  .cf-label{font-size:12px;font-weight:700;color:var(--tx2)}
  .cf-tag{font-family:'JetBrains Mono',monospace;font-size:8.5px;color:var(--tx3);padding:3px 8px;background:rgba(255,255,255,.03);border-radius:3px;border:1px solid var(--border)}
  .cf-chart{display:flex;align-items:flex-end;gap:7px;height:120px;position:relative;margin-bottom:4px}
  .cf-chart::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:var(--borderHi)}
  .cf-col{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;position:relative}
  .cf-bar{
    width:100%;max-width:48px;border-radius:4px 4px 0 0;
    transition:height .65s cubic-bezier(.4,0,.2,1),background .4s;
    position:relative;
  }
  .cf-bar::before{
    content:attr(data-v);
    position:absolute;top:-16px;left:50%;transform:translateX(-50%);
    font-family:'JetBrains Mono',monospace;font-size:7.5px;color:var(--tx2);
    white-space:nowrap;
  }
  .cf-xlabels{display:flex;gap:7px}
  .cf-xl{flex:1;font-family:'JetBrains Mono',monospace;font-size:8.5px;color:var(--tx3);text-align:center}
  .cf-note{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--tx3);text-align:center;margin-top:10px}

  /* animations */
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  .p{animation:fadeUp .4s ease both}
  .p:nth-child(1){animation-delay:.06s}
  .p:nth-child(2){animation-delay:.1s}
  .p:nth-child(3){animation-delay:.14s}
  .p:nth-child(4){animation-delay:.18s}
  .p:nth-child(5){animation-delay:.22s}
  .p:nth-child(6){animation-delay:.26s}
  .p:nth-child(7){animation-delay:.3s}
`;

const fmtEuro = (n: number) => {
  const abs = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(2)}M €`;
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)}K €`;
  return `${sign}${Math.round(abs)} €`;
};

type CLS = 'safe' | 'warn' | 'danger';
const pdCls = (pd: number): CLS => pd <= 5 ? 'safe' : pd <= 15 ? 'warn' : 'danger';
const dscrCls = (d: number) => d >= 1.5 ? 'good' : d >= 1.0 ? 'mid' : 'bad';
const levCls = (l: number) => l <= 3 ? 'good' : l <= 5 ? 'mid' : 'bad';

const Slider = ({ label, value, min, max, step, unit, onChange }: any) => (
  <div className="si">
    <div className="srow">
      <span className="slabel">{label}</span>
      <span className="sval">{value.toLocaleString('fr-FR')} {unit}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))} />
  </div>
);

export default function Simulator() {
  const [ca, setCa] = useState(1_000_000);
  const [marge, setMarge] = useState(12);
  const [detteBase, setDetteBase] = useState(200_000);
  const [montantPret, setMontantPret] = useState(150_000);
  const [taux, setTaux] = useState(5.5);
  const [duree, setDuree] = useState(60);

  const [score, setScore] = useState(50);
  const [pd, setPd] = useState(10);
  const [dscr, setDscr] = useState(1.5);
  const [levier, setLevier] = useState(3.0);
  const [ebitda, setEbitda] = useState(0);
  const [cashFlows, setCashFlows] = useState<number[]>([]);

  useEffect(() => {
    const eb = ca * (marge / 100);
    setEbitda(eb);
    const rm = (taux / 100) / 12;
    const men = rm === 0 ? montantPret / duree : (montantPret * rm) / (1 - Math.pow(1 + rm, -duree));
    const ann = men * 12;
    const dTot = detteBase + montantPret;
    const d = ann > 0 ? eb / ann : 99;
    const l = eb > 0 ? dTot / eb : 99;
    setDscr(d); setLevier(l);

    let s = 60;
    if (d < 1.0) s -= 40; else if (d < 1.2) s -= 20; else if (d >= 2.0) s += 20; else if (d >= 1.5) s += 10;
    if (l > 6) s -= 30; else if (l > 4) s -= 15; else if (l < 2) s += 20;
    if (marge < 3) s -= 20; else if (marge > 15) s += 15;
    if (dTot > ca) s -= 15;
    s = Math.max(0, Math.min(100, s));
    setScore(s);
    setPd(Math.max(0.1, Math.min(99.9, 100 * Math.exp(-0.06 * s))));

    setCashFlows(Array.from({ length: 5 }, (_, i) => eb * Math.pow(1.03, i) - ann * Math.pow(0.97, i)));
  }, [ca, marge, detteBase, montantPret, taux, duree]);

  const cls = pdCls(pd);
  const badgeLabel = { safe: 'RISQUE FAIBLE', warn: 'SURVEILLANCE', danger: 'RISQUE ÉLEVÉ' }[cls];
  const maxCF = Math.max(...cashFlows.map(Math.abs), 1);

  return (
    <div className="r">
      <style>{CSS}</style>
      <div className="wrap">

        {/* HEADER */}
        <div className="hdr">
          <div>
            <div className="eyebrow">Analyse de crédit · Module actif</div>
            <h1 className="htitle">Simulateur<br/>de Risque</h1>
            <p className="hsub">Stress-testez la solvabilité d'un emprunteur en temps réel avec projection sur 5 ans.</p>
          </div>
          <button className="backbtn"><ArrowLeft size={12} /> Dashboard</button>
        </div>

        <div className="grid">

          {/* ─── LEFT: SLIDERS ─── */}
          <div className="lcol">
            <div className="p pi">
              <div className="ptitle"><span className="ptitle-icon"><DollarSign size={12} /></span>Données entreprise</div>
              <Slider label="Chiffre d'Affaires" value={ca} min={10000} max={5000000} step={10000} unit="€" onChange={setCa} />
              <Slider label="Marge EBITDA" value={marge} min={-10} max={40} step={1} unit="%" onChange={setMarge} />
              <Slider label="Dette existante" value={detteBase} min={0} max={2000000} step={10000} unit="€" onChange={setDetteBase} />
            </div>

            <div className="p pi">
              <div className="ptitle"><span className="ptitle-icon"><TrendingUp size={12} /></span>Scénario de financement</div>
              <Slider label="Montant demandé" value={montantPret} min={0} max={1000000} step={10000} unit="€" onChange={setMontantPret} />
              <Slider label="Durée d'amortissement" value={duree} min={12} max={120} step={12} unit="mois" onChange={setDuree} />
              <Slider label="Taux d'intérêt" value={taux} min={0} max={15} step={0.1} unit="%" onChange={setTaux} />
            </div>

            {/* EBITDA mini */}
            <div className="p eb-panel">
              <div className="eb-row">
                <div>
                  <div className="eb-label">EBITDA annuel</div>
                  <div className="eb-amount" style={{ color: ebitda >= 0 ? 'var(--gold)' : 'var(--red)' }}>{fmtEuro(ebitda)}</div>
                  <div className="eb-sub">{marge}% du chiffre d'affaires · {fmtEuro(ca)} CA</div>
                </div>
                <div className="eb-bars">
                  {[.35,.55,.75,1,.85].map((r, i) => (
                    <div key={i} className="eb-b" style={{
                      height: Math.abs(r) * 44,
                      background: ebitda >= 0
                        ? `linear-gradient(180deg, var(--kais-primary) 0%, color-mix(in srgb, var(--kais-primary) 30%, transparent) 100%)`
                        : 'var(--red)',
                    }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ─── RIGHT: RESULTS ─── */}
          <div className="rcol">

            {/* PD HERO */}
            <div className="p pd-hero">
              <div className="pd-body">
                <div>
                  <div className={`badge ${cls}`}><span className="badge-dot" />{badgeLabel}</div>
                  <div className={`pd-num ${cls}`}>
                    {pd.toFixed(1)}<span className="pd-unit">%</span>
                  </div>
                  <div className="pd-desc">Probabilité de défaut estimée sur 12 mois</div>
                </div>

                <div className="gauge-side">
                  <div className="g-top">
                    <span className="g-label">Score de solvabilité</span>
                    <span className="g-val">{score}<span style={{ fontSize: 11, opacity: .4, fontWeight: 400 }}>/100</span></span>
                  </div>
                  <div className="g-track">
                    <div className={`g-fill ${cls}`} style={{ width: `${score}%` }} />
                  </div>
                  <div className="g-ticks">{['0','25','50','75','100'].map(v => <span key={v} className="g-tick">{v}</span>)}</div>

                  <div className="segs">
                    {Array.from({ length: 20 }, (_, i) => {
                      const active = score >= (i + 1) * 5;
                      return <div key={i} className="seg" style={active ? {
                        background: score < 50 ? 'var(--red)' : score < 70 ? 'var(--amber)' : 'var(--green)'
                      } : {}} />;
                    })}
                  </div>

                  <div className="mini-rats">
                    {[
                      { k: 'DSCR', v: dscr > 50 ? '>50' : dscr.toFixed(2), ok: dscr >= 1.2 },
                      { k: 'LEVIER', v: levier > 50 ? '>50' : `${levier.toFixed(1)}x`, ok: levier <= 4 },
                      { k: 'MARGE', v: `${marge}%`, ok: marge > 5 },
                    ].map(({ k, v, ok }) => (
                      <div key={k} className="mini-rat">
                        <div className="mr-key">{k}</div>
                        <div className="mr-val" style={{ color: ok ? 'var(--green)' : 'var(--red)' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* KPI ROW */}
            <div className="krow">
              <div className="p kpi">
                <div className="ktop">
                  <div className={`kicon ${dscrCls(dscr)}`}><Activity size={15} /></div>
                  <span className="ktag">DSCR</span>
                </div>
                <div className="kval" style={{ color: dscr < 1 ? 'var(--red)' : dscr < 1.2 ? 'var(--amber)' : 'var(--green)' }}>
                  {dscr > 50 ? '>50' : dscr.toFixed(2)}<span style={{ fontSize: 13, opacity: .45 }}>x</span>
                </div>
                <div className="kname">Debt Service Coverage Ratio</div>
                <div className="kbar">
                  <div className="kbar-fill" style={{
                    width: `${Math.min(100, (dscr / 3) * 100)}%`,
                    background: dscr < 1.2 ? 'var(--red)' : 'var(--green)',
                  }} />
                </div>
              </div>

              <div className="p kpi">
                <div className="ktop">
                  <div className={`kicon ${levCls(levier)}`}><TrendingDown size={15} /></div>
                  <span className="ktag">LEVIER</span>
                </div>
                <div className="kval" style={{ color: levier > 6 ? 'var(--red)' : levier > 4 ? 'var(--amber)' : 'var(--green)' }}>
                  {levier > 50 ? '>50' : levier.toFixed(1)}<span style={{ fontSize: 13, opacity: .45 }}>x</span>
                </div>
                <div className="kname">Dette totale / EBITDA</div>
                <div className="kbar">
                  <div className="kbar-fill" style={{
                    width: `${Math.min(100, (levier / 8) * 100)}%`,
                    background: levier > 4 ? 'var(--red)' : 'var(--green)',
                  }} />
                </div>
              </div>
            </div>

            {/* CASH FLOW CHART */}
            <div className="p cf-panel">
              <div className="cf-title">
                <span className="cf-label">Cash Flow Libre — projection 5 ans</span>
                <span className="cf-tag">INDICATIF</span>
              </div>
              <div className="cf-chart">
                {cashFlows.map((cf, i) => {
                  const h = Math.max(5, (Math.abs(cf) / maxCF) * 96);
                  const pos = cf >= 0;
                  return (
                    <div key={i} className="cf-col">
                      <div className="cf-bar"
                        data-v={fmtEuro(cf)}
                        style={{
                          height: h,
                          background: pos
                            ? 'linear-gradient(180deg,rgba(16,185,129,.88) 0%,rgba(16,185,129,.18) 100%)'
                            : 'linear-gradient(180deg,rgba(244,63,94,.88) 0%,rgba(244,63,94,.18) 100%)',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="cf-xlabels">
                {['A1','A2','A3','A4','A5'].map(l => <span key={l} className="cf-xl">{l}</span>)}
              </div>
              <p className="cf-note">Marge disponible après service de la dette simulé · Croissance CA +3%/an</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}