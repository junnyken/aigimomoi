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

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function saveUploadedFile(file: File, subfolder: string = 'recipes'): Promise<UploadResult> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Định dạng tệp không được hỗ trợ. Vui lòng tải ảnh JPEG, PNG, WebP hoặc AVIF.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Dung lượng tệp vượt quá giới hạn 5MB.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const ext = path.extname(file.name).toLowerCase() || '.jpg';
  const hash = crypto.randomBytes(16).toString('hex');
  const filename = `${Date.now()}-${hash}${ext}`;
  const key = `${subfolder}/${filename}`;

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
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', subfolder);
  await fs.mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, buffer);

  return {
    url: `/uploads/${subfolder}/${filename}`,
    filename,
    size: file.size,
    mimeType: file.type,
    provider: 'LOCAL',
  };
}

export async function deleteUploadedFile(url: string): Promise<boolean> {
  try {
    if (!url.startsWith('/uploads/')) return false;
    const relativePath = url.replace(/^\//, '');
    const fullPath = path.join(process.cwd(), 'public', relativePath);
    await fs.unlink(fullPath);
    return true;
  } catch {
    return false;
  }
}
