export function parseCookies(request) {
  const header = request.headers.get("Cookie") || "";
  const cookies = {};
  header.split(";").forEach((pair) => {
    const separatorIndex = pair.indexOf("=");
    if (separatorIndex === -1) return;
    const name = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    if (name) cookies[name] = value;
  });
  return cookies;
}

function assertHostPrefix(name) {
  if (!name.startsWith("__Host-")) {
    throw new Error(`cookie "${name}" precisa usar o prefixo __Host-`);
  }
}

export function buildHostCookie(name, value, { maxAge, sameSite }) {
  assertHostPrefix(name);
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=${maxAge}`;
}

export function expireHostCookie(name, { sameSite }) {
  assertHostPrefix(name);
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=0`;
}
