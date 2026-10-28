import { describe, it, expect } from "vitest";
import { GET as getOidc } from "../openid-configuration/route";
import { GET as getOAuth } from "../oauth-authorization-server/route";

describe("OAuth & OIDC Discovery Endpoints", () => {
  it("openid-configuration returns HTTP 200 with issuer and authorization_endpoint", async () => {
    const res = await getOidc();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.issuer).toBe("https://med-record-delta.vercel.app");
    expect(data.authorization_endpoint).toBe("https://med-record-delta.vercel.app/login");
    expect(data.token_endpoint).toBe("https://med-record-delta.vercel.app/api/auth/token");
    expect(data.jwks_uri).toBe("https://med-record-delta.vercel.app/.well-known/jwks.json");
  });

  it("oauth-authorization-server returns HTTP 200 with issuer and authorization_endpoint", async () => {
    const res = await getOAuth();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.issuer).toBe("https://med-record-delta.vercel.app");
    expect(data.authorization_endpoint).toBe("https://med-record-delta.vercel.app/login");
    expect(data.token_endpoint).toBe("https://med-record-delta.vercel.app/api/auth/token");
  });
});
