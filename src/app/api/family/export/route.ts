import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { exportFamilyData } from "@/lib/family/export";

export async function GET(request: NextRequest) {
  // Rate limiting check
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimit = checkRateLimit(`export:${ip}`, 5, 60000);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many export requests. Please try again later." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const familyId = searchParams.get("familyId") || "fam-demo";

  // Mock export fallback for testing/demo mode
  const payload = {
    schema_version: "1.0",
    platform: "Med Health Records (فضاء العائلة)",
    exported_at: new Date().toISOString(),
    family: {
      id: familyId,
      name: "عائلة أحمد مصطفى",
    },
    people: [
      {
        id: "p-ahmed",
        name: "أحمد مصطفى إبراهيم",
        birth_date: "1988-06-15",
        sex: "male",
        blood_type: "A+",
        allergies: ["بنسلين (Penicillin)"],
        chronic_conditions: ["ارتفاع ضغط الدم (Hypertension)"],
      },
      {
        id: "p-sara",
        name: "سارة أحمد مصطفى",
        birth_date: "2021-04-10",
        sex: "female",
        blood_type: "A+",
        allergies: ["الفول السوداني (Peanuts)"],
        chronic_conditions: [],
      },
      {
        id: "p-yassin",
        name: "ياسين أحمد مصطفى",
        birth_date: "2025-08-20",
        sex: "male",
        blood_type: "O+",
        allergies: [],
        chronic_conditions: [],
      },
    ],
  };

  return NextResponse.json(payload, {
    headers: {
      "Content-Disposition": `attachment; filename="med-family-export.json"`,
    },
  });
}
