/**
 * ============================================
 * APP.JS - COMPOSANT RACINE DE L'APPLICATION
 * ============================================
 */

// ============================================
// IMPORTATIONS DES DÉPENDANCES
// ============================================

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Material-UI
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Snackbar, Alert } from '@mui/material';

// Hook personnalisé pour la gestion de l'inactivité
import useIdleTimer from './hooks/useIdleTimer';
import { APP_CONFIG } from './config/config';

// ============================================
// IMPORTATION DES PAGES
// ============================================
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UsersManagement from './pages/UsersManagement';
import Depot from './pages/Depot';
import Historique from './pages/Historique';
import Annuler from './pages/Annuler';
import Profile from './pages/Profile';

// ============================================
// IMPORTATION DU LAYOUT
// ============================================
import MainLayout from './components/layout/Layout';

// ============================================
// COMPOSANT PRINCIPAL APP
// ============================================

function App() {
  
  // ============================================
  // ÉTAT D'AUTHENTIFICATION
  // ============================================
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('token');
  });

  // ============================================
  // ÉTAT DU THÈME (DARK/LIGHT)
  // ============================================
  
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light';
  });

  // ============================================
  // ÉTAT POUR LA NOTIFICATION DE DÉCONNEXION
  // ============================================
  
  const [showIdleAlert, setShowIdleAlert] = useState(false);

  // Fonction pour fermer manuellement le message
  const handleCloseIdleAlert = (event, reason) => {
    // Permettre la fermeture manuelle (clic sur la croix)
    // mais pas la fermeture automatique par clickaway
    if (reason === 'clickaway') {
      return;
    }
    setShowIdleAlert(false);
  };

  // ============================================
  // GESTION DE L'AUTHENTIFICATION
  // ============================================

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  // ============================================
  // GESTION DE LA DÉCONNEXION PAR INACTIVITÉ
  // ============================================

  const handleIdleLogout = () => {
    // Afficher le message seulement si l'option est activée
    if (APP_CONFIG.SHOW_IDLE_MESSAGE) {
      setShowIdleAlert(true);
      // Attendre 2 secondes pour afficher le message avant de déconnecter
      setTimeout(() => {
        handleLogout();
      }, 2000);
    } else {
      // Déconnexion immédiate sans message
      handleLogout();
    }
  };

  // Activer le timer d'inactivité uniquement si l'utilisateur est connecté
  useIdleTimer(
    handleIdleLogout,
    APP_CONFIG.IDLE_TIMEOUT,
    isAuthenticated
  );

  // ============================================
  // GESTION DU THÈME
  // ============================================

  const toggleTheme = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return newMode;
    });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  // ============================================
  // CONFIGURATION DU THÈME DYNAMIQUE
  // ============================================
  
  const theme = createTheme({
    palette: {
      mode: mode,
      primary: {
        main: '#5b1cadff',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#f5f5f5',
        paper: mode === 'dark' ? '#1e1e1e' : '#fff',
      },
      grey: {
        100: mode === 'dark' ? '#2c2c2c' : '#f5f5f5',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
  });

  // ============================================
  // COMPOSANT DE PROTECTION DES ROUTES
  // ============================================
  
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return (
      <MainLayout 
        onLogout={handleLogout} 
        toggleTheme={toggleTheme} 
        mode={mode}
      >
        {children}
      </MainLayout>
    );
  };

  // ============================================
  // RENDU DU COMPOSANT
  // ============================================
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* Notification de déconnexion par inactivité */}
      <Snackbar 
        open={showIdleAlert} 
        autoHideDuration={10000}
        onClose={handleCloseIdleAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="warning" 
          sx={{ width: '100%' }}
          onClose={handleCloseIdleAlert}
        >
          Déconnexion automatique pour cause d'inactivité
        </Alert>
      </Snackbar>

      <Router>
        <Routes>
          
          <Route 
            path="/login" 
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            } 
          />

          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/users" 
            element={
              <ProtectedRoute>
                <UsersManagement />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/depot" 
            element={
              <ProtectedRoute>
                <Depot />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/historique" 
            element={
              <ProtectedRoute>
                <Historique />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/annuler" 
            element={
              <ProtectedRoute>
                <Annuler />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />

          <Route 
            path="*" 
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;