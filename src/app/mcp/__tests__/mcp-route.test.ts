import { describe, it, expect } from "vitest";
import { POST, GET } from "../route";
import { NextRequest } from "next/server";

describe("MCP Endpoint (/mcp)", () => {
  it("responds to GET with server status and endpoint info", async () => {
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.name).toBe("med-record");
    expect(data.status).toBe("ready");
  });

  it("handles initialize handshake correctly", async () => {
    const req = new NextRequest("https://med-record-delta.vercel.app/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.jsonrpc).toBe("2.0");
    expect(data.id).toBe(1);
    expect(data.result.serverInfo.name).toBe("med-record");
    expect(data.result.protocolVersion).toBe("2024-11-05");
    expect(data.result.capabilities.tools).toBeDefined();
  });

  it("handles ping request", async () => {
    const req = new NextRequest("https://med-record-delta.vercel.app/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 42,
        method: "ping",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe(42);
    expect(data.result).toEqual({});
  });

  it("handles tools/list request", async () => {
    const req = new NextRequest("https://med-record-delta.vercel.app/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 99,
        method: "tools/list",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe(99);
    expect(data.result.tools.length).toBeGreaterThan(0);
    expect(data.result.tools[0].name).toBe("get_platform_specs");
  });
});
