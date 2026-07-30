import { Redis } from "@upstash/redis";

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

const globalForRateLimit = globalThis as unknown as {
  rateLimitCache?: Map<string, number[]>;
  cleanupInterval?: NodeJS.Timeout;
};

const cache = globalForRateLimit.rateLimitCache ?? new Map<string, number[]>();
if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.rateLimitCache = cache;
}

if (!globalForRateLimit.cleanupInterval) {
  // Clean up cache every 5 minutes to prevent memory leaks
  globalForRateLimit.cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of cache.entries()) {
      // Remove timestamps older than 1 hour
      const valid = timestamps.filter((t) => now - t < 3600000);
      if (valid.length === 0) {
        cache.delete(key);
      } else {
        cache.set(key, valid);
      }
    }
  }, 300000);

  // Prevent the interval from keeping the process alive
  globalForRateLimit.cleanupInterval.unref?.();
}

// Resilient Redis Initialization
let redisClient: Redis | null = null;
let isRedisFallback = false;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (e) {
    console.error("Failed to initialize Upstash Redis client. Falling back to memory.", e);
    isRedisFallback = true;
  }
}

export class RateLimiter {
  /**
   * Check if a key is rate limited.
   * Uses Redis sliding window log with unique member IDs.
   * Automatically degrades to local in-memory log if Redis fails.
   */
  static async check(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - windowMs;

    // 1. Attempt Redis Rate Limiter
    if (redisClient && !isRedisFallback) {
      try {
        const redisKey = `ratelimit:${key}`;
        const uniqueMember = `${now}-${Math.random().toString(36).slice(2, 7)}`;

        const p = redisClient.pipeline();
        p.zremrangebyscore(redisKey, 0, windowStart);
        p.zadd(redisKey, { score: now, member: uniqueMember });
        p.zcard(redisKey);
        p.expire(redisKey, Math.ceil(windowMs / 1000));

        const results = await p.exec();
        const currentRequests = results[2] as number;

        if (currentRequests > limit) {
          // Fetch oldest entry score to calculate accurate reset time
          const oldestRecords = await redisClient.zrange(redisKey, 0, 0, { withScores: true });
          const oldest = oldestRecords.length > 1 ? Number(oldestRecords[1]) : now;
          const reset = oldest + windowMs;

          return {
            success: false,
            limit,
            remaining: 0,
            reset,
          };
        }

        return {
          success: true,
          limit,
          remaining: limit - currentRequests,
          reset: now + windowMs,
        };
      } catch (e) {
        console.error("Redis rate limit check failed. Falling back to memory.", e);
        // Do not throw. Continue executing to fall back gracefully.
      }
    }

    // 2. Local In-Memory Fallback
    let timestamps = cache.get(key) || [];
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= limit) {
      const oldest = timestamps[0];
      const reset = oldest + windowMs;
      cache.set(key, timestamps);
      return {
        success: false,
        limit,
        remaining: 0,
        reset,
      };
    }

    timestamps.push(now);
    cache.set(key, timestamps);

    return {
      success: true,
      limit,
      remaining: limit - timestamps.length,
      reset: now + windowMs,
    };
  }
}
