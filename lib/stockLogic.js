// =====================================================================
// ATURAN BISNIS (tanpa tampilan, tanpa database)
// Daftar produk bawaan, penentuan kemasan/berat, hitung saldo stok,
// prefix nomor lot, dan helper periode bulan.
// =====================================================================

// ---------- Data produk (diambil dari STOCK_CARD_PFA_DES_2025.xlsx) ----------
export const RAW_PRODUCTS = [
  "PFA 86% ZAK25", "PFA 88% ZAK25",
  "PFA 92% ZAK25", "PFA 92% ZAK25 KITE", "PFA 92% JB300", "PFA 92% JB300 KITE",
  "PFA 92% JB500", "PFA 92% JB500 KITE", "PFA 92% JB1000", "PFA 92% JB1000 KITE",
  "PFA 96% ZAK25", "PFA 96% ZAK25 KITE", "PFA 96% JB450", "PFA 96% JB450 KITE",
  "PFA 96% JB500", "PFA 96% JB500 KITE", "PFA 96% JB1000", "PFA 96% JB1000 KITE",
  "PFA 97% ZAK20 KITE", "PFA 97% ZAK500 KITE",
  "PFA Others @20KG", "PFA Others @25KG", "PFA Transisi @25KG", "PFA Others @JB500",
];

export function categorize(name) {
  const m = name.match(/(\d{1,3})%/);
  if (m) return `${m[1]}%`;
  return "Lainnya";
}
export function slugify(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
// Urutan kategori dihitung otomatis di dalam komponen (lihat variabel productCategories),
// supaya kalau ada persentase baru (misal 99%) otomatis kesortir sesuai angka, bukan hardcode.
// Menjaga id produk tetap sama seperti sebelumnya walau nama tampilannya berubah,
// supaya data transaksi yang sudah tersimpan (dikunci ke id lama) tidak hilang/terpisah.
const ID_OVERRIDES = {
  "PFA 86% ZAK25": "pfa-86",
  "PFA 88% ZAK25": "pfa-88",
  "PFA Others @20KG": "pfa-others-20",
  "PFA Others @25KG": "pfa-others-25",
  "PFA Transisi @25KG": "pfa-transisi",
  "PFA Others @JB500": "pfa-others-jb500",
};
export function buildProduct(name) {
  const trimmed = name.trim();
  return { id: ID_OVERRIDES[trimmed] || slugify(trimmed), name: trimmed, category: categorize(trimmed) };
}
export const BASE_PRODUCTS = RAW_PRODUCTS.map(buildProduct);


export function getPackagingUnit(name) {
  const trimmed = name.trim();
  if (KNOWN_UNIT_WEIGHTS[trimmed] != null) return `ZAK ${KNOWN_UNIT_WEIGHTS[trimmed]}`;
  const upper = trimmed.toUpperCase();
  let m = upper.match(/JB\s?(\d+)/);
  if (m) return `JB ${m[1]}`;
  m = upper.match(/ZAK\s?(\d+)/);
  if (m) return `ZAK ${m[1]}`;
  m = upper.match(/@\s?(\d+)/);
  if (m) return `ZAK ${m[1]}`;
  return "Zak";
}
// Produk yang beratnya nggak tercantum eksplisit di nama, tapi berat per satuannya sudah diketahui
const KNOWN_UNIT_WEIGHTS = {};

export function getUnitWeight(name) {
  const trimmed = name.trim();
  if (KNOWN_UNIT_WEIGHTS[trimmed] != null) return KNOWN_UNIT_WEIGHTS[trimmed];
  const upper = trimmed.toUpperCase();
  let m = upper.match(/JB\s?(\d+)/);
  if (m) return Number(m[1]);
  m = upper.match(/ZAK\s?(\d+)/);
  if (m) return Number(m[1]);
  m = upper.match(/@\s?(\d+)/);
  if (m) return Number(m[1]);
  return null;
}


// Nomor referensi data contoh dari awal pengembangan prototype — otomatis dibersihkan kalau masih ketemu
export const LEGACY_DEMO_REFS = ["EXT25-00207", "PA25-08160"];


export function computeBalance(txns) {
  const sorted = [...txns].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  let zak = 0, kg = 0;
  return sorted.map((t) => {
    if (t.type === "in") { zak += Number(t.zak) || 0; kg += Number(t.kg) || 0; }
    else { zak -= Number(t.zak) || 0; kg -= Number(t.kg) || 0; }
    return { ...t, sisaZak: zak, sisaKg: kg };
  });
}


// Prefix Lot No otomatis dari tanggal: 2 digit tahun + huruf bulan (A=Jan ... L=Des) + 2 digit tanggal
// Contoh: 2023-12-22 -> "23L22"
export function getLotPrefix(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return "";
  const yy = y.slice(-2);
  const monthNum = parseInt(m, 10);
  if (!monthNum || monthNum < 1 || monthNum > 12) return "";
  const monthLetter = String.fromCharCode(64 + monthNum); // 1->A, 2->B ... 12->L
  return `${yy}${monthLetter}${d}`;
}

export function monthKey(iso) {
  return iso ? iso.slice(0, 7) : "";
}

export function lastDayOfMonthStr(year, monthIndex) {
  const days = new Date(year, monthIndex + 1, 0).getDate();
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(days).padStart(2, "0")}`;
}
