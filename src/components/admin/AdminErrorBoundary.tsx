import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

class AdminErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorId: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ADMIN ERROR BOUNDARY]', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log error for monitoring
    this.logError(error, errorInfo);
  }

  private logError = async (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId,
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: 'admin_user' // In real app, get from auth context
    };

    try {
      console.error('[ADMIN ERROR LOG]', errorData);
      
      // In production, send to error tracking service
      if (import.meta.env.PROD) {
        await fetch('/api/error-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData)
        }).catch(() => {
          // Fail silently to not cause additional errors
        });
      }
    } catch (logError) {
      console.error('[ADMIN ERROR] Failed to log error:', logError);
    }
  };

  private handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: ''
    });
    window.location.reload();
  };

  private handleReportError = () => {
    const subject = encodeURIComponent(`Admin Panel Error - ${this.state.errorId}`);
    const body = encodeURIComponent(`
Error ID: ${this.state.errorId}
Error: ${this.state.error?.message}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}

Please provide any additional context about what you were doing when this error occurred.
    `);
    
    window.open(`mailto:admin-support@yarimart.com?subject=${subject}&body=${body}`);
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-lg w-full">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-200 dark:border-red-800 p-8">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Admin Panel Error
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Something went wrong in the admin panel. This error has been logged and our team has been notified.
                </p>
                
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
                  <div className="text-left">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                      Error ID: {this.state.errorId}
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-400">
                      {this.state.error?.message}
                    </p>
                    {import.meta.env.DEV && this.state.error?.stack && (
                      <details className="mt-2">
                        <summary className="text-sm font-medium text-red-800 dark:text-red-300 cursor-pointer">
                          Stack Trace
                        </summary>
                        <pre className="mt-2 text-xs text-red-700 dark:text-red-400 overflow-auto max-h-32">
                          {this.state.error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={this.handleRetry}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Admin Panel
                  </button>
                  
                  <button
                    onClick={this.handleReportError}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <Bug className="h-4 w-4 mr-2" />
                    Report Error
                  </button>
                  
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

    return this.props.children;
  }
}

export default AdminErrorBoundary;