/**
 * In-memory rate limiter with sliding window.
 * For multi-instance deployments, replace with Redis-backed implementation.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  const keys = Array.from(store.keys());
  for (const key of keys) {
    const entry = store.get(key)!;
    entry.timestamps = entry.timestamps.filter((ts: number) => now - ts < 3600_000);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  /** Maximum number of requests allowed within the window */
  maxAttempts: number;
  /** Time window in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of remaining attempts in the current window */
  remaining: number;
  /** Milliseconds until the oldest attempt expires (reset time) */
  retryAfterMs: number;
}

/**
 * Check rate limit for a given key (e.g., IP address or email).
 * Returns whether the request is allowed and metadata.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key) || { timestamps: [] };

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter(
    (t) => now - t < config.windowMs
  );

  if (entry.timestamps.length >= config.maxAttempts) {
    const oldestTimestamp = entry.timestamps[0];
    const retryAfterMs = config.windowMs - (now - oldestTimestamp);

    return {
      allowed: false,
      remaining: 0,
      retryAfterMs,
    };
  }

  // Record this attempt
  entry.timestamps.push(now);
  store.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxAttempts - entry.timestamps.length,
    retryAfterMs: 0,
  };
}

/**
 * Get the count of attempts in the current window without recording a new one.
 */
export function getAttemptCount(key: string, windowMs: number): number {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry) return 0;

  return entry.timestamps.filter((t) => now - t < windowMs).length;
}

/**
 * Reset rate limit for a key (e.g., after successful login).
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

// ─── Preset Configurations ──────────────────────────────────────────

/** 5 login attempts per 15 minutes per IP */
export const LOGIN_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
};

/** 10 login attempts per 15 minutes per IP (more lenient, per-IP) */
export const LOGIN_IP_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 10,
  windowMs: 15 * 60 * 1000,
};

/** 3 signup attempts per hour per IP */
export const SIGNUP_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000,
};

/** 5 password change attempts per hour */
export const PASSWORD_CHANGE_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 60 * 60 * 1000,
};

/** Account lockout: 5 failed attempts triggers 15 min lockout */
export const ACCOUNT_LOCKOUT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
};
