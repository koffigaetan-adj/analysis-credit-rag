import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck, Bell, Mail } from 'lucide-react';

const sections = [
  {
    id: 'collecte',
    icon: <Database className="w-5 h-5 text-blue-400" />,
    title: '1. Données collectées',
    content: `Kaïs Analytics collecte uniquement les données strictement nécessaires au fonctionnement de la plateforme :

**Données du compte utilisateur :**
- Nom, prénom, adresse email professionnelle
- Établissement bancaire d'appartenance
- Poste occupé et rôle applicatif
- Avatar (optionnel, uploadé par l'utilisateur)

**Données d'analyse :**
- Documents PDF soumis à l'analyse (bilans, bulletins de salaire, liasses fiscales)
- Résultats d'analyse, scores et recommandations IA
- Historique des analyses consultées et sauvegardées

**Données techniques :**
- Adresse IP (pour la sécurité et la prévention des fraudes uniquement)
- Journaux d'accès anonymisés (authentification, connexion)
- Sessions de chat IA associées au compte utilisateur`
  },
  {
    id: 'finalites',
    icon: <Target/>,
    title: '2. Finalités du traitement',
    icon2: <Eye className="w-5 h-5 text-violet-400" />,
    content: `Les données collectées sont traitées exclusivement pour les finalités suivantes :

**a) Fourniture du service :**
L'analyse des documents financiers soumis nécessite leur traitement temporaire pour extraction des données numériques et génération du scoring.

**b) Authentification et sécurité :**
Gestion des comptes utilisateurs, contrôle d'accès basé sur les rôles (SUPER_ADMIN, ADMIN, ANALYST), détection des accès frauduleux.

**c) Amélioration du service :**
Statistiques d'usage anonymisées pour améliorer les performances de la plateforme. Aucun profil individuel n'est constitué à des fins commerciales.

**d) Communication opérationnelle :**
Notifications relatives au compte (approbation de demande, réinitialisation de mot de passe, envoi de rapports).`
  },
  {
    id: 'conservation',
    icon: <Lock className="w-5 h-5 text-emerald-400" />,
    title: '3. Conservation des données',
    content: `Les durées de conservation sont strictement limitées aux besoins du service :

| Type de donnée | Durée de conservation |
|---|---|
| Compte utilisateur actif | Durée de la relation contractuelle |
| Analyses et rapports | 5 ans (archivage bancaire réglementaire) |
| Documents PDF uploadés | Suppression après traitement (max 24h) |
| Journaux de connexion | 12 mois glissants |
| Sessions de chat | 2 ans ou sur demande de suppression |
| Codes OTP (réinitialisation) | 15 minutes (expiration automatique) |

À l'issue de ces durées, les données sont supprimées de manière sécurisée et irréversible.`
  },
  {
    id: 'securite',
    icon: <Shield className="w-5 h-5 text-amber-400" />,
    title: '4. Sécurité des données',
    content: `Kaïs Analytics applique les standards de sécurité les plus élevés de l'industrie bancaire :

**Chiffrement :**
- Chiffrement en transit : TLS 1.3 sur toutes les communications
- Chiffrement au repos : AES-256 sur toutes les données stockées
- Hachage des mots de passe : bcrypt avec sel aléatoire (coût ≥ 12)

**Contrôle d'accès :**
- Authentification par JWT (JSON Web Token) avec expiration configurable
- Système de rôles hiérarchiques (RBAC) — accès strictement cloisonnés
- Session timeout automatique après inactivité

**Infrastructure :**
- Hébergement sur infrastructure cloud certifiée ISO 27001
- Séparation des environnements (production / staging / développement)
- Sauvegardes chiffrées quotidiennes avec rétention de 30 jours

**Audit :**
- Journalisation de tous les accès aux données sensibles
- Alertes automatiques en cas de comportement anormal
- Revue de sécurité trimestrielle`
  },
  {
    id: 'droits',
    icon: <UserCheck className="w-5 h-5 text-rose-400" />,
    title: '5. Vos droits (RGPD)',
    content: `Conformément au Règlement Général sur la Protection des Données (RGPD — UE 2016/679), vous disposez des droits suivants :

**Droit d'accès (Art. 15 RGPD) :**
Vous pouvez obtenir la confirmation du traitement de vos données et en recevoir une copie.

**Droit de rectification (Art. 16 RGPD) :**
Vous pouvez demander la correction de données inexactes ou incomplètes.

**Droit à l'effacement (Art. 17 RGPD) :**
Vous pouvez demander la suppression de vos données dans les limites des obligations légales de conservation.

**Droit à la portabilité (Art. 20 RGPD) :**
Vous pouvez recevoir vos données dans un format structuré et lisible par machine.

**Droit d'opposition (Art. 21 RGPD) :**
Vous pouvez vous opposer au traitement de vos données à des fins de prospection.

**Comment exercer vos droits :**
Adressez votre demande par email à **privacy@kaisanalytics.com** avec la mention "Exercice de droits RGPD" et une copie de votre pièce d'identité. Nous vous répondrons dans un délai maximum de 30 jours.

En cas de litige non résolu, vous avez le droit de saisir la **CNIL** (Commission Nationale de l'Informatique et des Libertés) : www.cnil.fr`
  },
  {
    id: 'cookies',
    icon: <Bell className="w-5 h-5 text-cyan-400" />,
    title: '6. Cookies et traceurs',
    content: `Kaïs Analytics utilise un nombre minimal de cookies, tous strictement nécessaires au fonctionnement du service :

**Cookies de session :**
- Token JWT d'authentification (sessionStorage, effacé à la fermeture du navigateur)
- Préférences d'interface (thème sombre/clair, localStorage)

**Cookies strictement refusés :**
- Aucun cookie publicitaire ou de tracking tiers
- Aucune intégration de réseaux sociaux avec suivi
- Aucun outil d'analytics tiers (ex. Google Analytics) sans consentement explicite

Aucun bandeau de consentement aux cookies n'est requis car seuls des cookies techniquement nécessaires sont déposés, conformément à l'article 82 de la Loi Informatique et Libertés française.`
  },
  {
    id: 'transferts',
    icon: <Lock className="w-5 h-5 text-indigo-400" />,
    title: '7. Transferts de données et sous-traitants',
    content: `Certains de nos sous-traitants peuvent traiter des données hors de l'Union Européenne. Dans tous les cas, des garanties appropriées sont mises en place :

**Sous-traitants principaux :**

| Prestataire | Localisation | Rôle | Garantie |
|---|---|---|---|
| Supabase | USA / EU | Base de données vectorielle | Clauses contractuelles types (CCT) |
| Groq Cloud | USA | Inférence LLM (analyse IA) | CCT + traitement anonymisé |
| HuggingFace | USA / EU | Génération d'embeddings | CCT |
| SMTP (Gmail/Brevo) | EU | Envoi d'emails | Conforme RGPD |

**Important :** Les documents PDF uploadés sont transmis aux services d'IA uniquement pour la durée du traitement. Aucun stockage permanent n'est effectué par nos sous-traitants IA.`
  },
  {
    id: 'contact',
    icon: <Mail className="w-5 h-5 text-slate-400" />,
    title: '8. Contact & Délégué à la Protection des Données',
    content: `Pour toute question relative au traitement de vos données personnelles :

**Responsable du traitement :**
Kaïs Analytics SAS
Siège social : Paris, France

**Email DPO :** privacy@kaisanalytics.com
**Objet à préciser :** "Protection des données personnelles"

**CNIL :**
En cas de résolution insatisfaisante, vous pouvez contacter la Commission Nationale de l'Informatique et des Libertés :
3 Place de Fontenoy — TSA 80715 — 75334 Paris Cedex 07
www.cnil.fr`
  },
];

