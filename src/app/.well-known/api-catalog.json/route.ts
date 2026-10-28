import { NextResponse } from "next/server";

export async function GET() {
  const linkset = {
    linkset: [
      {
        anchor: "https://med-record-delta.vercel.app/api",
        "service-desc": [
          {
            href: "https://med-record-delta.vercel.app/openapi.yaml",
            type: "application/yaml",
          },
          {
            href: "https://med-record-delta.vercel.app/openapi.json",
            type: "application/vnd.oai.openapi+json",
          },
        ],
        "service-doc": [
          {
            href: "https://med-record-delta.vercel.app/services",
            type: "text/html",
          },
        ],
      },
    ],
  };

  return NextResponse.json(linkset, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
