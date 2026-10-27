import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  MOCK_FAMILY_MEMBERS,
  MOCK_MEASUREMENTS,
  MOCK_GROWTH_MEASUREMENTS,
  MOCK_MEDICATIONS,
  MOCK_DOCUMENTS,
  MOCK_ENCOUNTERS,
  MOCK_VACCINATIONS,
} from '@/lib/med-record/mock-data';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'med-record-db.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getDefaultMockState() {
  return {
    isMockData: true,
    members: MOCK_FAMILY_MEMBERS,
    measurements: MOCK_MEASUREMENTS,
    growthMeasurements: MOCK_GROWTH_MEASUREMENTS,
    medications: MOCK_MEDICATIONS,
    documents: MOCK_DOCUMENTS,
    encounters: MOCK_ENCOUNTERS,
    vaccinations: MOCK_VACCINATIONS,
    reports: [],
    shares: [],
  };
}

function getCleanEmptyState() {
  return {
    isMockData: false,
    members: [],
    measurements: [],
    growthMeasurements: [],
    medications: [],
    documents: [],
    encounters: [],
    vaccinations: [],
    reports: [],
    shares: [],
  };
}

export async function GET() {
  try {
    ensureDataDir();
    if (!fs.existsSync(DB_FILE)) {
      const defaultState = getDefaultMockState();
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultState, null, 2), 'utf-8');
      return NextResponse.json(defaultState);
    }

    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(content);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    ensureDataDir();
    const body = await req.json();

    if (body.action === 'clear_mock') {
      const emptyState = getCleanEmptyState();
      fs.writeFileSync(DB_FILE, JSON.stringify(emptyState, null, 2), 'utf-8');
      return NextResponse.json({ success: true, state: emptyState });
    }

    if (body.action === 'reset_mock') {
      const mockState = getDefaultMockState();
      fs.writeFileSync(DB_FILE, JSON.stringify(mockState, null, 2), 'utf-8');
      return NextResponse.json({ success: true, state: mockState });
    }

    // Direct save of full state
    fs.writeFileSync(DB_FILE, JSON.stringify(body, null, 2), 'utf-8');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
