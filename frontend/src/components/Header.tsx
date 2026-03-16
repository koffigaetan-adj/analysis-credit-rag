import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

import { Bell, ChevronDown, Menu, Trash2 } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.is_read).length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [token]);

  const markAsRead = async (id: number, type: string) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/auth/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotifications();
      // On ne ferme plus forcément le menu ici pour permettre d'autres actions
      if (type === 'ACCOUNT_REQUEST') {
        setShowNotifMenu(false);
        navigate('/team', { state: { activeTab: 'requests' } });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteNotification = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Évite de déclencher le markAsRead
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
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
        fetchNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helper pour les initiales
  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName) return 'U';
    return ((firstName[0] || '') + (lastName?.[0] || '')).toUpperCase();
  };

  return (
    <header className="print:hidden sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 px-8 py-3 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* ESPACE GAUCHE */}
        <div className="flex items-center gap-2">
          {/* Menu Hamburger pour Mobile */}
          <button
            onClick={onMenuClick}
            className="p-2 lg:hidden text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* ACTIONS DROITE */}
        <div className="flex items-center gap-6">

          {/* NOTIFICATIONS */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setShowNotifMenu(!showNotifMenu); setShowUserMenu(false); }}
              className="relative p-2.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-2xl transition-all duration-300 group"
            >
              <Bell className="w-5 h-5 transition-transform group-hover:rotate-12" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
              )}
            </button>

            {/* DROPDOWN NOTIFICATIONS */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto bg-white dark:bg-slate-900 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notifications</p>
                    {unreadCount > 0 && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">{unreadCount}</span>}
                  </div>
                  {notifications.length > 0 && (
                    <button 
                      onClick={clearAllNotifications}
                      className="text-[10px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-widest transition-colors"
                    >
                      Tout effacer
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-500">Aucune notification</div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => markAsRead(notif.id, notif.type)}
                        className={`group/item relative text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-50 border-last-transparent dark:border-slate-800/50 cursor-pointer ${notif.is_read ? 'opacity-60' : 'bg-blue-50/30'}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <p className={`text-sm ${notif.is_read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100 font-bold'}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{notif.message}</p>
                          </div>
                          <button
                            onClick={(e) => deleteNotification(e, notif.id)}
                            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all opacity-0 group-hover/item:opacity-100"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PROFIL UTILISATEUR */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifMenu(false); }}
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

            {/* DROPDOWN MENU */}
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
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="w-full text-left flex items-center px-4 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                >
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}