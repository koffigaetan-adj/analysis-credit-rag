import React, { useState } from 'react';
import { Mail, MessageSquare, Send, Paperclip, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function HelpCenter() {
     const { user } = useAuth();

     const [formData, setFormData] = useState({
          email: user?.email || '',
          subject: '',
          message: ''
     });

     // Custom subject input handling if "Autre" is selected
     const [isCustomSubject, setIsCustomSubject] = useState(false);
     const [customSubjectText, setCustomSubjectText] = useState('');

     const [file, setFile] = useState<File | null>(null);
     const [isSubmitting, setIsSubmitting] = useState(false);
     const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

     const subjectOptions = [
          "--- Sélectionner un objet ---",
          "Assistance technique",
          "Signaler un bug",
          "Question commerciale / Facturation",
          "Demande d'évolution",
          "Autre"
     ];

     const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
          const value = e.target.value;
          if (value === "Autre") {
               setIsCustomSubject(true);
               setFormData({ ...formData, subject: '' });
          } else {
               setIsCustomSubject(false);
               setFormData({ ...formData, subject: value === "--- Sélectionner un objet ---" ? "" : value });
          }
     };

     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          if (e.target.files && e.target.files[0]) {
               setFile(e.target.files[0]);
          }
     };

     const removeFile = () => {
          setFile(null);
     };

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          setIsSubmitting(true);
          setSubmitStatus('idle');

          const finalSubject = isCustomSubject ? customSubjectText : formData.subject;

          if (!formData.email || !finalSubject || !formData.message) {
               alert("Veuillez remplir tous les champs obligatoires.");
               setIsSubmitting(false);
               return;
          }

          try {
               const formPayload = new FormData();
               formPayload.append('email', formData.email);
               formPayload.append('subject', finalSubject);
               formPayload.append('message', formData.message);
               if (file) {
                    formPayload.append('file', file);
               }

               const response = await fetch('http://127.0.0.1:8000/contact/', {
                    method: 'POST',
                    headers: {
                         'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                    },
                    body: formPayload
               });

               if (response.ok) {
                    setSubmitStatus('success');
                    setFormData({ ...formData, subject: '', message: '' });
                    setCustomSubjectText('');
                    setIsCustomSubject(false);
                    setFile(null);
               } else {
                    setSubmitStatus('error');
               }
          } catch (error) {
               console.error("Erreur d'envoi", error);
               setSubmitStatus('error');
          } finally {
               setIsSubmitting(false);

               if (submitStatus !== 'error') {
                    setTimeout(() => setSubmitStatus('idle'), 5000);
               }
          }
     };

     return (
          <div className="max-w-4xl mx-auto pb-20 px-6 mt-10 animate-fade-in text-left">
               {/* HEADER SECTION */}
               <div className="mb-10">
                    <h1 className="text-3xl font-light text-slate-800 dark:text-slate-100 tracking-tight transition-colors">
                         Centre <span className="font-semibold text-slate-900 dark:text-white">d'Aide</span>
                    </h1>
                    <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                         Une question ? Un problème technique ? Contactez notre équipe d'assistance.
                    </p>
               </div>

               <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-50 dark:border-slate-800 overflow-hidden transition-colors">
                    <div className="p-6 md:p-10">

                         {submitStatus === 'success' && (
                              <div className="mb-8 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl flex items-start gap-3 text-emerald-700 dark:text-emerald-400 animate-in slide-in-from-top-4">
                                   <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                                   <div>
                                        <h4 className="font-semibold text-sm">Message envoyé avec succès !</h4>
                                        <p className="text-xs mt-1 opacity-90">Notre équipe reviendra vers vous très prochainement à l'adresse fournie.</p>
                                   </div>
                              </div>
                         )}

                         {submitStatus === 'error' && (
                              <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl flex items-start gap-3 text-red-700 dark:text-red-400 animate-in slide-in-from-top-4">
                                   <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                                   <div>
                                        <h4 className="font-semibold text-sm">Une erreur est survenue</h4>
                                        <p className="text-xs mt-1 opacity-90">Impossible d'envoyer votre message. Veuillez réessayer plus tard.</p>
                                   </div>
                              </div>
                         )}

                         <form onSubmit={handleSubmit} className="space-y-6">

                              {/* EMAIL */}
                              <div className="space-y-2">
                                   <label htmlFor="email" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Mail className="w-4 h-4" /> Adresse Email
                                   </label>
                                   <input
                                        id="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="votre@email.com"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 focus:border-blue-100 dark:focus:border-blue-900 outline-none transition-all"
                                   />
                              </div>

                              {/* OBJET */}
                              <div className="space-y-2">
                                   <label htmlFor="subject" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" /> Objet de la demande
                                   </label>
                                   <div className="flex flex-col sm:flex-row gap-3">
                                        <select
                                             id="subject"
                                             onChange={handleSubjectChange}
                                             value={isCustomSubject ? "Autre" : formData.subject || "--- Sélectionner un objet ---"}
                                             className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 focus:border-blue-100 dark:focus:border-blue-900 outline-none transition-all"
                                        >
                                             {subjectOptions.map((opt, idx) => (
                                                  <option key={idx} value={opt} disabled={opt.startsWith("---")}>{opt}</option>
                                             ))}
                                        </select>

                                        {isCustomSubject && (
                                             <input
                                                  type="text"
                                                  required
                                                  value={customSubjectText}
                                                  onChange={(e) => setCustomSubjectText(e.target.value)}
                                                  placeholder="Précisez votre objet"
                                                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 focus:border-blue-100 dark:focus:border-blue-900 outline-none transition-all animate-in slide-in-from-right-4"
                                             />
                                        )}
                                   </div>
                              </div>

                              {/* MESSAGE */}
                              <div className="space-y-2">
                                   <label htmlFor="message" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        Message détaillé
                                   </label>
                                   <textarea
                                        id="message"
                                        required
                                        rows={6}
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="Décrivez votre problème ou votre demande..."
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 focus:border-blue-100 dark:focus:border-blue-900 outline-none transition-all resize-none"
                                   />
                              </div>

                              {/* PIECE JOINTE */}
                              <div className="space-y-2">
                                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Paperclip className="w-4 h-4" /> Pièce jointe <span className="text-[10px] font-normal lowercase tracking-normal opacity-70">(Optionnel)</span>
                                   </label>

                                   <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                        <label className="cursor-pointer inline-block">
                                             <span className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors inline-block">
                                                  Parcourir...
                                             </span>
                                             <input
                                                  type="file"
                                                  className="hidden"
                                                  onChange={handleFileChange}
                                                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                             />
                                        </label>

                                        {file && (
                                             <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 pl-3 pr-2 py-1.5 rounded-lg text-xs font-medium animate-in fade-in zoom-in">
                                                  <span className="truncate max-w-[200px]">{file.name}</span>
                                                  <button type="button" onClick={removeFile} className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md transition-colors">
                                                       <X className="w-3.5 h-3.5" />
                                                  </button>
                                             </div>
                                        )}
                                        {!file && <span className="text-xs text-slate-400 italic">Aucun fichier sélectionné</span>}
                                   </div>
                              </div>

                              {/* BOUTON ENVOYER */}
                              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                   <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-2xl text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                   >
                                        {isSubmitting ? (
                                             <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                             <Send className="w-4 h-4" />
                                        )}
                                        {isSubmitting ? 'Envoi...' : 'Envoyer la demande'}
                                   </button>
                              </div>

                         </form>
                    </div>
               </div>
          </div>
     );
}
