import type {
  FamilyMember,
  Measurement,
  GrowthMeasurement,
  Medication,
  MedicalDocument,
  Encounter,
  Vaccination,
  DoctorReport,
  ReportShare,
  DocumentCategory,
  MedicationStatus,
  MeasurementType,
} from '@/types/med-record';
import {
  MOCK_FAMILY_MEMBERS,
  MOCK_MEASUREMENTS,
  MOCK_GROWTH_MEASUREMENTS,
  MOCK_MEDICATIONS,
  MOCK_DOCUMENTS,
  MOCK_ENCOUNTERS,
  MOCK_VACCINATIONS,
  DEMO_USER_ID,
} from './mock-data';
import { evaluateVitalMeasurement } from './vitals-evaluator';
import { LOINC_CODES } from './standards';

export interface CreateReportInput {
  memberId: string;
  title: string;
  dateFrom: string;
  dateTo: string;
  includedSections: string[];
  summaryNotes?: string;
}

export class InMemoryMedRecordRepository {
  private members: FamilyMember[] = [];
  private measurements: Measurement[] = [];
  private growthMeasurements: GrowthMeasurement[] = [];
  private medications: Medication[] = [];
  private documents: MedicalDocument[] = [];
  private encounters: Encounter[] = [];
  private vaccinations: Vaccination[] = [];
  private reports: DoctorReport[] = [];
  private shares: ReportShare[] = [];

  constructor() {
    this.resetToMockData();
  }

  async resetToMockData(): Promise<void> {
    this.members = JSON.parse(JSON.stringify(MOCK_FAMILY_MEMBERS));
    this.measurements = JSON.parse(JSON.stringify(MOCK_MEASUREMENTS));
    this.growthMeasurements = JSON.parse(JSON.stringify(MOCK_GROWTH_MEASUREMENTS));
    this.medications = JSON.parse(JSON.stringify(MOCK_MEDICATIONS));
    this.documents = JSON.parse(JSON.stringify(MOCK_DOCUMENTS));
    this.encounters = JSON.parse(JSON.stringify(MOCK_ENCOUNTERS));
    this.vaccinations = JSON.parse(JSON.stringify(MOCK_VACCINATIONS));
    this.reports = [];
    this.shares = [];
  }

  // --- Family Members ---
  async getFamilyMembers(userId: string = DEMO_USER_ID): Promise<FamilyMember[]> {
    return this.members.filter(m => m.userId === userId && !m.archivedAt);
  }

  async getFamilyMember(id: string): Promise<FamilyMember | null> {
    return this.members.find(m => m.id === id && !m.archivedAt) || null;
  }

