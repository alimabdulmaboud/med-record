import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { exportComprehensiveFamilyCSV, type FamilyExportPayload } from "@/lib/family/export";

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
  const format = searchParams.get("format") || "json";

  // Mock export fallback for testing/demo mode
  const payload: FamilyExportPayload = {
    schema_version: "1.0",
    platform: "Med Health Records (فضاء العائلة)",
    exported_at: new Date().toISOString(),
    family: {
      id: familyId,
      name: "عائلة أحمد مصطفى",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    members: [],
    emergency_contacts: [
      {
        id: "ec-1",
        person_id: "p-ahmed",
        name: "منى الشاذلي",
        relationship: "الزوجة",
        phone: "+201012345678",
        is_primary: true,
        created_at: new Date().toISOString(),
      },
    ],
    people: [
      {
        id: "p-ahmed",
        family_id: familyId,
        name: "أحمد مصطفى إبراهيم",
        birth_date: "1988-06-15",
        sex: "male",
        blood_type: "A+",
        allergies: ["بنسلين (Penicillin)"],
        chronic_conditions: ["ارتفاع ضغط الدم (Hypertension)"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "p-sara",
        family_id: familyId,
        name: "سارة أحمد مصطفى",
        birth_date: "2021-04-10",
        sex: "female",
        blood_type: "A+",
        allergies: ["الفول السوداني (Peanuts)"],
        chronic_conditions: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "p-yassin",
        family_id: familyId,
        name: "ياسين أحمد مصطفى",
        birth_date: "2025-08-20",
        sex: "male",
        blood_type: "O+",
        allergies: [],
        chronic_conditions: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  };

  if (format === "csv") {
    const csvContent = exportComprehensiveFamilyCSV(payload);
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="med-family-export.csv"`,
      },
    });
  }

  return NextResponse.json(payload, {
    headers: {
      "Content-Disposition": `attachment; filename="med-family-export.json"`,
    },
  });
}
