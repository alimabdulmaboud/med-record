import { describe, it, expect } from 'vitest';
import { LOINC_CODES, mapToFHIRIPS } from '../standards';
import type { FamilyMember, DoctorReportData } from '@/types/med-record';

describe('HL7 FHIR & LOINC Standards Mapping', () => {
  it('defines valid LOINC codes for all standard vitals and measurements', () => {
    expect(LOINC_CODES.BLOOD_PRESSURE_PANEL).toBe('85354-9');
    expect(LOINC_CODES.SYSTOLIC_BP).toBe('8480-6');
    expect(LOINC_CODES.DIASTOLIC_BP).toBe('8462-4');
    expect(LOINC_CODES.HEART_RATE).toBe('8867-4');
    expect(LOINC_CODES.BLOOD_GLUCOSE).toBe('2339-0');
    expect(LOINC_CODES.HBA1C).toBe('4548-4');
    expect(LOINC_CODES.BODY_WEIGHT).toBe('29463-7');
    expect(LOINC_CODES.BODY_HEIGHT).toBe('8302-2');
    expect(LOINC_CODES.HEAD_CIRCUMFERENCE).toBe('9843-4');
    expect(LOINC_CODES.OXYGEN_SATURATION).toBe('59408-5');
    expect(LOINC_CODES.BODY_TEMPERATURE).toBe('8310-5');
  });

  it('compiles a complete HL7 FHIR International Patient Summary (IPS) Bundle', () => {
    const mockMember: FamilyMember = {
      id: 'member-1',
      userId: 'user-1',
      fullName: 'أحمد مصطفى',
      relationship: 'self',
      birthDate: '1985-05-12',
      sex: 'male',
      bloodType: 'A+',
      isPrimary: true,
      avatarColor: 'blue',
      emergencyContacts: [
        { id: 'c1', name: 'منى إبراهيم', phone: '01012345678', relation: 'زوجة' }
      ],
      chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
      allergies: ['Penicillin'],
      createdAt: '2026-01-01T00:00:00Z',
    };

    const mockReportData: DoctorReportData = {
      reportTitle: 'الملخص الطبي للطبيب',
      generatedAt: '2026-10-27T10:00:00Z',
      dateRange: { from: '2026-07-01', to: '2026-10-27' },
      measurements: [
        {
          id: 'm1',
          memberId: 'member-1',
          measurementType: 'blood_pressure',
          values: { systolic: 125, diastolic: 82 },
          unit: 'mmHg',
          loincCode: LOINC_CODES.BLOOD_PRESSURE_PANEL,
          isAbnormal: false,
          recordedAt: '2026-10-20T08:00:00Z',
        },
      ],
      medications: [
        {
          id: 'med1',
          memberId: 'member-1',
          name: 'Concor 5mg',
          dose: '5mg',
          frequency: 'مرة واحدة صباحاً',
          startDate: '2024-01-15',
          status: 'active',
          reminderEnabled: true,
          createdAt: '2024-01-15T00:00:00Z',
        },
      ],
      encounters: [
        {
          id: 'enc1',
          memberId: 'member-1',
          visitDate: '2026-08-10',
          doctorName: 'د. خالد عبد الرحمن',
          specialty: 'باطنة وقبل',
          diagnosis: 'متابعة ضغط الدم',
          notes: 'ضغط الدم مستقر مع العلاج الحالي',
          createdAt: '2026-08-10T00:00:00Z',
        },
      ],
    };

    const bundle = mapToFHIRIPS(mockMember, mockReportData);

    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.type).toBe('document');
    expect(bundle.entry.length).toBeGreaterThanOrEqual(4);

    // Entry 0 must be Composition
    const composition = bundle.entry[0].resource;
    expect(composition.resourceType).toBe('Composition');
    expect(composition.status).toBe('final');
    expect(composition.title).toContain('Patient Summary');

    // Entry 1 must be Patient
    const patient = bundle.entry[1].resource as Record<string, any>;
    expect(patient.resourceType).toBe('Patient');
    expect(patient.name[0].text).toBe('أحمد مصطفى');
    expect(patient.gender).toBe('male');
    expect(patient.birthDate).toBe('1985-05-12');

    // Should include observation
    const observations = bundle.entry.filter(e => e.resource.resourceType === 'Observation');
    expect(observations.length).toBe(1);
    const firstObs = observations[0].resource as Record<string, any>;
    expect(firstObs.code.coding[0].code).toBe(LOINC_CODES.BLOOD_PRESSURE_PANEL);

    // Should include medication statement
    const medications = bundle.entry.filter(e => e.resource.resourceType === 'MedicationStatement');
    expect(medications.length).toBe(1);
    expect(medications[0].resource.status).toBe('active');
  });
});
