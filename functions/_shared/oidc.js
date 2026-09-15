import { base64UrlToUint8Array } from "./crypto.js";

const GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration";
const CLOCK_SKEW_SECONDS = 60;

function decodeJwtSegment(segment) {
  const bytes = base64UrlToUint8Array(segment);
  const text = new TextDecoder().decode(bytes);
  return JSON.parse(text);
}

export async function verifyGoogleIdToken(idToken, { clientId, nonce }) {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("id_token malformado");
  const [headerB64, payloadB64, signatureB64] = parts;

  const header = decodeJwtSegment(headerB64);
  if (header.alg !== "RS256") throw new Error("alg inesperado no id_token");

  const discoveryResponse = await fetch(GOOGLE_DISCOVERY_URL);
  if (!discoveryResponse.ok) throw new Error("falha ao obter o documento de descoberta OIDC");
  const discovery = await discoveryResponse.json();

  const jwksResponse = await fetch(discovery.jwks_uri);
  if (!jwksResponse.ok) throw new Error("falha ao obter o JWKS");
  const jwks = await jwksResponse.json();

  const jwk = jwks.keys.find((key) => key.kid === header.kid);
  if (!jwk) throw new Error("chave pública não encontrada para o kid informado");

  const publicKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlToUint8Array(signatureB64);
  const isValid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, signature, signedData);
  if (!isValid) throw new Error("assinatura do id_token inválida");

  const payload = decodeJwtSegment(payloadB64);
  const now = Math.floor(Date.now() / 1000);

  if (payload.iss !== discovery.issuer) throw new Error("iss inválido");
  if (payload.aud !== clientId) throw new Error("aud inválido");
  if (typeof payload.exp !== "number" || now > payload.exp + CLOCK_SKEW_SECONDS) {
    throw new Error("id_token expirado");
  }
  if (typeof payload.iat !== "number" || payload.iat > now + CLOCK_SKEW_SECONDS) {
    throw new Error("iat no futuro");
  }
  if (!nonce || payload.nonce !== nonce) throw new Error("nonce inválido");

  return {
    sub: payload.sub,
    email: payload.email ?? null,
    name: payload.name ?? null,
  };
}
