import React, { useEffect, useState } from 'react';
import { Lock, ArrowRight, Eye, EyeOff, AlertTriangle, Clock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoSvg from '../images/logocompletoffice.svg';

export default function BackofficeLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const isInactivityLogout = new URLSearchParams(location.search).get('reason') === 'inactivity';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [isTwoFactorStep, setIsTwoFactorStep] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Titre & favicon dédiés au backoffice
  useEffect(() => {
    const prevTitle = document.title;
    const prevFavicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const prevHref = prevFavicon?.href;
    document.title = 'Kaïs Backoffice';
    if (prevFavicon) prevFavicon.href = '/logobackoffice.svg';
    return () => {
      document.title = prevTitle;
      if (prevFavicon && prevHref) prevFavicon.href = prevHref;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      if (isTwoFactorStep) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/2fa/login-verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ temp_token: tempToken, code: twoFactorCode.trim() })
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.detail || 'Code invalide');
        }
        const data = await res.json();
        localStorage.setItem('backoffice_token', data.access_token);
        localStorage.setItem('backoffice_user', JSON.stringify(data.user_info));
        navigate('/backoffice');
      } else {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/backoffice/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.detail || 'Identifiants invalides');
        }
        const data = await res.json();
        if (data.requires_2fa) {
            setIsTwoFactorStep(true);
            setTempToken(data.temp_token);
            return;
        }
        localStorage.setItem('backoffice_token', data.access_token);
        localStorage.setItem('backoffice_user', JSON.stringify(data.user_info));
        navigate('/backoffice');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0C14] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Fond subtil grille */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(to right, #645CA5 1px, transparent 1px), linear-gradient(to bottom, #645CA5 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
      {/* Glow violet centré */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(100,92,165,0.15) 0%, transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logoSvg} alt="Kaïs Backoffice" className="h-12 w-auto" />
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7 shadow-2xl"
          style={{
            background: 'rgba(18,16,30,0.95)',
            border: '1px solid rgba(100,92,165,0.25)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-white">Administration</h1>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Accès réservé aux administrateurs système
            </p>
          </div>

          {isInactivityLogout && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}>
              <Clock className="w-4 h-4 shrink-0" />
              Session expirée après 30 minutes d'inactivité.
            </div>
          )}
          {errorMsg && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {isTwoFactorStep ? (
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Code d'Authentification (6 chiffres)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={e => setTwoFactorCode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all text-center tracking-[0.5em]"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(100,92,165,0.25)',
                      color: '#e2e0f0',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#645CA5')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(100,92,165,0.25)')}
                  />
                  <button
                      type="button"
                      onClick={() => { setIsTwoFactorStep(false); setTempToken(''); setErrorMsg(''); }}
                      className="text-xs mt-3 block w-full text-center transition-colors hover:text-white"
                      style={{ color: 'rgba(255,255,255,0.3)' }}
                  >
                      Retour
                  </button>
                </div>
            ) : (
                <>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Adresse Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@kais-analytics.com"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(100,92,165,0.25)',
                  color: '#e2e0f0',
                }}
                onFocus={e => (e.target.style.borderColor = '#645CA5')}
                onBlur={e => (e.target.style.borderColor = 'rgba(100,92,165,0.25)')}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(100,92,165,0.25)',
                    color: '#e2e0f0',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#645CA5')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(100,92,165,0.25)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#645CA5')}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.3)')}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm group disabled:opacity-50"
              style={{ background: '#645CA5', color: 'white' }}
              onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#534d8e'; }}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = '#645CA5')}
            >
              {isLoading ? 'Connexion en cours...' : (
                <>
                  {isTwoFactorStep ? "Vérifier" : "Se connecter"}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.15)' }}>
          Kaïs Analytics · Console d'Administration
        </p>
      </div>
    </div>
  );
}