  async addFamilyMember(memberData: Omit<FamilyMember, 'id' | 'createdAt'>): Promise<FamilyMember> {
    const newMember: FamilyMember = {
      ...memberData,
      id: `member-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.members.push(newMember);
    return newMember;
  }

  async updateFamilyMember(id: string, updates: Partial<FamilyMember>): Promise<FamilyMember | null> {
    const idx = this.members.findIndex(m => m.id === id);
    if (idx === -1) return null;
    this.members[idx] = { ...this.members[idx], ...updates };
    return this.members[idx];
  }

  // --- Measurements ---
  async getMeasurements(memberId: string, type?: MeasurementType): Promise<Measurement[]> {
    return this.measurements
      .filter(m => m.memberId === memberId && (!type || m.measurementType === type))
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  }

  async addMeasurement(measurementData: Omit<Measurement, 'id'>): Promise<Measurement> {
    const evaluation = evaluateVitalMeasurement(
      measurementData.measurementType,
      measurementData.values
    );

    let loinc = measurementData.loincCode;
    if (!loinc) {
      if (measurementData.measurementType === 'blood_pressure') loinc = LOINC_CODES.BLOOD_PRESSURE_PANEL;
      else if (measurementData.measurementType === 'blood_sugar') loinc = LOINC_CODES.BLOOD_GLUCOSE;
      else if (measurementData.measurementType === 'heart_rate') loinc = LOINC_CODES.HEART_RATE;
      else if (measurementData.measurementType === 'oxygen_saturation') loinc = LOINC_CODES.OXYGEN_SATURATION;
      else if (measurementData.measurementType === 'weight') loinc = LOINC_CODES.BODY_WEIGHT;
      else if (measurementData.measurementType === 'height') loinc = LOINC_CODES.BODY_HEIGHT;
      else if (measurementData.measurementType === 'head_circumference') loinc = LOINC_CODES.HEAD_CIRCUMFERENCE;
      else if (measurementData.measurementType === 'temperature') loinc = LOINC_CODES.BODY_TEMPERATURE;
    }

    const newMeasurement: Measurement = {
      ...measurementData,
      id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      isAbnormal: measurementData.isAbnormal !== undefined ? measurementData.isAbnormal : evaluation.isAbnormal,
      loincCode: loinc,
    };
    this.measurements.push(newMeasurement);
    return newMeasurement;
  }

  // --- Growth Measurements ---
  async getGrowthMeasurements(memberId: string): Promise<GrowthMeasurement[]> {
    return this.growthMeasurements
      .filter(g => g.memberId === memberId)
      .sort((a, b) => a.ageInMonths - b.ageInMonths);
  }

  async addGrowthMeasurement(growthData: Omit<GrowthMeasurement, 'id'>): Promise<GrowthMeasurement> {
    const newGrowth: GrowthMeasurement = {
      ...growthData,
      id: `gw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.growthMeasurements.push(newGrowth);
    return newGrowth;
  }

  // --- Medications ---
  async getMedications(memberId: string, status?: MedicationStatus): Promise<Medication[]> {
    return this.medications.filter(
      med => med.memberId === memberId && (!status || med.status === status)
    );
  }

  async addMedication(medData: Omit<Medication, 'id' | 'createdAt'>): Promise<Medication> {
    const newMed: Medication = {
      ...medData,
      id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.medications.push(newMed);
    return newMed;
  }

  async updateMedication(id: string, updates: Partial<Medication>): Promise<Medication | null> {
    const idx = this.medications.findIndex(m => m.id === id);
    if (idx === -1) return null;
    this.medications[idx] = { ...this.medications[idx], ...updates };
    return this.medications[idx];
  }

  // --- Medical Documents ---
  async getDocuments(
    memberId: string,
    category?: DocumentCategory,
    search?: string
  ): Promise<MedicalDocument[]> {
    return this.documents.filter(doc => {
      if (doc.memberId !== memberId) return false;
      if (category && doc.documentType !== category) return false;
      if (search) {
        const query = search.toLowerCase();
        const matchesTitle = doc.title.toLowerCase().includes(query);
        const matchesDoc = doc.doctorName?.toLowerCase().includes(query);
        const matchesFacility = doc.facilityName?.toLowerCase().includes(query);
        const matchesTags = doc.tags?.some(t => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDoc && !matchesFacility && !matchesTags) {
          return false;
        }
      }
      return true;
    });
  }

  async addDocument(docData: Omit<MedicalDocument, 'id' | 'createdAt'>): Promise<MedicalDocument> {
    const newDoc: MedicalDocument = {
      ...docData,
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.documents.push(newDoc);
    return newDoc;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const idx = this.documents.findIndex(d => d.id === id);
    if (idx === -1) return false;
    this.documents.splice(idx, 1);
    return true;
  }

  // --- Encounters ---
  async getEncounters(memberId: string): Promise<Encounter[]> {
    return this.encounters
      .filter(e => e.memberId === memberId)
      .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
  }

  async addEncounter(encounterData: Omit<Encounter, 'id' | 'createdAt'>): Promise<Encounter> {
    const newEnc: Encounter = {
      ...encounterData,
      id: `enc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.encounters.push(newEnc);
    return newEnc;
  }

  // --- Vaccinations ---
  async getVaccinations(memberId: string): Promise<Vaccination[]> {
    return this.vaccinations.filter(v => v.memberId === memberId);
  }

  async addVaccination(vaccineData: Omit<Vaccination, 'id' | 'createdAt'>): Promise<Vaccination> {
    const newVac: Vaccination = {
      ...vaccineData,
      id: `vac-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.vaccinations.push(newVac);
    return newVac;
  }

  async updateVaccination(id: string, updates: Partial<Vaccination>): Promise<Vaccination | null> {
    const idx = this.vaccinations.findIndex(v => v.id === id);
    if (idx === -1) return null;
    this.vaccinations[idx] = { ...this.vaccinations[idx], ...updates };
    return this.vaccinations[idx];
  }

  // --- Doctor Reports & Sharing ---
  async createDoctorReport(input: CreateReportInput): Promise<DoctorReport> {
    const measurements = await this.getMeasurements(input.memberId);
    const filteredMeasurements = measurements.filter(
      m => m.recordedAt.split('T')[0] >= input.dateFrom && m.recordedAt.split('T')[0] <= input.dateTo
    );

    const medications = await this.getMedications(input.memberId);
    const encounters = await this.getEncounters(input.memberId);
    const filteredEncounters = encounters.filter(
      e => e.visitDate >= input.dateFrom && e.visitDate <= input.dateTo
    );
    const documents = await this.getDocuments(input.memberId);
    const vaccinations = await this.getVaccinations(input.memberId);

    const report: DoctorReport = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      memberId: input.memberId,
      title: input.title,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      includedSections: input.includedSections,
      summaryNotes: input.summaryNotes,
      snapshotData: {
        reportTitle: input.title,
        generatedAt: new Date().toISOString(),
        dateRange: { from: input.dateFrom, to: input.dateTo },
        measurements: filteredMeasurements,
        medications,
        encounters: filteredEncounters,
        documents,
        vaccinations,
        summaryNotes: input.summaryNotes,
      },
      createdAt: new Date().toISOString(),
    };

    this.reports.push(report);
    return report;
  }

  async getDoctorReport(id: string): Promise<DoctorReport | null> {
    return this.reports.find(r => r.id === id) || null;
  }

  async createReportShare(reportId: string, expiresInHours: number = 24, pin?: string): Promise<ReportShare> {
    const report = await this.getDoctorReport(reportId);
    if (!report) throw new Error('Report not found');

    const randomBytes = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

    const share: ReportShare = {
      id: `share-${Date.now()}`,
      reportId,
      accessToken: randomBytes,
      pinHash: pin ? pin : undefined,
      expiresAt,
      isRevoked: false,
      viewCount: 0,
      createdAt: new Date().toISOString(),
    };

    this.shares.push(share);
    return share;
  }

  async getSharedReport(
    token: string,
    pin?: string
  ): Promise<{ report: DoctorReport; member: FamilyMember } | null> {
    const share = this.shares.find(s => s.accessToken === token);
    if (!share) return null;
    if (share.isRevoked) return null;

    const isExpired = new Date(share.expiresAt).getTime() < Date.now();
    if (isExpired) return null;

    if (share.pinHash && share.pinHash !== pin) {
      return null; // Invalid PIN
    }

    share.viewCount += 1;
    share.lastViewedAt = new Date().toISOString();

    const report = await this.getDoctorReport(share.reportId);
    if (!report) return null;

    const member = await this.getFamilyMember(report.memberId);
    if (!member) return null;

    return { report, member };
  }

  async revokeReportShare(shareId: string): Promise<boolean> {
    const share = this.shares.find(s => s.id === shareId);
    if (!share) return false;
    share.isRevoked = true;
    return true;
  }

  // --- Data Sovereignty & GDPR ---
  async deleteAllUserData(userId: string): Promise<void> {
    const userMemberIds = this.members.filter(m => m.userId === userId).map(m => m.id);

    this.members = this.members.filter(m => m.userId !== userId);
    this.measurements = this.measurements.filter(m => !userMemberIds.includes(m.memberId));
    this.growthMeasurements = this.growthMeasurements.filter(g => !userMemberIds.includes(g.memberId));
    this.medications = this.medications.filter(med => !userMemberIds.includes(med.memberId));
    this.documents = this.documents.filter(d => !userMemberIds.includes(d.memberId));
    this.encounters = this.encounters.filter(e => !userMemberIds.includes(e.memberId));
    this.vaccinations = this.vaccinations.filter(v => !userMemberIds.includes(v.memberId));

    const userReportIds = this.reports.filter(r => userMemberIds.includes(r.memberId)).map(r => r.id);
    this.reports = this.reports.filter(r => !userMemberIds.includes(r.memberId));
    this.shares = this.shares.filter(s => !userReportIds.includes(s.reportId));
  }
}

// Global Singleton for Repository
let globalRepo: InMemoryMedRecordRepository | null = null;

export function getMedRecordRepository(): InMemoryMedRecordRepository {
  if (!globalRepo) {
    globalRepo = new InMemoryMedRecordRepository();
  }
  return globalRepo;
}
