import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
     const { isAuthenticated, isLoading } = useAuth();

     // Pendant que l'on vérifie si une session existe dans le localStorage
     if (isLoading) {
          return (
               <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
                    {/* Background Gradients (matching Layout) */}
                    <div className="absolute inset-0 opacity-[0.1] dark:opacity-[0.15] [background-image:linear-gradient(#cbd5e1_1px,transparent_1px),linear-gradient(90deg,#cbd5e1_1px,transparent_1px)] dark:[background-image:linear-gradient(#1e293b_1px,transparent_1px),linear-gradient(90deg,#1e293b_1px,transparent_1px)] [background-size:40px_40px]" />

                    <div className="relative z-10 flex flex-col items-center">
                         <div className="w-16 h-16 relative">
                              {/* Outer ring */}
                              <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                              {/* Inner spinning ring */}
                              <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>

                              <div className="absolute inset-0 flex items-center justify-center">
                                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              </div>
                         </div>

                         <div className="mt-6 flex flex-col items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-widest uppercase">Kaïs Analytics</h3>
                              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] animate-pulse">Restauration de la session...</p>
                         </div>
                    </div>
               </div>
          );
     }

     // Si l'utilisateur n'est pas connecté, le renvoyer vers le login
     if (!isAuthenticated) {
          return <Navigate to="/login" replace />;
     }

     // On n'empêche plus l'accès complet, la modale d'UpdatePasswordModal 
     // qui sera placée dans Layout va s'occuper de bloquer l'interface.
     // On laisse passer l'Outlet pour que la structure se charge en dessous.

     // Si tout est OK, afficher la route enfant (Le layout avec la Sidebar)
     return <Outlet />;
}
