import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AgentPortalPage from '../pages/AgentPortalPage';
import PortalNavigation from '../components/PortalNavigation';
import ErrorBoundary from '../components/ErrorBoundary';
import { SettingsProvider } from '../contexts/SettingsContext';
import { AuthProvider } from '../contexts/AuthContext';
import RoomingListPage from '../pages/RoomingListPage';
import ClientsPage from '../pages/ClientsPage';

// ... other imports

const AppRouter: React.FC = () => {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <AuthProvider>
          <Router>
            <div className="relative">
              <PortalNavigation />
              <Routes>
                <Route path="/" element={<Navigate to="/portal" replace />} />
                <Route path="/portal" element={<AgentPortalPage />} />
                <Route path="/portal/rooming" element={<RoomingListPage />} />
                <Route path="/portal/clients" element={<ClientsPage />} />

                {/* Catch-all redirect to portal */}
                <Route path="*" element={<Navigate to="/portal" replace />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
};

export default AppRouter;
