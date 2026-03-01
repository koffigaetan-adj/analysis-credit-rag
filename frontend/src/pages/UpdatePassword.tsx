import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UpdatePassword() {
     const navigate = useNavigate();
     const { token, login, user } = useAuth();

     const [oldPassword, setOldPassword] = useState('');
     const [newPassword, setNewPassword] = useState('');
     const [confirmPassword, setConfirmPassword] = useState('');
     const [showOldPassword, setShowOldPassword] = useState(false);
     const [showNewPassword, setShowNewPassword] = useState(false);
     const [showConfirmPassword, setShowConfirmPassword] = useState(false);
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          setError(null);

          if (newPassword !== confirmPassword) {
               setError("Les nouveaux mots de passe ne correspondent pas.");
               return;
          }

          if (newPassword.length < 8) {
               setError("Le mot de passe doit contenir au moins 8 caractères.");
               return;
          }

          setIsLoading(true);

          try {
               const response = await fetch('http://localhost:8000/auth/update-password', {
                    method: 'POST',
                    headers: {
                         'Content-Type': 'application/json',
                         'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                         old_password: oldPassword,
                         new_password: newPassword
                    })
               });

               if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'Erreur lors de la mise à jour.');
               }

               // Mise à jour du context : on dit qu'on n'est plus en "is_first_login"
               if (user && token) {
                    login(token, user, false);
               }

               navigate('/dashboard');

          } catch (err: any) {
               setError(err.message);
          } finally {
               setIsLoading(false);
          }
     };

     return (
          <div className="min-h-screen w-full relative flex items-center justify-center font-sans overflow-hidden bg-slate-950">

               {/* Background simpliste pour la page UpdatePassword */}
               <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-950 to-slate-900"></div>

               <div className="relative z-10 w-full max-w-md p-8">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[40px] shadow-2xl">

                         <div className="mb-8 flex flex-col items-center text-center">
                              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-6">
                                   <ShieldAlert className="w-8 h-8 text-amber-500" />
                              </div>
                              <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Sécurité requise</h2>
                              <p className="text-slate-400 text-sm font-medium">
                                   Veuillez modifier votre mot de passe temporaire pour continuer vers votre espace.
                              </p>
                         </div>

                         <form onSubmit={handleSubmit} className="space-y-5">
                              {error && (
                                   <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm font-medium text-center">
                                        {error}
                                   </div>
                              )}

                              <div className="space-y-2">
                                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Ancien mot de passe</label>
                                   <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                             type={showOldPassword ? "text" : "password"}
                                             value={oldPassword}
                                             onChange={(e) => setOldPassword(e.target.value)}
                                             placeholder="••••••••"
                                             className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-sm"
                                             required
                                        />
                                        <button
                                             type="button"
                                             onClick={() => setShowOldPassword(!showOldPassword)}
                                             className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                        >
                                             {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                   </div>
                              </div>

                              <div className="space-y-2">
                                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nouveau mot de passe</label>
                                   <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                             type={showNewPassword ? "text" : "password"}
                                             value={newPassword}
                                             onChange={(e) => setNewPassword(e.target.value)}
                                             placeholder="Nouveau mot de passe"
                                             className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-sm"
                                             required
                                        />
                                        <button
                                             type="button"
                                             onClick={() => setShowNewPassword(!showNewPassword)}
                                             className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                        >
                                             {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                   </div>
                              </div>

                              <div className="space-y-2">
                                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Confirmer mot de passe</label>
                                   <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                             type={showConfirmPassword ? "text" : "password"}
                                             value={confirmPassword}
                                             onChange={(e) => setConfirmPassword(e.target.value)}
                                             placeholder="Répétez le mot de passe"
                                             className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-sm"
                                             required
                                        />
                                        <button
                                             type="button"
                                             onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                             className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                        >
                                             {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                   </div>
                              </div>

                              <button
                                   type="submit"
                                   disabled={isLoading}
                                   className="w-full mt-8 bg-amber-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                              >
                                   {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                   ) : (
                                        <>Valider <ArrowRight className="w-4 h-4" /></>
                                   )}
                              </button>
                         </form>
                    </div>
               </div>
          </div>
     );
}
