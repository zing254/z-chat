import { env } from '../config/env.js';
import { createFileStore } from './fileStore.js';
import { createSupabaseStore } from './supabaseStore.js';

let store = null;

export function getStore() {
  if (!store) {
    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
      store = createSupabaseStore();
      console.log('[store] Supabase persistence enabled');
    } else {
      store = createFileStore();
      console.log('[store] File persistence enabled (set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for durable Postgres)');
    }
  }
  return store;
}

export function isSupabase() {
  return !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}
