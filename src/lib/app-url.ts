/**
 * Returns the canonical application base URL configured via AUTH_URL.
 * Supports Vercel deployment URL fallback and local development fallback.
 * Always returns a clean URL without trailing slashes.
 */
export function getAppUrl(): string {
  if (process.env.AUTH_URL) {
    return process.env.AUTH_URL.replace(/\/+$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/+$/, "")}`;
  }
  return "http://localhost:3000";
}

