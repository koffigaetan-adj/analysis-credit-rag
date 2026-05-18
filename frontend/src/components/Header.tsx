import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

import { Bell, ChevronDown, Menu, Trash2, X, Calendar, ChevronDown as ChevronExpand, CheckCheck } from 'lucide-react';
import NotificationModal from './NotificationModal';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [expandedNotif, setExpandedNotif] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);

  const lastNotifIds = useRef<Set<number>>(new Set());
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();

        if (!isFirstLoad.current) {
          const newNotifs = data.filter((n: any) => !lastNotifIds.current.has(n.id) && !n.is_read);
          if (newNotifs.length > 0) triggerNotificationAlert(newNotifs[0]);
        }

        const ids = new Set<number>(data.map((n: any) => n.id));
        lastNotifIds.current = ids;
        isFirstLoad.current = false;

        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.is_read).length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const triggerNotificationAlert = (notif: any) => {
    const audio = new Audio('https://res.cloudinary.com/dsu768xsy/video/upload/v1715781442/ping-82822_c9t6xp.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => { });
    if ("Notification" in window && Notification.permission === "granted") {
      const plainText = notif.message.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
      new Notification(notif.title, { body: plainText, icon: '/logo_kais.svg' });
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, [token]);

  const handleNotifExpand = async (notif: any) => {
    const newExpanded = expandedNotif === notif.id ? null : notif.id;
    setExpandedNotif(newExpanded);

    if (!notif.is_read && newExpanded !== null) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/auth/notifications/${notif.id}/read`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchNotifications();
        if (notif.type === 'ACCOUNT_REQUEST') {
          setShowNotifDrawer(false);
          navigate('/team', { state: { activeTab: 'requests' } });
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const deleteNotification = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        if (expandedNotif === id) setExpandedNotif(null);
        fetchNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/notifications`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setExpandedNotif(null);
        fetchNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n =>
      fetch(`${import.meta.env.VITE_API_URL}/auth/notifications/${n.id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ));
    fetchNotifications();
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName) return 'U';
    return ((firstName[0] || '') + (lastName?.[0] || '')).toUpperCase();
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString('fr-FR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });

  const renderMessage = (text: string) => {
    if (!text) return { __html: '' };
    const html = text
      .replace(/\*\*(.*?)\*\*/gs, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gs, '<em>$1</em>')
      .replace(/\[(.*?)\]\((.*?)\)/gs, '<a href="$2" target="_blank" class="text-blue-500 hover:underline font-medium">$1</a>')
      .replace(/\n/g, '<br/>');
    return { __html: html };
  };

  const typeColor: Record<string, string> = {
    ACCOUNT_REQUEST: 'bg-amber-400',
    WELCOME: 'bg-emerald-400',
    INFO: 'bg-blue-400',
  };

  return (
    <>
      <header className="print:hidden sticky top-0 z-40 w-full  dark:bg-slate-900/60 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 px-8 py-3 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* LEFT */}
          <div className="flex items-center gap-2">
            <button
              onClick={onMenuClick}
              className="p-2 lg:hidden text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* RIGHT: Profile + Bell */}
          <div className="flex items-center gap-3">

            {/* PROFIL UTILISATEUR */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => { setShowUserMenu(!showUserMenu); }}
                className="flex items-center gap-3 p-1.5 pl-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-[20px] border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all duration-300"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight transition-colors">
                    {user ? `${user.first_name} ${user.last_name}` : 'Utilisateur'}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter transition-colors">
                    {user?.role === 'SUPER_ADMIN' ? 'Super Administrateur' : user?.role === 'ADMIN' ? 'Administrateur' : 'Analyste'}
                  </p>
                </div>

                <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden transition-all">
                  {user?.avatar_url ? (
                    <img src={`${user.avatar_url}`} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-600 dark:text-slate-300 font-bold text-xs uppercase">
                      {getInitials(user?.first_name, user?.last_name)}
                    </span>
                  )}
                </div>

                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-2 mb-2 border-b border-slate-50 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compte</p>
                  </div>
                  <Link to="/settings" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition-colors">
                    Paramètres du compte
                  </Link>
                  <div className="my-2 border-t border-slate-50 dark:border-slate-800"></div>
                  <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="w-full text-left flex items-center px-4 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                  >
                    Déconnexion
                  </button>
                </div>
              )}
            </div>

            {/* CLOCHE NOTIFICATIONS */}
            <button
              onClick={() => setShowNotifDrawer(true)}
              className="relative p-2.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-2xl transition-all duration-300 group"
            >
              <Bell className="w-5 h-5 transition-transform group-hover:rotate-12" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-rose-500 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center text-[9px] font-black text-white leading-none px-0.5">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── NOTIFICATION DRAWER OVERLAY ── */}
      {showNotifDrawer && (
        <div
          className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px]"
          onClick={() => setShowNotifDrawer(false)}
        />
      )}

      {/* ── NOTIFICATION DRAWER PANEL ── */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] z-[70] bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-[−20px_0_60px_rgba(0,0,0,0.12)] flex flex-col transition-transform duration-300 ease-out ${showNotifDrawer ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center">
              <Bell className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 w-[18px] h-[18px]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Notifications</h2>
              {unreadCount > 0 && (
                <p className="text-[10px] text-slate-400">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 text-[10px] font-bold text-blue-500 hover:text-blue-600 uppercase tracking-widest transition-colors px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10"
                title="Tout marquer comme lu"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tout lire</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-widest transition-colors px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Effacer</span>
              </button>
            )}
            <button
              onClick={() => setShowNotifDrawer(false)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto py-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Aucune notification</p>
                <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Vous êtes à jour !</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1 px-3">
              {notifications.map(notif => {
                const isExpanded = expandedNotif === notif.id;
                const dotColor = typeColor[notif.type] || 'bg-slate-400';
                return (
                  <div
                    key={notif.id}
                    className={`group rounded-2xl border transition-all duration-200 overflow-hidden ${isExpanded
                      ? 'border-blue-200 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/5'
                      : notif.is_read
                        ? 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        : 'border-transparent bg-blue-50/40 dark:bg-blue-500/5 hover:bg-blue-50/70 dark:hover:bg-blue-500/10'
                      }`}
                  >
                    {/* Notification Header Row */}
                    <button
                      onClick={() => handleNotifExpand(notif)}
                      className="w-full text-left px-4 py-3.5 flex items-start gap-3"
                    >
                      {/* Status dot */}
                      <div className="flex-shrink-0 pt-1">
                        <div className={`w-2 h-2 rounded-full ${notif.is_read ? 'bg-slate-300 dark:bg-slate-600' : dotColor}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm leading-snug truncate ${notif.is_read ? 'text-slate-500 dark:text-slate-400 font-medium' : 'text-slate-900 dark:text-slate-100 font-bold'}`}>
                            {notif.title}
                          </p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <ChevronExpand
                              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </div>
                        </div>
                        {!isExpanded && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">
                            {notif.message.replace(/<[^>]*>/g, '').replace(/\*\*/g, '')}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Calendar className="w-2.5 h-2.5 text-slate-300 dark:text-slate-600" />
                          <span className="text-[10px] text-slate-400 dark:text-slate-600">{formatDate(notif.created_at)}</span>
                        </div>
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                        <div className="ml-5 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                          <div
                            className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed"
                            dangerouslySetInnerHTML={renderMessage(notif.message)}
                          />
                        </div>
                        <div className="ml-5 mt-2 flex justify-end">
                          <button
                            onClick={(e) => deleteNotification(e, notif.id)}
                            className="flex items-center gap-1.5 text-[10px] font-bold text-rose-400 hover:text-rose-600 uppercase tracking-widest transition-colors px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-3 h-3" />
                            Supprimer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <NotificationModal
        notification={selectedNotif}
        onClose={() => setSelectedNotif(null)}
      />
    </>
  );
}