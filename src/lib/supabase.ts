import { createClient } from '@supabase/supabase-js';

// Function to get environment variables in Vite environment
const getEnvVariable = (key: string, defaultValue: string = ''): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  
  // Fallback for environments where import.meta.env is not available
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  
  return defaultValue;
};

// Get Supabase credentials from environment variables
const supabaseUrl = getEnvVariable('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVariable('VITE_SUPABASE_ANON_KEY');

// Enhanced validation with better error reporting
const isValidUrl = supabaseUrl && 
  supabaseUrl !== '' && 
  supabaseUrl !== 'https://example.supabase.co' && 
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseUrl.includes('supabase.co');

const isValidKey = supabaseAnonKey && 
  supabaseAnonKey !== '' && 
  supabaseAnonKey !== 'example-key' && 
  supabaseAnonKey !== 'your-anon-public-key' &&
  supabaseAnonKey.length > 20;

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  const isConfigured = isValidUrl && isValidKey;
  
  if (!isConfigured) {
    console.warn('⚠️ Supabase Configuration Status:');
    console.warn(`- URL configured: ${isValidUrl ? '✅' : '❌'} (${supabaseUrl || 'not set'})`);
    console.warn(`- Anon key configured: ${isValidKey ? '✅' : '❌'} (${supabaseAnonKey ? 'present' : 'not set'})`);
    
    if (!isValidUrl) {
      console.warn('Please set VITE_SUPABASE_URL in your environment variables');
    }
    if (!isValidKey) {
      console.warn('Please set VITE_SUPABASE_ANON_KEY in your environment variables');
    }
  }
  
  return isConfigured;
};

// Create a default client (will work even with invalid credentials for demo mode)
const createSupabaseClient = () => {
  if (isSupabaseConfigured()) {
    console.log('✅ Supabase is properly configured');
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'implicit'
      }
    });
  }
  
  // Return a mock client for demo mode
  console.log('📱 Running in demo mode - limited functionality available');
  return createClient(
    'https://demo.supabase.co',
    'demo-anon-key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );
};

export const supabase = createSupabaseClient();

// Development helper function
export const getSupabaseConfig = () => {
  return {
    url: supabaseUrl,
    hasValidUrl: isValidUrl,
    hasValidKey: isValidKey,
    isConfigured: isSupabaseConfigured()
  };
};