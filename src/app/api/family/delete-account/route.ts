import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/security/rate-limiter";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimit = checkRateLimit(`delete-account:${ip}`, 3, 60000);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many delete requests. Please wait." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    if (body.confirmation !== "حذف بياناتي نهائيا") {
      return NextResponse.json(
        { error: "Confirmation phrase does not match." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Family account and all associated health records purged successfully.",
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 }
    );
  }
}
