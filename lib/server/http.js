// BACKEND — helper kecil untuk membaca token dan membuat respons JSON.
import { NextResponse } from "next/server";
import { getSupabase } from "./supabaseServer";

export function ok(data, status = 200) {
  return NextResponse.json(data, { status });
}
export function fail(status, message, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function getToken(request) {
  const h = request.headers.get("authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() || null : null;
}

// Ubah error database menjadi respons HTTP yang jelas.
export function fromDbError(error) {
  const code = String(error?.code || "");
  if (code.startsWith("PGRST30") || /jwt/i.test(error?.message || "")) {
    return fail(401, "Sesi login habis atau tidak valid.");
  }
  if (code === "42501") return fail(403, "Tidak punya izin (hanya Editor yang boleh mengubah data).");
  if (code === "23503") return fail(400, "Produk tidak ditemukan.");
  if (code === "23505") return fail(409, "Data sudah ada.");
  return fail(500, error?.message || "Terjadi kesalahan pada database.");
}

// Pastikan pemanggil adalah Editor. Mengembalikan { response } kalau ditolak,
// atau { supabase } (sudah membawa token) kalau diizinkan.
export async function requireEditor(request) {
  const token = getToken(request);
  if (!token) return { response: fail(401, "Harus login sebagai Editor.") };
  const supabase = getSupabase(token);
  const { data, error } = await supabase.rpc("is_editor");
  if (error) return { response: fromDbError(error) };
  if (data !== true) return { response: fail(403, "Hanya Editor yang boleh mengubah data.") };
  return { supabase };
}
