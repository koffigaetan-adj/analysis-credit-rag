import React from 'react';
import { AlertTriangle, X, Check, Trash2, Loader2, Info } from 'lucide-react';

export type ModalType = 'danger' | 'warning' | 'info' | 'success' | 'loading';

interface AnimatedModalProps {
     isOpen: boolean;
     onClose: () => void;
     onConfirm?: () => void;
     title: string;
     message?: React.ReactNode;
     type?: ModalType;
     confirmText?: string;
     cancelText?: string;
     isLoading?: boolean;
     children?: React.ReactNode;
}

export default function AnimatedModal({
     isOpen,
     onClose,
     onConfirm,
     title,
     message,
     type = 'warning',
     confirmText = 'Confirmer',
     cancelText = 'Annuler',
     isLoading = false,
     children
}: AnimatedModalProps) {
     if (!isOpen) return null;

     const config = {
          danger: {
               icon: Trash2,
               color: 'red',
               bgClass: 'bg-red-500',
               textClass: 'text-red-500',
               lightBgClass: 'bg-red-50 dark:bg-red-500/10',
               borderClass: 'border-red-100 dark:border-red-500/20'
          },
          warning: {
               icon: AlertTriangle,
               color: 'amber',
               bgClass: 'bg-amber-500',
               textClass: 'text-amber-500',
               lightBgClass: 'bg-amber-50 dark:bg-amber-500/10',
               borderClass: 'border-amber-100 dark:border-amber-500/20'
          },
          info: {
               icon: Info,
               color: 'blue',
               bgClass: 'bg-blue-500',
               textClass: 'text-blue-500',
               lightBgClass: 'bg-blue-50 dark:bg-blue-500/10',
               borderClass: 'border-blue-100 dark:border-blue-500/20'
          },
          success: {
               icon: Check,
               color: 'emerald',
               bgClass: 'bg-emerald-500',
               textClass: 'text-emerald-500',
               lightBgClass: 'bg-emerald-50 dark:bg-emerald-500/10',
               borderClass: 'border-emerald-100 dark:border-emerald-500/20'
          },
          loading: {
               icon: Loader2,
               color: 'blue',
               bgClass: 'bg-blue-600',
               textClass: 'text-blue-500',
               lightBgClass: 'bg-blue-50 dark:bg-blue-500/10',
               borderClass: 'border-blue-100 dark:border-blue-500/20'
          }
     };

     const activeConfig = config[type];
     const Icon = activeConfig.icon;

     return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               {/* Overlay Backdrop */}
               <div
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={isLoading ? undefined : onClose}
               />

               {/* Modal Container */}
               <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">

                    {/* Ligne de décoration supérieure */}
                    <div className={`h-1.5 w-full ${activeConfig.bgClass}`} />

                    <div className="p-8">
                         {/* Header & Icon */}
                         <div className="flex flex-col items-center text-center mb-6">
                              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${activeConfig.lightBgClass} ${type === 'loading' ? 'animate-pulse' : ''}`}>
                                   <Icon className={`w-8 h-8 ${activeConfig.textClass} ${type === 'loading' ? 'animate-spin' : ''}`} />
                              </div>
                              <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                                   {title}
                              </h3>
                              {message && (
                                   <div className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                        {message}
                                   </div>
                              )}
                         </div>

                         {children}

                         {/* Actions */}
                         {type !== 'loading' && !children && (
                              <div className="flex gap-3 justify-center w-full mt-8">
                                   {onClose && (
                                        <button
                                             type="button"
                                             onClick={onClose}
                                             disabled={isLoading}
                                             className="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 bg-slate-100/50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors disabled:opacity-50"
                                        >
                                             {cancelText}
                                        </button>
                                   )}
                                   {onConfirm && (
                                        <button
                                             type="button"
                                             onClick={onConfirm}
                                             disabled={isLoading}
                                             className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 ${activeConfig.bgClass} hover:opacity-90 hover:shadow-${activeConfig.color}-500/20`}
                                        >
                                             {isLoading ? (
                                                  <Loader2 className="w-4 h-4 animate-spin" />
                                             ) : (
                                                  confirmText
                                             )}
                                        </button>
                                   )}
                              </div>
                         )}
                    </div>

                    {/* Bouton de fermeture (Croix) */}
                    {!isLoading && type !== 'loading' && (
                         <button
                              onClick={onClose}
                              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                         >
                              <X className="w-4 h-4" />
                         </button>
                    )}
               </div>
          </div>
     );
}
