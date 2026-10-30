/**
 * In-memory rate limiter for login attempts and security-sensitive actions.
 * TODO: Move rate-limiting store to Upstash Redis for distributed/serverless multi-instance support.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Checks and increments rate limit counter for a specific key.
 *
 * @param key Unique identifier (e.g., lowercase email + IP)
 * @param maxAttempts Maximum attempts allowed within the window
 * @param windowMs Time window in milliseconds
 * @returns Object indicating if the request is allowed and remaining attempts
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = MAX_LOGIN_ATTEMPTS,
  windowMs: number = LOGIN_WINDOW_MS
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Clean expired record or initialize new
  if (!record || now > record.resetAt) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, newRecord);
    return {
      success: true,
      remaining: maxAttempts - 1,
      resetAt: newRecord.resetAt,
    };
  }

  if (record.count >= maxAttempts) {
    return {
      success: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  record.count += 1;
  return {
    success: true,
    remaining: maxAttempts - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Convenience helper specifically for login attempts.
 */
export function checkLoginRateLimit(
  email: string,
  ip: string = "unknown"
): { success: boolean; remaining: number; resetAt: number } {
  const normalizedKey = `login:${email.trim().toLowerCase()}:${ip}`;
  return checkRateLimit(normalizedKey, MAX_LOGIN_ATTEMPTS, LOGIN_WINDOW_MS);
}

