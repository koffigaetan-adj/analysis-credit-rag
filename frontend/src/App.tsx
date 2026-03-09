import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import List from './pages/List';
import NewAnalysis from './pages/NewAnalysis';
import AnalysisDetail from './pages/AnalysisDetail';
import AnalysisResult from './pages/AnalysisResult';
import Team from './pages/Team';
import Settings from './pages/Settings';
import HelpCenter from './pages/HelpCenter';
import Chat from './pages/Chat';
import Prediction from './pages/Prediction';
import Privacy from './pages/Privacy';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import SessionTimeout from './components/SessionTimeout';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SessionTimeout />
        <Routes>
          {/* Route SANS barre latérale */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* Routes AVEC barre latérale (via Layout) & PROTEGEES */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/list" element={<List />} />
              <Route path="/history" element={<List />} />
              <Route path="/prediction" element={<Prediction />} />
              <Route path="/new" element={<NewAnalysis />} />
              <Route path="/analysis/result" element={<AnalysisResult />} />
              <Route path="/analysis/:id" element={<AnalysisDetail />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/team" element={<Team />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/privacy" element={<Privacy />} />
            </Route>
          </Route>

          {/* Securité : redirection si route inconnue */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;