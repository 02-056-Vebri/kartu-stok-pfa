// =====================================================================
// BACKEND — koneksi ke Supabase dari SERVER (hanya dipanggil oleh app/api/*).
// Kode di folder lib/server/ tidak pernah dikirim ke browser.
// Kalau ada token login pengguna, token diteruskan ke Supabase supaya
// aturan keamanan database (RLS) tetap berlaku.
// =====================================================================
import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabase(token) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY belum diset di .env.local");
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : {},
  });
}
