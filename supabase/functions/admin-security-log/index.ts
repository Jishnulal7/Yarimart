import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SecurityEvent {
  event: string;
  userId?: string;
  userEmail?: string;
  details?: any;
  timestamp: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract JWT token from Authorization header
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization header format' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client for authentication
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Check if user has admin role
    const appMetadata = user.app_metadata as { role?: string } || {};
    if (appMetadata.role !== 'admin') {
      console.error('User is not admin:', { userId: user.id, role: appMetadata.role });
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin role required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse the security event from request body
    const securityEvent: SecurityEvent = await req.json();
    
    // Validate required fields
    if (!securityEvent.event || !securityEvent.timestamp) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: event, timestamp' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Enhance the security event with server-side data
    const enhancedEvent = {
      ...securityEvent,
      serverTimestamp: new Date().toISOString(),
      verifiedUserId: user.id,
      verifiedUserEmail: user.email,
      source: 'admin-panel',
      severity: determineSeverity(securityEvent.event),
      ip: getClientIP(req) || 'unknown'
    };

    // Log the security event
    console.log('[ADMIN SECURITY LOG]', enhancedEvent);
    
    // In a production environment, you would:
    // 1. Store in a dedicated security logs table
    // 2. Send to external monitoring service (e.g., Datadog, New Relic)
    // 3. Trigger alerts for critical events
    // 4. Apply rate limiting and anomaly detection
    
    // Example: Store in a security_logs table
    /*
    const { error: insertError } = await supabase
      .from('security_logs')
      .insert([enhancedEvent]);
    
    if (insertError) {
      console.error('Failed to insert security log:', insertError);
    }
    */

    return new Response(
      JSON.stringify({ 
        success: true, 
        eventId: enhancedEvent.serverTimestamp,
        message: 'Security event logged successfully' 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Security logging error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process security event',
        details: error.message || 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function determineSeverity(event: string): 'low' | 'medium' | 'high' | 'critical' {
  const criticalEvents = [
    'admin_access_denied',
    'session_validation_error',
    'database_connectivity_error'
  ];
  
  const highEvents = [
    'admin_route_access_attempt',
    'invalid_admin_role',
    'no_session'
  ];
  
  const mediumEvents = [
    'admin_manual_signout',
    'admin_auth_error'
  ];
  
  if (criticalEvents.includes(event)) return 'critical';
  if (highEvents.includes(event)) return 'high';
  if (mediumEvents.includes(event)) return 'medium';
  return 'low';
}

function getClientIP(req: Request): string | null {
  // Try various headers that might contain the client IP
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip', // Cloudflare
    'x-cluster-client-ip'
  ];
  
  for (const header of headers) {
    const value = req.headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      return value.split(',')[0].trim();
    }
  }
  
  return null;
}