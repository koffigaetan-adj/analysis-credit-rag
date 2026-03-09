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
     login: (token: string, user: User, is_first_login: boolean) => void;
     logout: () => void;
     isAuthenticated: boolean;
     isFirstLogin: boolean;
     isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_LIMIT_MS = 30 * 60 * 1000; // 30 minutes

export const AuthProvider = ({ children }: { children: ReactNode }) => {
     const [user, setUser] = useState<User | null>(null);
     const [token, setToken] = useState<string | null>(null);
     const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);
     const [isLoading, setIsLoading] = useState<boolean>(true);

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
                    // Update last activity on restore
                    localStorage.setItem('lastActivity', now.toString());
               } else {
                    // Session expired
                    logout();
               }
          }
          setIsLoading(false);
     }, []);

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

          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('isFirstLogin');
          localStorage.removeItem('lastActivity');
     };

     return (
          <AuthContext.Provider value={{
               user,
               token,
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
