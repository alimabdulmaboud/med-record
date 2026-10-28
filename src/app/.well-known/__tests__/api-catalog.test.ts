import { describe, it, expect } from "vitest";
import { GET } from "../api-catalog/route";

describe("API Catalog Endpoint (/.well-known/api-catalog)", () => {
  it("returns HTTP 200 and valid RFC 9727 linkset pointing to OpenAPI file", async () => {
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/linkset+json");
    expect(data.linkset).toBeDefined();
    expect(Array.isArray(data.linkset)).toBe(true);

    const entry = data.linkset[0];
    expect(entry.anchor).toBe("https://med-record-delta.vercel.app/api");

    const openApiLink = entry["service-desc"].find(
      (desc: { href: string; type: string }) =>
        desc.href.includes("openapi.yaml") || desc.href.includes("openapi.json")
    );
    expect(openApiLink).toBeDefined();
    expect(openApiLink.href).toBe("https://med-record-delta.vercel.app/openapi.yaml");
  });
});
