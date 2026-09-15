import { sha256Hex } from "../_shared/crypto.js";
import { parseCookies, expireHostCookie } from "../_shared/cookies.js";

export async function onRequestPost(context) {
  const env = context.env;
  const origin = context.request.headers.get("Origin");
  if (origin !== env.PUBLIC_BASE_URL) {
    return new Response(null, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const cookies = parseCookies(context.request);
  const sessionId = cookies["__Host-session"];
  if (sessionId) {
    const sessionHash = await sha256Hex(sessionId);
    await env.DB.prepare("DELETE FROM sessions WHERE id_hash = ?").bind(sessionHash).run();
  }

  const headers = new Headers({ "Cache-Control": "no-store" });
  headers.append("Set-Cookie", expireHostCookie("__Host-session", { sameSite: "Strict" }));

  return new Response(null, { status: 204, headers });
}
