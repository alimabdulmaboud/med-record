import type { FamilyMember, DoctorReportData, Measurement } from '@/types/med-record';

export const LOINC_CODES = {
  BLOOD_PRESSURE_PANEL: '85354-9',
  SYSTOLIC_BP: '8480-6',
  DIASTOLIC_BP: '8462-4',
  HEART_RATE: '8867-4',
  BLOOD_GLUCOSE: '2339-0',
  HBA1C: '4548-4',
  BODY_WEIGHT: '29463-7',
  BODY_HEIGHT: '8302-2',
  HEAD_CIRCUMFERENCE: '9843-4',
  OXYGEN_SATURATION: '59408-5',
  BODY_TEMPERATURE: '8310-5',
} as const;

export interface FHIRResource {
  resourceType: string;
  id?: string;
  [key: string]: unknown;
}

export interface FHIREntry {
  fullUrl?: string;
  resource: FHIRResource;
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  id?: string;
  type: 'document';
  timestamp: string;
  entry: FHIREntry[];
}

export function mapToFHIRIPS(member: FamilyMember, reportData: DoctorReportData): FHIRBundle {
  const timestamp = reportData.generatedAt || new Date().toISOString();
  const compositionId = `composition-${member.id}-${Date.now()}`;
  const patientId = `patient-${member.id}`;

  const patientResource: FHIRResource = {
    resourceType: 'Patient',
    id: patientId,
    name: [
      {
        use: 'official',
        text: member.fullName,
      },
    ],
    gender: member.sex,
    birthDate: member.birthDate,
    extension: [
      {
        url: 'http://hl7.org/fhir/StructureDefinition/patient-bloodType',
        valueString: member.bloodType,
      },
    ],
  };

  const compositionResource: FHIRResource = {
    resourceType: 'Composition',
    id: compositionId,
    status: 'final',
    type: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '60591-5',
          display: 'Patient summary Document',
        },
      ],
      text: 'International Patient Summary',
    },
    title: `International Patient Summary - ${member.fullName}`,
    date: timestamp,
    subject: {
      reference: `Patient/${patientId}`,
      display: member.fullName,
    },
  };

  const entries: FHIREntry[] = [
    { resource: compositionResource },
    { resource: patientResource },
  ];

  // Add Allergies if present
  if (member.allergies && member.allergies.length > 0) {
    member.allergies.forEach((allergy, idx) => {
      entries.push({
        resource: {
          resourceType: 'AllergyIntolerance',
          id: `allergy-${member.id}-${idx}`,
          clinicalStatus: {
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active' }],
          },
          patient: { reference: `Patient/${patientId}` },
          code: { text: allergy },
        },
      });
    });
  }

  // Add Chronic Conditions
  if (member.chronicConditions && member.chronicConditions.length > 0) {
    member.chronicConditions.forEach((condition, idx) => {
      entries.push({
        resource: {
          resourceType: 'Condition',
          id: `condition-${member.id}-${idx}`,
          clinicalStatus: {
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }],
          },
          subject: { reference: `Patient/${patientId}` },
          code: { text: condition },
        },
      });
    });
  }

  // Add Measurements as Observations
  reportData.measurements.forEach((m: Measurement, idx: number) => {
    const obs: FHIRResource = {
      resourceType: 'Observation',
      id: `obs-${m.id || idx}`,
      status: 'final',
      category: [
        {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }],
        },
      ],
      code: {
        coding: [{ system: 'http://loinc.org', code: m.loincCode || LOINC_CODES.BLOOD_PRESSURE_PANEL }],
        text: m.measurementType,
      },
      subject: { reference: `Patient/${patientId}` },
      effectiveDateTime: m.recordedAt,
    };

    if (m.measurementType === 'blood_pressure') {
      obs.component = [
        {
          code: { coding: [{ system: 'http://loinc.org', code: LOINC_CODES.SYSTOLIC_BP }] },
          valueQuantity: { value: m.values.systolic, unit: 'mmHg' },
        },
        {
          code: { coding: [{ system: 'http://loinc.org', code: LOINC_CODES.DIASTOLIC_BP }] },
          valueQuantity: { value: m.values.diastolic, unit: 'mmHg' },
        },
      ];
    } else if (m.values.value !== undefined || m.values.glucose !== undefined) {
      obs.valueQuantity = {
        value: m.values.glucose !== undefined ? m.values.glucose : m.values.value,
        unit: m.unit,
      };
    }

    entries.push({ resource: obs });
  });

  // Add Medications
  reportData.medications.forEach((med, idx) => {
    entries.push({
      resource: {
        resourceType: 'MedicationStatement',
        id: `med-${med.id || idx}`,
        status: med.status,
        subject: { reference: `Patient/${patientId}` },
        medicationCodeableConcept: { text: med.name },
        dosage: [{ text: `${med.dose} - ${med.frequency}` }],
        effectivePeriod: { start: med.startDate, end: med.endDate },
      },
    });
  });

  return {
    resourceType: 'Bundle',
    type: 'document',
    timestamp,
    entry: entries,
  };
}
