import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimiter } from "../rate-limiter";

describe("Phase 1: Rate Limiter for Auth & Sensitive Endpoints", () => {
  beforeEach(() => {
    resetRateLimiter();
  });

  it("allows requests under the limit within the time window", () => {
    const key = "ip:192.168.1.1:auth";
    const maxRequests = 3;
    const windowMs = 60000;

    const res1 = checkRateLimit(key, maxRequests, windowMs);
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = checkRateLimit(key, maxRequests, windowMs);
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = checkRateLimit(key, maxRequests, windowMs);
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("blocks requests that exceed the limit within the time window", () => {
    const key = "ip:10.0.0.1:auth";
    const maxRequests = 2;
    const windowMs = 60000;

    checkRateLimit(key, maxRequests, windowMs);
    checkRateLimit(key, maxRequests, windowMs);

    const blocked = checkRateLimit(key, maxRequests, windowMs);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });
});
