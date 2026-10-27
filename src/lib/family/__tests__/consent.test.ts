import { describe, it, expect, vi } from "vitest";
import { hasUserConsented, recordUserConsent } from "../consent";

describe("Phase 1: Consent Gating & Medical Notice Tracking", () => {
  it("returns false when user has not yet accepted terms and medical disclaimer", async () => {
    const chainableEq: any = vi.fn();
    chainableEq.mockReturnValue({
      eq: chainableEq,
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: chainableEq,
        }),
      }),
    };

    const consented = await hasUserConsented(mockClient as any, "user-unconsented");
    expect(consented).toBe(false);
  });

  it("records user consent with timestamp and type, returning true", async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: { id: "c-1" }, error: null });
    const mockClient = {
      from: vi.fn().mockReturnValue({
        insert: mockInsert,
      }),
    };

    const success = await recordUserConsent(mockClient as any, {
      userId: "user-new",
      type: "terms_and_disclaimer",
      version: "1.0",
      userAgent: "Mozilla/5.0",
    });

    expect(success).toBe(true);
    expect(mockClient.from).toHaveBeenCalledWith("consents");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-new",
        type: "terms_and_disclaimer",
        version: "1.0",
        user_agent: "Mozilla/5.0",
      })
    );
  });

  it("returns true when an active consent record is found", async () => {
    const chainableEq: any = vi.fn();
    chainableEq.mockReturnValue({
      eq: chainableEq,
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "c-1",
          user_id: "user-consented",
          type: "terms_and_disclaimer",
          accepted_at: "2026-10-27T10:00:00Z",
        },
        error: null,
      }),
    });

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: chainableEq,
        }),
      }),
    };

    const consented = await hasUserConsented(mockClient as any, "user-consented");
    expect(consented).toBe(true);
  });
});
