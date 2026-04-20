import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
     poste: string;
     id: string;
     first_name: string;
     last_name: string;
     sexe: string;
     establishment?: string;
     email: string;
     role: string;
     avatar_url?: string;
}

interface AuthContextType {
     user: User | null;
     token: string | null;
     primaryColor: string;
     login: (token: string, user: User, is_first_login: boolean) => void;
     logout: () => void;
     isAuthenticated: boolean;
     isFirstLogin: boolean;
     isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_LIMIT_MS = 30 * 60 * 1000; // 30 minutes
const DEFAULT_COLOR = '#E73919';

// Applique la couleur dans le DOM
function applyThemeColor(color: string) {
     document.documentElement.style.setProperty('--kais-primary', color);
     // Derivées: version claire et foncée
     document.documentElement.style.setProperty('--kais-primary-light', `${color}22`);
     document.documentElement.style.setProperty('--kais-primary-border', `${color}44`);
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
     const [user, setUser] = useState<User | null>(null);
     const [token, setToken] = useState<string | null>(null);
     const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);
     const [isLoading, setIsLoading] = useState<boolean>(true);
     const [primaryColor, setPrimaryColor] = useState<string>(DEFAULT_COLOR);

     // Charge la couleur sauvegardée au démarrage
     useEffect(() => {
          const storedColor = localStorage.getItem('establishment_color');
          if (storedColor) {
               setPrimaryColor(storedColor);
               applyThemeColor(storedColor);
          } else {
               applyThemeColor(DEFAULT_COLOR);
          }
     }, []);

     useEffect(() => {
          // Restaurer la session à partir du localStorage
          const storedToken = localStorage.getItem('token');
          const storedUser = localStorage.getItem('user');
          const storedFirstLogin = localStorage.getItem('isFirstLogin');
          const lastActivity = localStorage.getItem('lastActivity');

          if (storedToken && storedUser && lastActivity) {
               const now = Date.now();
               const inactiveTime = now - parseInt(lastActivity, 10);

               if (inactiveTime < SESSION_LIMIT_MS) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                    setIsFirstLogin(storedFirstLogin === 'true');
                    localStorage.setItem('lastActivity', now.toString());
               } else {
                    logout();
               }
          }
          setIsLoading(false);
     }, []);

     // Charger + re-charger la couleur à chaque reprise de focus (capte les changements admin)
     useEffect(() => {
          if (!user?.establishment || !token) return;

          const API = import.meta.env.VITE_API_URL;

          const fetchColor = () => {
               fetch(`${API}/auth/establishments`, {
                    headers: { Authorization: `Bearer ${token}` }
               })
               .then(res => res.ok ? res.json() : [])
               .then((ests: any[]) => {
                    const est = ests.find((e: any) => e.name === user.establishment);
                    if (est?.primary_color) {
                         const color = est.primary_color;
                         setPrimaryColor(color);
                         applyThemeColor(color);
                         localStorage.setItem('establishment_color', color);
                    }
               })
               .catch(() => {});
          };

          // Fetch immédiat
          fetchColor();

          // Re-fetch quand l'utilisateur revient sur l'onglet
          window.addEventListener('focus', fetchColor);
          document.addEventListener('visibilitychange', fetchColor);

          return () => {
               window.removeEventListener('focus', fetchColor);
               document.removeEventListener('visibilitychange', fetchColor);
          };
     }, [user?.establishment, token]);

     const login = (newToken: string, newUser: User, firstLogin: boolean) => {
          const now = Date.now().toString();
          setToken(newToken);
          setUser(newUser);
          setIsFirstLogin(firstLogin);

          localStorage.setItem('token', newToken);
          localStorage.setItem('user', JSON.stringify(newUser));
          localStorage.setItem('isFirstLogin', firstLogin.toString());
          localStorage.setItem('lastActivity', now);
     };

     const logout = () => {
          setToken(null);
          setUser(null);
          setIsFirstLogin(false);
          setPrimaryColor(DEFAULT_COLOR);
          applyThemeColor(DEFAULT_COLOR);

          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('isFirstLogin');
          localStorage.removeItem('lastActivity');
          localStorage.removeItem('establishment_color');
     };

     return (
          <AuthContext.Provider value={{
               user,
               token,
               primaryColor,
               login,
               logout,
               isAuthenticated: !!token,
               isFirstLogin,
               isLoading
          }}>
               {children}
          </AuthContext.Provider>
     );
};

export const useAuth = () => {
     const context = useContext(AuthContext);
     if (context === undefined) {
          throw new Error('useAuth doit être utilisé dans un AuthProvider');
     }
     return context;
};
