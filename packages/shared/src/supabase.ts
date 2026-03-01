import { createClient } from '@supabase/supabase-js';

export function createSupabaseServiceClient(url: string, serviceRoleKey: string) {
  return createClient(url, serviceRoleKey);
}

export function createSupabaseClient(url: string, anonKey: string) {
  return createClient(url, anonKey);
}
