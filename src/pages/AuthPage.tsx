import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400\" aria-hidden="true" />
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
                      <EyeOff className="h-5 w-5\" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5\" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || (!isLogin && isAdminEmail)}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600 ${
                  (isLoading || (!isLogin && isAdminEmail)) ? 'opacity-70 cursor-not-allowed' : ''
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