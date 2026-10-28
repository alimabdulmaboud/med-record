import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "public", "openapi.json");
  const jsonContent = fs.readFileSync(filePath, "utf-8");

  return new NextResponse(jsonContent, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.oai.openapi+json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
