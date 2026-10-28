import type {
  PersonDocument,
  CreateDocumentInput,
  DocumentFilter,
} from '@/types/documents';
import type { Person } from '@/types/family';
import { generateExpiringSignedUrl } from '@/lib/med-record/storage';

const STORAGE_KEY = 'med_person_documents';

let inMemoryDocuments: PersonDocument[] = [];

export function clearDocumentsStore(): void {
  inMemoryDocuments = [];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

function loadAllDocuments(): PersonDocument[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
  }
  return inMemoryDocuments;
}

function saveAllDocuments(list: PersonDocument[]): void {
  inMemoryDocuments = list;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }
}

export async function addPersonDocument(
  input: CreateDocumentInput
): Promise<PersonDocument> {
  const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const storagePath =
    input.storage_path ||
    `families/${input.family_id}/people/${input.person_id}/${docId}_${input.file_name}`;

  const newDoc: PersonDocument = {
    id: docId,
    family_id: input.family_id,
    person_id: input.person_id,
    title: input.title.trim(),
    document_type: input.document_type,
    file_name: input.file_name,
    file_type: input.file_type,
    file_size_bytes: input.file_size_bytes,
    storage_path: storagePath,
    doctor_name: input.doctor_name?.trim() || null,
    facility_name: input.facility_name?.trim() || null,
    document_date: input.document_date || new Date().toISOString().split('T')[0],
    tags: input.tags || [],
    notes: input.notes?.trim() || null,
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const list = loadAllDocuments();
  list.unshift(newDoc);
  saveAllDocuments(list);

  return newDoc;
}

export async function getPersonDocuments(
  personId: string,
  filter?: DocumentFilter
): Promise<PersonDocument[]> {
  const all = loadAllDocuments();
  let filtered = all.filter((d) => d.person_id === personId && !d.archived_at);

  if (filter?.category && filter.category !== 'all') {
    filtered = filtered.filter((d) => d.document_type === filter.category);
  }

  if (filter?.search && filter.search.trim()) {
    const q = filter.search.toLowerCase().trim();
    filtered = filtered.filter((d) => {
      const matchTitle = d.title.toLowerCase().includes(q);
      const matchDoc = d.doctor_name?.toLowerCase().includes(q) ?? false;
      const matchFac = d.facility_name?.toLowerCase().includes(q) ?? false;
      const matchNotes = d.notes?.toLowerCase().includes(q) ?? false;
      const matchTags = d.tags.some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchDoc || matchFac || matchNotes || matchTags;
    });
  }

  if (filter?.startDate) {
    filtered = filtered.filter((d) => d.document_date >= filter.startDate!);
  }

  if (filter?.endDate) {
    filtered = filtered.filter((d) => d.document_date <= filter.endDate!);
  }

  filtered.sort(
    (a, b) => new Date(b.document_date).getTime() - new Date(a.document_date).getTime()
  );

  if (filter?.limit && filter.limit > 0) {
    filtered = filtered.slice(0, filter.limit);
  }

  return filtered;
}

export async function archivePersonDocument(documentId: string): Promise<boolean> {
  const all = loadAllDocuments();
  const doc = all.find((d) => d.id === documentId);
  if (!doc) return false;

  doc.archived_at = new Date().toISOString();
  doc.updated_at = new Date().toISOString();
  saveAllDocuments(all);
  return true;
}

export async function getDocumentDownloadUrl(
  documentId: string,
  expiresInSeconds: number = 900 // 15 mins default
): Promise<string> {
  const all = loadAllDocuments();
  const doc = all.find((d) => d.id === documentId);
  if (!doc) {
    throw new Error('المستند غير موجود أو تم حذفه');
  }

  return generateExpiringSignedUrl(doc.storage_path, expiresInSeconds);
}

export async function seedRealisticMockDocuments(people: Person[]): Promise<void> {
  const existing = loadAllDocuments();
  if (existing.length > 0) return;

  const ahmed = people.find((p) => p.name.includes('أحمد مصطفى'));
  const sara = people.find((p) => p.name.includes('سارة'));
  const yassin = people.find((p) => p.name.includes('ياسين'));

  if (ahmed) {
    await addPersonDocument({
      family_id: ahmed.family_id,
      person_id: ahmed.id,
      title: 'تحليل دم شامل (Complete Blood Count - CBC)',
      document_type: 'lab_result',
      file_name: 'ahmed_cbc_2026.pdf',
      file_type: 'application/pdf',
      file_size_bytes: 420 * 1024,
      doctor_name: 'د. طارق السعدني',
      facility_name: 'معامل البرج - فرع المعادي',
      document_date: '2026-10-15',
      tags: ['CBC', 'هيموجلوبين', 'صورة دم'],
      notes: 'الهيموجلوبين طبيعي 14.8 g/dL',
    });

    await addPersonDocument({
      family_id: ahmed.family_id,
      person_id: ahmed.id,
      title: 'أشعة رنين مغناطيسي على الفقرات القطنية',
      document_type: 'radiology',
      file_name: 'mri_lumbar_spine.pdf',
      file_type: 'application/pdf',
      file_size_bytes: 3500 * 1024,
      doctor_name: 'د. خالد عبد الرحمن',
      facility_name: 'كايرو سكان - المهندسين',
      document_date: '2026-08-20',
      tags: ['MRI', 'رنين', 'ظهر'],
      notes: 'انزلاق غضروفي بسيط بين L4 و L5',
    });

    await addPersonDocument({
      family_id: ahmed.family_id,
      person_id: ahmed.id,
      title: 'روشتة علاج ارتفاع ضغط الدم',
      document_type: 'prescription',
      file_name: 'hypertension_rx.jpg',
      file_type: 'image/jpeg',
      file_size_bytes: 750 * 1024,
      doctor_name: 'د. سامح الجمال',
      facility_name: 'عيادات كليوباترا',
      document_date: '2026-09-01',
      tags: ['روشتة', 'ضغط'],
      notes: 'كونكور 5 ملغ قرص صباحاً',
    });
  }

  if (sara) {
    await addPersonDocument({
      family_id: sara.family_id,
      person_id: sara.id,
      title: 'شهادة التطعيمات الإلزامية حتى 18 شهراً',
      document_type: 'vaccination_card',
      file_name: 'sara_vaccination_card.pdf',
      file_type: 'application/pdf',
      file_size_bytes: 1200 * 1024,
      facility_name: 'مكتب صحة النزهة',
      document_date: '2022-10-10',
      tags: ['تطعيمات', 'صحة', 'إلزامي'],
    });

    await addPersonDocument({
      family_id: sara.family_id,
      person_id: sara.id,
      title: 'تحليل حساسية الطعام المتقدم (IgE)',
      document_type: 'lab_result',
      file_name: 'sara_allergy_panel.pdf',
      file_type: 'application/pdf',
      file_size_bytes: 850 * 1024,
      doctor_name: 'د. رانيا المهدي',
      facility_name: 'معامل المختبر',
      document_date: '2024-05-12',
      tags: ['حساسية', 'فول سوداني'],
      notes: 'تأكيد الحساسية الشديدة من الفول السوداني (الفئة 4)',
    });
  }

  if (yassin) {
    await addPersonDocument({
      family_id: yassin.family_id,
      person_id: yassin.id,
      title: 'إخطار ولادة وفحص السمع والغدة الدرقية',
      document_type: 'hospital_report',
      file_name: 'birth_and_newborn_screening.pdf',
      file_type: 'application/pdf',
      file_size_bytes: 650 * 1024,
      facility_name: 'مستشفى دار الفؤاد',
      document_date: '2025-08-22',
      tags: ['حديثي ولادة', 'كعب الطفل', 'سمع'],
      notes: 'كافة فحوصات حديثي الولادة طبيعية وسليمة تماماً',
    });
  }
}
