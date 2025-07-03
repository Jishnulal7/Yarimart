import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Eye, EyeOff, Settings, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured, getSupabaseConfig } from '../lib/supabase';

const ADMIN_EMAILS = [
  'pamacomkb@gmail.com',
  'yarimaind@gmail.com', 
  'pamacospares@gmail.com', 
  'fortunemillstores@gmail.com'
];

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [copied, setCopied] = useState(false);
  const { signIn, signUp, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // Helper function to normalize and check admin emails
  const checkIsAdminEmail = (email: string): boolean => {
    if (!email) return false;
    
    const normalizedEmail = email.toLowerCase().trim();
    for (const adminEmail of ADMIN_EMAILS) {
      if (adminEmail.toLowerCase().trim() === normalizedEmail) {
        console.log(`[AUTH-PAGE] Email ${normalizedEmail} is recognized as admin`);
        return true;
      }
    }
    console.log(`[AUTH-PAGE] Email ${normalizedEmail} is NOT an admin`);
    return false;
  };
  
  // Check if the email is an admin email
  const isAdminEmail = checkIsAdminEmail(email);
  
  useEffect(() => {
    // Check localStorage first for admin status
    const storedAdminStatus = localStorage.getItem('isAdmin') === 'true';
    console.log(`[AUTH-PAGE] Initial check - stored admin status: ${storedAdminStatus}, context admin status: ${isAdmin}`);
    
    // If already logged in as admin, redirect to admin panel
    if (isAdmin || storedAdminStatus) {
      console.log('[AUTH-PAGE] User is admin, redirecting to admin panel');
      navigate('/admin');
    }
  }, [isAdmin, navigate]);

  // Handle regular user signup attempts with admin emails
  useEffect(() => {
    if (!isLogin && isAdminEmail) {
      setError('This email is reserved for admin use only and cannot be used for regular user registration.');
    } else {
      // Clear the error when email changes or mode changes
      if (error === 'This email is reserved for admin use only and cannot be used for regular user registration.') {
        setError('');
      }
    }
  }, [email, isLogin, isAdminEmail, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      console.log('[AUTH-PAGE] Form submitted:', isLogin ? 'login' : 'signup', email);
      
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        throw new Error('Authentication service is not available. Please check the configuration or contact support.');
      }
      
      // Prevent signup with admin email for regular users
      if (!isLogin && isAdminEmail) {
        throw new Error('This email is reserved for admin use only and cannot be used for regular user registration.');
      }
      
      if (isForgotPassword) {
        console.log('[AUTH-PAGE] Initiating password reset for:', email);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        
        if (error) throw error;
        
        setSuccess('Password reset email sent! Check your inbox.');
        setTimeout(() => {
          setIsForgotPassword(false);
        }, 3000);
      } else if (isLogin) {
        console.log(`[AUTH-PAGE] Attempting to sign in with email: ${email}`);
        
        // Determine admin status before sign-in
        const isUserAdmin = checkIsAdminEmail(email);
        console.log(`[AUTH-PAGE] Pre-login admin check: ${isUserAdmin}`);
        
        // Set admin status in localStorage before auth to ensure persistence
        localStorage.setItem('isAdmin', isUserAdmin ? 'true' : 'false');
        console.log(`[AUTH-PAGE] Pre-set localStorage admin status to: ${isUserAdmin}`);
        
        // Perform sign in
        await signIn(email, password);
        console.log("[AUTH-PAGE] Sign in completed successfully");
        
        // Double-check admin status after login
        console.log(`[AUTH-PAGE] Admin status check after login: ${isUserAdmin}`);
        console.log(`[AUTH-PAGE] localStorage admin status: ${localStorage.getItem('isAdmin')}`);
        
        if (isUserAdmin) {
          console.log("[AUTH-PAGE] Admin email detected, redirecting to admin panel");
          navigate('/admin');
        } else {
          console.log("[AUTH-PAGE] Regular user, redirecting to home");
          navigate('/');
        }
      } else {
        console.log('[AUTH-PAGE] Registering new user:', email);
        await signUp(email, password);
        setSuccess('Registration successful! Please check your email to verify your account.');
        setTimeout(() => {
          setIsLogin(true);
        }, 3000);
      }
    } catch (err) {
      console.error("[AUTH-PAGE] Auth error:", err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const supabaseConfig = getSupabaseConfig();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
          {isForgotPassword 
            ? 'Reset your password' 
            : isLogin 
              ? 'Sign in to your account' 
              : 'Create a new account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Configuration Status */}
          {!isSupabaseConfigured() && (
            <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4">
              <div className="flex items-center justify-between">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                      Authentication service requires configuration
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
              
              {showConfig && (
                <div className="mt-4 space-y-4">
                  {/* Status indicators */}
                  <div className="bg-yellow-100 dark:bg-yellow-900/40 p-3 rounded">
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="font-medium">Status:</span>
                      <span className={`inline-flex items-center ${supabaseConfig.hasValidUrl ? 'text-green-600' : 'text-red-600'}`}>
                        URL: {supabaseConfig.hasValidUrl ? '✅' : '❌'}
                      </span>
                      <span className={`inline-flex items-center ${supabaseConfig.hasValidKey ? 'text-green-600' : 'text-red-600'}`}>
                        Key: {supabaseConfig.hasValidKey ? '✅' : '❌'}
                      </span>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="text-sm space-y-3">
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                        For Deployed Site (Netlify):
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
                        <li>Go to your Netlify dashboard</li>
                        <li>Select your site</li>
                        <li>Go to Site settings → Environment variables</li>
                        <li>Add these variables:</li>
                      </ol>
                      
                      <div className="mt-2 space-y-2">
                        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded border">
                          <div className="flex items-center justify-between">
                            <code className="text-xs">VITE_SUPABASE_URL</code>
                            <button
                              onClick={() => copyToClipboard('VITE_SUPABASE_URL')}
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            >
                              {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Your Supabase project URL
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded border">
                          <div className="flex items-center justify-between">
                            <code className="text-xs">VITE_SUPABASE_ANON_KEY</code>
                            <button
                              onClick={() => copyToClipboard('VITE_SUPABASE_ANON_KEY')}
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            >
                              {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Your Supabase anon public key
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-yellow-200 dark:border-yellow-700 pt-3">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                        Need help finding your Supabase keys?
                      </p>
                      <a
                        href="https://app.supabase.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm"
                      >
                        Open Supabase Dashboard
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                        Go to Project Settings → API to find your keys
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {success && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4">
              <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || (!isLogin && isAdminEmail) || !isSupabaseConfigured()}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600 ${
                  (isLoading || (!isLogin && isAdminEmail) || !isSupabaseConfigured()) ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading 
                  ? 'Processing...' 
                  : isForgotPassword 
                    ? 'Send reset email' 
                    : isLogin 
                      ? 'Sign in' 
                      : 'Sign up'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            {!isForgotPassword ? (
              <div className="space-y-4">
                {isLogin && (
                  <button
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError('');
                      setSuccess('');
                    }}
                    className="w-full text-center text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Forgot your password?
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setSuccess('');
                  }}
                  className="w-full text-center text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setError('');
                  setSuccess('');
                }}
                className="w-full text-center text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;