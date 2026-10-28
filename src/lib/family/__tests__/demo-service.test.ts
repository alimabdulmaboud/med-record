import { describe, it, expect, beforeEach } from 'vitest';
import {
  isDemoModeActive,
  getStoredPeople,
  clearDemoData,
  restoreDemoData,
  DEMO_CLEARED_KEY,
  PEOPLE_STORAGE_KEY,
  INITIAL_DEMO_PEOPLE,
  getFamilyName,
  saveFamilyName,
} from '../demo-service';

// Mock localStorage for vitest Node environment
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const key of Object.keys(mockStorage)) {
      delete mockStorage[key];
    }
  },
};

describe('Family Demo Service', () => {
  beforeEach(() => {
    // Setup global window and localStorage
    (global as unknown as { window: unknown }).window = {
      localStorage: localStorageMock,
    };
    (global as unknown as { localStorage: typeof localStorageMock }).localStorage = localStorageMock;
    localStorageMock.clear();
  });

  it('detects demo mode active by default for first-time visitor', () => {
    expect(isDemoModeActive()).toBe(true);
    const people = getStoredPeople();
    expect(people.length).toBe(3);
    expect(people[0].name).toContain('أحمد مصطفى');
  });

  it('clears all demo data and sets cleared flag', () => {
    clearDemoData();

    expect(isDemoModeActive()).toBe(false);
    expect(localStorageMock.getItem(DEMO_CLEARED_KEY)).toBe('true');
    expect(getStoredPeople()).toEqual([]);
    expect(getFamilyName()).toBe('سجل عائلتي الصحي');
  });

  it('restores demo data cleanly when requested', () => {
    clearDemoData();
    expect(isDemoModeActive()).toBe(false);

    restoreDemoData();
    expect(isDemoModeActive()).toBe(true);
    expect(localStorageMock.getItem(DEMO_CLEARED_KEY)).toBeNull();
    const people = getStoredPeople();
    expect(people.length).toBe(INITIAL_DEMO_PEOPLE.length);
  });

  it('allows customizing and retrieving family name', () => {
    saveFamilyName('عائلة الأستاذ محمود');
    expect(getFamilyName()).toBe('عائلة الأستاذ محمود');
  });
});
