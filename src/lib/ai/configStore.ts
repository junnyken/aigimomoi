// Quản lý Cấu hình AI & Khóa API Mã hóa AES-256-GCM (DeepSeek / Gemini / OpenAI)
// Bảo mật theo chuẩn webapp-security:
// - Chỉ ADMIN mới được ghi/cập nhật qua /api/editor/ai-settings.
// - Khóa API được mã hóa AES-256-GCM bằng khóa dẫn xuất từ AUTH_SECRET trước khi lưu xuống PostgreSQL & đĩa.
// - Tuyệt đối không bao giờ trả khóa thô (raw API key) về trình duyệt; chỉ trả chuỗi đã che (masked) 4 ký tự cuối.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getAuthSecret } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

export type AiPrimaryOrder = 'DEEPSEEK_FIRST' | 'GEMINI_FIRST' | 'OPENAI_FIRST';

export interface StoredAiSettings {
  primaryOrder: AiPrimaryOrder;
  deepseekApiKey?: string;
  deepseekModel?: string;
  deepseekBaseUrl?: string;
  geminiApiKey?: string;
  geminiModel?: string;
  openaiApiKey?: string;
  openaiModel?: string;
  updatedAt?: string;
  updatedByEmail?: string;
}

export interface EffectiveAiConfig {
  primaryOrder: AiPrimaryOrder;
  deepseek: {
    apiKey: string;
    model: string;
    baseUrl: string;
    source: 'ADMIN_CONFIG' | 'ENV' | 'NONE';
  };
  gemini: {
    apiKey: string;
    model: string;
    source: 'ADMIN_CONFIG' | 'ENV' | 'NONE';
  };
  openai: {
    apiKey: string;
    model: string;
    source: 'ADMIN_CONFIG' | 'ENV' | 'NONE';
  };
  updatedAt?: string;
  updatedByEmail?: string;
}

const CONFIG_KEY = 'ai_gateway_config_v1';

let memoryCache: StoredAiSettings | null = null;
let lastLoadedAt = 0;
const CACHE_TTL_MS = 15_000; // Tự động đồng bộ lại từ DB mỗi 15 giây nếu có nhiều worker
let tableInitialized = false;

function getEncryptionKey32(): Buffer {
  let baseSecret = 'angimom_fallback_local_dev_key_derivation_seed_only';
  try {
    baseSecret = getAuthSecret();
  } catch {
    // Trong môi trường test đơn vị chưa set AUTH_SECRET, dùng seed cục bộ
  }
  return crypto.createHash('sha256').update(`${baseSecret}::angimom_ai_config_aes256gcm_v1`).digest();
}

export function encryptConfigPayload(data: StoredAiSettings): string {
  const key = getEncryptionKey32();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(data), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `v1:${iv.toString('base64url')}:${authTag.toString('base64url')}:${encrypted.toString('base64url')}`;
}

export function decryptConfigPayload(token: string): StoredAiSettings | null {
  try {
    const parts = token.split(':');
    if (parts.length !== 4 || parts[0] !== 'v1') return null;
    const iv = Buffer.from(parts[1], 'base64url');
    const authTag = Buffer.from(parts[2], 'base64url');
    const ciphertext = Buffer.from(parts[3], 'base64url');

    const key = getEncryptionKey32();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8')) as StoredAiSettings;
  } catch {
    return null;
  }
}

function getLocalFallbackFilePath(): string {
  const persistentDir = fs.existsSync('/app/data')
    ? '/app/data'
    : path.join(process.cwd(), '.data');
  try {
    if (!fs.existsSync(persistentDir)) {
      fs.mkdirSync(persistentDir, { recursive: true });
    }
  } catch {
    // ignore
  }
  return path.join(persistentDir, 'ai-gateway-config.enc');
}

