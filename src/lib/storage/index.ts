// Storage Adapter: Hỗ trợ linh hoạt Cloudflare R2 / AWS S3 và Local Disk Fallback
// Tự động phát hiện biến môi trường:
// - Nếu có S3_ENDPOINT hoặc R2_ACCOUNT_ID -> Lưu trữ đám mây Cloudflare R2 / AWS S3
// - Nếu không có -> Lưu trữ thư mục cục bộ public/uploads/ (Local fallback cho Dev/VPS)

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

import { getR2Config, uploadBufferToR2 } from './r2Client';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  provider: 'LOCAL' | 'S3_R2';
}

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

const SAFE_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function sanitizeSubfolder(rawSubfolder: string): string {
  const cleaned = (rawSubfolder || 'recipes')
    .replace(/\\/g, '/')
    .split('/')
    .filter((segment) => segment && segment !== '.' && segment !== '..')
    .join('-')
    .replace(/[^a-zA-Z0-9_-]/g, '');
  return cleaned || 'recipes';
}

function hasValidImageSignature(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  // Chặn nội dung HTML / XML / SVG / Script giả mạo ảnh
  const headStr = buffer.subarray(0, 64).toString('utf8').trimStart().toLowerCase();
  if (
    headStr.startsWith('<') ||
    headStr.includes('<script') ||
    headStr.includes('<svg') ||
    headStr.includes('<!doctype')
  ) {
    return false;
  }
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  // GIF: GIF87a / GIF89a
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return true;
  // WebP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return true;
  }
  // AVIF / ISO BMFF: ....ftyp
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
    return true;
  }
  return false;
}

export async function saveUploadedFile(file: File, subfolder: string = 'recipes'): Promise<UploadResult> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Định dạng tệp không được hỗ trợ. Vui lòng tải ảnh JPEG, PNG, WebP hoặc AVIF.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Dung lượng tệp vượt quá giới hạn 5MB.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!hasValidImageSignature(buffer)) {
    throw new Error('Nội dung tệp không phải là định dạng ảnh hợp lệ.');
  }

  const cleanSubfolder = sanitizeSubfolder(subfolder);
  const rawExt = path.extname(file.name || '').toLowerCase();
  const ext = SAFE_IMAGE_EXTENSIONS.has(rawExt) ? rawExt : (MIME_TO_EXT[file.type] || '.jpg');
  const hash = crypto.randomBytes(16).toString('hex');
  const filename = `${Date.now()}-${hash}${ext}`;
  const key = `${cleanSubfolder}/${filename}`;

  // 1. Kiểm tra cấu hình Cloudflare R2
  const r2Config = getR2Config();
  if (r2Config) {
    try {
      const publicUrl = await uploadBufferToR2(buffer, key, file.type, r2Config);
      logger.info('File successfully uploaded to Cloudflare R2', { key, publicUrl });
      return {
        url: publicUrl,
        filename,
        size: file.size,
        mimeType: file.type,
        provider: 'S3_R2',
      };
    } catch (err) {
      logger.warn('Cloudflare R2 upload failed, falling back to local disk storage', { err });
    }
  }

  // 2. Mặc định: Local Storage Fallback (Lưu thư mục public/uploads/)
  const uploadsRoot = path.resolve(process.cwd(), 'public', 'uploads');
  const uploadDir = path.resolve(uploadsRoot, cleanSubfolder);
  if (!uploadDir.startsWith(uploadsRoot + path.sep)) {
    throw new Error('Thư mục lưu trữ không hợp lệ.');
  }
  await fs.mkdir(uploadDir, { recursive: true });

  const filePath = path.resolve(uploadDir, filename);
  if (!filePath.startsWith(uploadDir + path.sep)) {
    throw new Error('Đường dẫn tệp không hợp lệ.');
  }
  await fs.writeFile(filePath, buffer);

  return {
    url: `/uploads/${cleanSubfolder}/${filename}`,
    filename,
    size: file.size,
    mimeType: file.type,
    provider: 'LOCAL',
  };
}

export async function deleteUploadedFile(url: string): Promise<boolean> {
  try {
    if (!url || typeof url !== 'string' || !url.startsWith('/uploads/')) return false;
    if (url.includes('..') || url.includes('\0') || url.includes('\\')) return false;

    const uploadsRoot = path.resolve(process.cwd(), 'public', 'uploads');
    const relativeFromUploads = url.slice('/uploads/'.length);
    if (!relativeFromUploads) return false;

    const fullPath = path.resolve(uploadsRoot, relativeFromUploads);
    if (!fullPath.startsWith(uploadsRoot + path.sep) || fullPath === uploadsRoot) {
      return false;
    }

    await fs.unlink(fullPath);
    return true;
  } catch {
    return false;
  }
}
