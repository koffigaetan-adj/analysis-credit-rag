import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
     id: string;
     full_name: string;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
     const [user, setUser] = useState<User | null>(null);
     const [token, setToken] = useState<string | null>(null);
     const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);

     useEffect(() => {
          // Restaurer la session à partir du localStorage
          const storedToken = localStorage.getItem('token');
          const storedUser = localStorage.getItem('user');
          const storedFirstLogin = localStorage.getItem('isFirstLogin');

          if (storedToken && storedUser) {
               setToken(storedToken);
               setUser(JSON.parse(storedUser));
               setIsFirstLogin(storedFirstLogin === 'true');
          }
     }, []);

     const login = (newToken: string, newUser: User, firstLogin: boolean) => {
          setToken(newToken);
          setUser(newUser);
          setIsFirstLogin(firstLogin);

          localStorage.setItem('token', newToken);
          localStorage.setItem('user', JSON.stringify(newUser));
          localStorage.setItem('isFirstLogin', firstLogin.toString());
     };

     const logout = () => {
          setToken(null);
          setUser(null);
          setIsFirstLogin(false);

          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('isFirstLogin');
     };

     return (
          <AuthContext.Provider value={{
               user,
               token,
               login,
               logout,
               isAuthenticated: !!token,
               isFirstLogin
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
