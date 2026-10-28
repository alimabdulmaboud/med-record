import { describe, it, expect } from 'vitest';
import { normalizeArabic, searchEgyptianDrugs } from '../drug-search';

describe('Egyptian Drug Database Search', () => {
  it('normalizes Arabic characters and removes diacritics', () => {
    expect(normalizeArabic('أَوْجْمَنْتِينْ')).toBe('اوجمنتين');
    expect(normalizeArabic('إِبْرُوفِينْ')).toBe('ابروفين');
    expect(normalizeArabic('بانادول إكسترا')).toBe('بانادول اكسترا');
    expect(normalizeArabic('حبّة')).toBe('حبه');
    expect(normalizeArabic('كتافلام')).toBe('كتافلام');
  });

  it('searches drugs by Arabic commercial name', () => {
    const results = searchEgyptianDrugs('كونكور', 10);
    expect(results.length).toBeGreaterThan(0);
    const first = results[0];
    expect(first.displayName).toContain('كونكور');
    expect(first.scientificName).toContain('BISOPROLOL');
  });

  it('searches drugs by English commercial name', () => {
    const results = searchEgyptianDrugs('panadol', 10);
    expect(results.length).toBeGreaterThan(0);
    const hasPanadol = results.some((r) => r.nameEn.toLowerCase().includes('panadol'));
    expect(hasPanadol).toBe(true);
  });

  it('searches drugs by active ingredient (scientific name)', () => {
    const results = searchEgyptianDrugs('paracetamol', 10);
    expect(results.length).toBeGreaterThan(0);
    const hasParacetamol = results.some((r) => r.scientificName.toUpperCase().includes('PARACETAMOL'));
    expect(hasParacetamol).toBe(true);
  });

  it('handles empty query gracefully with default items', () => {
    const results = searchEgyptianDrugs('', 5);
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(5);
  });
});
