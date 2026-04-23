import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, ShieldAlert, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isBackoffice?: boolean;
}

export default function TwoFactorSettingsModal({ isOpen, onClose, isBackoffice = false }: Props) {
  const { user, token, login } = useAuth();
  const [step, setStep] = useState<'info' | 'setup' | 'verify' | 'disable'>('info');
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // S'assurer qu'on utilise le bon endpoint et token selon le type de session
  const activeToken = isBackoffice ? localStorage.getItem('backoffice_token') : token;
  const baseUrl = isBackoffice ? `${import.meta.env.VITE_API_URL}/auth/backoffice` : `${import.meta.env.VITE_API_URL}/auth`;
  
  // Dans le contexte backoffice, on n'a peut-être pas accès directement à l'état two_factor_enabled dans user
  // On suppose que user_info contient cette info, ou on la lit du localStorage
  const activeUser = isBackoffice ? JSON.parse(localStorage.getItem('backoffice_user') || '{}') : user;
  const isEnabled = activeUser?.two_factor_enabled === true;

  useEffect(() => {
    if (isOpen) {
      setStep(isEnabled ? 'disable' : 'info');
      setCode('');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, isEnabled]);

  if (!isOpen) return null;

  const handleSetup = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const res = await fetch(`${baseUrl}/2fa/setup`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Erreur d'initialisation");
      }
      const data = await res.json();
      setSecret(data.secret);
      setQrCode(data.qr_code);
      setStep('setup');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const res = await fetch(`${baseUrl}/2fa/verify-setup`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}` 
        },
        body: JSON.stringify({ code })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Code invalide");
      }
      
      setSuccessMsg("L'authentification à deux facteurs a été activée avec succès !");
      
      // Update local storage user
      const updatedUser = { ...activeUser, two_factor_enabled: true };
      if (isBackoffice) {
          localStorage.setItem('backoffice_user', JSON.stringify(updatedUser));
      } else if (token) {
          login(token, updatedUser, false);
      }
      
      setTimeout(() => onClose(), 2000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const res = await fetch(`${baseUrl}/2fa/disable`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}` 
        },
        body: JSON.stringify({ code })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Code invalide");
      }
      
      setSuccessMsg("L'authentification à deux facteurs a été désactivée.");
      
      // Update local storage user
      const updatedUser = { ...activeUser, two_factor_enabled: false };
      if (isBackoffice) {
          localStorage.setItem('backoffice_user', JSON.stringify(updatedUser));
      } else if (token) {
          login(token, updatedUser, false);
      }
      
      setTimeout(() => onClose(), 2000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Sécurité 2FA
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-bold leading-relaxed">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-xs font-bold leading-relaxed">
              {successMsg}
            </div>
          )}

          {!successMsg && step === 'info' && (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-4">
                <ShieldAlert className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  L'authentification à deux facteurs ajoute une couche de sécurité supplémentaire à votre compte en exigeant plus qu'un simple mot de passe.
                </p>
              </div>
              <button
                onClick={handleSetup}
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20"
              >
                {isLoading ? "Préparation..." : "Configurer l'Application"}
              </button>
            </div>
          )}

          {!successMsg && step === 'setup' && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                  1. Scannez ce QR Code avec votre application d'authentification (Google Authenticator, Authy, etc).
                </p>
                <div className="bg-white p-4 inline-block rounded-xl mx-auto border border-slate-200">
                  {qrCode ? (
                    <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                  ) : (
                    <div className="w-48 h-48 bg-slate-100 flex items-center justify-center animate-pulse" />
                  )}
                </div>
                
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1 font-bold uppercase transition-colors">Ou entrez ce code manuellement :</p>
                  <p className="text-sm font-mono tracking-widest text-slate-800 dark:text-white select-all">{secret}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 font-bold">2. Entrez le code à 6 chiffres généré :</p>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-center font-mono tracking-[0.5em] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:text-white"
                />
                <button
                  onClick={handleVerify}
                  disabled={isLoading || code.length < 6}
                  className="w-full mt-4 py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isLoading ? "Vérification..." : "Vérifier et Activer"}
                </button>
              </div>
            </div>
          )}

          {!successMsg && step === 'disable' && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 flex items-center justify-center rounded-full mx-auto mb-4">
                <Key className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                La double authentification est actuellement <span className="text-emerald-500 font-bold uppercase">Activée</span>.
              </p>
              <p className="text-xs text-slate-500 mt-2 mb-6">
                Pour la désactiver, veuillez entrer un code de vérification généré par votre application.
              </p>
              
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-center font-mono tracking-[0.5em] focus:ring-2 focus:ring-red-500/20 outline-none transition-all dark:text-white"
              />
              <button
                onClick={handleDisable}
                disabled={isLoading || code.length < 6}
                className="w-full mt-4 py-3 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-500 transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                {isLoading ? "Désactivation..." : "Désactiver la 2FA"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
