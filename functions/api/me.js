import { sha256Hex } from "../_shared/crypto.js";
import { parseCookies } from "../_shared/cookies.js";

export async function onRequestGet(context) {
  const cookies = parseCookies(context.request);
  const sessionId = cookies["__Host-session"];
  if (!sessionId) {
    return new Response(null, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const sessionHash = await sha256Hex(sessionId);
  const now = Math.floor(Date.now() / 1000);

  const row = await context.env.DB.prepare(
    "SELECT email, display_name FROM sessions WHERE id_hash = ? AND expires_at > ?"
  )
    .bind(sessionHash, now)
    .first();

  if (!row) {
    return new Response(null, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  return Response.json(
    { email: row.email, displayName: row.display_name },
    { headers: { "Cache-Control": "no-store" } }
  );
}
