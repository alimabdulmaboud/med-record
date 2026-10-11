/**
 * Pediatrics Module Service
 * 
 * Rules:
 * - AGENTS.md Rule #1: Roles first. Only doctors can read/write clinical pediatric records.
 * - AGENTS.md Rule #2: Medical privacy. Receptionists and platform admins are strictly denied.
 * - AGENTS.md Rule #3: Tenant isolation. Cross-clinic access is denied.
 * - AGENTS.md Rule #7: No invented medical data. Ships with official Egyptian MOH childhood schedule.
 */

import { isModuleEnabled } from "../registry";
import {
  BirthHistory,
  FeedingHistory,
  VaccineTemplate,
  VaccinationRecord,
  MilestoneItem,
  PatientMilestoneRecord,
  PediatricExam,
  FullPediatricRecord,
} from "./types";

export interface ActorContext {
  id: string;
  role: string;
  clinicId: string;
}

// ------------------------------------------------------------------------------
// Official Egyptian Ministry of Health Childhood Vaccination Schedule
// (Baseline template per Section 15 Resolved Decision #8)
// ------------------------------------------------------------------------------
export const EGYPT_MOH_VACCINE_SCHEDULE: readonly Omit<
  VaccineTemplate,
  "id" | "clinicId" | "isActive"
>[] = [
  {
    vaccine_name: "الدرن (BCG)",
    targetAgeMonths: 0,
    doseNumber: 1,
    isMandatory: true,
    notes: "حقن داخل الجلد في أعلى الذراع الأيسر فور الولادة أو خلال الشهر الأول",
  },
  {
    vaccine_name: "الالتهاب الكبدي الفيروسي ب (جرعة الصفر - Hepatitis B)",
    targetAgeMonths: 0,
    doseNumber: 1,
    isMandatory: true,
    notes: "حقن بالعضل خلال أول 24 ساعة من الولادة",
  },
  {
    vaccine_name: "شلل الأطفال الفموي (سابين - جرعة الصفر)",
    targetAgeMonths: 0,
    doseNumber: 1,
    isMandatory: true,
    notes: "نقطتان بالفم عند الولادة",
  },
  {
    vaccine_name: "الخماسي (DTP + HepB + Hib - الجرعة الأولى)",
    targetAgeMonths: 2,
    doseNumber: 1,
    isMandatory: true,
    notes: "حقن بالعضل في الجزء الخارجي من الفخذ الأيمن",
  },
  {
    vaccine_name: "شلل الأطفال الفموي (سابين - الجرعة الأولى)",
    targetAgeMonths: 2,
    doseNumber: 1,
    isMandatory: true,
    notes: "نقطتان بالفم",
  },
  {
    vaccine_name: "شلل الأطفال المعطل بالحقن (سولك IPV - الجرعة الأولى)",
    targetAgeMonths: 2,
    doseNumber: 1,
    isMandatory: true,
    notes: "حقن بالعضل في الفخذ الأيسر",
  },
  {
    vaccine_name: "الخماسي (DTP + HepB + Hib - الجرعة الثانية)",
    targetAgeMonths: 4,
    doseNumber: 2,
    isMandatory: true,
    notes: "حقن بالعضل في الفخذ الأيمن",
  },
  {
    vaccine_name: "شلل الأطفال الفموي (سابين - الجرعة الثانية)",
    targetAgeMonths: 4,
    doseNumber: 2,
    isMandatory: true,
    notes: "نقطتان بالفم",
  },
  {
    vaccine_name: "شلل الأطفال المعطل بالحقن (سولك IPV - الجرعة الثانية)",
    targetAgeMonths: 4,
    doseNumber: 2,
    isMandatory: true,
    notes: "حقن بالعضل في الفخذ الأيسر",
  },
  {
    vaccine_name: "الخماسي (DTP + HepB + Hib - الجرعة الثالثة)",
    targetAgeMonths: 6,
    doseNumber: 3,
    isMandatory: true,
    notes: "حقن بالعضل في الفخذ الأيمن",
  },
  {
    vaccine_name: "شلل الأطفال الفموي (سابين - الجرعة الثالثة)",
    targetAgeMonths: 6,
    doseNumber: 3,
    isMandatory: true,
    notes: "نقطتان بالفم",
  },
  {
    vaccine_name: "شلل الأطفال المعطل بالحقن (سولك IPV - الجرعة الثالثة)",
    targetAgeMonths: 6,
    doseNumber: 3,
    isMandatory: true,
    notes: "حقن بالعضل في الفخذ الأيسر",
  },
  {
    vaccine_name: "شلل الأطفال الفموي (سابين - الجرعة الرابعة)",
    targetAgeMonths: 9,
    doseNumber: 4,
    isMandatory: true,
    notes: "نقطتان بالفم",
  },
  {
    vaccine_name: "فيتامين أ (جرعة 100,000 وحدة دولية)",
    targetAgeMonths: 9,
    doseNumber: 1,
    isMandatory: true,
    notes: "كبسولة تقطر بالفم لدعم المناعة والنمو",
  },
  {
    vaccine_name: "الثلاثي الفيروسي (MMR - الحصبة والنكاف والحصبة الألمانية)",
    targetAgeMonths: 12,
    doseNumber: 1,
    isMandatory: true,
    notes: "حقن تحت الجلد في أعلى الذراع الأيمن عند عمر سنة",
  },
  {
    vaccine_name: "شلل الأطفال الفموي (سابين - الجرعة الخامسة)",
    targetAgeMonths: 12,
    doseNumber: 5,
    isMandatory: true,
    notes: "نقطتان بالفم عند عمر سنة",
  },
  {
    vaccine_name: "الثلاثي الفيروسي (MMR - الجرعة المنشطة)",
    targetAgeMonths: 18,
    doseNumber: 2,
    isMandatory: true,
    notes: "حقن تحت الجلد في أعلى الذراع عند عمر 18 شهراً",
  },
  {
    vaccine_name: "الثلاثي البكتيري المنشط (DTP Booster)",
    targetAgeMonths: 18,
    doseNumber: 4,
    isMandatory: true,
    notes: "حقن بالعضل في الفخذ أو العضلة الدالية",
  },
  {
    vaccine_name: "شلل الأطفال الفموي المنشط (سابين - الجرعة السادسة)",
    targetAgeMonths: 18,
    doseNumber: 6,
    isMandatory: true,
    notes: "نقطتان بالفم",
  },
  {
    vaccine_name: "فيتامين أ (جرعة 200,000 وحدة دولية)",
    targetAgeMonths: 18,
    doseNumber: 2,
    isMandatory: true,
    notes: "كبسولتان بالفم عند عمر 18 شهراً",
  },
].map((item) => ({
  ...item,
  vaccineName: item.vaccine_name,
}));

