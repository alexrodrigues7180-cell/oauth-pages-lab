export const PROVIDERS = {
  google: {
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    issuer: "https://accounts.google.com",
    scope: "openid email profile",
  },
  github: {
    authorizationEndpoint: "https://github.com/login/oauth/authorize",
    tokenEndpoint: "https://github.com/login/oauth/access_token",
    userEndpoint: "https://api.github.com/user",
    issuer: "https://github.com",
    revokeEndpoint: (clientId) => `https://api.github.com/applications/${clientId}/grant`,
  },
};

export function isSupportedProvider(provider) {
  return provider === "google" || provider === "github";
}
