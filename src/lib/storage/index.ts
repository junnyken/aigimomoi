import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export async function saveUploadedFile(
  file: File,
  subfolder: string = 'recipes'
): Promise<UploadResult> {
  // 1. Kiểm tra kích thước
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Dung lượng tệp vượt quá giới hạn tối đa 5MB.');
  }

  // 2. Kiểm tra định dạng MIME
  const mimeType = file.type.toLowerCase();
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(
      `Định dạng tệp không được hỗ trợ (${mimeType}). Chỉ chấp nhận JPG, PNG, WebP hoặc AVIF.`
    );
  }

  const ext = EXTENSION_MAP[mimeType] || 'jpg';
  const uniqueId = crypto.randomUUID().slice(0, 12);
  const timestamp = Date.now();
  const filename = `${timestamp}-${uniqueId}.${ext}`;

  // 3. Đường dẫn thư mục đích
  // Đảm bảo không bị Directory Traversal: chỉ cho phép ký tự an toàn trong subfolder
  const sanitizedSubfolder = subfolder.replace(/[^a-zA-Z0-9_-]/g, '');
  const targetDir = path.join(process.cwd(), 'public', 'uploads', sanitizedSubfolder);
  await mkdir(targetDir, { recursive: true });

  // 4. Lưu tệp nhị phân
  const filePath = path.join(targetDir, filename);
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(filePath, buffer);

  const publicUrl = `/uploads/${sanitizedSubfolder}/${filename}`;

  return {
    url: publicUrl,
    filename,
    size: file.size,
    mimeType,
  };
}

export async function deleteUploadedFile(publicUrl: string): Promise<boolean> {
  try {
    if (!publicUrl.startsWith('/uploads/')) {
      return false;
    }

    // Ngăn chặn Directory Traversal
    const safePath = path.normalize(publicUrl).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.join(process.cwd(), 'public', safePath);

    // Đảm bảo đường dẫn nằm trong public/uploads
    const baseUploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fullPath.startsWith(baseUploadsDir)) {
      return false;
    }

    await unlink(fullPath);
    return true;
  } catch (error) {
    // Không ném lỗi nếu tệp không tồn tại
    return false;
  }
}
