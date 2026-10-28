import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "public", "openapi.yaml");
  const yamlContent = fs.readFileSync(filePath, "utf-8");

  return new NextResponse(yamlContent, {
    status: 200,
    headers: {
      "Content-Type": "application/yaml",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