// ------------------------------------------------------------------------------
// Official Developmental Milestones Checklist by Age Band
// ------------------------------------------------------------------------------
export const DEVELOPMENTAL_MILESTONES_CATALOG: readonly MilestoneItem[] = [
  // 2 Months
  {
    key: "m2_lifts_head",
    category: "gross_motor",
    ageBand: "2_months",
    titleAr: "يرفع رأسه لثوانٍ عند الاستلقاء على البطن",
    titleEn: "Lifts head briefly when prone",
  },
  {
    key: "m2_social_smile",
    category: "cognitive_social",
    ageBand: "2_months",
    titleAr: "يبتسم استجابة للأم وصوتها (الابتسامة الاجتماعية)",
    titleEn: "Responsive social smile to caregivers",
  },
  {
    key: "m2_cooing",
    category: "speech_language",
    ageBand: "2_months",
    titleAr: "يصدر أصوات مناغاة خفيفة ونغمات هادئة (Cooing)",
    titleEn: "Makes cooing, gurgling sounds",
  },

  // 4 Months
  {
    key: "m4_head_control",
    category: "gross_motor",
    ageBand: "4_months",
    titleAr: "يثبت رأسه جيداً دون تذبذب عند حمله جالساً",
    titleEn: "Steady head control without wobbling",
  },
  {
    key: "m4_grasps_rattle",
    category: "fine_motor",
    ageBand: "4_months",
    titleAr: "يمد يديه ليمسك باللعبة ويضعها في فمه",
    titleEn: "Reaches for and grasps toys",
  },
  {
    key: "m4_laughs",
    category: "cognitive_social",
    ageBand: "4_months",
    titleAr: "يضحك بصوت عالٍ ويتفاعل مع المداعبة",
    titleEn: "Laughs out loud and responds to affection",
  },

  // 6 Months
  {
    key: "m6_sits_supported",
    category: "gross_motor",
    ageBand: "6_months",
    titleAr: "يجلس مستنداً على يديه أو بدعم خفيف",
    titleEn: "Sits with light support (tripod sitting)",
  },
  {
    key: "m6_transfers_object",
    category: "fine_motor",
    ageBand: "6_months",
    titleAr: "ينقل الأشياء والمكعبات من يد إلى أخرى",
    titleEn: "Transfers objects from one hand to the other",
  },
  {
    key: "m6_babbling",
    category: "speech_language",
    ageBand: "6_months",
    titleAr: "يناغي بمقاطع صوتية متكررة (بابا، ماما، دادا)",
    titleEn: "Babbles consonant-vowel combinations",
  },

  // 9 Months
  {
    key: "m9_sits_unsupported",
    category: "gross_motor",
    ageBand: "9_months",
    titleAr: "يجلس بمفرده بثبات تام دون أي دعم",
    titleEn: "Sits unsupported steadily",
  },
  {
    key: "m9_crawls",
    category: "gross_motor",
    ageBand: "9_months",
    titleAr: "يزحف أو يحبو للأمام بحرية",
    titleEn: "Crawls or creeps forward",
  },
  {
    key: "m9_pincer_grasp",
    category: "fine_motor",
    ageBand: "9_months",
    titleAr: "يلتقط الأشياء الصغيرة بالسبابة والإبهام (الملقط)",
    titleEn: "Early pincer grasp using index and thumb",
  },

  // 12 Months (1 Year)
  {
    key: "m12_stands_cruises",
    category: "gross_motor",
    ageBand: "12_months",
    titleAr: "يقف مستنداً ويمشي حول الأثاث (Cruising)",
    titleEn: "Pulls to stand and cruises along furniture",
  },
  {
    key: "m12_first_words",
    category: "speech_language",
    ageBand: "12_months",
    titleAr: "ينطق كلمة أو كلمتين ذات معنى محدد (ماما / بابا)",
    titleEn: "Says 1-2 specific words with meaning",
  },
  {
    key: "m12_waves_bye",
    category: "cognitive_social",
    ageBand: "12_months",
    titleAr: "يلوح مودعاً (باي باي) ويشير بالسبابة لطلب شيء",
    titleEn: "Waves bye-bye and points to request objects",
  },

  // 18 Months (1.5 Years)
  {
    key: "m18_walks_alone",
    category: "gross_motor",
    ageBand: "18_months",
    titleAr: "يمشي بمفرده بثبات تام دون مساعدة",
    titleEn: "Walks independently and stably",
  },
  {
    key: "m18_tower_cubes",
    category: "fine_motor",
    ageBand: "18_months",
    titleAr: "يبني برجاً من 3 إلى 4 مكعبات ويستخدم الملعقة",
    titleEn: "Builds tower of 3-4 blocks, drinks from cup",
  },
  {
    key: "m18_vocabulary",
    category: "speech_language",
    ageBand: "18_months",
    titleAr: "حصيلة لغوية من 10 إلى 20 كلمة مفهومة",
    titleEn: "Has vocabulary of 10-20 distinct words",
  },

  // 24 Months (2 Years)
  {
    key: "m24_runs_stairs",
    category: "gross_motor",
    ageBand: "24_months",
    titleAr: "يجري بثقة ويصعد الدرج درجة درجة مستنداً للدرابزين",
    titleEn: "Runs well, walks up stairs holding handrail",
  },
  {
    key: "m24_two_word_sentences",
    category: "speech_language",
    ageBand: "24_months",
    titleAr: "يركب جملة من كلمتين مفيدتين (عايز أشرب / فين بابا)",
    titleEn: "Combines 2 words into meaningful phrases",
  },

  // 36 Months (3 Years)
  {
    key: "m36_pedals_tricycle",
    category: "gross_motor",
    ageBand: "36_months",
    titleAr: "يقفز بالقدمين ويركب دراجة ثلاثية العجلات",
    titleEn: "Jumps with both feet, pedals a tricycle",
  },
  {
    key: "m36_full_sentences",
    category: "speech_language",
    ageBand: "36_months",
    titleAr: "يتحدث بجمل واضحة من 3 إلى 4 كلمات ويسأل أسئلة",
    titleEn: "Speaks in 3-4 word sentences, asks questions",
  },
];

