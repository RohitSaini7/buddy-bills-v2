import { expect, test, describe, beforeEach } from "bun:test";
import { RateLimiter } from "./rate-limit";

describe("RateLimiter", () => {
  beforeEach(() => {
    // Clear global cache if needed, but since it's a sliding window based on time,
    // we can just use unique keys per test.
  });

  test("allows requests under the limit", async () => {
    const key = `test_under_${Date.now()}`;
    const limit = 3;
    const windowMs = 10000;

    const res1 = await RateLimiter.check(key, limit, windowMs);
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = await RateLimiter.check(key, limit, windowMs);
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = await RateLimiter.check(key, limit, windowMs);
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  test("blocks requests over the limit", async () => {
    const key = `test_over_${Date.now()}`;
    const limit = 2;
    const windowMs = 10000;

    await RateLimiter.check(key, limit, windowMs);
    await RateLimiter.check(key, limit, windowMs);

    // 3rd request should fail
    const res3 = await RateLimiter.check(key, limit, windowMs);
    expect(res3.success).toBe(false);
    expect(res3.remaining).toBe(0);
    expect(res3.reset).toBeGreaterThan(Date.now());
  });
});