function PrivacySection({ section }: { section: typeof sections[0] }) {
  const lines = section.content.split('\n');
  return (
    <div id={section.id} className="scroll-mt-20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          {section.icon2 || section.icon}
        </div>
        <h2 className="text-2xl font-bold text-white">{section.title}</h2>
      </div>
      <div className="pl-12 space-y-3 text-slate-400 leading-relaxed">
        {lines.map((line, i) => {
          if (!line.trim()) return null;
          if (line.startsWith('**') && line.endsWith('**')) {
            return <p key={i} className="text-white font-bold mt-4 mb-1">{line.replace(/\*\*/g, '')}</p>;
          }
          if (line.startsWith('| ') && line.includes(' | ')) {
            const cells = line.split(' | ').map(c => c.replace(/^\||\|$/g, '').trim());
            const isHeader = lines[i + 1]?.includes('---|');
            const isPassed = lines[i - 1]?.includes('---|');
            if (lines[i + 1]?.includes('---|')) {
              return (
                <div key={i} className="overflow-x-auto mt-3">
                  <table className="w-full text-sm border-collapse">
                    <thead><tr className="bg-white/5">{cells.filter(c => c !== '---').map((c, j) => <th key={j} className="px-3 py-2 text-left text-white font-bold border border-white/10">{c}</th>)}</tr></thead>
                    <tbody id={`tbody-${i}`}></tbody>
                  </table>
                </div>
              );
            }
            if (line.includes('---|')) return null;
            return (
              <tr key={i} className="border-b border-white/5 hover:bg-white/3">
                {cells.filter(c => c !== '---').map((c, j) => (
                  <td key={j} className="px-3 py-2 border border-white/8 text-slate-400 text-sm">{c}</td>
                ))}
              </tr>
            );
          }
          return <p key={i} className={`${line.startsWith('- ') ? 'ml-4 flex gap-2' : ''}`}>
            {line.startsWith('- ') ? <><span className="text-blue-500 shrink-0">•</span><span>{line.slice(2)}</span></> : line}
          </p>;
        })}
      </div>
      <div className="mt-8 border-b border-white/5" />
    </div>
  );
}

export default function PrivacyPublic() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Nav */}
      <nav className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
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

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-4 gap-12">

          {/* Sommaire latéral */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Sommaire</p>
              {sections.map(s => (
                <a key={s.id} href={`#${s.id}`} className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors py-1 group">
                  <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-blue-500 transition-colors" />
                  {s.title.replace(/^\d+\. /, '')}
                </a>
              ))}
            </div>
          </aside>

          {/* Contenu */}
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm font-medium">
                <Shield className="w-4 h-4" />
                Conforme RGPD — UE 2016/679
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
                Politique de Confidentialité
              </h1>
              <p className="text-slate-400 leading-relaxed">
                Kaïs Analytics s'engage à protéger la vie privée de ses utilisateurs et à traiter leurs données personnelles dans le strict respect du cadre légal européen.
              </p>
              <div className="flex flex-wrap gap-4 mt-6">
                <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400">
                  📅 Dernière mise à jour : Avril 2026
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400">
                  📋 Version 2.2
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                  ✓ Conforme RGPD
                </span>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-10">
              {sections.map(s => (
                <PrivacySection key={s.id} section={s} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer mini */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Kaïs Analytics — Tous droits réservés.</p>
          <div className="flex gap-6">
            <Link to="/" className="hover:text-white transition-colors">Accueil</Link>
            <Link to="/contact-public" className="hover:text-white transition-colors">Contact</Link>
            <Link to="/about" className="hover:text-white transition-colors">À propos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Target(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  );
}
