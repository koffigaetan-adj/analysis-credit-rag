import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Zap, BarChart3, Database, ChevronRight, Lock, Brain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
     const navigate = useNavigate();
     const { isAuthenticated } = useAuth();

     const handleCtaClick = () => {
          if (isAuthenticated) {
               navigate('/dashboard');
          } else {
               navigate('/login');
          }
     };

     return (
          <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
               {/* Navbar w/ Glassmorphism */}
               <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                         <div className="flex justify-between items-center h-16">
                              <div className="flex items-center space-x-2">
                                   <Link to="/" className="flex items-center">
                                        <img src="/Logocomplet.svg" alt="Kaïs Analytics" className="h-10 object-contain drop-shadow-[0_0_15px_rgba(230,57,25,0.2)]" />
                                   </Link>
                              </div>
                              <div className="flex items-center space-x-4">
                                   <Link
                                        to="/login"
                                        className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                                   >
                                        Espace Client
                                   </Link>
                                   <button
                                        onClick={handleCtaClick}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)]"
                                   >
                                        {isAuthenticated ? 'Accéder au Dashboard' : 'Se Connecter'}
                                   </button>
                              </div>
                         </div>
                    </div>
               </nav>

               {/* Hero Section */}
               <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden">
                    {/* Background glow effects - aligned with Login DA (red/orange from logo and blue primary) */}
                    <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#e63919]/10 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-scale-in">
                         <div className="inline-flex items-center px-3 py-1 mb-8 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-medium">
                              <SparklesIcon className="w-4 h-4 mr-2" />
                              La nouvelle norme en analyse de crédit
                         </div>
                         <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8 text-white">
                              L'Intelligence Artificielle <br />
                              <span className="text-blue-500">
                                   au service du risque.
                              </span>
                         </h1>
                         <p className="mt-4 max-w-2xl text-lg sm:text-xl text-slate-400 mx-auto mb-10">
                              Évaluez la solvabilité de vos clients instantanément avec nos modèles de scoring prédictifs et notre technologie RAG avancée. Prenez des décisions éclairées, plus rapidement.
                         </p>
                         <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                              <button
                                   onClick={handleCtaClick}
                                   className="px-8 py-4 w-full sm:w-auto text-lg font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] flex items-center justify-center group"
                              >
                                   Démarrer l'analyse
                                   <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                              </button>
                              <a
                                   href="#features"
                                   className="px-8 py-4 w-full sm:w-auto text-lg font-medium text-slate-300 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 rounded-xl transition-all flex items-center justify-center"
                              >
                                   Découvrir les fonctionnalités
                              </a>
                         </div>
                    </div>
               </div>

               {/* Stats/Logo Cloud Section (Optional visual filler) */}
               <div className="border-y border-white/5 bg-white/[0.02]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/5">
                              <div>
                                   <div className="text-3xl font-bold text-white mb-1">+99%</div>
                                   <div className="text-sm text-slate-400">Précision de scoring</div>
                              </div>
                              <div>
                                   <div className="text-3xl font-bold text-white mb-1">&lt; 2s</div>
                                   <div className="text-sm text-slate-400">Temps d'analyse</div>
                              </div>
                              <div>
                                   <div className="text-3xl font-bold text-white mb-1">24/7</div>
                                   <div className="text-sm text-slate-400">Surveillance IA</div>
                              </div>
                              <div>
                                   <div className="text-3xl font-bold text-white mb-1">100%</div>
                                   <div className="text-sm text-slate-400">Données sécurisées</div>
                              </div>
                         </div>
                    </div>
               </div>

               {/* Features Section */}
               <div id="features" className="py-24 relative">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                         <div className="text-center mb-16">
                              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                                   Une plateforme analytique complète
                              </h2>
                              <p className="text-slate-400 max-w-2xl mx-auto">
                                   Nous combinons les dernières avancées en IA générative et en algorithmes prédictifs pour transformer vos processus de décision.
                              </p>
                         </div>

                         <div className="grid md:grid-cols-3 gap-8">
                              <FeatureCard
                                   icon={<Brain className="w-8 h-8 text-blue-400" />}
                                   title="Scoring IA Prédictif"
                                   description="Nos modèles de machine learning évaluent la probabilité de défaut de vos clients avec une précision inégalée en analysant des centaines de variables."
                              />
                              <FeatureCard
                                   icon={<Database className="w-8 h-8 text-blue-400" />}
                                   title="Technologie RAG Intégrée"
                                   description="Interrogez vos documents financiers (bilans, liasses fiscales) en langage naturel grâce à notre moteur de recherche augmenté par génération."
                              />
                              <FeatureCard
                                   icon={<Shield className="w-8 h-8 text-emerald-400" />}
                                   title="Sécurité & Conformité"
                                   description="Vos données sont chiffrées de bout en bout et strictement cloisonnées par tenant. Conformité RGPD maximale pour les institutions."
                              />
                              <FeatureCard
                                   icon={<Zap className="w-8 h-8 text-amber-400" />}
                                   title="Analyse Instantanée"
                                   description="Obtenez des rapports détaillés et des recommandations claires en un clic. Finis les longs processus d'octroi de crédit."
                              />
                              <FeatureCard
                                   icon={<BarChart3 className="w-8 h-8 text-rose-400" />}
                                   title="Tableaux de Bord Dynamiques"
                                   description="Visualisez l'exposition au risque de votre portefeuille en temps réel avec nos KPIs avancés et interactifs."
                              />
                              <FeatureCard
                                   icon={<Lock className="w-8 h-8 text-cyan-400" />}
                                   title="Gestion Multi-Tenants"
                                   description="Créez des espaces isolés pour chaque département ou filiale. Contrôle absolu des accès et des permissions utilisateurs."
                              />
                         </div>
                    </div>
               </div>

               {/* Footer */}
               <footer className="border-t border-white/5 bg-slate-950 py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                         <div className="flex items-center space-x-2">
                              <img src="/Logocomplet.svg" alt="Kaïs Analytics" className="h-8 object-contain opacity-80" />
                         </div>
                         <div className="flex space-x-6 text-sm text-slate-400">
                              <a href="/terms-and-conditions" className="hover:text-white transition-colors">Conditions Générales</a>
                              <a href="/privacy-policy" className="hover:text-white transition-colors">Politique de Confidentialité</a>
                              <a href="/contact" className="hover:text-white transition-colors">Contact</a>
                         </div>
                         <p className="text-sm text-slate-500">
                              &copy; {new Date().getFullYear()} Kaïs Analytics. Tous droits réservés.
                         </p>
                    </div>
               </footer>
          </div>
     );
};

// Helper component for features
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
     <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(37,99,235,0.2)] group">
          <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 group-hover:bg-blue-500/10 transition-all">
               {icon}
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
          <p className="text-slate-400 leading-relaxed">
               {description}
          </p>
     </div>
);

// Sparkles icon definition
function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
     return (
          <svg
               {...props}
               xmlns="http://www.w3.org/2000/svg"
               width="24"
               height="24"
               viewBox="0 0 24 24"
               fill="none"
               stroke="currentColor"
               strokeWidth="2"
               strokeLinecap="round"
               strokeLinejoin="round"
          >
               <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          </svg>
     );
}

export default Landing;
