import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
     const { isAuthenticated } = useAuth();

     // Si l'utilisateur n'est pas connecté, le renvoyer vers le login
     if (!isAuthenticated) {
          return <Navigate to="/login" replace />;
     }

     // On n'empêche plus l'accès complet, la modale d'UpdatePasswordModal 
     // qui sera placée dans Layout va s'occuper de bloquer l'interface.
     // On laisse passer l'Outlet pour que la structure se charge en dessous.

     // Si tout est OK, afficher la route enfant (Le layout avec la Sidebar)
     return <Outlet />;
}
