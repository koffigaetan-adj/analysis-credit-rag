import { ShieldCheck, Lock, FileText, Database, ArrowLeft, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
     const navigate = useNavigate();

     return (
          <div className="max-w-4xl mx-auto pb-20 px-6 mt-10 animate-fade-in text-left font-sans">
               <button
                    onClick={() => navigate(-1)}
                    className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-8 transition-all"
               >
                    <ArrowLeft className="w-4 h-4" /> Retour
               </button>

               <div className="mb-12">
                    <h1 className="text-4xl font-light text-slate-800 dark:text-slate-100 tracking-tight mb-4">
                         Politique de <span className="font-semibold text-slate-900 dark:text-white">Confidentialité & RGPD</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">
                         Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </p>
               </div>

               <div className="space-y-8 text-slate-600 dark:text-slate-300 leading-relaxed">
                    {/* Intro */}
                    <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                         <div className="flex items-center gap-4 mb-6">
                              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                                   <ShieldCheck className="w-6 h-6" />
                              </div>
                              <h2 className="text-xl font-bold text-slate-800 dark:text-white">1. Engagement de Kaïs</h2>
                         </div>
                         <p>
                              Chez Kaïs, la protection de vos données personnelles et financières est notre priorité absolue.
                              Cette politique décrit comment nous collectons, utilisons et protégeons les informations que vous nous confiez lors de l'utilisation de notre plateforme d'analyse de crédit.
                              Nous nous conformons strictement au Règlement Général sur la Protection des Données (RGPD) et aux normes bancaires en vigueur.
                         </p>
                    </section>

                    {/* Data Collection */}
                    <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                         <div className="flex items-center gap-4 mb-6">
                              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                                   <Database className="w-6 h-6" />
                              </div>
                              <h2 className="text-xl font-bold text-slate-800 dark:text-white">2. Données Collectées</h2>
                         </div>
                         <p className="mb-4">Dans le cadre de nos audits et analyses IA, nous collectons :</p>
                         <ul className="list-disc pl-6 space-y-2">
                              <li><strong>Données d'identification :</strong> Noms des entités (entreprises ou particuliers), identifiants utilisateurs.</li>
                              <li><strong>Données financières (traitées localement ou chiffrées) :</strong> Bilans, comptes de résultats, relevés bancaires téléchargés pour OCR.</li>
                              <li><strong>Métadonnées d'utilisation :</strong> Historique de navigation sur la plateforme pour l'amélioration continue de nos modèles.</li>
                         </ul>
                    </section>

                    {/* Security */}
                    <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                         <div className="flex items-center gap-4 mb-6">
                              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                                   <Lock className="w-6 h-6" />
                              </div>
                              <h2 className="text-xl font-bold text-slate-800 dark:text-white">3. Sécurité et Chiffrement</h2>
                         </div>
                         <p className="mb-4">
                              Pour garantir une intégrité totale de vos informations relatives aux dossiers de crédit :
                         </p>
                         <ul className="list-disc pl-6 space-y-2">
                              <li>Toutes les données en transit sont chiffrées via TLS 1.3.</li>
                              <li>Les données au repos (documents comptables) sont protégées par chiffrement <strong>AES-256</strong> sur des serveurs sécurisés.</li>
                              <li>L'intelligence artificielle traite les données financières de manière anonymisée. Aucun de vos documents confidentiels ne sert à entraîner des modèles d'IA publics.</li>
                         </ul>
                    </section>

                    {/* User Rights */}
                    <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                         <div className="flex items-center gap-4 mb-6">
                              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                                   <FileText className="w-6 h-6" />
                              </div>
                              <h2 className="text-xl font-bold text-slate-800 dark:text-white">4. Vos Droits (RGPD)</h2>
                         </div>
                         <p className="mb-4">Conformément aux lois européennes sur la vie privée, vous disposez des droits suivants :</p>
                         <ul className="list-disc pl-6 space-y-2">
                              <li><strong>Droit d'accès et portabilité :</strong> Vous pouvez demander une copie de toutes vos données d'analyse via l'onglet Historique.</li>
                              <li><strong>Droit d'effacement ("Droit à l'oubli") :</strong> La suppression d'un dossier depuis votre interface détruit physiquement le dossier de nos bases de données instantanément.</li>
                              <li><strong>Droit de rectification :</strong> Vous pouvez mettre à jour vos informations de compte via le menu Paramètres.</li>
                         </ul>

                         <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                              <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-widest uppercase mb-4 flex items-center gap-2">
                                   <Mail className="w-4 h-4" /> Contacter notre DPO
                              </h3>
                              <p className="text-sm">
                                   Pour toute demande relative à vos données personnelles, notre Délégué à la Protection des Données (DPO) est joignable à l'adresse suivante :<br />
                                   <a href="mailto:privacy@kais-analytics.com" className="text-blue-600 dark:text-blue-400 font-bold hover:underline mt-2 inline-block">privacy@kais-analytics.com</a>
                              </p>
                         </div>
                    </section>
               </div>
          </div>
     );
}
