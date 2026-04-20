import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, Server, TerminalSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BackofficeLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/backoffice/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Identifiants invalides");
      }

      const data = await response.json();
      
      // Store token specific to backoffice
      localStorage.setItem('backoffice_token', data.access_token);
      localStorage.setItem('backoffice_user', JSON.stringify(data.user_info));
      
      navigate('/backoffice');

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06080F] flex items-center justify-center p-4 relative overflow-hidden font-mono text-sm selection:bg-emerald-500/30">
      
      {/* Decorative Grid Network */}
      <div className="absolute inset-0 z-0 opacity-10" style={{
        backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.2) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />

      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#06080F_100%)]"></div>

      <div className="w-full max-w-md bg-[#0F1523]/90 backdrop-blur-md border border-emerald-900/40 rounded-sm relative z-10 p-8 shadow-[0_0_50px_-12px_rgba(16,185,129,0.2)]">
        
        {/* Terminal Header */}
        <div className="flex items-center gap-2 mb-8 border-b border-emerald-900/30 pb-4">
          <TerminalSquare className="w-6 h-6 text-emerald-500" />
          <div>
            <h1 className="text-emerald-500 font-bold tracking-widest uppercase">System Console</h1>
            <p className="text-xs text-emerald-500/50">Core Administration Interface</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-900/20 border border-red-500/50 text-red-400 text-xs flex items-start gap-2">
            <span className="text-red-500 font-bold">[ERR]</span>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
             <label className="flex items-center gap-2 text-emerald-500/70 text-xs mb-2 uppercase tracking-wider">
               <Server className="w-3 h-3" /> System ID
             </label>
             <input 
               type="email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               required
               placeholder="admin@kais-analytics.com"
               className="w-full bg-black/50 border border-emerald-900/50 text-emerald-400 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono text-sm placeholder:text-emerald-900/50"
             />
          </div>

          <div>
             <label className="flex items-center gap-2 text-emerald-500/70 text-xs mb-2 uppercase tracking-wider">
               <Lock className="w-3 h-3" /> Credentials
             </label>
             <input 
               type="password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               required
               placeholder="****************"
               className="w-full bg-black/50 border border-emerald-900/50 text-emerald-400 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono tracking-widest text-sm placeholder:text-emerald-900/50"
             />
          </div>

          <button 
             type="submit"
             disabled={isLoading}
             className="w-full bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 hover:border-emerald-400 py-3 font-bold uppercase tracking-wider disabled:opacity-50 transition-all flex items-center justify-center gap-3 mt-8 group"
          >
            {isLoading ? 'Authenticating...' : 'Establish link'}
            {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
        
        <div className="mt-8 pt-4 border-t border-emerald-900/30 flex items-center justify-between text-[10px] text-emerald-900/60 uppercase tracking-widest">
           <span>Kaïs Secure Auth</span>
           <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Node Online</span>
        </div>
      </div>
    </div>
  );
}
