import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to check if user has admin role in app_metadata
  const checkIsAdmin = (user: User | null): boolean => {
    if (!user) return false;
    
    const appMetadata = user.app_metadata as { role?: string } || {};
    const userIsAdmin = appMetadata.role === 'admin';
    
    console.log(`[AUTH] Admin check for ${user.email}: ${userIsAdmin} (role: ${appMetadata.role})`);
    return userIsAdmin;
  };

  useEffect(() => {
    console.log('[AUTH] Provider initialized, Supabase configured:', isSupabaseConfigured());
    
    // If Supabase is not configured, set loading to false and return
    if (!isSupabaseConfigured()) {
      console.log('[AUTH] Supabase not configured, running in demo mode');
      setLoading(false);
      return;
    }

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        console.error('[AUTH] Session error:', sessionError);
        setError(sessionError.message);
        setLoading(false);
        return;
      }

      console.log('[AUTH] Session retrieved:', session ? 'yes' : 'no');
      setUser(session?.user ?? null);
      
      // Check if user is an admin based on app_metadata
      if (session?.user) {
        const userIsAdmin = checkIsAdmin(session.user);
        console.log(`[AUTH] User authenticated, admin status: ${userIsAdmin}`);
        setIsAdmin(userIsAdmin);
        
        // Store admin status in localStorage for persistence
        localStorage.setItem('isAdmin', userIsAdmin ? 'true' : 'false');
      } else {
        setIsAdmin(false);
        localStorage.removeItem('isAdmin');
      }
      
      setLoading(false);
    }).catch(error => {
      console.error('[AUTH] Error getting session:', error);
      setError(error.message);
      setLoading(false);
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[AUTH] Auth state changed: ${event}`);
      setError(null); // Clear any previous errors
      setUser(session?.user ?? null);
      
      // Check if user is an admin based on app_metadata
      if (session?.user) {
        const userIsAdmin = checkIsAdmin(session.user);
        console.log(`[AUTH] Auth state changed, admin status: ${userIsAdmin}`);
        setIsAdmin(userIsAdmin);
        localStorage.setItem('isAdmin', userIsAdmin ? 'true' : 'false');
      } else {
        console.log('[AUTH] Auth state changed: No user');
        setIsAdmin(false);
        localStorage.removeItem('isAdmin');
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Authentication requires Supabase configuration. Please contact support.');
    }
    
    setError(null);
    console.log(`[AUTH] Attempting to sign up: ${email}`);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      console.error("[AUTH] Sign up error:", error.message);
      setError(error.message);
      throw error;
    }
    
    console.log("[AUTH] Sign up response:", data);
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Authentication requires Supabase configuration. Please contact support.');
    }
    
    setError(null);
    console.log(`[AUTH] Attempting to sign in: ${email}`);
    
    try {
      // Sign in with password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("[AUTH] Sign in error:", error);
        setError(error.message);
        throw error;
      }
      
      console.log("[AUTH] Sign in successful:", data.user?.email);
      
      // Set user data
      setUser(data.user);
      
      // Check admin status from app_metadata
      const userIsAdmin = checkIsAdmin(data.user);
      setIsAdmin(userIsAdmin);
      localStorage.setItem('isAdmin', userIsAdmin ? 'true' : 'false');
      console.log(`[AUTH] Set isAdmin state to: ${userIsAdmin}`);
      
      return;
    } catch (err) {
      console.error("[AUTH] Sign in exception:", err);
      if (err instanceof Error) {
        setError(err.message);
      }
      throw err;
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      // For demo mode, just clear the state
      setUser(null);
      setIsAdmin(false);
      localStorage.removeItem('isAdmin');
      return;
    }
    
    setError(null);
    console.log("[AUTH] Signing out");
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[AUTH] Sign out error:", error);
      setError(error.message);
      throw error;
    }
    
    console.log("[AUTH] Sign out successful");
    setIsAdmin(false);
    localStorage.removeItem('isAdmin');
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, signIn, signUp, signOut, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};