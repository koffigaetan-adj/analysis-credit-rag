import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldCheck, Zap, BarChart3, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// --- TYPES ---
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  angle: number;
  spin: number;
}

// --- COMPOSANT BACKGROUND ---
const InteractiveBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    const colors = ['#e63919', '#cb2b11', '#a9210c', '#404040', '#262626'];
    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 5000);
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 1.2) * 0.5,
          size: Math.random() * 2 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          angle: Math.random() * 360,
          spin: (Math.random() - 0.5) * 2,
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const dxMouse = mouseX - p.x;
        const dyMouse = mouseY - p.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        const maxDistMouse = 150;

        if (distMouse < maxDistMouse) {
          const force = (maxDistMouse - distMouse) / maxDistMouse;
          p.x -= (dxMouse / distMouse) * force * 5;
          p.y -= (dyMouse / distMouse) * force * 3;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;

        if (p.y < -20) p.y = canvas.height + 20;
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(230, 57, 25, ${0.2 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.closePath();
          }
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.angle * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
        ctx.restore();
      }

      animationId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

// --- CHAMP MOT DE PASSE AVEC ŒIL ---
const PasswordInput = ({
  value,
  onChange,
  placeholder = '••••••••',
  required = false,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
}) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-sm"
        required={required}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sexe, setSexe] = useState('M');
  const [poste, setPoste] = useState('');

  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isResetPassword) {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), code: resetCode.trim(), new_password: newPassword })
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Erreur lors de la réinitialisation");
        }
        setSuccessMessage("Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.");
        setIsResetPassword(false);
        setIsForgotPassword(false);
        setPassword('');
        setResetCode('');
        setNewPassword('');
      } else if (isForgotPassword) {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() })
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Erreur lors de la demande");
        }
        setSuccessMessage("Si l'adresse email existe, un code à 6 chiffres a été envoyé.");
        setIsForgotPassword(false);
        setIsResetPassword(true);
      } else if (isSignUp) {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/request-account`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            sexe,
            email: email.trim(),
            poste: poste.trim() || 'Data Analyst'
          })
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Erreur lors de la demande de création");
        }
        setSuccessMessage("Votre demande de compte a été enregistrée. Elle sera validée par un administrateur.");
        setIsSignUp(false);
      } else {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Erreur lors de la connexion');
        }
        const data = await response.json();
        login(data.access_token, data.user_info, data.is_first_login);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center font-sans overflow-hidden bg-slate-950">

      <InteractiveBackground />

      <div className="relative z-10 w-full h-full flex flex-col lg:flex-row">

        {/* SECTION GAUCHE */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-12">
          <div className="max-w-md text-left">
            {/* Logo réduit */}
            <div className="mb-10 w-fit inline-block" style={{ perspective: '1000px' }}>
              <a 
                href="https://kais-analytics.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <img
                  src="/Logocomplet.svg"
                  alt="Kaïs Logo"
                  className="h-36 object-contain drop-shadow-[0_20px_80px_rgba(230,57,25,0.2)] pointer-events-none"
                />
              </a>
            </div>

            <p className="text-slate-400 text-lg mb-12 leading-relaxed">
              Analysez les dossiers de crédit pro avec une précision chirurgicale grâce à Kaïs.
            </p>

            <div className="space-y-8 text-left animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
              {[
                { icon: <Zap className="w-6 h-6" />, title: 'Analyse instantanée', desc: 'Traitement OCR et scoring en 10s.' },
                { icon: <ShieldCheck className="w-6 h-6" />, title: 'Sécurité bancaire', desc: 'Chiffrement AES-256 certifié.' },
                { icon: <BarChart3 className="w-6 h-6" />, title: 'Ratios dynamiques', desc: "Calcul automatique de l'EBITDA." },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-5 group">
                  <div className="w-12 h-12 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600/20 transition-all duration-300">
                    <div className="text-blue-400">{item.icon}</div>
                  </div>
                  <div>
                    <h3 className="text-white font-bold mb-1 tracking-wide uppercase text-xs">{item.title}</h3>
                    <p className="text-slate-500 text-sm leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION DROITE */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Logo Mobile — réduit aussi */}
          <div className="lg:hidden mb-8 mt-8 flex justify-center w-full animate-fade-in">
            <img
              src="/Logocomplet.svg"
              alt="Kaïs Logo"
              className="h-16 object-contain drop-shadow-[0_20px_50px_rgba(230,57,25,0.2)]"
            />
          </div>

          <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-[40px] shadow-2xl">
            <div className="mb-8 text-left">
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                {isResetPassword ? "Nouveau MDP" : isForgotPassword ? "Mot de passe oublié" : isSignUp ? "Créer un compte" : "Connexion"}
              </h2>
              <p className="text-slate-400 text-sm font-medium">
                {isResetPassword ? "Entrez le code reçu par email" : isForgotPassword ? "Recevez un code à 6 chiffres" : isSignUp ? "Demandez votre accès à Kaïs" : "Console d'audit professionnelle."}
              </p>
            </div>

            {(!isForgotPassword && !isResetPassword) && (
              <div className="relative flex mb-8 bg-white/5 p-1.5 rounded-2xl overflow-hidden">
                {/* Pill animée */}
                <div 
                  className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-blue-600/20 border border-blue-500/30 rounded-xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    isSignUp ? 'translate-x-[calc(100%+6px)]' : 'translate-x-0'
                  }`} 
                />
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setError(null); setSuccessMessage(null); }}
                  className={`relative z-10 flex-1 py-3.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors duration-300 ${!isSignUp ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}
                >
                  Se connecter
                </button>
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setError(null); setSuccessMessage(null); }}
                  className={`relative z-10 flex-1 py-3.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors duration-300 ${isSignUp ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}
                >
                  S'inscrire
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm font-medium">
                  {error}
                </div>
              )}
              {successMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-medium">
                  {successMessage}
                </div>
              )}

              {isSignUp && !isForgotPassword && !isResetPassword && (
                <>
                  <div className="flex gap-3">
                    <div className="space-y-2 flex-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Prénom</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-sm"
                        required={isSignUp}
                      />
                    </div>
                    <div className="space-y-2 flex-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nom</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-sm"
                        required={isSignUp}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="space-y-2 flex-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Sexe</label>
                      <select
                        value={sexe}
                        onChange={(e) => setSexe(e.target.value)}
                        className="w-full px-4 py-3 bg-[#222222] border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-sm appearance-none"
                      >
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                        <option value="NB">Non-Binaire</option>
                      </select>
                    </div>
                    <div className="space-y-2 flex-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Poste (opt)</label>
                      <input
                        type="text"
                        value={poste}
                        placeholder="Data Analyst"
                        onChange={(e) => setPoste(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* EMAIL */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="analyste@kais.com"
                    className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-sm"
                    required
                    disabled={isResetPassword}
                  />
                </div>
              </div>

              {/* RESET PASSWORD FIELDS */}
              {isResetPassword && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Code à 6 chiffres</label>
                    <input
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="Ex: 123456"
                      className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-sm text-center tracking-widest"
                      maxLength={6}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nouveau mot de passe</label>
                    <PasswordInput
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {/* MOT DE PASSE CONNEXION */}
              {(!isSignUp && !isForgotPassword && !isResetPassword) && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mot de passe</label>
                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(true); setError(null); setSuccessMessage(null); }}
                      className="text-[10px] font-bold text-blue-500  tracking-tighter hover:text-blue-400 transition-colors"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {isLoading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <>{isResetPassword ? "Valider le code" : isForgotPassword ? "Recevoir le code" : isSignUp ? "Envoyer la demande" : "Accéder"} <ArrowRight className="w-4 h-4" /></>
                }
              </button>

              {(isForgotPassword || isResetPassword) && (
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(false); setIsResetPassword(false); setError(null); setSuccessMessage(null); }}
                  className="w-full text-slate-400 py-2 text-xs font-bold uppercase tracking-widest hover:text-white transition-all flex items-center justify-center mt-2"
                >
                  Retour à la connexion
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}