// =====================================================================
// BACKEND — login lewat Supabase Auth + pengecekan peran (tabel profiles).
// =====================================================================
import { getSupabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabaseServer";

// Username singkat yang diketik di form login dipetakan ke email akun Supabase Auth.
// Password TIDAK disimpan di sini — divalidasi langsung oleh Supabase Auth.
const USERNAME_TO_EMAIL = {
  pfa: "editor@dover.local",
  viewer: "viewer@dover.local",
};

export async function login({ username, password, expectedRole }) {
  const typed = String(username).trim().toLowerCase();
  const email = USERNAME_TO_EMAIL[typed] || String(username).trim();

  const anon = getSupabase();
  const { data: authData, error: authError } = await anon.auth.signInWithPassword({
    email,
    password: String(password).trim(),
  });
  if (authError || !authData?.user || !authData?.session) {
    return { ok: false, reason: "invalid_credentials" };
  }

  const accessToken = authData.session.access_token;
  const authed = getSupabase(accessToken);
  const { data: profile, error: profileError } = await authed
    .from("profiles")
    .select("role, name")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== expectedRole) {
    await revokeToken(accessToken);
    return { ok: false, reason: "wrong_role" };
  }

  return {
    ok: true,
    role: profile.role,
    name: profile.name || null,
    accessToken,
    refreshToken: authData.session.refresh_token,
  };
}

export async function refresh(refreshToken) {
  const anon = getSupabase();
  const { data, error } = await anon.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data?.session) return { ok: false };
  return {
    ok: true,
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
}

// Cabut sesi di Supabase (setara signOut).
export async function revokeToken(accessToken) {
  try {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
    });
  } catch (_) {
    // abaikan: token tetap akan kedaluwarsa sendiri
  }
}
