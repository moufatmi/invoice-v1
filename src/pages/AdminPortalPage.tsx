import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import DirectorDashboard from '../components/DirectorDashboard';
import AdminLoginForm from '../components/AdminLoginForm';
import LoadingSpinner from '../components/LoadingSpinner';
import AuthErrorFallback from '../components/AuthErrorFallback';
import { useAuth } from '../contexts/AuthContext';

const AdminPortalPage: React.FC = () => {
  const [loginError, setLoginError] = useState<string>('');

  const { isAuthenticated, loading, error, agentProfile, signIn, signOut, forceInitComplete, retryAuth } = useAuth();

  // Set page title
  useEffect(() => {
    document.title = 'Admin Portal - Invoice Management System';
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
          <LoadingSpinner size="lg" text="Loading admin portal..." />
          <div className="mt-6">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
            <p className="text-sm text-gray-500 mt-2">
              If loading takes too long, click "Try Again"
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect regular agents to agent portal
  if (isAuthenticated && agentProfile && (agentProfile as any).role !== 'director') {
    return <Navigate to="/agent" replace />;
  }

  const handleLogin = async (email: string, password: string) => {
    setLoginError('');

    try {
      const { agent, error } = await signIn(email, password);

      if (error || !agent) {
        setLoginError(error || 'Failed to sign in');
        return;
      }

      // Verify the user has director role
      if (agent.role === 'director') {
        return;
      }

      setLoginError('You do not have permission to access the admin portal.');
      await signOut();
    } catch (e) {
      setLoginError('Failed to verify user role.');
      await signOut();
    }
  };

  const handleLogout = async () => {
    await signOut();
    setLoginError('');
  };

  // Show director dashboard if authenticated as director
  if (isAuthenticated && agentProfile && (agentProfile as any).role === 'director') {
    return <DirectorDashboard onLogout={handleLogout} />;
  }

  // Show admin login form
  return (
    <AdminLoginForm
      onLogin={handleLogin}
      error={loginError}
    />
  );
};

export default AdminPortalPage;