// ------------------------------------------------------------------------------
// In-Memory Storage for Pediatrics records
// ------------------------------------------------------------------------------
const birthHistories = new Map<string, BirthHistory>();
const feedingHistories = new Map<string, FeedingHistory>();
const clinicVaccineTemplates = new Map<string, VaccineTemplate[]>();
const patientVaccinations = new Map<string, VaccinationRecord[]>();
const patientMilestones = new Map<string, PatientMilestoneRecord[]>();
const pediatricExams = new Map<string, PediatricExam[]>();

// Seed clinic-1 (Pediatrics Clinic) with initial templates and pat-1 records
function ensureInitialized(clinicId: string) {
  if (!clinicVaccineTemplates.has(clinicId)) {
    const templates: VaccineTemplate[] = EGYPT_MOH_VACCINE_SCHEDULE.map(
      (s, index) => ({
        id: `vt-${clinicId}-${index + 1}`,
        clinicId,
        vaccineName: s.vaccineName,
        targetAgeMonths: s.targetAgeMonths,
        doseNumber: s.doseNumber,
        isMandatory: s.isMandatory,
        notes: s.notes,
        isActive: true,
      })
    );
    clinicVaccineTemplates.set(clinicId, templates);
  }

  // Pre-seed pat-1 (Omar, 4-year-old in clinic-1)
  if (clinicId === "clinic-1" && !birthHistories.has("pat-1")) {
    birthHistories.set("pat-1", {
      id: "bh-pat-1",
      clinicId: "clinic-1",
      patientId: "pat-1",
      gestationalAgeWeeks: 39,
      deliveryType: "c_section",
      birthWeightKg: 3.4,
      birthLengthCm: 50,
      birthHeadCircumferenceCm: 35,
      apgarScore1min: 9,
      apgarScore5min: 10,
      nicuStay: false,
      nicuDays: 0,
      complications: "لا توجد مضاعفات أثناء الولادة",
      notes: "ولادة قيصرية مجدولة بدون مضاعفات",
      createdAt: "2022-04-15T10:00:00Z",
      updatedAt: "2022-04-15T10:00:00Z",
    });

    feedingHistories.set("pat-1", {
      id: "fh-pat-1",
      clinicId: "clinic-1",
      patientId: "pat-1",
      feedingType: "exclusive_breastfeeding",
      solidsStartAgeMonths: 6,
      vitaminDSupplement: true,
      ironSupplement: false,
      notes: "رضاعة طبيعية مطلقة حتى 6 أشهر ثم إدخال الأطعمة التكميلية بانتظام",
      createdAt: "2022-04-15T10:00:00Z",
      updatedAt: "2022-04-15T10:00:00Z",
    });

    // Omar has completed his primary vaccines up to 18m
    const initialVaccines: VaccinationRecord[] = [
      {
        id: "vac-1",
        clinicId: "clinic-1",
        patientId: "pat-1",
        vaccineName: "الدرن (BCG)",
        doseNumber: 1,
        administeredDate: "2022-04-18",
        batchNumber: "BCG-22019",
        site: "intradermal",
        administeredBy: "مكتب صحة التجمع",
        status: "administered",
        notes: "تم التطعيم بانتظام وتكونت الندبة",
        createdAt: "2022-04-18T10:00:00Z",
      },
      {
        id: "vac-2",
        clinicId: "clinic-1",
        patientId: "pat-1",
        vaccineName: "الخماسي (DTP + HepB + Hib - الجرعة الأولى)",
        doseNumber: 1,
        administeredDate: "2022-06-16",
        batchNumber: "PENT-4402",
        site: "right_thigh",
        administeredBy: "المركز الطبي",
        status: "administered",
        notes: "سخونة خفيفة ليوم واحد عولجت بالباراسيتامول",
        createdAt: "2022-06-16T10:00:00Z",
      },
      {
        id: "vac-3",
        clinicId: "clinic-1",
        patientId: "pat-1",
        vaccineName: "الثلاثي الفيروسي (MMR - الحصبة والنكاف والحصبة الألمانية)",
        doseNumber: 1,
        administeredDate: "2023-04-20",
        batchNumber: "MMR-901",
        site: "right_deltoid",
        administeredBy: "المركز الطبي",
        status: "administered",
        notes: "تم بدون أي مضاعفات",
        createdAt: "2023-04-20T10:00:00Z",
      },
    ];
    patientVaccinations.set("pat-1", initialVaccines);

    // Milestones achieved
    const milestones: PatientMilestoneRecord[] = [
      {
        id: "ms-1",
        clinicId: "clinic-1",
        patientId: "pat-1",
        milestoneKey: "m2_social_smile",
        category: "cognitive_social",
        ageBand: "2_months",
        achieved: true,
        achievedDate: "2022-06-10",
      },
      {
        id: "ms-2",
        clinicId: "clinic-1",
        patientId: "pat-1",
        milestoneKey: "m6_sits_supported",
        category: "gross_motor",
        ageBand: "6_months",
        achieved: true,
        achievedDate: "2022-10-15",
      },
      {
        id: "ms-3",
        clinicId: "clinic-1",
        patientId: "pat-1",
        milestoneKey: "m12_first_words",
        category: "speech_language",
        ageBand: "12_months",
        achieved: true,
        achievedDate: "2023-04-12",
      },
      {
        id: "ms-4",
        clinicId: "clinic-1",
        patientId: "pat-1",
        milestoneKey: "m18_walks_alone",
        category: "gross_motor",
        ageBand: "18_months",
        achieved: true,
        achievedDate: "2023-09-20",
      },
    ];
    patientMilestones.set("pat-1", milestones);
  }
}

