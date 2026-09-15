import { sha256Hex, randomBase64Url } from "../../_shared/crypto.js";
import { parseCookies, buildHostCookie, expireHostCookie } from "../../_shared/cookies.js";
import { PROVIDERS, isSupportedProvider } from "../../_shared/providers.js";
import { verifyGoogleIdToken } from "../../_shared/oidc.js";

const SESSION_TTL_SECONDS = 8 * 60 * 60;
const GITHUB_API_VERSION = "2026-03-10";
const USER_AGENT = "oauth-pages-lab";

function rejectResponse(status) {
  return new Response(null, { status, headers: { "Cache-Control": "no-store" } });
}

async function handleGoogleCallback({ code, codeVerifier, nonce, redirectUri, env }) {
  const config = PROVIDERS.google;
  const body = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
    code_verifier: codeVerifier,
  });

  const tokenResponse = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });
  if (!tokenResponse.ok) throw new Error("falha na troca de tokens do Google");
  const tokenData = await tokenResponse.json();
  if (!tokenData.id_token) throw new Error("id_token ausente na resposta do Google");

  const claims = await verifyGoogleIdToken(tokenData.id_token, {
    clientId: env.GOOGLE_CLIENT_ID,
    nonce,
  });

  return {
    issuer: config.issuer,
    subject: claims.sub,
    email: claims.email,
    displayName: claims.name,
  };
}

async function handleGithubCallback({ code, codeVerifier, redirectUri, env }) {
  const config = PROVIDERS.github;
  const body = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    client_secret: env.GITHUB_CLIENT_SECRET,
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const tokenResponse = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
    body,
  });
  if (!tokenResponse.ok) throw new Error("falha na troca de tokens do GitHub");
  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) throw new Error("access_token ausente na resposta do GitHub");
  if (!/^bearer$/i.test(tokenData.token_type || "")) throw new Error("token_type inesperado");

  const userResponse = await fetch(config.userEndpoint, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
      "User-Agent": USER_AGENT,
    },
  });
  if (userResponse.status !== 200) throw new Error("falha ao consultar /user no GitHub");
  const user = await userResponse.json();
  if (typeof user.id !== "number") throw new Error("id ausente ou inválido na resposta do GitHub");

  const revokeResponse = await fetch(config.revokeEndpoint(env.GITHUB_CLIENT_ID), {
    method: "DELETE",
    headers: {
      Authorization: `Basic ${btoa(`${env.GITHUB_CLIENT_ID}:${env.GITHUB_CLIENT_SECRET}`)}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify({ access_token: tokenData.access_token }),
  });
  if (revokeResponse.status !== 204) throw new Error("falha ao revogar a autorização no GitHub");

  return {
    issuer: config.issuer,
    subject: String(user.id),
    email: null,
    displayName: user.name || user.login,
  };
}

export async function onRequestGet(context) {
  const { provider } = context.params;
  if (!isSupportedProvider(provider)) return rejectResponse(404);

  const env = context.env;
  const url = new URL(context.request.url);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (error || !code || !state) return rejectResponse(400);

  const cookies = parseCookies(context.request);
  const txId = cookies["__Host-oauth-tx"];
  if (!txId) return rejectResponse(400);

  const idHash = await sha256Hex(txId);
  const now = Math.floor(Date.now() / 1000);

  const row = await env.DB.prepare(
    "SELECT * FROM oauth_transactions WHERE id_hash = ? AND provider = ? AND expires_at > ?"
  )
    .bind(idHash, provider, now)
    .first();
  if (!row) return rejectResponse(400);

  const stateHash = await sha256Hex(state);
  if (stateHash !== row.state_hash) return rejectResponse(400);

  await env.DB.prepare("DELETE FROM oauth_transactions WHERE id_hash = ?").bind(idHash).run();

  const redirectUri = `${env.PUBLIC_BASE_URL}/oauth/callback/${provider}`;
  let identity;
  try {
    identity =
      provider === "google"
        ? await handleGoogleCallback({ code, codeVerifier: row.code_verifier, nonce: row.nonce, redirectUri, env })
        : await handleGithubCallback({ code, codeVerifier: row.code_verifier, redirectUri, env });
  } catch (_err) {
    return rejectResponse(400);
  }

  const sessionId = randomBase64Url(32);
  const sessionHash = await sha256Hex(sessionId);
  const expiresAt = now + SESSION_TTL_SECONDS;

  await env.DB.prepare(
    `INSERT INTO sessions (id_hash, issuer, subject, email, display_name, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(sessionHash, identity.issuer, identity.subject, identity.email, identity.displayName, expiresAt, now)
    .run();

  const headers = new Headers({
    Location: env.PUBLIC_BASE_URL,
    "Cache-Control": "no-store",
  });
  headers.append(
    "Set-Cookie",
    buildHostCookie("__Host-session", sessionId, { maxAge: SESSION_TTL_SECONDS, sameSite: "Strict" })
  );
  headers.append("Set-Cookie", expireHostCookie("__Host-oauth-tx", { sameSite: "Lax" }));

  return new Response(null, { status: 302, headers });
}
