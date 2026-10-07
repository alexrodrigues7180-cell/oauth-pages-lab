import { parseCookies } from "../_shared/cookies.js";

// GET /api/sessoes?email=... -> quantas sessoes vivas aquele e-mail tem.
// Exige o cookie de sessao; nao e um endpoint publico.
export async function onRequestGet(context) {
  const cookies = parseCookies(context.request);
  if (!cookies["__Host-session"]) {
    return new Response(null, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const email = new URL(context.request.url).searchParams.get("email") ?? "";
  const now = Math.floor(Date.now() / 1000);

  const row = await context.env.DB.prepare(
    `SELECT COUNT(*) AS total FROM sessions WHERE email = '${email}' AND expires_at > ${now}`
  ).first();

  return Response.json(
    { email, total: row.total },
    { headers: { "Cache-Control": "no-store" } }
  );
}
