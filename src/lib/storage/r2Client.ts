// Cloudflare R2 Native S3 SigV4 Upload Client (Zero-dependency)
// Sử dụng chuẩn AWS Signature Version 4 để đẩy ảnh trực tiếp vào Cloudflare R2 bucket
import crypto from 'crypto';
import { logger } from '@/lib/logger';

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicDomain?: string; // Ví dụ: 'https://media.angimom.vn' hoặc 'https://pub-xxx.r2.dev'
}

export function getR2Config(): R2Config | null {
  let accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || process.env.R2_ACCOUNT_ID;
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT || process.env.R2_ENDPOINT || process.env.S3_ENDPOINT;
  if (!accountId && endpoint) {
    const match = endpoint.match(/https?:\/\/([a-zA-Z0-9]+)\.r2\.cloudflarestorage\.com/i);
    if (match?.[1]) {
      accountId = match[1];
    }
  }

  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || process.env.S3_BUCKET_NAME || 'angimom-media';
  const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN || process.env.R2_PUBLIC_DOMAIN || process.env.S3_PUBLIC_DOMAIN;

  if (accountId && accessKeyId && secretAccessKey) {
    return {
      accountId,
      accessKeyId,
      secretAccessKey,
      bucketName,
      publicDomain,
    };
  }

  return null;
}

function hmac(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest();
}

function hashSha256(data: Buffer | string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Tải file lên Cloudflare R2 bằng REST API và AWS Signature V4
 */
export async function uploadBufferToR2(
  buffer: Buffer,
  key: string,
  contentType: string,
  config: R2Config
): Promise<string> {
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const region = 'auto'; // Cloudflare R2 dùng region 'auto'
  const service = 's3';

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.substring(0, 8); // YYYYMMDD

  const canonicalUri = `/${config.bucketName}/${key.replace(/^\//, '')}`;
  const canonicalQuery = '';

  const payloadHash = hashSha256(buffer);

  // Canonical headers (phải xếp thứ tự chữ cái thường)
  const canonicalHeaders = 
    `content-length:${buffer.length}\n` +
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;

  const signedHeaders = 'content-length;content-type;host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest = 
    `PUT\n` +
    `${canonicalUri}\n` +
    `${canonicalQuery}\n` +
    `${canonicalHeaders}\n` +
    `${signedHeaders}\n` +
    `${payloadHash}`;

  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = 
    `${algorithm}\n` +
    `${amzDate}\n` +
    `${credentialScope}\n` +
    `${hashSha256(canonicalRequest)}`;

  // Tạo signature key
  const kDate = hmac(`AWS4${config.secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');

  const authorizationHeader = 
    `${algorithm} ` +
    `Credential=${config.accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, ` +
    `Signature=${signature}`;

  const url = `https://${host}${canonicalUri}`;

  logger.info('Uploading asset to Cloudflare R2', { key, bucket: config.bucketName, size: buffer.length });

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Host': host,
      'Content-Type': contentType,
      'Content-Length': String(buffer.length),
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      'Authorization': authorizationHeader,
    },
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Cloudflare R2 upload error (${res.status}): ${errorText}`);
  }

  // Tạo public URL
  if (config.publicDomain) {
    return `${config.publicDomain.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
  }

  return `https://${config.bucketName}.${config.accountId}.r2.cloudflarestorage.com/${key.replace(/^\//, '')}`;
}
