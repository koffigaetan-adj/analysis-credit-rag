import { useState } from 'react';
import { Lock, ArrowRight, ShieldAlert, Eye, EyeOff, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface UpdatePasswordModalProps {
     isOpen?: boolean;
     onClose?: () => void;
}

export default function UpdatePasswordModal({ isOpen = false, onClose }: UpdatePasswordModalProps = {}) {
     const { token, login, user, isFirstLogin } = useAuth();

     const [oldPassword, setOldPassword] = useState('');
     const [newPassword, setNewPassword] = useState('');
     const [confirmPassword, setConfirmPassword] = useState('');
     const [showOldPassword, setShowOldPassword] = useState(false);
     const [showNewPassword, setShowNewPassword] = useState(false);
     const [showConfirmPassword, setShowConfirmPassword] = useState(false);
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);

     // Ne pas rendre la modale si on n'est pas sur une première connexion ET qu'elle n'est pas forcée ouverte
     if (!isFirstLogin && !isOpen) return null;

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
               if (user && token && isFirstLogin) {
                    login(token, user, false); // Cela déclenchera la disparition de la modale globale
               }

               if (onClose) onClose();

          } catch (err: any) {
               setError(err.message);
          } finally {
               setIsLoading(false);
          }
     };

     return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
               <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 relative">
                    {!isFirstLogin && onClose && (
                         <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-10">
                              <X className="w-5 h-5" />
                         </button>
                    )}
                    <div className="p-8 pb-6 border-b border-rose-50 dark:border-rose-900/20 bg-rose-50/50 dark:bg-rose-950/20 text-center">
                         <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-slate-900 shadow-sm">
                              <ShieldAlert className="w-8 h-8 text-rose-500" />
                         </div>
                         <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                              {isFirstLogin ? 'Mise à jour requise' : 'Changement de mot de passe'}
                         </h2>
                         <p className="text-slate-500 dark:text-slate-400 text-[13px] mt-2 font-medium">
                              {isFirstLogin ? (
                                   <>
                                        Vous utilisez un mot de passe temporaire.<br />
                                        Veuillez le modifier pour sécuriser votre compte avant d'accéder à l'application.
                                   </>
                              ) : (
                                   <>
                                        Modifier votre mot de passe.<br />
                                        Choisissez un nouveau mot de passe sécurisé pour votre accès personnel.
                                   </>
                              )}
                         </p>
                    </div>

                    <div className="p-8">
                         <form onSubmit={handleSubmit} className="space-y-4">
                              {error && (
                                   <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold text-center">
                                        {error}
                                   </div>
                              )}

                              <div className="space-y-1.5">
                                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">
                                        {isFirstLogin ? 'Mot de passe temporaire' : 'Ancien mot de passe'}
                                   </label>
                                   <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                             type={showOldPassword ? "text" : "password"}
                                             value={oldPassword}
                                             onChange={(e) => setOldPassword(e.target.value)}
                                             placeholder="••••••••"
                                             className="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-sm"
                                             required
                                        />
                                        <button
                                             type="button"
                                             onClick={() => setShowOldPassword(!showOldPassword)}
                                             className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                        >
                                             {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                   </div>
                              </div>

                              <div className="space-y-1.5">
                                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Nouveau mot de passe</label>
                                   <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                             type={showNewPassword ? "text" : "password"}
                                             value={newPassword}
                                             onChange={(e) => setNewPassword(e.target.value)}
                                             placeholder="Nouveau mot de passe"
                                             className="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-sm"
                                             required
                                        />
                                        <button
                                             type="button"
                                             onClick={() => setShowNewPassword(!showNewPassword)}
                                             className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                        >
                                             {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                   </div>
                              </div>

                              <div className="space-y-1.5">
                                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Confirmer mot de passe</label>
                                   <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                             type={showConfirmPassword ? "text" : "password"}
                                             value={confirmPassword}
                                             onChange={(e) => setConfirmPassword(e.target.value)}
                                             placeholder="Répétez le mot de passe"
                                             className="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-sm"
                                             required
                                        />
                                        <button
                                             type="button"
                                             onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                             className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                        >
                                             {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                   </div>
                              </div>

                              <button
                                   type="submit"
                                   disabled={isLoading || !oldPassword || !newPassword || !confirmPassword}
                                   className="w-full mt-6 bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                              >
                                   {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                   ) : (
                                        <>Mettre à jour <ArrowRight className="w-4 h-4" /></>
                                   )}
                              </button>
                         </form>
                    </div>
               </div>
          </div>
     );
}
