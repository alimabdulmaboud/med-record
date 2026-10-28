export interface CompactDrugRecord {
  en: string;
  ar: string;
  sc: string;
  mfg: string;
  rt: string;
  pr: number | null;
}

export interface EgyptianDrugMatch {
  id: string;
  nameEn: string;
  nameAr: string;
  displayName: string;
  scientificName: string;
  manufacturer: string;
  route: string;
  priceEgp: number | null;
}

export interface DrugSearchResponse {
  query: string;
  results: EgyptianDrugMatch[];
  total: number;
}
