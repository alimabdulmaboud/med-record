import { NextRequest, NextResponse } from 'next/server';
import { verifySignedUrlToken } from '@/lib/med-record/storage';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  const expires = searchParams.get('expires');
  const token = searchParams.get('token');

  if (!path || !expires || !token) {
    return NextResponse.json(
      { error: 'Missing signed URL verification parameters' },
      { status: 400 }
    );
  }

  const isValid = verifySignedUrlToken(request.url);
  if (!isValid) {
    return NextResponse.json(
      {
        error: 'انتهت صلاحية رابط التحميل أو أن الرابط غير مصرح به (URL Expired or Unauthorized)',
        code: 'EXPIRED_OR_INVALID_TOKEN',
      },
      { status: 403 }
    );
  }

  // Generate a mock response content representing the protected health document
  const fileName = decodeURIComponent(path).split('/').pop() || 'document.pdf';
  const isPdf = fileName.toLowerCase().endsWith('.pdf');

  // Return synthetic mock document buffer for download
  const mockContent = `PDF/1.4 - Med Record Secure Document Vault\nDocument: ${fileName}\nSigned-URL-Verification: Passed\nExpires-At: ${new Date(
    parseInt(expires, 10) * 1000
  ).toISOString()}`;

  return new NextResponse(mockContent, {
    status: 200,
    headers: {
      'Content-Type': isPdf ? 'application/pdf' : 'text/plain; charset=utf-8',
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    },
  });
}
