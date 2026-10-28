import { NextRequest, NextResponse } from "next/server";

const SERVER_INFO = {
  name: "med-record",
  version: "1.0.0",
};

const PROTOCOL_VERSION = "2024-11-05";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, mcp-session-id",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET() {
  return NextResponse.json(
    {
      name: SERVER_INFO.name,
      version: SERVER_INFO.version,
      status: "ready",
      protocolVersion: PROTOCOL_VERSION,
      endpoints: {
        mcp: "https://med-record-delta.vercel.app/mcp",
        card: "https://med-record-delta.vercel.app/.well-known/mcp.json",
      },
    },
    { headers: CORS_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, method, params } = body;

    // Handle MCP Initialize handshake
    if (method === "initialize") {
      const requestedProtocol = params?.protocolVersion || PROTOCOL_VERSION;
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: id ?? 1,
          result: {
            protocolVersion: requestedProtocol,
            capabilities: {
              tools: {
                listChanged: false,
              },
              resources: {
                subscribe: false,
                listChanged: false,
              },
              prompts: {
                listChanged: false,
              },
            },
            serverInfo: SERVER_INFO,
            instructions:
              "Med Record MCP server provides clinical knowledge lookup, WHO child growth charts, and platform specification tools.",
          },
        },
        { headers: CORS_HEADERS }
      );
    }

    // Handle client confirmation notification
    if (method === "notifications/initialized") {
      return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
    }

    // Handle Ping
    if (method === "ping") {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: id ?? 1,
          result: {},
        },
        { headers: CORS_HEADERS }
      );
    }

    // Handle Tools Listing
    if (method === "tools/list") {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: id ?? 1,
          result: {
            tools: [
              {
                name: "get_platform_specs",
                description:
                  "Retrieve factual specifications, launch year, pricing (0 EGP), and architecture for Med Record.",
                inputSchema: {
                  type: "object",
                  properties: {},
                },
              },
              {
                name: "get_who_growth_standards",
                description:
                  "Get WHO pediatric growth percentiles and metrics (weight, height, BMI) used in Med Record.",
                inputSchema: {
                  type: "object",
                  properties: {
                    metric: {
                      type: "string",
                      enum: ["weight", "height", "bmi"],
                      description: "Growth indicator to evaluate",
                    },
                    gender: {
                      type: "string",
                      enum: ["boy", "girl"],
                      description: "Child gender",
                    },
                  },
                  required: ["metric", "gender"],
                },
              },
            ],
          },
        },
        { headers: CORS_HEADERS }
      );
    }

    // Default response for other valid JSON-RPC calls
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: id ?? 1,
        result: {},
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32700,
          message: "Parse error",
        },
      },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}
