// =====================================================================
// BACKEND — query ke database (tabel products & stock_transactions).
// Setiap fungsi menerima objek "supabase" dari getSupabase(), jadi
// token login pengguna ikut terbawa dan RLS tetap berlaku.
//   products (1) ──< (N) stock_transactions >── (N) profiles (1)
// =====================================================================

// ---------- Konversi baris database <-> format yang dipakai tampilan ----------
export function rowToTxn(r) {
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

export function txnToRow(productId, t) {
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
export async function listTransactions(supabase, productId) {
  const { data, error } = await supabase
    .from("stock_transactions")
    .select("*")
    .eq("product_id", productId)
    .order("txn_date", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return { error };
  return { data: (data || []).map(rowToTxn) };
}

export async function upsertTransactions(supabase, productId, items) {
  const { error } = await supabase
    .from("stock_transactions")
    .upsert(items.map((t) => txnToRow(productId, t)), { onConflict: "id" });
  return { error };
}

export async function deleteTransactions(supabase, ids) {
  const { data, error } = await supabase
    .from("stock_transactions")
    .delete()
    .in("id", ids)
    .select("id");
  return { error, deleted: data ? data.length : 0 };
}

// ---------- PRODUK TAMBAHAN (is_custom = true) ----------
export async function listCustomProductNames(supabase) {
  const { data, error } = await supabase
    .from("products")
    .select("name")
    .eq("is_custom", true)
    .order("created_at", { ascending: true });
  if (error) return { error };
  return { data: (data || []).map((p) => p.name) };
}

export async function insertProduct(supabase, p) {
  const { error } = await supabase.from("products").insert({
    id: p.id,
    name: p.name,
    category: p.category,
    unit: p.unit,
    unit_weight: p.unitWeight ?? null,
    is_custom: true,
  });
  return { error };
}

// Hapus produk tambahan (transaksinya ikut terhapus: ON DELETE CASCADE).
export async function removeProduct(supabase, id) {
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("is_custom", true)
    .select("id");
  return { error, deleted: data ? data.length : 0 };
}
