import fs from 'fs';
import path from 'path';
import type { CompactDrugRecord, EgyptianDrugMatch } from '@/types/drugs';

let cachedRecords: CompactDrugRecord[] | null = null;
let cachedNormalized: {
  record: CompactDrugRecord;
  normEn: string;
  normAr: string;
  normSc: string;
}[] | null = null;

export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // tashkeel & tatweel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase()
    .trim();
}

export function normalizeText(text: string): string {
  if (!text) return '';
  return normalizeArabic(text);
}

function loadDrugDatabase(): CompactDrugRecord[] {
  if (cachedRecords) return cachedRecords;

  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'egyptian-drugs-compact.json');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      cachedRecords = JSON.parse(content) as CompactDrugRecord[];
    } else {
      cachedRecords = [];
    }
  } catch (err) {
    console.error('Failed to load egyptian drugs database:', err);
    cachedRecords = [];
  }

  // Pre-normalize index for blazing search
  cachedNormalized = cachedRecords.map((record) => ({
    record,
    normEn: normalizeText(record.en),
    normAr: normalizeText(record.ar),
    normSc: normalizeText(record.sc),
  }));

  return cachedRecords;
}

export function searchEgyptianDrugs(query: string, limit = 20): EgyptianDrugMatch[] {
  loadDrugDatabase();

  if (!cachedNormalized || cachedNormalized.length === 0) {
    return [];
  }

  const cleanQuery = normalizeText(query);
  if (!cleanQuery) {
    // Return sample popular Egyptian drugs if query is empty
    return cachedNormalized.slice(0, Math.min(limit, 10)).map(({ record }, idx) => formatDrugMatch(record, idx));
  }

  interface ScoredMatch {
    record: CompactDrugRecord;
    score: number;
  }

  const matches: ScoredMatch[] = [];

  for (let i = 0; i < cachedNormalized.length; i++) {
    const item = cachedNormalized[i];
    const { record, normEn, normAr, normSc } = item;

    let score = 0;

    // Check Arabic commercial name
    if (normAr) {
      if (normAr === cleanQuery) {
        score = 100;
      } else if (normAr.startsWith(cleanQuery)) {
        score = 80;
      } else if (normAr.includes(cleanQuery)) {
        score = 40;
      }
    }

    // Check English commercial name
    if (normEn) {
      if (normEn === cleanQuery) {
        score = Math.max(score, 90);
      } else if (normEn.startsWith(cleanQuery)) {
        score = Math.max(score, 70);
      } else if (normEn.includes(cleanQuery)) {
        score = Math.max(score, 30);
      }
    }

    // Check Active Ingredient / Scientific name
    if (normSc && score < 30) {
      if (normSc.startsWith(cleanQuery)) {
        score = Math.max(score, 50);
      } else if (normSc.includes(cleanQuery)) {
        score = Math.max(score, 20);
      }
    }

    if (score > 0) {
      matches.push({ record, score });
    }
  }

  // Sort by score descending, then by shorter commercial name
  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const lenA = (a.record.ar || a.record.en).length;
    const lenB = (b.record.ar || b.record.en).length;
    return lenA - lenB;
  });

  return matches.slice(0, limit).map((m, idx) => formatDrugMatch(m.record, idx));
}

function formatDrugMatch(record: CompactDrugRecord, index: number): EgyptianDrugMatch {
  let displayName = record.en;
  if (record.ar && record.en) {
    displayName = `${record.ar} (${record.en})`;
  } else if (record.ar) {
    displayName = record.ar;
  }

  return {
    id: `drug-${index}-${record.en.slice(0, 10).replace(/[^a-zA-Z0-9]/g, '')}`,
    nameEn: record.en,
    nameAr: record.ar,
    displayName,
    scientificName: record.sc,
    manufacturer: record.mfg,
    route: record.rt,
    priceEgp: record.pr,
  };
}
