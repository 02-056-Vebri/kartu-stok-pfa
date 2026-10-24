// BACKEND — endpoint transaksi.
//   GET    /api/transactions?productId=...  → baca transaksi satu produk (publik)
//   POST   /api/transactions                → tambah/ubah transaksi (Editor)
//   DELETE /api/transactions                → hapus transaksi (Editor)
import { getSupabase } from "../../../lib/server/supabaseServer";
import { ok, fail, getToken, fromDbError, requireEditor } from "../../../lib/server/http";
import { validateTxn } from "../../../lib/server/validate";
import { listTransactions, upsertTransactions, deleteTransactions } from "../../../lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const productId = new URL(request.url).searchParams.get("productId");
    if (!productId) return fail(400, "Parameter productId wajib diisi.");
    const supabase = getSupabase(getToken(request));
    const { data, error } = await listTransactions(supabase, productId);
    if (error) return fromDbError(error);
    return ok({ transactions: data });
  } catch (e) {
    return fail(500, e.message);
  }
}

export async function POST(request) {
  try {
    const auth = await requireEditor(request);
    if (auth.response) return auth.response;

    const body = await request.json().catch(() => null);
    if (!body || typeof body.productId !== "string" || !Array.isArray(body.items) || body.items.length === 0) {
      return fail(400, "Isi permintaan harus berisi productId dan items.");
    }
    for (const t of body.items) {
      const msg = validateTxn(t);
      if (msg) return fail(400, msg);
    }
    const { error } = await upsertTransactions(auth.supabase, body.productId, body.items);
    if (error) return fromDbError(error);
    return ok({ saved: body.items.length });
  } catch (e) {
    return fail(500, e.message);
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireEditor(request);
    if (auth.response) return auth.response;

    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.ids) || body.ids.length === 0 || body.ids.some((i) => typeof i !== "string")) {
      return fail(400, "Isi permintaan harus berisi daftar ids.");
    }
    const { error, deleted } = await deleteTransactions(auth.supabase, body.ids);
    if (error) return fromDbError(error);
    return ok({ deleted });
  } catch (e) {
    return fail(500, e.message);
  }
}
