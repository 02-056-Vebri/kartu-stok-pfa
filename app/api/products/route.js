// BACKEND — endpoint produk tambahan.
//   GET    /api/products        → daftar nama produk tambahan (publik)
//   POST   /api/products        → tambah produk (Editor)
//   DELETE /api/products?id=... → hapus produk beserta transaksinya (Editor)
import { getSupabase } from "../../../lib/server/supabaseServer";
import { ok, fail, getToken, fromDbError, requireEditor } from "../../../lib/server/http";
import { validateProduct } from "../../../lib/server/validate";
import { listCustomProductNames, insertProduct, removeProduct } from "../../../lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const supabase = getSupabase(getToken(request));
    const { data, error } = await listCustomProductNames(supabase);
    if (error) return fromDbError(error);
    return ok({ names: data });
  } catch (e) {
    return fail(500, e.message);
  }
}

export async function POST(request) {
  try {
    const auth = await requireEditor(request);
    if (auth.response) return auth.response;

    const body = await request.json().catch(() => null);
    const msg = validateProduct(body);
    if (msg) return fail(400, msg);

    const { error } = await insertProduct(auth.supabase, body);
    if (error) return fromDbError(error);
    return ok({ created: body.id }, 201);
  } catch (e) {
    return fail(500, e.message);
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireEditor(request);
    if (auth.response) return auth.response;

    const id = new URL(request.url).searchParams.get("id");
    if (!id) return fail(400, "Parameter id wajib diisi.");

    const { error, deleted } = await removeProduct(auth.supabase, id);
    if (error) return fromDbError(error);
    if (deleted === 0) return fail(404, "Produk tambahan tidak ditemukan.");
    return ok({ deleted });
  } catch (e) {
    return fail(500, e.message);
  }
}
