import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AuthErrorFallbackProps {
  onRetry: () => void;
  onSkip: () => void;
}

const AuthErrorFallback: React.FC<AuthErrorFallbackProps> = ({ onRetry, onSkip }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Connection Issue</h2>
          <p className="text-gray-600">
            We're having trouble connecting to the authentication service. This might be due to network issues or server maintenance.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
          
          <button
            onClick={onSkip}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors duration-200"
          >
            Proceed to Login
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            If this problem persists, please check your internet connection or contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthErrorFallback;
