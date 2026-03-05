import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../context/AuthContext';
import { Outlet } from 'react-router-dom';
import UpdatePasswordModal from './UpdatePasswordModal';

export default function Layout() {
  const { isFirstLogin } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-500 relative">

      {/* --- FOND GÉNÉRAL DYNAMIQUE --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">

        {/* 1. La Grille (Pattern) */}
        <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.2] [background-image:linear-gradient(#cbd5e1_1px,transparent_1px),linear-gradient(90deg,#cbd5e1_1px,transparent_1px)] dark:[background-image:linear-gradient(#1e293b_1px,transparent_1px),linear-gradient(90deg,#1e293b_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

        {/* 2. Le Halo Central (Lueur IA) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 dark:bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow" />

        {/* 3. Ligne de balayage (Scanning line - très subtil) */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-scan" />
      </div>

      {/* --- STRUCTURE --- */}
      <div className="print:hidden">
        <Sidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isOpenMobile={isMobileMenuOpen}
          setIsOpenMobile={setIsMobileMenuOpen}
        />
      </div>

      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 z-10 print:ml-0 print:bg-white w-full ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <div className="print:hidden">
          <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
        </div>
        <main className="p-4 md:p-8 print:p-0 flex-1 relative">
          <div className="relative z-20 print:w-full print:max-w-none print:m-0 print:p-0">
            {!isFirstLogin ? <Outlet /> : <div className="flex items-center justify-center min-h-[50vh] text-slate-400 font-medium">Veuillez mettre à jour votre mot de passe pour continuer...</div>}
          </div>
        </main>
      </div>

      {/* MODALE DE PREMIERE CONNEXION */}
      <UpdatePasswordModal />
    </div>
  );
}