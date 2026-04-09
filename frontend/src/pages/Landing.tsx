import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield, Zap, BarChart3, Database, ChevronRight, Lock, Brain,
  CheckCircle, ArrowRight, FileSearch, Cpu, TrendingUp, Users,
  MessageSquare, Mail, ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Hook: animation au scroll ─────────────────────────────────────────────────
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ── Composant: section animée ─────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ── Particules flottantes ─────────────────────────────────────────────────────
function FloatingParticles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    x: Math.random() * 100,
    delay: Math.random() * 8,
    duration: Math.random() * 10 + 12,
    opacity: Math.random() * 0.3 + 0.05,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-blue-400"
          style={{
            width: p.size, height: p.size,
            left: `${p.x}%`, bottom: '-10px',
            opacity: p.opacity,
            animation: `floatUp ${p.duration}s ${p.delay}s infinite linear`,
          }}
        />
      ))}
    </div>
  );
}

// ── Compteur animé ────────────────────────────────────────────────────────────
function CountUp({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useScrollReveal();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [visible, end, duration]);
  return <span ref={ref}>{count}{suffix}</span>;
}

// ── Accordéon FAQ ─────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/8 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-white font-medium">{q}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`transition-all duration-300 overflow-hidden ${open ? 'max-h-96' : 'max-h-0'}`}>
        <p className="px-6 pb-5 text-slate-400 leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const handleCtaClick = () => navigate(isAuthenticated ? '/dashboard' : '/login');

  const features = [
    { icon: <Brain className="w-7 h-7 text-blue-400" />, title: 'Scoring IA Prédictif', description: 'Nos modèles évaluent la probabilité de défaut en analysant des centaines de variables financières avec une précision inégalée.', color: 'blue' },
    { icon: <Database className="w-7 h-7 text-violet-400" />, title: 'Technologie RAG', description: 'Interrogez vos documents financiers en langage naturel. Notre moteur RAG consulte automatiquement la politique de crédit interne.', color: 'violet' },
    { icon: <Shield className="w-7 h-7 text-emerald-400" />, title: 'Sécurité & Conformité', description: 'Chiffrement bout en bout, cloisonnement par tenant, conformité RGPD totale. Vos données ne quittent jamais votre espace sécurisé.', color: 'emerald' },
    { icon: <Zap className="w-7 h-7 text-amber-400" />, title: 'Analyse en < 2 secondes', description: 'Rapports détaillés et recommandations claires en un clic. Finis les longs processus d\'instruction de crédit.', color: 'amber' },
    { icon: <BarChart3 className="w-7 h-7 text-rose-400" />, title: 'Tableaux de Bord Dynamiques', description: 'Visualisez l\'exposition au risque de votre portefeuille en temps réel avec des KPIs avancés et des graphiques interactifs.', color: 'rose' },
    { icon: <Lock className="w-7 h-7 text-cyan-400" />, title: 'Gestion Multi-Tenants', description: 'Espaces isolés par département ou filiale. Contrôle absolu des accès et des permissions avec des rôles hiérarchiques.', color: 'cyan' },
  ];

  const steps = [
    { num: '01', icon: <FileSearch className="w-6 h-6" />, title: 'Déposez vos documents', desc: 'Uploadez les PDF financiers (bilans, bulletins de salaire, liasses fiscales) en quelques secondes.' },
    { num: '02', icon: <Cpu className="w-6 h-6" />, title: 'Extraction & Scoring IA', desc: 'Notre IA extrait les données clés, calcule les ratios financiers et génère un score de solvabilité.' },
    { num: '03', icon: <TrendingUp className="w-6 h-6" />, title: 'Analyse contradictoire RAG', desc: 'Le moteur RAG confronte les résultats à votre politique de crédit interne pour une conformité totale.' },
    { num: '04', icon: <CheckCircle className="w-6 h-6" />, title: 'Décision éclairée', desc: 'Recevez une note d\'audit complète, des risques identifiés et des recommandations concrètes.' },
  ];

  const testimonials = [
    { name: 'Sophie M.', role: 'Directrice crédit, BNL Finance', text: 'Kaïs Analytics a réduit notre temps d\'instruction de 70%. La précision des scores est bluffante et la conformité RGPD est irréprochable.' },
    { name: 'Alexandre T.', role: 'Analyste senior, Crédit Pro', text: 'Le moteur RAG qui consulte automatiquement notre politique interne est une révolution. On ne rate plus aucune règle lors de l\'analyse.' },
    { name: 'Isabelle K.', role: 'Responsable risque, CapitalTech', text: 'Interface intuitive, résultats en quelques secondes, et un assistant IA qui répond à toutes nos questions sur le dossier. Impressionnant.' },
  ];

  const faqs = [
    { q: 'Quels types de documents puis-je analyser ?', a: 'Kaïs Analytics accepte les bilans comptables, comptes de résultats, bulletins de salaire, avis d\'imposition, liasses fiscales et tout document PDF financier. Le système extrait automatiquement les données numériques pertinentes.' },
    { q: 'Comment fonctionne le moteur RAG ?', a: 'Le RAG (Retrieval-Augmented Generation) indexe votre politique de crédit interne dans une base vectorielle (Supabase pgvector). À chaque analyse, l\'IA récupère automatiquement les règles pertinentes et les applique au dossier.' },
    { q: 'Mes données sont-elles sécurisées ?', a: 'Oui. Toutes les données sont chiffrées en transit (TLS) et au repos (AES-256). Chaque organisation dispose d\'un espace cloisonné. Nous sommes conformes au RGPD et aucune donnée n\'est partagée entre clients.' },
    { q: 'Comment créer un compte analyste ?', a: 'Les comptes sont créés sur demande d\'accès validée par un administrateur. Soumettez votre demande depuis la page de connexion, et votre administrateur reçoit une notification pour approuver ou rejeter la demande.' },
    { q: 'Peut-on exporter les rapports d\'analyse ?', a: 'Oui, chaque rapport peut être exporté en PDF (impression navigateur) et envoyé directement par email à l\'analyste ou au client, directement depuis l\'interface.' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden">

      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'border-b border-white/8 bg-slate-950/80 backdrop-blur-xl shadow-2xl shadow-black/20' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <img src="/Logocomplet.svg" alt="Kaïs Analytics" className="h-10 object-contain drop-shadow-[0_0_15px_rgba(230,57,25,0.2)]" />
            </Link>
            <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
              <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
              <a href="#process" className="hover:text-white transition-colors">Comment ça marche</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block">
                Espace Client
              </Link>
              <button
                onClick={handleCtaClick}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] hover:scale-105"
              >
                {isAuthenticated ? 'Dashboard' : 'Connexion'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <div className="relative pt-28 pb-24 sm:pt-36 sm:pb-32 overflow-hidden">
        {/* Blobs animés */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#e63919]/8 rounded-full blur-[130px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />

        <FloatingParticles />

        {/* Grille de fond */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-1.5 mb-8 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-medium animate-pulse" style={{ animationDuration: '3s' }}>
            <SparklesIcon className="w-4 h-4 mr-2" />
            La nouvelle norme en analyse de crédit bancaire
          </div>

          {/* Titre avec animation de révélation lettre par lettre */}
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8 text-white leading-tight animate-fadeIn">
            L'Intelligence Artificielle<br />
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-violet-500 animate-gradient">
                au service du risque crédit.
              </span>
              {/* Soulignement animé */}
              <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-violet-500 scale-x-0 animate-underline origin-left" />
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-lg sm:text-xl text-slate-400 mx-auto mb-10 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            Évaluez la solvabilité de vos clients instantanément avec nos modèles de scoring prédictifs et notre technologie RAG avancée. Prenez des décisions éclairées, plus rapidement.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
            <button
              onClick={handleCtaClick}
              className="group px-8 py-4 w-full sm:w-auto text-lg font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_40px_rgba(37,99,235,0.7)] hover:scale-105 flex items-center justify-center"
            >
              Démarrer l'analyse
              <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="#features"
              className="px-8 py-4 w-full sm:w-auto text-lg font-medium text-slate-300 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Découvrir les fonctionnalités
            </a>
          </div>

          {/* Indicateurs de confiance */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 animate-fadeInUp" style={{ animationDelay: '0.7s' }}>
            {['✓ RGPD conforme', '✓ Chiffrement bout en bout', '✓ Déploiement cloud sécurisé'].map(item => (
              <span key={item} className="flex items-center gap-1">{item}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────── */}
      <div className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: 99, suffix: '%', label: 'Précision de scoring' },
              { val: 2, suffix: 's', label: 'Temps d\'analyse moyen' },
              { val: 100, suffix: '%', label: 'Données sécurisées' },
              { val: 24, suffix: '/7', label: 'Surveillance IA active' },
            ].map(({ val, suffix, label }, i) => (
              <Reveal key={label} delay={i * 100}>
                <div className="group cursor-default">
                  <div className="text-4xl font-black text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {i === 1 ? '< ' : ''}<CountUp end={val} suffix={suffix} />
                  </div>
                  <div className="text-sm text-slate-400">{label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ─────────────────────────────────────────── */}
      <div id="features" className="py-28 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.04)_0%,transparent_70%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-16">
            <p className="text-blue-400 text-sm font-bold uppercase tracking-widest mb-3">Fonctionnalités</p>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">
              Une plateforme analytique <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-500">complète</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Nous combinons les dernières avancées en IA générative et en algorithmes prédictifs pour transformer vos processus de décision crédit.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <div className="group h-full p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-blue-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(37,99,235,0.2)] cursor-default">
                  <div className={`w-14 h-14 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 group-hover:bg-blue-500/10 transition-all duration-300`}>
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{f.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* ── Process / Timeline ───────────────────────────────── */}
      <div id="process" className="py-28 bg-white/[0.015] border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-16">
            <p className="text-violet-400 text-sm font-bold uppercase tracking-widest mb-3">Processus</p>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">En 4 étapes, <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">du document à la décision</span></h2>
          </Reveal>

          <div className="relative">
            {/* Ligne de connexion animée */}
            <div className="hidden md:block absolute top-[46px] left-[12.5%] right-[12.5%] h-1 bg-white/[0.03] rounded-full overflow-hidden">
              <div className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent -translate-x-full animate-[shimmerLine_2.5s_infinite_linear]" />
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              {steps.map((s, i) => (
                <Reveal key={s.num} delay={i * 120}>
                  <div className="relative text-center group">
                    <div className="relative mx-auto w-24 h-24 rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center mb-6 group-hover:border-blue-500/50 group-hover:bg-blue-950/50 group-hover:shadow-[0_0_30px_rgba(37,99,235,0.2)] transition-all duration-500 group-hover:scale-110">
                      <div className="text-blue-400 group-hover:text-blue-300 transition-colors">{s.icon}</div>
                      <span className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shadow-[0_0_12px_rgba(37,99,235,0.6)]">{s.num}</span>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Témoignages ──────────────────────────────────────── */}
      <div className="py-28 relative overflow-hidden">
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-16">
            <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest mb-3">Témoignages</p>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">La confiance de nos <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">partenaires</span></h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 100}>
                <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/8 hover:border-emerald-500/20 hover:bg-white/[0.05] transition-all duration-300 group h-full flex flex-col">
                  <div className="flex mb-4 gap-1">
                    {[...Array(5)].map((_, j) => <span key={j} className="text-amber-400 text-lg">★</span>)}
                  </div>
                  <p className="text-slate-300 leading-relaxed mb-6 flex-1 italic">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-white/8">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{t.name}</p>
                      <p className="text-slate-500 text-xs">{t.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA Banner ───────────────────────────────────────── */}
      <Reveal>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="relative rounded-3xl overflow-hidden border border-blue-500/20 bg-gradient-to-br from-blue-900/30 via-slate-900 to-violet-900/20 p-12 md:p-16 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.15)_0%,transparent_70%)] pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
            <p className="text-blue-400 text-sm font-bold uppercase tracking-widest mb-4">Prêt à commencer ?</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-6">
              Transformez vos analyses crédit<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">dès aujourd'hui.</span>
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Rejoignez les équipes crédit qui font confiance à Kaïs Analytics pour accélérer leurs décisions et réduire les risques.
            </p>
            <button
              onClick={handleCtaClick}
              className="group inline-flex items-center gap-3 px-10 py-5 text-lg font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-2xl transition-all shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:shadow-[0_0_50px_rgba(37,99,235,0.8)] hover:scale-105"
            >
              Accéder à la plateforme
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </Reveal>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <div id="faq" className="py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4">
          <Reveal className="text-center mb-12">
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Questions fréquentes</h2>
          </Reveal>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <Reveal key={i} delay={i * 60}>
                <FaqItem q={f.q} a={f.a} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-slate-950 pt-16 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10 pb-12 border-b border-white/5">
            {/* Logo + desc */}
            <div className="md:col-span-2">
              <img src="/Logocomplet.svg" alt="Kaïs Analytics" className="h-10 object-contain mb-4 opacity-90" />
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                Plateforme d'analyse de risque crédit propulsée par l'IA générative et la technologie RAG. Conçue pour les professionnels du crédit bancaire.
              </p>
              <div className="flex gap-3 mt-5">
                <a href="mailto:contact@kaisanalytics.com" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600/20 hover:border-blue-500/30 transition-all">
                  <Mail className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600/20 hover:border-blue-500/30 transition-all">
                  <Users className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600/20 hover:border-blue-500/30 transition-all">
                  <MessageSquare className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Liens produit */}
            <div>
              <p className="text-white font-bold text-sm mb-4">Plateforme</p>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#process" className="hover:text-white transition-colors">Comment ça marche</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Espace Client</Link></li>
              </ul>
            </div>

            {/* Liens légaux */}
            <div>
              <p className="text-white font-bold text-sm mb-4">À propos</p>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><Link to="/about" className="hover:text-white transition-colors">À propos de nous</Link></li>
                <li><Link to="/contact-public" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Politique de confidentialité</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Conditions d'utilisation</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">© {new Date().getFullYear()} Kaïs Analytics. Tous droits réservés.</p>
            <p className="text-xs text-slate-600">Propulsé par LLaMA 3.3 70B · Supabase pgvector · FastAPI</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

export default Landing;
