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

export const LOCAL_STORAGE_KEY = 'med_record_store_v1';

export interface CreateReportInput {
  memberId: string;
  title: string;
  dateFrom: string;
  dateTo: string;
  includedSections: string[];
  summaryNotes?: string;
}

export interface MedRecordStorageState {
  isMockData: boolean;
  members: FamilyMember[];
  measurements: Measurement[];
  growthMeasurements: GrowthMeasurement[];
  medications: Medication[];
  documents: MedicalDocument[];
  encounters: Encounter[];
  vaccinations: Vaccination[];
  reports: DoctorReport[];
  shares: ReportShare[];
}

export class InMemoryMedRecordRepository {
  private isMockData: boolean = true;
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
    this.init();
  }

  private init() {
    // 1. Try loading from browser localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          this.fromJSON(parsed);
          return;
        }
      } catch (err) {
        console.warn('Failed to load med record from localStorage:', err);
      }
    }

    // 2. Default to mock data initially
    this.resetToMockData();

    // 3. Trigger async sync with server disk storage in browser
    if (typeof window !== 'undefined') {
      this.syncWithServer();
    }
  }

  public toJSON(): MedRecordStorageState {
    return {
      isMockData: this.isMockData,
      members: this.members,
      measurements: this.measurements,
      growthMeasurements: this.growthMeasurements,
      medications: this.medications,
      documents: this.documents,
      encounters: this.encounters,
      vaccinations: this.vaccinations,
      reports: this.reports,
      shares: this.shares,
    };
  }

  public fromJSON(data: Partial<MedRecordStorageState>) {
    this.isMockData = data.isMockData ?? false;
    this.members = data.members ? JSON.parse(JSON.stringify(data.members)) : [];
    this.measurements = data.measurements ? JSON.parse(JSON.stringify(data.measurements)) : [];
    this.growthMeasurements = data.growthMeasurements ? JSON.parse(JSON.stringify(data.growthMeasurements)) : [];
    this.medications = data.medications ? JSON.parse(JSON.stringify(data.medications)) : [];
    this.documents = data.documents ? JSON.parse(JSON.stringify(data.documents)) : [];
    this.encounters = data.encounters ? JSON.parse(JSON.stringify(data.encounters)) : [];
    this.vaccinations = data.vaccinations ? JSON.parse(JSON.stringify(data.vaccinations)) : [];
    this.reports = data.reports ? JSON.parse(JSON.stringify(data.reports)) : [];
    this.shares = data.shares ? JSON.parse(JSON.stringify(data.shares)) : [];
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        const state = this.toJSON();
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));

        // Asynchronously save to server disk db
        fetch('/api/med-record/storage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state),
        }).catch(() => {
          // Ignore offline/server fetch failures; localStorage preserves the data
        });
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
    }
  }

  private async syncWithServer() {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch('/api/med-record/storage');
      if (res.ok) {
        const serverState = await res.json();
        const localStored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!localStored && serverState) {
          this.fromJSON(serverState);
          window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.toJSON()));
        }
      }
    } catch {
      // Ignore background sync errors
    }
  }

  public isMockDataActive(): boolean {
    return this.isMockData;
  }

  // --- Reset to Mock Data ---
  async resetToMockData(): Promise<void> {
    this.isMockData = true;
    this.members = JSON.parse(JSON.stringify(MOCK_FAMILY_MEMBERS));
    this.measurements = JSON.parse(JSON.stringify(MOCK_MEASUREMENTS));
    this.growthMeasurements = JSON.parse(JSON.stringify(MOCK_GROWTH_MEASUREMENTS));
    this.medications = JSON.parse(JSON.stringify(MOCK_MEDICATIONS));
    this.documents = JSON.parse(JSON.stringify(MOCK_DOCUMENTS));
    this.encounters = JSON.parse(JSON.stringify(MOCK_ENCOUNTERS));
    this.vaccinations = JSON.parse(JSON.stringify(MOCK_VACCINATIONS));
    this.reports = [];
    this.shares = [];
    this.saveToStorage();
  }

  // --- Clear All Mock Data (Start Clean Real Record) ---
  async clearAllMockData(): Promise<void> {
    this.isMockData = false;
    this.members = [];
    this.measurements = [];
    this.growthMeasurements = [];
    this.medications = [];
    this.documents = [];
    this.encounters = [];
    this.vaccinations = [];
    this.reports = [];
    this.shares = [];
    this.saveToStorage();
  }

  // --- Family Members ---
  async getFamilyMembers(userId: string = DEMO_USER_ID): Promise<FamilyMember[]> {
    return this.members.filter(m => m.userId === userId && !m.archivedAt);
  }

  async getFamilyMember(id: string): Promise<FamilyMember | null> {
    return this.members.find(m => m.id === id && !m.archivedAt) || null;
  }

  async addFamilyMember(memberData: Omit<FamilyMember, 'id' | 'createdAt'>): Promise<FamilyMember> {
    // Adding real data switches mock mode off
    this.isMockData = false;

    // If this is the first member, mark as primary by default
    const isFirst = this.members.length === 0;

    const newMember: FamilyMember = {
      ...memberData,
      isPrimary: memberData.isPrimary !== undefined ? memberData.isPrimary : isFirst,
      id: `member-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.members.push(newMember);
    this.saveToStorage();
    return newMember;
  }

  async updateFamilyMember(id: string, updates: Partial<FamilyMember>): Promise<FamilyMember | null> {
    const idx = this.members.findIndex(m => m.id === id);
    if (idx === -1) return null;
    this.members[idx] = { ...this.members[idx], ...updates };
    this.saveToStorage();
    return this.members[idx];
  }

  async deleteFamilyMember(id: string): Promise<boolean> {
    const idx = this.members.findIndex(m => m.id === id);
    if (idx === -1) return false;

    this.members.splice(idx, 1);
    // Cascade delete related records
    this.measurements = this.measurements.filter(m => m.memberId !== id);
    this.growthMeasurements = this.growthMeasurements.filter(g => g.memberId !== id);
    this.medications = this.medications.filter(med => med.memberId !== id);
    this.documents = this.documents.filter(d => d.memberId !== id);
    this.encounters = this.encounters.filter(e => e.memberId !== id);
    this.vaccinations = this.vaccinations.filter(v => v.memberId !== id);
    this.reports = this.reports.filter(r => r.memberId !== id);

    this.saveToStorage();
    return true;
  }

  // --- Measurements ---
  async getMeasurements(memberId?: string, type?: MeasurementType): Promise<Measurement[]> {
    return this.measurements
      .filter(m => (!memberId || m.memberId === memberId) && (!type || m.measurementType === type))
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  }

  async addMeasurement(measurementData: Omit<Measurement, 'id'>): Promise<Measurement> {
    this.isMockData = false;
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
    this.saveToStorage();
    return newMeasurement;
  }

  async deleteMeasurement(id: string): Promise<boolean> {
    const idx = this.measurements.findIndex(m => m.id === id);
    if (idx === -1) return false;
    this.measurements.splice(idx, 1);
    this.saveToStorage();
    return true;
  }

  // --- Growth Measurements ---
  async getGrowthMeasurements(memberId: string): Promise<GrowthMeasurement[]> {
    return this.growthMeasurements
      .filter(g => g.memberId === memberId)
      .sort((a, b) => a.ageInMonths - b.ageInMonths);
  }

  async addGrowthMeasurement(growthData: Omit<GrowthMeasurement, 'id'>): Promise<GrowthMeasurement> {
    this.isMockData = false;
    const newGrowth: GrowthMeasurement = {
      ...growthData,
      id: `gw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.growthMeasurements.push(newGrowth);
    this.saveToStorage();
    return newGrowth;
  }

  // --- Medications ---
  async getMedications(memberId: string, status?: MedicationStatus): Promise<Medication[]> {
    return this.medications.filter(
      med => med.memberId === memberId && (!status || med.status === status)
    );
  }

  async addMedication(medData: Omit<Medication, 'id' | 'createdAt'>): Promise<Medication> {
    this.isMockData = false;
    const newMed: Medication = {
      ...medData,
      id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.medications.push(newMed);
    this.saveToStorage();
    return newMed;
  }

  async updateMedication(id: string, updates: Partial<Medication>): Promise<Medication | null> {
    const idx = this.medications.findIndex(m => m.id === id);
    if (idx === -1) return null;
    this.medications[idx] = { ...this.medications[idx], ...updates };
    this.saveToStorage();
    return this.medications[idx];
  }

  async deleteMedication(id: string): Promise<boolean> {
    const idx = this.medications.findIndex(m => m.id === id);
    if (idx === -1) return false;
    this.medications.splice(idx, 1);
    this.saveToStorage();
    return true;
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
    this.isMockData = false;
    const newDoc: MedicalDocument = {
      ...docData,
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.documents.push(newDoc);
    this.saveToStorage();
    return newDoc;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const idx = this.documents.findIndex(d => d.id === id);
    if (idx === -1) return false;
    this.documents.splice(idx, 1);
    this.saveToStorage();
    return true;
  }

  // --- Encounters ---
  async getEncounters(memberId?: string): Promise<Encounter[]> {
    return this.encounters
      .filter(e => !memberId || e.memberId === memberId)
      .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
  }

  async addEncounter(encounterData: Omit<Encounter, 'id' | 'createdAt'>): Promise<Encounter> {
    this.isMockData = false;
    const newEnc: Encounter = {
      ...encounterData,
      id: `enc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.encounters.push(newEnc);
    this.saveToStorage();
    return newEnc;
  }

  async deleteEncounter(id: string): Promise<boolean> {
    const idx = this.encounters.findIndex(e => e.id === id);
    if (idx === -1) return false;
    this.encounters.splice(idx, 1);
    this.saveToStorage();
    return true;
  }

  // --- Vaccinations ---
  async getVaccinations(memberId: string): Promise<Vaccination[]> {
    return this.vaccinations.filter(v => v.memberId === memberId);
  }

  async addVaccination(vaccineData: Omit<Vaccination, 'id' | 'createdAt'>): Promise<Vaccination> {
    this.isMockData = false;
    const newVac: Vaccination = {
      ...vaccineData,
      id: `vac-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.vaccinations.push(newVac);
    this.saveToStorage();
    return newVac;
  }

  async updateVaccination(id: string, updates: Partial<Vaccination>): Promise<Vaccination | null> {
    const idx = this.vaccinations.findIndex(v => v.id === id);
    if (idx === -1) return null;
    this.vaccinations[idx] = { ...this.vaccinations[idx], ...updates };
    this.saveToStorage();
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
    this.saveToStorage();
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
    this.saveToStorage();
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
    this.saveToStorage();

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
    this.saveToStorage();
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
    this.isMockData = false;

    this.saveToStorage();
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
