import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AdminAuthState {
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  hasValidSession: boolean;
}

interface AdminAuthResult extends AdminAuthState {
  refreshAuth: () => Promise<void>;
  logSecurityEvent: (event: string, details?: any) => void;
}

// Admin email whitelist for additional security
const ADMIN_EMAIL_WHITELIST = [
  'pamacomkb@gmail.com',
  'yarimaind@gmail.com', 
  'pamacospares@gmail.com', 
  'fortunemillstores@gmail.com'
];

export const useAdminAuth = (): AdminAuthResult => {
  const { user, isAdmin: contextIsAdmin, loading: authLoading } = useAuth();
  const [authState, setAuthState] = useState<AdminAuthState>({
    isAdmin: false,
    isLoading: true,
    error: null,
    hasValidSession: false
  });

  const logSecurityEvent = async (event: string, details?: any) => {
    const logData = {
      timestamp: new Date().toISOString(),
      event,
      userId: user?.id,
      userEmail: user?.email,
      details,
      userAgent: navigator.userAgent,
      ip: 'client-side', // In production, this would come from server
      sessionId: user?.id ? `session_${user.id.slice(0, 8)}` : 'anonymous'
    };

    try {
      console.log('[SECURITY]', logData);
      
      // In production, send to logging service
      if (import.meta.env.PROD) {
        // You can integrate with services like LogRocket, Sentry, or custom logging
        await fetch('/api/security-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logData)
        }).catch(() => {
          // Fail silently for logging to not break the app
        });
      }
    } catch (error) {
      console.error('[SECURITY] Failed to log security event:', error);
    }
  };

  const validateAdminAccess = async (): Promise<boolean> => {
    if (!user) {
      await logSecurityEvent('admin_access_denied', { reason: 'no_user' });
      return false;
    }

    // Check email whitelist
    if (!ADMIN_EMAIL_WHITELIST.includes(user.email || '')) {
      await logSecurityEvent('admin_access_denied', { 
        reason: 'email_not_whitelisted',
        email: user.email 
      });
      return false;
    }

    // Check app metadata role
    const appMetadata = user.app_metadata as { role?: string } || {};
    if (appMetadata.role !== 'admin') {
      await logSecurityEvent('admin_access_denied', { 
        reason: 'invalid_role',
        role: appMetadata.role 
      });
      return false;
    }

    // Additional server-side validation if Supabase is configured
    if (isSupabaseConfigured()) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          await logSecurityEvent('admin_access_denied', { reason: 'no_session' });
          return false;
        }

        // Verify session is still valid by making a test query
        const { error } = await supabase.from('products').select('id').limit(1);
        if (error) {
          await logSecurityEvent('admin_access_denied', { 
            reason: 'session_invalid',
            error: error.message 
          });
          return false;
        }
      } catch (error) {
        await logSecurityEvent('admin_access_denied', { 
          reason: 'validation_error',
          error: error instanceof Error ? error.message : 'unknown' 
        });
        return false;
      }
    }

    await logSecurityEvent('admin_access_granted', { 
      email: user.email,
      role: appMetadata.role 
    });
    return true;
  };

  const refreshAuth = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (authLoading) {
        return; // Wait for auth context to finish loading
      }

      const isValidAdmin = await validateAdminAccess();
      const hasSession = !!user;

      setAuthState({
        isAdmin: isValidAdmin,
        isLoading: false,
        error: null,
        hasValidSession: hasSession
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      await logSecurityEvent('admin_auth_error', { error: errorMessage });
      
      setAuthState({
        isAdmin: false,
        isLoading: false,
        error: errorMessage,
        hasValidSession: false
      });
    }
  };

  useEffect(() => {
    refreshAuth();
  }, [user, contextIsAdmin, authLoading]);

  // Auto-refresh auth every 5 minutes to ensure session validity
  useEffect(() => {
    const interval = setInterval(() => {
      if (authState.isAdmin && !authState.isLoading) {
        refreshAuth();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [authState.isAdmin, authState.isLoading]);

  return {
    ...authState,
    refreshAuth,
    logSecurityEvent
  };
};