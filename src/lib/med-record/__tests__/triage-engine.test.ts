import { describe, it, expect } from 'vitest';
import { analyzeInitialComplaint, generateTriageAssessment } from '@/lib/med-record/triage-engine';
import type { FamilyMember } from '@/types/med-record';

describe('AI Medical Triage Engine (مساعد الفحص الذكي)', () => {
  const adultMember: FamilyMember = {
    id: 'mem-1',
    userId: 'u-1',
    fullName: 'أحمد محمود',
    relationship: 'self',
    birthDate: '1988-05-15',
    sex: 'male',
    bloodType: 'A+',
    chronicConditions: ['ارتفاع ضغط الدم'],
    allergies: ['حساسية البنسلين'],
    createdAt: '2026-01-01'
  };

  const childMember: FamilyMember = {
    id: 'mem-child',
    userId: 'u-1',
    fullName: 'يوسف أحمد',
    relationship: 'child',
    birthDate: '2022-10-10',
    sex: 'male',
    bloodType: 'O+',
    chronicConditions: [],
    allergies: [],
    createdAt: '2026-01-01'
  };

  it('correctly maps chest pain symptoms to Cardiology specialty with emergency warning', () => {
    const analysis = analyzeInitialComplaint('حاسس بألم في الصدر مع ثقل وضيق تنفس', {
      member: adultMember
    });

    expect(analysis.matchedRule.specialtyEn).toBe('Cardiology');
    expect(analysis.firstQuestion).toContain('الذراع الأيسر');

    const assessment = generateTriageAssessment(
      'ألم في الصدر مع ثقل',
      'يمتد للكتف والذراع الأيسر مع عرق',
      analysis.matchedRule,
      { member: adultMember }
    );

    expect(assessment.urgencyLevel).toBe('emergency');
    expect(assessment.recommendedSpecialtyAr).toContain('القلب');
    expect(assessment.comfortAdvice.some(a => a.includes('البنسلين'))).toBe(true);
  });

  it('routes children fever complaints to Pediatrics specialty with appropriate age questions', () => {
    const analysis = analyzeInitialComplaint('الطفل عنده سخونية عالية وخامل', {
      member: childMember
    });

    expect(analysis.matchedRule.specialtyEn).toBe('Pediatrics');
    expect(analysis.firstQuestion).toContain('الطفل عمره');

    const assessment = generateTriageAssessment(
      'الطفل عنده سخونية عالية',
      'الحرارة 39 وخمول',
      analysis.matchedRule,
      { member: childMember }
    );

    expect(assessment.recommendedSpecialtyAr).toContain('طب الأطفال');
    expect(assessment.comfortAdvice.some(a => a.includes('خافض حرارة آمن'))).toBe(true);
  });

  it('correctly routes abdominal colic to Gastroenterology', () => {
    const analysis = analyzeInitialComplaint('عندي مغص شديد في بطني مع غازات وإسهال', {
      member: adultMember
    });

    expect(analysis.matchedRule.specialtyEn).toBe('Gastroenterology');

    const assessment = generateTriageAssessment(
      'مغص في البطن',
      'حول السرة فقط دون حرارة',
      analysis.matchedRule,
      { member: adultMember }
    );

    expect(assessment.recommendedSpecialtyAr).toContain('الجهاز الهضمي');
    expect(assessment.questionsForDoctor.some(q => q.includes('جرثومة المعدة'))).toBe(true);
  });
});
