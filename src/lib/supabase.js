import { createClient } from '@supabase/supabase-js';
import { isCloudEnabled, supabaseUrl, supabaseAnonKey } from './cloudConfig';

let client = null;

export function getSupabase() {
  if (!isCloudEnabled()) return null;
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
