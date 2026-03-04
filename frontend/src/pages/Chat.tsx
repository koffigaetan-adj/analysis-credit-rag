import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, MessageSquare, Briefcase, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ChatMessage {
     role: 'user' | 'assistant';
     content: string;
}

export default function Chat() {
     const { user, token } = useAuth();
     const [messages, setMessages] = useState<ChatMessage[]>([]);
     const [inputMessage, setInputMessage] = useState('');
     const [isTyping, setIsTyping] = useState(false);
     const chatEndRef = useRef<HTMLDivElement>(null);

     // Suggested Prompts
     const suggestedPrompts = [
          { icon: <Briefcase className="w-4 h-4" />, text: "Explique l'EBITDA de façon simple" },
          { icon: <TrendingUp className="w-4 h-4" />, text: "Comment évaluer le risque de liquidité ?" },
          { icon: <MessageSquare className="w-4 h-4" />, text: "Donne-moi les 5 ratios clés d'un audit" }
     ];

     useEffect(() => {
          // Initial Greeting Message
          if (messages.length === 0 && user?.first_name) {
               const firstName = user.first_name;
               setMessages([
                    {
                         role: 'assistant',
                         content: `Bonjour **${firstName}** 👋 ! Je suis l'assistant autonome Kaïs.\n\nJe suis spécialisé en banque, finance et analyse de crédit. Comment puis-je vous accompagner aujourd'hui ?`
                    }
               ]);
          }
     }, [user, messages.length]);

     const scrollToBottom = () => {
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
     };

     useEffect(() => {
          scrollToBottom();
     }, [messages, isTyping]);

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
                         userName: user?.first_name || 'Utilisateur'
                    })
               });

               const data = await response.json();

               if (!response.ok) throw new Error(data.detail || "Erreur lors de l'envoi");

               setMessages([
                    ...newMessages,
                    { role: 'assistant', content: data.response }
               ]);
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
          <div className="max-w-5xl mx-auto h-[85vh] flex flex-col pt-10 px-6 animate-fade-in text-left">
               {/* HEADER */}
               <div className="mb-6 flex items-center justify-between">
                    <div>
                         <h1 className="text-3xl font-light text-slate-800 dark:text-slate-100 tracking-tight">
                              Assistant <span className="font-semibold text-slate-900 dark:text-white">Financier</span>
                         </h1>
                         <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Discutez, analysez et explorez des concepts financiers avec l'IA.</p>
                    </div>
               </div>

               {/* CHAT CONTAINER */}
               <div className="flex-1 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden transition-colors relative">

                    {/* MESSAGES AREA */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">
                         {messages.map((msg, idx) => (
                              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                                   {msg.role === 'assistant' && (
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mr-4 shadow-sm border border-blue-200 dark:border-blue-800/50">
                                             <Bot className="w-5 h-5" />
                                        </div>
                                   )}

                                   <div className={`max-w-[85%] md:max-w-[75%] p-5 rounded-3xl text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-sm shadow-md'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-sm shadow-sm'
                                        }`}>
                                        {renderContent(msg.content)}
                                   </div>

                                   {msg.role === 'user' && (
                                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 ml-4 shadow-sm">
                                             <User className="w-5 h-5 text-slate-500" />
                                        </div>
                                   )}
                              </div>
                         ))}

                         {isTyping && (
                              <div className="flex justify-start animate-in slide-in-from-bottom-2">
                                   <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mr-4 shadow-sm border border-blue-200 dark:border-blue-800/50">
                                        <Sparkles className="w-5 h-5 animate-pulse" />
                                   </div>
                                   <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl rounded-tl-sm shadow-sm p-5 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                                   </div>
                              </div>
                         )}
                         <div ref={chatEndRef} />
                    </div>

                    {/* INPUT AREA */}
                    <div className="p-4 md:p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">

                         {/* SUGGESTIONS (Only show if recent message isn't processing) */}
                         {messages.length < 5 && !isTyping && (
                              <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
                                   {suggestedPrompts.map((prompt, i) => (
                                        <button
                                             key={i}
                                             onClick={() => handleSendMessage(undefined, prompt.text)}
                                             className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors"
                                        >
                                             {prompt.icon} {prompt.text}
                                        </button>
                                   ))}
                              </div>
                         )}

                         <form onSubmit={handleSendMessage} className="flex gap-3 relative">
                              <input
                                   type="text"
                                   value={inputMessage}
                                   onChange={(e) => setInputMessage(e.target.value)}
                                   disabled={isTyping}
                                   placeholder="Posez votre question financière ici..."
                                   className="flex-1 w-full pl-6 pr-16 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[24px] text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              <button
                                   type="submit"
                                   disabled={isTyping || !inputMessage.trim()}
                                   className="absolute right-2 top-2 bottom-2 aspect-square bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-xl flex items-center justify-center transition-all disabled:cursor-not-allowed"
                              >
                                   <Send className="w-5 h-5" />
                              </button>
                         </form>
                         <div className="text-center mt-3 text-[10px] text-slate-400">
                              L'IA de Kaïs est spécialisée en finance et peut parfois commettre des erreurs. Vérifiez les informations complexes.
                         </div>
                    </div>
               </div>
          </div>
     );
}
