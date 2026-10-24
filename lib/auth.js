// =====================================================================
// LAPISAN LOGIN (backend-facing)
// Semua proses autentikasi ke Supabase Auth dan pengecekan peran
// (tabel profiles) ada di sini. Komponen tampilan hanya memanggil
// fungsi-fungsi ini dan tidak mengimpor Supabase langsung.
// =====================================================================
import { supabase } from "./supabaseClient";

// Username singkat yang diketik di form login dipetakan ke email akun Supabase Auth.
// Password TIDAK disimpan di sini — divalidasi langsung oleh Supabase Auth.
const USERNAME_TO_EMAIL = {
  pfa: "editor@dover.local",
  viewer: "viewer@dover.local",
};

// Login dengan username + password, lalu cocokkan peran akun dengan peran yang dipilih.
// Hasil: { ok: true, role, name }  atau  { ok: false, reason: "invalid_credentials" | "wrong_role" }
export async function loginWithPassword({ username, password, expectedRole }) {
  const typed = username.trim().toLowerCase();
  const email = USERNAME_TO_EMAIL[typed] || username.trim();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password: password.trim(),
  });
  if (authError || !authData?.user) {
    return { ok: false, reason: "invalid_credentials" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== expectedRole) {
    await supabase.auth.signOut();
    return { ok: false, reason: "wrong_role" };
  }

  return { ok: true, role: profile.role, name: profile.name || null };
}

// Keluar dari sesi login.
export async function signOut() {
  await supabase.auth.signOut();
}
