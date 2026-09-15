import { randomBase64Url, sha256Base64Url, sha256Hex } from "../../_shared/crypto.js";
import { buildHostCookie } from "../../_shared/cookies.js";
import { PROVIDERS, isSupportedProvider } from "../../_shared/providers.js";

const TX_TTL_SECONDS = 600;

export async function onRequestGet(context) {
  const { provider } = context.params;
  if (!isSupportedProvider(provider)) {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const env = context.env;
  const config = PROVIDERS[provider];
  const redirectUri = `${env.PUBLIC_BASE_URL}/oauth/callback/${provider}`;
  const clientId = provider === "google" ? env.GOOGLE_CLIENT_ID : env.GITHUB_CLIENT_ID;

  const txId = randomBase64Url(32);
  const state = randomBase64Url(32);
  const codeVerifier = randomBase64Url(32);
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const nonce = provider === "google" ? randomBase64Url(32) : null;

  const idHash = await sha256Hex(txId);
  const stateHash = await sha256Hex(state);
  const expiresAt = Math.floor(Date.now() / 1000) + TX_TTL_SECONDS;

  await env.DB.prepare(
    `INSERT INTO oauth_transactions (id_hash, provider, state_hash, nonce, code_verifier, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(idHash, provider, stateHash, nonce, codeVerifier, expiresAt)
    .run();

  const authUrl = new URL(config.authorizationEndpoint);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  if (provider === "google") {
    authUrl.searchParams.set("scope", config.scope);
    authUrl.searchParams.set("nonce", nonce);
  }

  const headers = new Headers({
    Location: authUrl.toString(),
    "Cache-Control": "no-store",
  });
  headers.append(
    "Set-Cookie",
    buildHostCookie("__Host-oauth-tx", txId, { maxAge: TX_TTL_SECONDS, sameSite: "Lax" })
  );

  return new Response(null, { status: 302, headers });
}
