// BACKEND — POST /api/auth/logout (mencabut sesi di Supabase)
import { ok, fail, getToken } from "../../../../lib/server/http";
import { revokeToken } from "../../../../lib/server/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const token = getToken(request);
    if (token) await revokeToken(token);
    return ok({ loggedOut: true });
  } catch (e) {
    return fail(500, e.message);
  }
}
