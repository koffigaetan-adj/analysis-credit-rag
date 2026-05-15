import { X, Bell, Calendar, Info } from 'lucide-react';

interface NotificationModalProps {
  notification: {
    id: number;
    title: string;
    message: string;
    created_at: string;
    type: string;
  } | null;
  onClose: () => void;
}

export default function NotificationModal({ notification, onClose }: NotificationModalProps) {
  if (!notification) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Decor */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-blue-600/10 to-transparent dark:from-blue-500/5 pointer-events-none"></div>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 pt-10">
          <div className="flex items-start gap-5 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Bell className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="pt-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight mb-2">
                {notification.title}
              </h2>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(notification.created_at)}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50">
              <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed whitespace-pre-wrap">
                {notification.message}
              </p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-blue-50/50 dark:bg-blue-500/5 rounded-xl border border-blue-100/50 dark:border-blue-500/10">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-400/80 leading-snug">
                Ceci est une notification officielle de l'équipe Kaïs Analytics. Pour toute question, veuillez contacter le support.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <button
              onClick={onClose}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg dark:shadow-white/5"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