async function ensureConfigTable(): Promise<void> {
  if (tableInitialized) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS app_system_configs (
      key TEXT PRIMARY KEY,
      encrypted_payload TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  tableInitialized = true;
}

export async function loadStoredAiSettings(forceRefresh = false): Promise<StoredAiSettings> {
  const now = Date.now();
  if (!forceRefresh && memoryCache && now - lastLoadedAt < CACHE_TTL_MS) {
    return memoryCache;
  }

  // 1. Ưu tiên đọc từ bảng PostgreSQL `app_system_configs`
  try {
    await ensureConfigTable();
    const rows = await db.execute(sql`
      SELECT encrypted_payload
      FROM app_system_configs
      WHERE key = ${CONFIG_KEY}
      LIMIT 1
    `);
    const row = rows[0] as { encrypted_payload?: string } | undefined;
    if (row?.encrypted_payload) {
      const decoded = decryptConfigPayload(row.encrypted_payload);
      if (decoded) {
        memoryCache = decoded;
        lastLoadedAt = now;
        return decoded;
      }
    }
  } catch {
    // Fallback xuống file mã hóa trên đĩa nếu DB đang khởi động hoặc chạy test offline
  }

  // 2. Đọc từ file mã hóa trên đĩa (`/app/data/ai-gateway-config.enc`)
  try {
    const filePath = getLocalFallbackFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8').trim();
      const decoded = decryptConfigPayload(raw);
      if (decoded) {
        memoryCache = decoded;
        lastLoadedAt = now;
        return decoded;
      }
    }
  } catch {
    // ignore
  }

  const emptyDefault: StoredAiSettings = {
    primaryOrder: 'DEEPSEEK_FIRST',
  };
  memoryCache = emptyDefault;
  lastLoadedAt = now;
  return emptyDefault;
}

export async function saveStoredAiSettings(
  updater: (current: StoredAiSettings) => StoredAiSettings
): Promise<StoredAiSettings> {
  const current = await loadStoredAiSettings(true);
  const next = updater(current);
  const encrypted = encryptConfigPayload(next);

  // 1. Lưu vào PostgreSQL
  try {
    await ensureConfigTable();
    await db.execute(sql`
      INSERT INTO app_system_configs (key, encrypted_payload, updated_at)
      VALUES (${CONFIG_KEY}, ${encrypted}, now())
      ON CONFLICT (key) DO UPDATE SET
        encrypted_payload = EXCLUDED.encrypted_payload,
        updated_at = now()
    `);
  } catch (err) {
    logger.warn('Could not persist AI settings to PostgreSQL, using encrypted disk fallback', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // 2. Lưu đồng thời xuống đĩa bền vững (`/app/data/ai-gateway-config.enc`)
  try {
    const filePath = getLocalFallbackFilePath();
    fs.writeFileSync(filePath, encrypted, { encoding: 'utf8', mode: 0o600 });
  } catch {
    // ignore disk error if read-only fs
  }

  memoryCache = next;
  lastLoadedAt = Date.now();
  return next;
}

export function maskApiKey(rawKey?: string | null): string {
  const trimmed = (rawKey || '').trim();
  if (!trimmed) return '';
  if (trimmed.length <= 8) return '••••••••';
  const prefix = trimmed.slice(0, 3);
  const suffix = trimmed.slice(-4);
  return `${prefix}••••••••••••${suffix}`;
}

export async function getEffectiveAiConfig(forceRefresh = false): Promise<EffectiveAiConfig> {
  const stored = await loadStoredAiSettings(forceRefresh);

  const envDeepseekKey = (process.env.DEEPSEEK_API_KEY || '').trim();
  const envGeminiKey = (
    process.env.GEMINI_API_KEY ||
    process.env.AI_GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    ''
  ).trim();
  const envOpenaiKey = (process.env.OPENAI_API_KEY || '').trim();

  const adminDeepseekKey = (stored.deepseekApiKey || '').trim();
  const adminGeminiKey = (stored.geminiApiKey || '').trim();
  const adminOpenaiKey = (stored.openaiApiKey || '').trim();

  const deepseekKey = adminDeepseekKey || envDeepseekKey;
  const geminiKey = adminGeminiKey || envGeminiKey;
  const openaiKey = adminOpenaiKey || envOpenaiKey;

  return {
    primaryOrder: stored.primaryOrder || 'DEEPSEEK_FIRST',
    deepseek: {
      apiKey: deepseekKey,
      model: (stored.deepseekModel || process.env.DEEPSEEK_MODEL || 'deepseek-chat').trim(),
      baseUrl: (stored.deepseekBaseUrl || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').trim(),
      source: adminDeepseekKey ? 'ADMIN_CONFIG' : envDeepseekKey ? 'ENV' : 'NONE',
    },
    gemini: {
      apiKey: geminiKey,
      model: (stored.geminiModel || process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim(),
      source: adminGeminiKey ? 'ADMIN_CONFIG' : envGeminiKey ? 'ENV' : 'NONE',
    },
    openai: {
      apiKey: openaiKey,
      model: (stored.openaiModel || process.env.OPENAI_MODEL || 'gpt-4o-mini').trim(),
      source: adminOpenaiKey ? 'ADMIN_CONFIG' : envOpenaiKey ? 'ENV' : 'NONE',
    },
    updatedAt: stored.updatedAt,
    updatedByEmail: stored.updatedByEmail,
  };
}
