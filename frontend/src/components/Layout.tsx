import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  // L'état est maintenant ici !
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* On passe l'état à la Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* LA ZONE DE CONTENU :
        - transition-all duration-300 : pour que le décalage soit fluide
        - ml-64 ou ml-20 : pour coller à la largeur de la sidebar
      */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <Header />
        
        <main className="p-8 flex-1">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
}