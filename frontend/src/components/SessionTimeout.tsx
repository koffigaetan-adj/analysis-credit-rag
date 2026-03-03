import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, LogOut } from 'lucide-react';

const INACTIVITY_LIMIT_MS = 1 * 60 * 1000;
const WARNING_BEFORE_LOGOUT_MS = 30 * 1000;

export default function SessionTimeout() {
     const { isAuthenticated, logout } = useAuth();
     const [showWarning, setShowWarning] = useState(false);
     const [timeLeft, setTimeLeft] = useState(WARNING_BEFORE_LOGOUT_MS / 1000);

     const timeoutRef = useRef<NodeJS.Timeout | null>(null);
     const countdownRef = useRef<NodeJS.Timeout | null>(null);

     const isWarningActive = useRef(false);
     const logoutFn = useRef(logout);

     useEffect(() => { logoutFn.current = logout; }, [logout]);
     useEffect(() => { isWarningActive.current = showWarning; }, [showWarning]);

     const startWarning = useCallback(() => {
          setShowWarning(true);
          setTimeLeft(WARNING_BEFORE_LOGOUT_MS / 1000);

          if (countdownRef.current) clearInterval(countdownRef.current);
          countdownRef.current = setInterval(() => {
               setTimeLeft((prev) => {
                    if (prev <= 1) {
                         if (countdownRef.current) clearInterval(countdownRef.current);
                         logoutFn.current();
                         setShowWarning(false);
                         return 0;
                    }
                    return prev - 1;
               });
          }, 1000);
     }, []);

     const resetTimer = useCallback(() => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);

          setShowWarning(false);

          if (isAuthenticated) {
               timeoutRef.current = setTimeout(() => {
                    startWarning();
               }, INACTIVITY_LIMIT_MS - WARNING_BEFORE_LOGOUT_MS);
          }
     }, [isAuthenticated, startWarning]);

     useEffect(() => {
          if (!isAuthenticated) return;

          resetTimer();

          const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
          let throttleTimer: NodeJS.Timeout | null = null;

          const handleActivity = () => {
               if (throttleTimer) return;
               if (isWarningActive.current) return;

               throttleTimer = setTimeout(() => {
                    resetTimer();
                    throttleTimer = null;
               }, 1000);
          };

          events.forEach(event => window.addEventListener(event, handleActivity));

          return () => {
               events.forEach(event => window.removeEventListener(event, handleActivity));
               if (throttleTimer) clearTimeout(throttleTimer);
               if (timeoutRef.current) clearTimeout(timeoutRef.current);
               if (countdownRef.current) clearInterval(countdownRef.current);
          };
     }, [isAuthenticated, resetTimer]);

     if (!showWarning) return null;

     return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
               <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                    <div className="p-6 text-center">
                         <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mb-4 ring-8 ring-amber-50 dark:ring-amber-900/10">
                              <AlertTriangle className="w-8 h-8" />
                         </div>

                         <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Inactivité détectée</h2>
                         <p className="text-sm text-slate-500 dark:text-slate-400">
                              Pour votre sécurité, votre session va expirer dans <br />
                              <strong className="text-amber-600 dark:text-amber-500 text-lg mt-2 inline-block">{timeLeft} secondes</strong>.
                         </p>
                    </div>

                    <div className="p-6 pt-0 flex gap-3">
                         <button
                              onClick={() => {
                                   logoutFn.current();
                                   setShowWarning(false);
                              }}
                              className="flex-1 py-3 px-4 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                         >
                              <LogOut className="w-4 h-4" /> Quitter
                         </button>
                         <button
                              onClick={resetTimer}
                              className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                         >
                              Rester connecté
                         </button>
                    </div>
               </div>
          </div>
     );
}
