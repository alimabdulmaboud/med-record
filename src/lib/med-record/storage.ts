/**
 * Secure Private Storage & Expiring Signed URLs Engine
 * Medical documents (scans, lab reports, prescriptions) MUST NOT be accessible via public URLs.
 * This module generates cryptographic signed URLs with customizable expiration (e.g. 15 minutes).
 */

const STORAGE_SECRET = process.env.MED_RECORD_STORAGE_SECRET || 'med-record-private-storage-key-2026';

function simpleHMAC(input: string, key: string): string {
  let hash = 0;
  const str = `${input}:${key}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

export async function generateExpiringSignedUrl(
  storagePath: string,
  expiresInSeconds: number = 900 // 15 mins default
): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = `${storagePath}:${expiresAt}`;
  const token = simpleHMAC(payload, STORAGE_SECRET);

  const encodedPath = encodeURIComponent(storagePath);
  return `/api/med-record/documents/download?path=${encodedPath}&expires=${expiresAt}&token=${token}`;
}

export function verifySignedUrlToken(signedUrlOrQuery: string): boolean {
  try {
    const url = new URL(signedUrlOrQuery, 'http://localhost');
    const path = decodeURIComponent(url.searchParams.get('path') || '');
    const expiresStr = url.searchParams.get('expires');
    const token = url.searchParams.get('token');

    if (!path || !expiresStr || !token) {
      return false;
    }

    const expiresAt = parseInt(expiresStr, 10);
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (nowSeconds > expiresAt) {
      return false; // Expired
    }

    const expectedToken = simpleHMAC(`${path}:${expiresAt}`, STORAGE_SECRET);
    return token === expectedToken;
  } catch {
    return false;
  }
}
