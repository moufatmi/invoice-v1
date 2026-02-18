import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import AgentPortal from '../components/AgentPortal';
import AuthForm from '../components/AuthForm';
import LoadingSpinner from '../components/LoadingSpinner';
import NetworkStatus from '../components/NetworkStatus';
import AuthErrorFallback from '../components/AuthErrorFallback';
import { useAuth } from '../contexts/AuthContext';
import { useDevelopmentMode } from '../hooks/useDevelopmentMode';

const AgentPortalPage: React.FC = () => {
  const { isAuthenticated, loading, error, agentProfile, forceInitComplete, retryAuth } = useAuth();
  const { enableBypass } = useDevelopmentMode();

  // Set page title
  useEffect(() => {
    document.title = 'Agent Portal - Invoice Management System';
  }, []);

  // Show error fallback if there's an authentication error
  if (error && !loading) {
    return (
      <AuthErrorFallback
        onRetry={retryAuth}
        onSkip={() => forceInitComplete()}
      />
    );
  }

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Loading your account..." />
          <div className="mt-6 space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
            
            {/* Development bypass option */}
            {import.meta.env.DEV && (
              <button
                onClick={() => {
                  enableBypass();
                  forceInitComplete();
                }}
                className="block w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 text-sm"
              >
                Development: Skip Auth Check
              </button>
            )}
            
            <p className="text-sm text-gray-500 mt-2">
              If loading takes too long, click "Try Again"
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to admin if user is a director
  if (isAuthenticated && agentProfile && (agentProfile as any).role === 'director') {
    return <Navigate to="/admin" replace />;
  }

  // Show authentication form if not authenticated
  if (!isAuthenticated) {
    return <AuthForm />;
  }

  // Show agent portal
  return (
    <div className="transition-colors duration-200">
      <NetworkStatus />
      <AgentPortal />
    </div>
  );
};

export default AgentPortalPage;
