import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Lock, Mail, ShieldCheck, Zap, BarChart3, ArrowRight } from 'lucide-react';
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

// --- COMPOSANT BACKGROUND FULL SCREEN DENSE AVEC RÉSEAU ---
const InteractiveBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    const colors = ['#475569', '#64748b', '#94a3b8', '#cbd5e1', '#1e293b'];
    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      // Densité élevée pour permettre les connexions réseau
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
      // Fond Slate 950 profond
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Interaction souris
        const dxMouse = mouseX - p.x;
        const dyMouse = mouseY - p.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        const maxDistMouse = 150;

        if (distMouse < maxDistMouse) {
          const force = (maxDistMouse - distMouse) / maxDistMouse;
          p.x -= (dxMouse / distMouse) * force * 5;
          p.y -= (dyMouse / distMouse) * force * 3;
        }

        // Physique
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;

        // Recyclage écran
        if (p.y < -20) p.y = canvas.height + 20;
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;

        // --- DESSIN DU RÉSEAU (Lignes entre points) ---
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(148, 163, 184, ${0.2 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.closePath();
          }
        }

        // --- DESSIN DU POINT ---
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

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/auth/login', {
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
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 bg-blue-600 rounded-[22px] flex items-center justify-center shadow-2xl shadow-blue-500/20 transition-transform hover:scale-105">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">
                Credir<span className="text-blue-500">o</span>
              </h1>
            </div>

            <h2 className="text-5xl font-bold text-white mb-6 leading-tight tracking-tight italic">
              L'audit financier <span className="text-blue-400">réinventé.</span>
            </h2>

            <p className="text-slate-400 text-lg mb-12 leading-relaxed">
              Analysez les dossiers de crédit pro avec une précision chirurgicale grâce à Crediro.
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
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[40px] shadow-2xl">
            <div className="mb-10 text-left">
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Connexion</h2>
              <p className="text-slate-400 text-sm font-medium">Console d'audit professionnelle.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="analyste@crediro.com"
                    className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mot de passe</label>
                  <a href="#" className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">Oublié ?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Accéder <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}