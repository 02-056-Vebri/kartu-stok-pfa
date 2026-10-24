// BACKEND — POST /api/auth/refresh (memperpanjang sesi login yang kedaluwarsa)
import { ok, fail } from "../../../../lib/server/http";
import { refresh } from "../../../../lib/server/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.refreshToken !== "string" || !body.refreshToken) {
      return fail(400, "refreshToken wajib diisi.");
    }
    const result = await refresh(body.refreshToken);
    if (!result.ok) return fail(401, "Sesi tidak bisa diperpanjang. Silakan login ulang.");
    return ok({ accessToken: result.accessToken, refreshToken: result.refreshToken });
  } catch (e) {
    return fail(500, e.message);
  }
}
