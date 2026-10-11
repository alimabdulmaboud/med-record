#!/usr/bin/env node
/**
 * scripts/check-arabic-quality.mjs
 * 
 * Verifies Arabic-first localization and translation key parity between ar.json and en.json.
 */

import fs from 'node:fs';
import path from 'node:path';

const arPath = path.resolve('src/lib/i18n/messages/ar.json');
const enPath = path.resolve('src/lib/i18n/messages/en.json');

const arMessages = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const enMessages = JSON.parse(fs.readFileSync(enPath, 'utf8'));

function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      keys = keys.concat(getAllKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const arKeys = getAllKeys(arMessages);
const enKeys = getAllKeys(enMessages);

const missingInEn = arKeys.filter(k => !enKeys.includes(k));
const missingInAr = enKeys.filter(k => !arKeys.includes(k));

console.log(`--- Arabic Quality & Localization Parity Check ---`);
console.log(`Total Arabic keys: ${arKeys.length}`);
console.log(`Total English keys: ${enKeys.length}`);

if (missingInEn.length > 0) {
  console.warn(`[WARNING] Keys present in ar.json but missing in en.json (${missingInEn.length}):`);
  console.warn(missingInEn.slice(0, 10));
}

if (missingInAr.length > 0) {
  console.warn(`[WARNING] Keys present in en.json but missing in ar.json (${missingInAr.length}):`);
  console.warn(missingInAr.slice(0, 10));
}

if (missingInEn.length === 0 && missingInAr.length === 0) {
  console.log(`[SUCCESS] 100% key parity between Arabic and English catalogs!`);
}
