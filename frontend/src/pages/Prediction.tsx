import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Prediction() {
     const navigate = useNavigate();

     return (
          <div className="max-w-7xl mx-auto pb-20 px-6 mt-10 animate-fade-in text-center font-sans">
               <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-8 relative">
                         <Sparkles className="w-12 h-12 text-blue-600 dark:text-blue-500 animate-pulse" />
                         <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-ping"></div>
                    </div>

                    <h1 className="text-4xl font-light text-slate-800 dark:text-slate-100 tracking-tight mb-4">
                         Module de <span className="font-semibold text-slate-900 dark:text-white">Prédiction</span>
                    </h1>

                    <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                         Nos modèles prédictifs d'intelligence artificielle sont en cours d'entraînement intensif.
                    </p>

                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold shadow-lg shadow-blue-500/25">
                         <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                         </span>
                         Disponible très prochainement
                    </div>

                    <button
                         onClick={() => navigate('/dashboard')}
                         className="mt-12 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium flex items-center gap-2 transition-colors"
                    >
                         Retour au tableau de bord <ArrowRight className="w-4 h-4" />
                    </button>
               </div>
          </div>
     );
}
