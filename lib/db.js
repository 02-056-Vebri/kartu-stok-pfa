// =====================================================================
// LAPISAN AKSES DATA (backend-facing)
// Semua pembacaan/penulisan ke database Supabase ada di file ini.
// Komponen tampilan (components/) TIDAK boleh memanggil Supabase langsung.
//
// Tabel yang dipakai:
//   products            (1) ──< (N) stock_transactions
//   profiles            (1) ──< (N) stock_transactions  (kolom created_by, diisi otomatis)
// =====================================================================
import { supabase } from "./supabaseClient";

// ---------- Konversi baris database <-> objek yang dipakai tampilan ----------
function rowToTxn(r) {
  return {
    id: r.id,
    date: r.txn_date,
    ref: r.ref ?? "",
    type: r.type,
    zak: Number(r.zak) || 0,
    kg: Number(r.kg) || 0,
    lot: r.lot ?? "",
    palletEkspor: r.pallet_ekspor == null ? "" : Number(r.pallet_ekspor),
    palletLokal: r.pallet_lokal == null ? "" : Number(r.pallet_lokal),
    lokasi: r.lokasi ?? "",
    ket: r.ket ?? "",
  };
}

function txnToRow(productId, t) {
  return {
    id: t.id,
    product_id: productId,
    txn_date: t.date,
    ref: t.ref || null,
    type: t.type,
    zak: Number(t.zak) || 0,
    kg: Number(t.kg) || 0,
    lot: t.lot || null,
    pallet_ekspor: t.palletEkspor === "" || t.palletEkspor == null ? null : Number(t.palletEkspor),
    pallet_lokal: t.palletLokal === "" || t.palletLokal == null ? null : Number(t.palletLokal),
    lokasi: t.lokasi || null,
    ket: t.ket || null,
    updated_at: new Date().toISOString(),
  };
}

// ---------- TRANSAKSI ----------

// Ambil semua transaksi satu produk.
export async function fetchTransactions(productId) {
  const { data, error } = await supabase
    .from("stock_transactions")
    .select("*")
    .eq("product_id", productId)
    .order("txn_date", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToTxn);
}

// Samakan database dengan daftar transaksi terbaru milik satu produk:
// baris baru/berubah di-upsert, baris yang hilang dihapus (per baris, bukan timpa semua).
export async function syncTransactions(productId, prevList, nextList) {
  const prevById = new Map(prevList.map((t) => [t.id, t]));
  const nextIds = new Set(nextList.map((t) => t.id));

  const changed = nextList.filter((t) => {
    const old = prevById.get(t.id);
    return !old || JSON.stringify(old) !== JSON.stringify(t);
  });
  const removedIds = prevList.filter((t) => !nextIds.has(t.id)).map((t) => t.id);

  if (changed.length) {
    const { error } = await supabase
      .from("stock_transactions")
      .upsert(changed.map((t) => txnToRow(productId, t)), { onConflict: "id" });
    if (error) throw error;
  }
  if (removedIds.length) {
    const { error } = await supabase.from("stock_transactions").delete().in("id", removedIds);
    if (error) throw error;
  }
}

// ---------- PRODUK TAMBAHAN (is_custom = true) ----------

// Ambil nama produk tambahan yang dibuat user.
export async function fetchCustomProductNames() {
  const { data, error } = await supabase
    .from("products")
    .select("name")
    .eq("is_custom", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map((p) => p.name);
}

// Tambah produk baru ke tabel products.
export async function addProduct({ id, name, category, unit, unitWeight }) {
  const { error } = await supabase.from("products").insert({
    id,
    name,
    category,
    unit,
    unit_weight: unitWeight,
    is_custom: true,
  });
  if (error) throw error;
}

// Hapus produk (transaksinya ikut terhapus otomatis karena ON DELETE CASCADE).
export async function deleteProduct(id) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}
