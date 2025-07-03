import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { AlertTriangle, Shield, RefreshCw, LogOut, Home } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { isAdmin, isLoading, error, hasValidSession, refreshAuth, logSecurityEvent } = useAdminAuth();
  const location = useLocation();
  const [retryCount, setRetryCount] = useState(0);
  const [showDetailedError, setShowDetailedError] = useState(false);

  useEffect(() => {
    // Log access attempt
    logSecurityEvent('admin_route_access_attempt', { 
      path: location.pathname,
      retryCount 
    });
  }, [location.pathname, retryCount, logSecurityEvent]);

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    await refreshAuth();
  };

  const handleSignOut = () => {
    logSecurityEvent('admin_manual_signout', { path: location.pathname });
    window.location.href = '/auth';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Verifying Admin Access
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we validate your credentials...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-200 dark:border-red-800 p-8">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Authentication Error
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Unable to verify admin access. Please try again or contact support if the issue persists.
              </p>
              
              {showDetailedError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
                  <p className="text-sm text-red-700 dark:text-red-300 font-mono">
                    {error}
                  </p>
                </div>
              )}
              
              <div className="space-y-3">
                <button
                  onClick={handleRetry}
                  disabled={retryCount >= 3}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry {retryCount >= 3 ? '(Max attempts reached)' : `(${retryCount}/3)`}
                </button>
                
                <button
                  onClick={() => setShowDetailedError(!showDetailedError)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {showDetailedError ? 'Hide' : 'Show'} Error Details
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Access denied state
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-200 dark:border-red-800 p-8">
            <div className="text-center">
              <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Access Denied
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You don't have permission to access the admin panel. If you believe this is an error, please contact support.
              </p>
              
              <div className="space-y-3">
                {hasValidSession ? (
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                ) : (
                  <a
                    href="/auth"
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Sign In
                  </a>
                )}
                
                <a
                  href="/"
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Store
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect non-admin users to auth page
  if (!hasValidSession) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Success - render admin content
  return <>{children}</>;
};

export default AdminProtectedRoute;