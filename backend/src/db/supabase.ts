import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import WebSocketImpl from 'ws'
import { env } from '../config/env.js'
import type { DbDriver } from './brandsRepo.js'

// Node < 22 has no global WebSocket. @supabase/supabase-js constructs a
// RealtimeClient in its constructor that requires one, so createClient() throws
// (and every auth check 401s) without this polyfill. We never use realtime.
if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'undefined') {
  ;(globalThis as { WebSocket?: unknown }).WebSocket = WebSocketImpl
}

let client: SupabaseClient | null = null
export function getSupabase(): SupabaseClient | null {
  if (!env.supabaseUrl || !env.supabaseServiceKey) return null
  if (!client) client = createClient(env.supabaseUrl, env.supabaseServiceKey, { auth: { persistSession: false } })
  return client
}

export function supabaseDriver(): DbDriver {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase not configured')
  return {
    insert: async (t, row) => { const { data, error } = await sb.from(t).insert(row).select().single(); if (error) throw error; return data },
    selectByOwner: async (t, owner) => { const { data, error } = await sb.from(t).select('*').eq('owner_id', owner).order('created_at', { ascending: false }); if (error) throw error; return data ?? [] },
    selectById: async (t, id) => { const { data, error } = await sb.from(t).select('*').eq('id', id).maybeSingle(); if (error) throw error; return data ?? null },
    deleteByIdOwner: async (t, id, owner) => { const { data, error } = await sb.from(t).delete().eq('id', id).eq('owner_id', owner).select(); if (error) throw error; return (data?.length ?? 0) > 0 },
  }
}
