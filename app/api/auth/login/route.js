// BACKEND — POST /api/auth/login
import { ok, fail } from "../../../../lib/server/http";
import { login } from "../../../../lib/server/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (
      !body ||
      typeof body.username !== "string" || !body.username.trim() ||
      typeof body.password !== "string" || !body.password.trim() ||
      (body.expectedRole !== "editor" && body.expectedRole !== "viewer")
    ) {
      return fail(400, "username, password, dan expectedRole wajib diisi.");
    }
    const result = await login(body);
    if (!result.ok) return fail(401, "Login gagal.", { reason: result.reason });
    return ok({
      role: result.role,
      name: result.name,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (e) {
    return fail(500, e.message);
  }
}
