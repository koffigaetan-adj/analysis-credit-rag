import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Send, MessageSquare, Clock, Shield } from 'lucide-react';
import { useState } from 'react';

export default function ContactPublic() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Nav */}
      <nav className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <img src="/Logocomplet.svg" alt="Kaïs" className="h-8 object-contain" />
          </Link>
          <Link to="/login" className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all">
            Espace Client
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative py-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-medium">
            <MessageSquare className="w-4 h-4" />
            On vous répond sous 24h
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-4">
            Contactez <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-500">notre équipe</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Une question sur la plateforme, un besoin spécifique ou une demande de démo ? Notre équipe est disponible pour vous accompagner.
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid lg:grid-cols-5 gap-10">

          {/* Infos de contact */}
          <div className="lg:col-span-2 space-y-6">
            {[
              { icon: <Mail className="w-5 h-5 text-blue-400" />, label: 'Email', value: 'contact@kaisanalytics.com', sub: 'Réponse sous 24h ouvrées' },
              { icon: <Phone className="w-5 h-5 text-emerald-400" />, label: 'Téléphone', value: '+33 (0)1 XX XX XX XX', sub: 'Lun–Ven, 9h–18h CET' },
              { icon: <MapPin className="w-5 h-5 text-rose-400" />, label: 'Siège social', value: 'Paris, France', sub: 'Sur rendez-vous uniquement' },
              { icon: <Clock className="w-5 h-5 text-amber-400" />, label: 'Disponibilité IA', value: '24h/24 — 7j/7', sub: 'Plateforme toujours disponible' },
            ].map(({ icon, label, value, sub }) => (
              <div key={label} className="flex gap-4 p-6 rounded-2xl bg-white/[0.03] border border-white/8 hover:border-blue-500/20 transition-all">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  {icon}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
                  <p className="text-white font-semibold">{value}</p>
                  <p className="text-slate-400 text-sm">{sub}</p>
                </div>
              </div>
            ))}

            <div className="p-6 rounded-2xl bg-blue-950/30 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-blue-400" />
                <p className="text-blue-300 font-semibold text-sm">Confidentialité garantie</p>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Toutes vos communications sont traitées dans le respect strict du RGPD. Vos données ne sont jamais partagées avec des tiers.
              </p>
            </div>
          </div>

          {/* Formulaire */}
          <div className="lg:col-span-3">
            {sent ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center rounded-3xl bg-white/[0.03] border border-emerald-500/20">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6">
                  <Send className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Message envoyé !</h2>
                <p className="text-slate-400 mb-6 max-w-sm">Merci pour votre message. Notre équipe vous répondra dans les 24 heures ouvrées.</p>
                <button
                  onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                  className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8 rounded-3xl bg-white/[0.03] border border-white/8 space-y-5">
                <h2 className="text-xl font-bold text-white mb-2">Envoyer un message</h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nom complet *</label>
                    <input
                      required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all text-sm"
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email *</label>
                    <input
                      type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all text-sm"
                      placeholder="jean@entreprise.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Sujet *</label>
                  <select
                    required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-all text-sm appearance-none"
                  >
                    <option value="" className="bg-slate-900">Sélectionner un sujet...</option>
                    <option value="demo" className="bg-slate-900">Demande de démonstration</option>
                    <option value="pricing" className="bg-slate-900">Tarifs et offres</option>
                    <option value="support" className="bg-slate-900">Support technique</option>
                    <option value="partnership" className="bg-slate-900">Partenariat</option>
                    <option value="other" className="bg-slate-900">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Message *</label>
                  <textarea
                    required rows={6} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all text-sm resize-none"
                    placeholder="Décrivez votre besoin ou votre question..."
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Envoyer le message
                    </>
                  )}
                </button>
                <p className="text-xs text-slate-500 text-center">
                  En soumettant ce formulaire, vous acceptez notre{' '}
                  <Link to="/privacy" className="text-blue-400 hover:underline">politique de confidentialité</Link>.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer mini */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Kaïs Analytics — Tous droits réservés.</p>
          <div className="flex gap-6">
            <Link to="/" className="hover:text-white transition-colors">Accueil</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
            <Link to="/about" className="hover:text-white transition-colors">À propos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
