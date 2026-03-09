import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, MessageSquare, Briefcase, TrendingUp, Plus, Trash2, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ChatMessage {
     role: 'user' | 'assistant';
     content: string;
}

interface ChatSession {
     id: string;
     title: string;
     messages: ChatMessage[];
     created_at: string;
     updated_at: string;
}

export default function Chat() {
     const { user, token } = useAuth();
     const [sessions, setSessions] = useState<ChatSession[]>([]);
     const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
     const [messages, setMessages] = useState<ChatMessage[]>([]);
     const [inputMessage, setInputMessage] = useState('');
     const [isTyping, setIsTyping] = useState(false);
     const [isLoadingHistory, setIsLoadingHistory] = useState(true);
     const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
     const [editTitle, setEditTitle] = useState('');
     const chatEndRef = useRef<HTMLDivElement>(null);

     // Suggested Prompts
     const suggestedPrompts = [
          { icon: <Briefcase className="w-4 h-4" />, text: "Explique l'EBITDA de façon simple" },
          { icon: <TrendingUp className="w-4 h-4" />, text: "Comment évaluer le risque de liquidité ?" },
          { icon: <MessageSquare className="w-4 h-4" />, text: "Donne-moi les 5 ratios clés d'un audit" }
     ];

     const fetchSessions = async () => {
          setIsLoadingHistory(true);
          try {
               const response = await fetch(`${import.meta.env.VITE_API_URL}/chat/sessions/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
               });
               if (response.ok) {
                    const data = await response.json();
                    setSessions(data);
               }
          } catch (error) {
               console.error("Failed to fetch chat sessions:", error);
          } finally {
               setIsLoadingHistory(false);
          }
     };

     useEffect(() => {
          if (token) {
               fetchSessions();
          }
     }, [token]);

     useEffect(() => {
          // Si on change de session ou pas de session
          if (currentSessionId) {
               const session = sessions.find(s => s.id === currentSessionId);
               if (session) {
                    setMessages(session.messages);
               }
          } else if (messages.length === 0 && user?.first_name && !isTyping) {
               // Message d'accueil par défaut si nouvelle session vide
               setMessages([{
                    role: 'assistant',
                    content: `Bonjour **${user.first_name}** 👋 ! Je suis l'assistant autonome Kaïs.\n\nJe suis spécialisé en banque, finance et analyse de crédit. Comment puis-je vous accompagner aujourd'hui ?`
               }]);
          }
     }, [currentSessionId, sessions, user]);

     const scrollToBottom = () => {
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
     };

     useEffect(() => {
          scrollToBottom();
     }, [messages, isTyping]);

     const startNewChat = () => {
          setCurrentSessionId(null);
          setMessages([{
               role: 'assistant',
               content: `Bonjour **${user?.first_name || 'Utilisateur'}** 👋 ! Je suis l'assistant autonome Kaïs.\n\nJe suis spécialisé en banque, finance et analyse de crédit. Comment puis-je vous accompagner aujourd'hui ?`
          }]);
     };

     const deleteSession = async (e: React.MouseEvent, id: string) => {
          e.stopPropagation();
          try {
               const res = await fetch(`${import.meta.env.VITE_API_URL}/chat/sessions/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
               });
               if (res.ok) {
                    setSessions(prev => prev.filter(s => s.id !== id));
                    if (currentSessionId === id) {
                         startNewChat();
                    }
               }
          } catch (error) {
               console.error("Failed to delete session", error);
          }
     };

     const handleRenameSession = async (id: string, newTitle: string) => {
          if (!newTitle.trim()) {
               setEditingSessionId(null);
               return;
          }
          try {
               const res = await fetch(`${import.meta.env.VITE_API_URL}/chat/sessions/${id}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: newTitle })
               });
               if (res.ok) {
                    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
               }
          } catch (error) {
               console.error("Failed to rename session", error);
          } finally {
               setEditingSessionId(null);
          }
     };

     const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
          if (e) e.preventDefault();
          const textToSend = customText || inputMessage;
          if (!textToSend.trim()) return;

          if (!customText) setInputMessage('');

          // Add User Message
          const newMessages = [...messages, { role: 'user', content: textToSend } as ChatMessage];
          setMessages(newMessages);
          setIsTyping(true);

          try {
               const response = await fetch(`${import.meta.env.VITE_API_URL}/chat/finance/`, {
                    method: 'POST',
                    headers: {
                         'Content-Type': 'application/json',
                         'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                         message: textToSend,
                         userName: user?.first_name || 'Utilisateur',
                         session_id: currentSessionId
                    })
               });

               const data = await response.json();

               if (!response.ok) throw new Error(data.detail || "Erreur lors de l'envoi");

               setMessages([
                    ...newMessages,
                    { role: 'assistant', content: data.response }
               ]);

               // Si c'est une nouvelle session, l'ID aura été généré par le backend
               if (!currentSessionId && data.session_id) {
                    setCurrentSessionId(data.session_id);
               }
               // Rafraîchir de manière silencieuse l'historique
               fetchSessions();

          } catch (error: any) {
               setMessages([
                    ...newMessages,
                    {
                         role: 'assistant',
                         content: `❌ **Oups, un problème technique est survenu !**\n\nNotre équipe technique est déjà en train de faire le nécessaire pour rétablir la connexion.\n\nSi le problème persiste, n'hésitez pas à nous contacter via le [Centre d'Aide](/help).`
                    }
               ]);
          } finally {
               setIsTyping(false);
          }
     };

     // Basic Markdown Renderer
     const renderContent = (content: string) => {
          const boldFormatted = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          return <div dangerouslySetInnerHTML={{ __html: boldFormatted.replace(/\n/g, '<br/>') }} />;
     };

     return (

          <div className="max-w-7xl mx-auto h-[90vh] pb-6 pt-10 px-6 animate-fade-in text-left flex flex-col gap-6">

               {/* HEADER EXTERIEUR */}
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
                    <div>
                         <h1 className="text-3xl font-light text-slate-800 dark:text-slate-100 tracking-tight">
                              Assistant <span className="font-semibold text-slate-900 dark:text-white">IA</span>
                         </h1>
                         <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-2">
                              <Bot className="w-4 h-4 text-blue-500" />
                              Discutez, analysez et explorez des concepts financiers.
                         </p>
                    </div>
                    {/* Bouton mobile pour Nouvelle discussion */}
                    <div className="lg:hidden flex">
                         <button
                              onClick={startNewChat}
                              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-500 shadow-sm flex items-center gap-2"
                         >
                              <Plus className="w-5 h-5" />
                              Nouvelle discussion
                         </button>
                    </div>
               </div>

               <div className="w-full flex-1 flex bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden min-h-0">

                    {/* SIDEBAR HISTORY */}
                    <div className="w-1/4 min-w-[260px] hidden lg:flex flex-col border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-sm">
                         <div className="p-4">
                              <button
                                   onClick={startNewChat}
                                   className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all font-medium"
                              >
                                   <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                        <Plus className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                   </div>
                                   Nouvelle discussion
                              </button>
                         </div>

                         <div className="flex-1 overflow-y-auto p-3 pt-0 mt-2">
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">Historique</p>
                              {isLoadingHistory ? (
                                   <div className="flex justify-center p-4">
                                        <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
                                   </div>
                              ) : sessions.length === 0 ? (
                                   <p className="text-slate-400 text-center py-4 px-2 text-xs">Aucune discussion existante.</p>
                              ) : (
                                   <div className="space-y-1">
                                        {sessions.map(session => (
                                             <div
                                                  key={session.id}
                                                  onClick={() => {
                                                       if (editingSessionId !== session.id) setCurrentSessionId(session.id);
                                                  }}
                                                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${currentSessionId === session.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                                             >
                                                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                       <MessageSquare className="w-4 h-4 shrink-0 opacity-60" />
                                                       {editingSessionId === session.id ? (
                                                            <input
                                                                 type="text"
                                                                 value={editTitle}
                                                                 autoFocus
                                                                 onChange={(e) => setEditTitle(e.target.value)}
                                                                 onKeyDown={(e) => {
                                                                      if (e.key === 'Enter') handleRenameSession(session.id, editTitle);
                                                                      if (e.key === 'Escape') setEditingSessionId(null);
                                                                 }}
                                                                 onBlur={() => handleRenameSession(session.id, editTitle)}
                                                                 className="w-full bg-transparent border-none outline-none text-sm p-0 m-0"
                                                                 onClick={(e) => e.stopPropagation()}
                                                            />
                                                       ) : (
                                                            <span className="truncate max-w-[140px]">{session.title}</span>
                                                       )}
                                                  </div>
                                                  {!editingSessionId && (
                                                       <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                                            <button
                                                                 onClick={(e) => {
                                                                      e.stopPropagation();
                                                                      setEditingSessionId(session.id);
                                                                      setEditTitle(session.title);
                                                                 }}
                                                                 className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                                                                 title="Renommer la discussion"
                                                            >
                                                                 <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                 onClick={(e) => deleteSession(e, session.id)}
                                                                 className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                                                                 title="Supprimer la discussion"
                                                            >
                                                                 <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                       </div>
                                                  )}
                                             </div>
                                        ))}
                                   </div>
                              )}
                         </div>
                    </div>

                    {/* MAIN CHAT AREA */}
                    <div className="flex-1 flex flex-col h-full relative bg-slate-50/50 dark:bg-slate-900/50">
                         {/* MESSAGES AREA */}
                         <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
                              {messages.map((msg, idx) => (
                                   <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                                        {msg.role === 'assistant' && (
                                             <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mr-4 shadow-sm border border-blue-200 dark:border-blue-800/50">
                                                  <Bot className="w-5 h-5" />
                                             </div>
                                        )}

                                        <div className={`max-w-[85%] md:max-w-[75%] p-5 rounded-3xl text-sm leading-relaxed ${msg.role === 'user'
                                             ? 'bg-blue-600 text-white rounded-tr-sm shadow-md'
                                             : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-sm shadow-sm'
                                             }`}>
                                             {renderContent(msg.content)}
                                        </div>

                                        {msg.role === 'user' && (
                                             <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0 ml-4 shadow-sm">
                                                  <User className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                             </div>
                                        )}
                                   </div>
                              ))}

                              {isTyping && (
                                   <div className="flex justify-start animate-in slide-in-from-bottom-2">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mr-4 shadow-sm border border-blue-200 dark:border-blue-800/50">
                                             <Sparkles className="w-5 h-5 animate-pulse" />
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl rounded-tl-sm shadow-sm p-5 flex items-center gap-2">
                                             <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                             <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                             <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                                        </div>
                                   </div>
                              )}
                              <div ref={chatEndRef} />
                         </div>

                         {/* INPUT AREA */}
                         <div className="p-4 md:p-6 border-t border-slate-100 dark:border-slate-800 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">

                              {/* SUGGESTIONS */}
                              {messages.length <= 1 && !isTyping && !currentSessionId && (
                                   <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
                                        {suggestedPrompts.map((prompt, i) => (
                                             <button
                                                  key={i}
                                                  onClick={() => handleSendMessage(undefined, prompt.text)}
                                                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 transition-all shadow-sm"
                                             >
                                                  {prompt.icon} <span className="hidden sm:inline">{prompt.text}</span>
                                             </button>
                                        ))}
                                   </div>
                              )}

                              <form onSubmit={handleSendMessage} className="flex gap-3 relative max-w-4xl mx-auto">
                                   <input
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        disabled={isTyping}
                                        placeholder="Message Kaïs IA..."
                                        className="flex-1 w-full pl-6 pr-16 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[24px] text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
                                   />
                                   <button
                                        type="submit"
                                        disabled={isTyping || !inputMessage.trim()}
                                        className="absolute right-2 top-2 bottom-2 aspect-square bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-[20px] flex items-center justify-center transition-all disabled:cursor-not-allowed"
                                   >
                                        <Send className="w-5 h-5" />
                                   </button>
                              </form>
                              <div className="text-center mt-3 text-[11px] text-slate-400">
                                   L'IA peut parfois fournir des informations imprécises. Veuillez vérifier les détails importants.
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     );
}