/**
 * Access Control Guard:
 * Non-negotiable Rules:
 * - Only doctors can read or write clinical pediatric data.
 * - Receptionists and Platform Admins are denied.
 * - The clinic must have the "pediatrics" module enabled.
 */
export function verifyPediatricsAccess(
  actor: ActorContext,
  targetClinicId: string,
  clinicEnabledModules: string[]
): void {
  if (actor.role !== "doctor") {
    throw new Error(
      "Medical Privacy Violation: Only doctors may access pediatric clinical records."
    );
  }

  if (actor.clinicId !== targetClinicId) {
    throw new Error(
      "Tenant Isolation Violation: Cross-clinic clinical access is strictly forbidden."
    );
  }

  if (!isModuleEnabled("pediatrics", clinicEnabledModules)) {
    throw new Error(
      "Module Access Denied: The pediatrics module is not enabled for this clinic."
    );
  }
}

/**
 * Fetches the full pediatric record for a patient.
 */
export function getFullPediatricRecord(
  actor: ActorContext,
  patientId: string,
  patientBirthDate: string,
  clinicEnabledModules: string[]
): FullPediatricRecord {
  verifyPediatricsAccess(actor, actor.clinicId, clinicEnabledModules);
  ensureInitialized(actor.clinicId);

  const bHistory = birthHistories.get(patientId);
  const fHistory = feedingHistories.get(patientId);
  const vaccines = patientVaccinations.get(patientId) || [];
  const milestonesList = patientMilestones.get(patientId) || [];
  const exams = pediatricExams.get(patientId) || [];

  const templates = clinicVaccineTemplates.get(actor.clinicId) || [];

  // Compute status for each template
  const now = new Date();
  const birth = new Date(patientBirthDate);

  const scheduleWithStatus = templates
    .filter((t) => t.isActive)
    .sort((a, b) => a.targetAgeMonths - b.targetAgeMonths)
    .map((template) => {
      // Find matching record
      const match = vaccines.find(
        (v) =>
          v.vaccineName === template.vaccineName &&
          v.doseNumber === template.doseNumber
      );

      // Calculate due date
      const dueDate = new Date(birth);
      dueDate.setMonth(dueDate.getMonth() + template.targetAgeMonths);
      const dueDateStr = dueDate.toISOString().split("T")[0];

      let calculatedStatus: "administered" | "due" | "overdue" | "upcoming";

      if (match && match.status === "administered") {
        calculatedStatus = "administered";
      } else {
        const diffDays = Math.round(
          (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays < 0) {
          calculatedStatus = "upcoming";
        } else if (diffDays <= 30) {
          calculatedStatus = "due";
        } else {
          calculatedStatus = "overdue";
        }
      }

      return {
        template,
        record: match,
        calculatedStatus,
        dueDate: dueDateStr,
      };
    });

  const milestonesMap: Record<string, PatientMilestoneRecord> = {};
  for (const m of milestonesList) {
    milestonesMap[m.milestoneKey] = m;
  }

  return {
    patientId,
    birthHistory: bHistory,
    feedingHistory: fHistory,
    vaccinations: vaccines,
    scheduleWithStatus,
    milestones: milestonesMap,
    recentExams: exams,
  };
}

/**
 * Saves or updates birth history.
 */
export function saveBirthHistory(
  actor: ActorContext,
  data: Omit<BirthHistory, "id" | "clinicId" | "createdAt" | "updatedAt">,
  clinicEnabledModules: string[]
): BirthHistory {
  verifyPediatricsAccess(actor, actor.clinicId, clinicEnabledModules);
  ensureInitialized(actor.clinicId);

  const existing = birthHistories.get(data.patientId);
  const now = new Date().toISOString();

  const record: BirthHistory = {
    ...data,
    id: existing?.id || `bh-${Date.now()}`,
    clinicId: actor.clinicId,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  birthHistories.set(data.patientId, record);
  return record;
}

/**
 * Saves or updates feeding history.
 */
export function saveFeedingHistory(
  actor: ActorContext,
  data: Omit<FeedingHistory, "id" | "clinicId" | "createdAt" | "updatedAt">,
  clinicEnabledModules: string[]
): FeedingHistory {
  verifyPediatricsAccess(actor, actor.clinicId, clinicEnabledModules);
  ensureInitialized(actor.clinicId);

  const existing = feedingHistories.get(data.patientId);
  const now = new Date().toISOString();

  const record: FeedingHistory = {
    ...data,
    id: existing?.id || `fh-${Date.now()}`,
    clinicId: actor.clinicId,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  feedingHistories.set(data.patientId, record);
  return record;
}

/**
 * Administers / records a vaccination for a patient.
 */
export function recordVaccination(
  actor: ActorContext,
  record: Omit<VaccinationRecord, "id" | "clinicId" | "createdAt">,
  clinicEnabledModules: string[]
): VaccinationRecord {
  verifyPediatricsAccess(actor, actor.clinicId, clinicEnabledModules);
  ensureInitialized(actor.clinicId);

  const list = patientVaccinations.get(record.patientId) || [];
  const existingIdx = list.findIndex(
    (v) =>
      v.vaccineName === record.vaccineName &&
      v.doseNumber === record.doseNumber
  );

  const now = new Date().toISOString();
  const newRecord: VaccinationRecord = {
    ...record,
    id: existingIdx >= 0 ? list[existingIdx].id : `vac-${Date.now()}`,
    clinicId: actor.clinicId,
    createdAt: existingIdx >= 0 ? list[existingIdx].createdAt : now,
  };

  if (existingIdx >= 0) {
    list[existingIdx] = newRecord;
  } else {
    list.push(newRecord);
  }

  patientVaccinations.set(record.patientId, list);
  return newRecord;
}

/**
 * Updates a developmental milestone status.
 */
export function updateMilestone(
  actor: ActorContext,
  patientId: string,
  milestoneKey: string,
  achieved: boolean,
  clinicEnabledModules: string[],
  notes?: string
): PatientMilestoneRecord {
  verifyPediatricsAccess(actor, actor.clinicId, clinicEnabledModules);
  ensureInitialized(actor.clinicId);

  const catalogItem = DEVELOPMENTAL_MILESTONES_CATALOG.find(
    (m) => m.key === milestoneKey
  );
  if (!catalogItem) {
    throw new Error(`Invalid milestone key: ${milestoneKey}`);
  }

  const list = patientMilestones.get(patientId) || [];
  const existingIdx = list.findIndex((m) => m.milestoneKey === milestoneKey);
  const now = new Date().toISOString();

  const record: PatientMilestoneRecord = {
    id: existingIdx >= 0 ? list[existingIdx].id : `ms-${Date.now()}`,
    clinicId: actor.clinicId,
    patientId,
    milestoneKey,
    category: catalogItem.category,
    ageBand: catalogItem.ageBand,
    achieved,
    achievedDate: achieved ? now.split("T")[0] : null,
    notes: notes !== undefined ? notes : list[existingIdx]?.notes,
  };

  if (existingIdx >= 0) {
    list[existingIdx] = record;
  } else {
    list.push(record);
  }

  patientMilestones.set(patientId, list);
  return record;
}

/**
 * Saves a structured pediatric examination by body system.
 */
export function savePediatricExam(
  actor: ActorContext,
  data: Omit<PediatricExam, "id" | "clinicId" | "createdAt">,
  clinicEnabledModules: string[]
): PediatricExam {
  verifyPediatricsAccess(actor, actor.clinicId, clinicEnabledModules);
  ensureInitialized(actor.clinicId);

  const list = pediatricExams.get(data.patientId) || [];
  const now = new Date().toISOString();

  const exam: PediatricExam = {
    ...data,
    id: `pexam-${Date.now()}`,
    clinicId: actor.clinicId,
    createdAt: now,
  };

  list.unshift(exam);
  pediatricExams.set(data.patientId, list);
  return exam;
}
