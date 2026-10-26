import { cookies } from 'next/headers';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

export const SESSION_COOKIE_NAME = 'angimom_session_v1';
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class AuthConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthConfigurationError';
  }
}

export const BLACKLISTED_SECRETS = new Set([
  'angimom_default_fallback_secret_must_be_overridden_in_production_32chars',
  'angimom_super_secret_jwt_key_production_2026',
  'super_secret_session_key_min_32_characters_long_angimom',
  'TaoChuoiNgauNhienItNhat32KyTuChoProduction2026_JWT',
  'angimom_dev_secret_only_for_local_development_32chars',
  'SinhKhoaNgauNhienItNhat32KyTuBangLenhOpensslRandBase64_32',
]);

export function validateAuthSecret(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new AuthConfigurationError('AUTH_SECRET is not configured or empty');
  }

  // Từ chối khoảng trắng đầu hoặc cuối: không sửa đổi âm thầm
  if (value !== value.trim()) {
    throw new AuthConfigurationError('AUTH_SECRET contains leading or trailing whitespace');
  }

  if (value.length < 32) {
    throw new AuthConfigurationError('AUTH_SECRET is too short: minimum 32 characters required');
  }

  if (BLACKLISTED_SECRETS.has(value)) {
    throw new AuthConfigurationError('AUTH_SECRET uses a known insecure placeholder');
  }

  return value;
}

export function getAuthSecret(): string {
  return validateAuthSecret(process.env.AUTH_SECRET);
}

export function isAuthConfigurationValid(): boolean {
  try {
    getAuthSecret();
    return true;
  } catch {
    return false;
  }
}

export interface SessionUser {
  id: number;
  email: string;
  displayName: string;
  role: 'ADMIN' | 'EDITOR' | 'COOK';
  /** session_version của user lúc ký token; lệch với DB = phiên đã bị thu hồi */
  sv?: number;
  exp: number;
}

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(): Promise<CryptoKey> {
  const secret = getAuthSecret();
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signToken(payload: Omit<SessionUser, 'exp'>): Promise<string> {
  const fullPayload: SessionUser = {
    ...payload,
    exp: Date.now() + SESSION_DURATION_MS,
  };

  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(JSON.stringify(fullPayload));
  const payloadB64 = base64UrlEncode(payloadBytes);

  const key = await getHmacKey();
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadB64));
  const signatureB64 = base64UrlEncode(signatureBytes);

  return `${payloadB64}.${signatureB64}`;
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const [payloadB64, signatureB64] = token.split('.');
    if (!payloadB64 || !signatureB64) return null;

    let key: CryptoKey;
    try {
      key = await getHmacKey();
    } catch (err) {
      if (err instanceof AuthConfigurationError) {
        console.error('[Auth Configuration Error]', err.message);
      }
      return null;
    }

    const encoder = new TextEncoder();
    const signatureBytes = base64UrlDecode(signatureB64);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as BufferSource,
      encoder.encode(payloadB64)
    );

    if (!isValid) return null;

    const payloadBytes = base64UrlDecode(payloadB64);
    const decoder = new TextDecoder();
    const payload: SessionUser = JSON.parse(decoder.decode(payloadBytes));

    if (Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Đối chiếu token với CSDL: tài khoản phải còn tồn tại và session_version phải khớp.
 * Vai trò / email / tên luôn lấy từ CSDL (hạ quyền có hiệu lực ngay). Lỗi CSDL → từ chối (fail-closed).
 */
async function resolveFreshSessionUser(payload: SessionUser | null): Promise<SessionUser | null> {
  if (!payload) return null;
  try {
    const [row] = await db
      .select({
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        sessionVersion: users.sessionVersion,
      })
      .from(users)
      .where(eq(users.id, payload.id))
      .limit(1);

    if (!row) return null;
    if (row.sessionVersion !== (payload.sv ?? 0)) return null;

    return {
      ...payload,
      email: row.email,
      displayName: row.displayName,
      role: row.role,
      sv: row.sessionVersion,
    };
  } catch (err) {
    console.error('[Auth] Không đối chiếu được phiên với CSDL:', err instanceof Error ? err.message : err);
    return null;
  }
}

export async function getSessionUser(requestOrToken?: Request | string): Promise<SessionUser | null> {
  if (typeof requestOrToken === 'string') {
    return resolveFreshSessionUser(await verifyToken(requestOrToken));
  }
  if (requestOrToken && 'headers' in requestOrToken && typeof requestOrToken.headers?.get === 'function') {
    const cookieHeader = requestOrToken.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
    if (match?.[1]) {
      return resolveFreshSessionUser(await verifyToken(decodeURIComponent(match[1])));
    }
  }
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return resolveFreshSessionUser(await verifyToken(token));
  } catch {
    return null;
  }
}

/** Vô hiệu hóa mọi phiên đang có của user; trả về session_version mới để ký lại cookie nếu cần. */
export async function revokeUserSessions(userId: number): Promise<number> {
  const [row] = await db
    .update(users)
    .set({ sessionVersion: sql`${users.sessionVersion} + 1` })
    .where(eq(users.id, userId))
    .returning({ sessionVersion: users.sessionVersion });
  return row?.sessionVersion ?? 0;
}

export async function setSessionCookie(user: Omit<SessionUser, 'exp'>): Promise<void> {
  const token = await signToken(user);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_DURATION_MS / 1000),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
