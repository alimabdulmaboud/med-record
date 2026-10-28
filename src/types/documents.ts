export type DocumentCategory =
  | 'lab_result'
  | 'radiology'
  | 'prescription'
  | 'hospital_report'
  | 'vaccination_card';

export interface PersonDocument {
  id: string;
  family_id: string;
  person_id: string;
  title: string;
  document_type: DocumentCategory;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  storage_path: string;
  doctor_name?: string | null;
  facility_name?: string | null;
  document_date: string;
  tags: string[];
  notes?: string | null;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentInput {
  family_id: string;
  person_id: string;
  title: string;
  document_type: DocumentCategory;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  storage_path?: string;
  doctor_name?: string;
  facility_name?: string;
  document_date?: string;
  tags?: string[];
  notes?: string;
}

export interface DocumentFilter {
  category?: DocumentCategory | 'all';
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}
