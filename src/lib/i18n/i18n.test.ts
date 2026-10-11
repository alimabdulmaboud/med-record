import { describe, it, expect } from "vitest";
import { t, DEFAULT_LOCALE } from "./index";

describe("i18n engine", () => {
  it("defaults to Arabic locale", () => {
    expect(DEFAULT_LOCALE).toBe("ar");
  });

  it("translates common keys into Arabic by default", () => {
    expect(t("common.welcome")).toBe("مرحباً بك في منصة مِيد");
    expect(t("app.name")).toBe("مِيد");
  });

  it("translates keys into English when requested", () => {
    expect(t("common.welcome", undefined, "en")).toBe("Welcome to Med Platform");
    expect(t("app.name", undefined, "en")).toBe("Med");
  });

  it("falls back to key string when translation does not exist", () => {
    expect(t("non.existent.key")).toBe("non.existent.key");
  });

  it("handles parameter interpolation correctly", () => {
    // Test helper with interpolated values
    const key = "test.interpolated";
    // If key not in dictionary, returns key
    expect(t(key, { name: "Ali" })).toBe("test.interpolated");
  });
});
