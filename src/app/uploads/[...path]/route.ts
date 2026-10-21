import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const EXT_TO_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await context.params;
    if (!Array.isArray(segments) || segments.length === 0) {
      return new NextResponse('Not Found', { status: 404 });
    }

    for (const seg of segments) {
      if (!seg || seg === '.' || seg === '..' || seg.includes('/') || seg.includes('\\') || seg.includes('\0')) {
        return new NextResponse('Bad Request', { status: 400 });
      }
    }

    const uploadsRoot = path.resolve(process.cwd(), 'public', 'uploads');
    const targetPath = path.resolve(uploadsRoot, ...segments);

    if (!targetPath.startsWith(uploadsRoot + path.sep)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const ext = path.extname(targetPath).toLowerCase();
    const contentType = EXT_TO_MIME[ext];
    if (!contentType) {
      return new NextResponse('Unsupported Media Type', { status: 415 });
    }

    const fileBuffer = await fs.readFile(targetPath);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new NextResponse('Not Found', { status: 404 });
  }
}
