// =====================================================================
// FRONTEND — satu-satunya pintu tampilan ke backend.
// Semua fungsi di sini memanggil endpoint /api/... (app/api/).
// Tampilan TIDAK lagi berbicara langsung dengan Supabase.
// Token login disimpan hanya di memori (hilang saat halaman ditutup).
// =====================================================================

let session = { accessToken: null, refreshToken: null };

async function refreshSession() {
  if (!session.refreshToken) return false;
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });
    if (!res.ok) { session = { accessToken: null, refreshToken: null }; return false; }
    const data = await res.json();
    session = { accessToken: data.accessToken, refreshToken: data.refreshToken };
    return true;
  } catch (_) {
    return false;
  }
}

async function request(path, { method = "GET", body, retry = true } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (session.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;

  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  // Sesi habis → perpanjang sekali, lalu ulangi permintaan.
  if (res.status === 401 && retry && session.refreshToken) {
    if (await refreshSession()) return request(path, { method, body, retry: false });
  }

  let data = null;
  try { data = await res.json(); } catch (_) {}
  if (!res.ok) {
    const err = new Error((data && data.error) || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// ---------- LOGIN ----------
export async function loginWithPassword({ username, password, expectedRole }) {
  let res;
  try {
    res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, expectedRole }),
    });
  } catch (_) {
    return { ok: false, reason: "invalid_credentials" };
  }
  let data = null;
  try { data = await res.json(); } catch (_) {}
  if (!res.ok || !data || !data.accessToken) {
    return { ok: false, reason: (data && data.reason) || "invalid_credentials" };
  }
  session = { accessToken: data.accessToken, refreshToken: data.refreshToken };
  return { ok: true, role: data.role, name: data.name };
}

export async function signOut() {
  const token = session.accessToken;
  session = { accessToken: null, refreshToken: null };
  if (!token) return;
  try {
    await fetch("/api/auth/logout", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  } catch (_) {}
}

// ---------- TRANSAKSI ----------
export async function fetchTransactions(productId) {
  const data = await request(`/api/transactions?productId=${encodeURIComponent(productId)}`);
  return data.transactions;
}

// Bandingkan daftar lama dan baru, kirim hanya yang berubah/dihapus.
export async function syncTransactions(productId, prevList, nextList) {
  const prevById = new Map(prevList.map((t) => [t.id, t]));
  const nextIds = new Set(nextList.map((t) => t.id));

  const changed = nextList.filter((t) => {
    const old = prevById.get(t.id);
    return !old || JSON.stringify(old) !== JSON.stringify(t);
  });
  const removedIds = prevList.filter((t) => !nextIds.has(t.id)).map((t) => t.id);

  if (changed.length) await request("/api/transactions", { method: "POST", body: { productId, items: changed } });
  if (removedIds.length) await request("/api/transactions", { method: "DELETE", body: { ids: removedIds } });
}

// ---------- PRODUK TAMBAHAN ----------
export async function fetchCustomProductNames() {
  const data = await request("/api/products");
  return data.names;
}

export async function addProduct(product) {
  await request("/api/products", { method: "POST", body: product });
}

export async function deleteProduct(id) {
  await request(`/api/products?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}
