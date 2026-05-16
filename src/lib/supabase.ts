import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { withRetry, withRetryAsync } from './supabase-retry';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error('Missing Supabase environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

const supabase = createClient<Database>(url, key);

// Global retry wrapper for database operations
// Usage: await retryQuery(() => supabase.from('items').select('*'))
export const retryQuery = withRetry;

// Global retry wrapper for auth operations
// Usage: await retryAuth(() => supabase.auth.signInWithPassword(...))
export const retryAuth = withRetryAsync;

// Export the supabase client and retry utilities
export { supabase, withRetry, withRetryAsync };
