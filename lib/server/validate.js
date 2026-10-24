// BACKEND — validasi data yang masuk sebelum disimpan ke database.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateTxn(t) {
  if (!t || typeof t !== "object") return "Data transaksi tidak valid.";
  if (typeof t.id !== "string" || !t.id.trim()) return "ID transaksi wajib diisi.";
  if (typeof t.date !== "string" || !DATE_RE.test(t.date)) return "Tanggal harus berformat YYYY-MM-DD.";
  if (t.type !== "in" && t.type !== "out") return "Tipe harus 'in' atau 'out'.";
  const zak = Number(t.zak), kg = Number(t.kg);
  if (!Number.isFinite(zak) || zak < 0) return "Jumlah (zak) tidak valid.";
  if (!Number.isFinite(kg) || kg < 0) return "Berat (kg) tidak valid.";
  return null;
}

export function validateProduct(p) {
  if (!p || typeof p !== "object") return "Data produk tidak valid.";
  if (typeof p.id !== "string" || !p.id.trim()) return "ID produk wajib diisi.";
  if (typeof p.name !== "string" || !p.name.trim()) return "Nama produk wajib diisi.";
  if (typeof p.category !== "string" || !p.category.trim()) return "Kategori wajib diisi.";
  if (p.unit !== "ZAK" && p.unit !== "JB") return "Satuan harus ZAK atau JB.";
  return null;
}
