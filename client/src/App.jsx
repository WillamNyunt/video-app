import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getSettings } from './api/settings';
import ProtectedRoute from './components/ProtectedRoute';
import Nav from './components/Nav';

import LoginPage from './pages/LoginPage';
import LocationsPage from './pages/LocationsPage';
import LocationDetailPage from './pages/LocationDetailPage';
import SessionDetailPage from './pages/SessionDetailPage';
import UploadPage from './pages/UploadPage';
import PeoplePage from './pages/PeoplePage';
import PersonDetailPage from './pages/PersonDetailPage';
import SearchPage from './pages/SearchPage';
import SettingsPage from './pages/SettingsPage';

import './styles/global.css';

function AppShell() {
  const { user } = useAuth();
  const [theme, setTheme] = useState('light');

  // Fetch and apply theme on app init (only once user is known)
  useEffect(() => {
    if (!user) return;
    getSettings()
      .then((settings) => {
        const themeSetting = Array.isArray(settings)
          ? settings.find((s) => s.key === 'theme')
          : settings;
        const value = themeSetting?.value || 'light';
        setTheme(value);
        document.documentElement.setAttribute('data-theme', value);
      })
      .catch(() => {
        // Default to light if settings unavailable
      });
  }, [user]);

  // Show loading state while auth is initialising
  if (user === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="page-layout">
              <Nav theme={theme} onThemeChange={setTheme} />
              <main className="page-content">
                <Routes>
                  <Route index element={<LocationsPage />} />
                  <Route path="locations/:id" element={<LocationDetailPage />} />
                  <Route path="sessions/:id" element={<SessionDetailPage />} />
                  <Route path="sessions/:id/upload" element={<UploadPage />} />
                  <Route path="people" element={<PeoplePage />} />
                  <Route path="people/:id" element={<PersonDetailPage />} />
                  <Route path="search" element={<SearchPage />} />
                  <Route path="admin/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
