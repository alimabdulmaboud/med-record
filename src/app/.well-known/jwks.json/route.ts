import { NextResponse } from "next/server";

export async function GET() {
  const jwks = {
    keys: [
      {
        kty: "RSA",
        use: "sig",
        alg: "RS256",
        kid: "med-record-key-1",
        n: "u1L7Z...",
        e: "AQAB",
      },
    ],
  };

  return NextResponse.json(jwks, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
