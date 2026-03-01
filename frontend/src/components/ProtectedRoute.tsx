import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
     const { isAuthenticated, isFirstLogin } = useAuth();

     // Si l'utilisateur n'est pas connecté, le renvoyer vers le login
     if (!isAuthenticated) {
          return <Navigate to="/login" replace />;
     }

     // Si c'est sa première connexion, il doit d'abord changer son mot de passe
     if (isFirstLogin) {
          return <Navigate to="/update-password" replace />;
     }

     // Si tout est OK, afficher la route enfant (Le layout avec la Sidebar)
     return <Outlet />;
}
