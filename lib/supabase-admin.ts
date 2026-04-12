import 'server-only';
import { createClient } from '@supabase/supabase-js';

// We use hard process.env here directly instead of the validated 'env' object 
// to ensure zero circular dependencies during the initialization phase.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Server-side Supabase client initialized with the Service Role Key.
 * NEVER use this on the client side, as it bypasses all Row Level Security.
 * 
 * Build-Safe: Uses dummy values if environments are missing during compilation.
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co', 
  supabaseServiceKey || 'placeholder-service-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
);

if (!supabaseUrl || !supabaseServiceKey) {
  // If we're in a build phase, we don't want to spam the logs with 
  // warnings that are expected (since secrets aren't available during build).
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  
  if (process.env.NODE_ENV === 'production' && !isBuildPhase) {
     console.warn('[supabase-admin] WARNING: Running with placeholder credentials. Database operations will fail.');
  }
}
