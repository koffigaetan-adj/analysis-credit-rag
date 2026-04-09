import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Target, Zap, Shield, Brain, BarChart3, ChevronRight } from 'lucide-react';

const team = [
  { name: 'Kaïs Analytics', role: 'Fondateur & Directeur Crédit', bio: 'Expert en analyse financière avec plus de 12 ans d\'expérience dans le secteur bancaire. Visionnaire derrière la plateforme.', initials: 'KA', color: 'from-blue-500 to-violet-600' },
  { name: 'Équipe IA', role: 'Ingénieurs Machine Learning', bio: 'Spécialistes en NLP, RAG et modèles de scoring. Responsables du cœur technologique de la plateforme.', initials: 'IA', color: 'from-violet-500 to-pink-600' },
  { name: 'Équipe Produit', role: 'Design & Développement', bio: 'Conçoivent une expérience utilisateur premium centrée sur les besoins réels des analystes crédit.', initials: 'UX', color: 'from-emerald-500 to-cyan-600' },
];

const values = [
  { icon: <Brain className="w-6 h-6 text-blue-400" />, title: 'Innovation continue', desc: 'Nous intégrons constamment les dernières avancées en IA générative pour rester à la pointe du secteur.' },
  { icon: <Shield className="w-6 h-6 text-emerald-400" />, title: 'Sécurité d\'abord', desc: 'La protection des données bancaires est non négociable. Chiffrement, cloisonnement et conformité RGPD sont au cœur de notre architecture.' },
  { icon: <Target className="w-6 h-6 text-amber-400" />, title: 'Précision maximale', desc: 'Chaque décision crédit a des conséquences réelles. Nous développons des outils auxquels les professionnels peuvent faire confiance.' },
  { icon: <Users className="w-6 h-6 text-rose-400" />, title: 'Centré utilisateur', desc: 'L\'interface est conçue par et pour les analystes crédit. Nous écoutons et intégrons les retours terrain de nos clients.' },
  { icon: <BarChart3 className="w-6 h-6 text-cyan-400" />, title: 'Transparence', desc: 'Nos scores et décisions sont explicables. Pas de boîte noire : chaque recommandation est accompagnée d\'une justification détaillée.' },
  { icon: <Zap className="w-6 h-6 text-violet-400" />, title: 'Excellence opérationnelle', desc: 'Rapidité, fiabilité et disponibilité 24/7. Nous concevons pour les environnements bancaires exigeants.' },
];

export default function About() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Nav */}
      <nav className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <img src="/Logocomplet.svg" alt="Kaïs" className="h-8 object-contain" />
          </Link>
          <Link to="/login" className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all">
            Espace Client
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative py-24 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[700px] h-[500px] bg-blue-600/8 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-violet-600/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium">
            <Users className="w-4 h-4" />
            Notre mission
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-6 leading-tight">
            Redonner le pouvoir<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400">
              aux analystes crédit.
            </span>
          </h1>
          <p className="text-slate-400 text-xl max-w-3xl mx-auto leading-relaxed">
            Kaïs Analytics est née d'un constat simple : les professionnels du crédit méritent des outils dignes du XXIe siècle. Notre plateforme combine l'IA générative, le RAG et un moteur de scoring déterministe pour transformer radicalement la prise de décision bancaire.
          </p>
        </div>
      </div>

      {/* Notre histoire */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-28">
          <div>
            <p className="text-blue-400 text-sm font-bold uppercase tracking-widest mb-4">Notre histoire</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">De la frustration <br />à l'innovation</h2>
            <div className="space-y-4 text-slate-400 leading-relaxed">
              <p>
                Tout a commencé par une frustration partagée par des dizaines d'analystes crédit : des processus d'instruction longs, des outils obsolètes et des décisions prises sans base technologique solide.
              </p>
              <p>
                En 2024, nous avons décidé de construire ce que nous aurions voulu avoir : une plateforme qui comprend les documents financiers, applique automatiquement la politique de crédit interne de la banque, et génère des recommandations argumentées en quelques secondes.
              </p>
              <p>
                Aujourd'hui, Kaïs Analytics est utilisée par des équipes crédit pour analyser des dossiers particuliers et entreprises avec une précision et une vitesse sans précédent.
              </p>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-6">
              {[
                { val: '2024', label: 'Année de fondation' },
                { val: '< 2s', label: 'Temps d\'analyse' },
                { val: '99%', label: 'Précision de scoring' },
              ].map(({ val, label }) => (
                <div key={label} className="text-center p-4 rounded-2xl bg-white/5 border border-white/8">
                  <p className="text-2xl font-black text-white mb-1">{val}</p>
                  <p className="text-xs text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-6">
            {[
              { year: '2024 T1', title: 'Inception du projet', desc: 'Identification du problème et conception de l\'architecture RAG + scoring hybride.' },
              { year: '2024 T2', title: 'Première version bêta', desc: 'Déploiement des premiers modules d\'extraction PDF et du moteur de scoring déterministe.' },
              { year: '2024 T3', title: 'Intégration LLM + RAG', desc: 'Intégration de LLaMA 3.3 via Groq et du moteur RAG sur Supabase pgvector.' },
              { year: '2026', title: 'Version 2.0 — Aujourd\'hui', desc: 'Plateforme complète avec gestion d\'équipe, chat IA contextuel, rapports PDF et tableau de bord complet.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">{i + 1}</div>
                  {i < 3 && <div className="w-0.5 h-full bg-blue-500/20 mt-2" />}
                </div>
                <div className="pb-6">
                  <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">{item.year}</p>
                  <p className="text-white font-bold mb-1">{item.title}</p>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Valeurs */}
        <div className="mb-28">
          <div className="text-center mb-12">
            <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest mb-3">Valeurs</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Ce en quoi nous croyons</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <div key={i} className="p-7 rounded-3xl bg-white/[0.03] border border-white/8 hover:border-blue-500/20 hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-5">
                  {v.icon}
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{v.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Équipe */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <p className="text-blue-400 text-sm font-bold uppercase tracking-widest mb-3">L'équipe</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Des experts derrière chaque fonctionnalité</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {team.map((m, i) => (
              <div key={i} className="p-8 rounded-3xl bg-white/[0.03] border border-white/8 hover:border-white/15 transition-all text-center group">
                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${m.color} flex items-center justify-center text-white text-2xl font-black mx-auto mb-5 group-hover:scale-110 transition-transform`}>
                  {m.initials}
                </div>
                <h3 className="text-white font-bold text-lg mb-1">{m.name}</h3>
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">{m.role}</p>
                <p className="text-slate-400 text-sm leading-relaxed">{m.bio}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="relative rounded-3xl overflow-hidden border border-blue-500/20 bg-gradient-to-br from-blue-900/20 via-slate-900 to-violet-900/20 p-12 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.12)_0%,transparent_70%)] pointer-events-none" />
          <h2 className="text-3xl font-extrabold text-white mb-4">Rejoignez la révolution crédit</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">Contactez notre équipe pour une démonstration personnalisée ou pour en savoir plus sur nos offres.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact-public" className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:scale-105">
              Nous contacter <ChevronRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white font-semibold rounded-xl transition-all">
              Essayer la plateforme
            </Link>
          </div>
        </div>
      </div>

      {/* Footer mini */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Kaïs Analytics — Tous droits réservés.</p>
          <div className="flex gap-6">
            <Link to="/" className="hover:text-white transition-colors">Accueil</Link>
            <Link to="/contact-public" className="hover:text-white transition-colors">Contact</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
