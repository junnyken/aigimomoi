import { getAuthSecret } from './session';

export interface ResetTokenPayload {
  userId: number;
  email: string;
  hashFrag: string;
  exp: number;
  purpose: 'RESET_PASSWORD';
}

const TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 phút

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
    encoder.encode(secret + '_pwd_reset_salt'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createResetToken(user: { id: number; email: string; passwordHash: string | null }): Promise<string> {
  const hashFrag = user.passwordHash ? user.passwordHash.slice(-16) : 'none';
  const payload: ResetTokenPayload = {
    userId: user.id,
    email: user.email.toLowerCase().trim(),
    hashFrag,
    exp: Date.now() + TOKEN_EXPIRY_MS,
    purpose: 'RESET_PASSWORD',
  };

  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(JSON.stringify(payload));
  const payloadB64 = base64UrlEncode(payloadBytes);

  const key = await getHmacKey();
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadB64));
  const signatureB64 = base64UrlEncode(signatureBytes);

  return `${payloadB64}.${signatureB64}`;
}

export async function verifyResetToken(
  token: string, 
  currentPasswordHash: string | null
): Promise<{ userId: number; email: string } | null> {
  try {
    const [payloadB64, signatureB64] = token.split('.');
    if (!payloadB64 || !signatureB64) return null;

    const key = await getHmacKey();
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
    const payload: ResetTokenPayload = JSON.parse(decoder.decode(payloadBytes));

    if (payload.purpose !== 'RESET_PASSWORD') return null;
    if (Date.now() > payload.exp) return null;

    // Single-use protection: hashFrag must match the current password hash in the database
    const expectedHashFrag = currentPasswordHash ? currentPasswordHash.slice(-16) : 'none';
    if (payload.hashFrag !== expectedHashFrag) {
      return null; // Token already used because password has changed
    }

    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}

export function extractResetTokenUserId(token: string): number | null {
  try {
    const [payloadB64] = token.split('.');
    if (!payloadB64) return null;
    const payloadBytes = base64UrlDecode(payloadB64);
    const decoder = new TextDecoder();
    const payload: Partial<ResetTokenPayload> = JSON.parse(decoder.decode(payloadBytes));
    if (typeof payload.userId === 'number') {
      return payload.userId;
    }
    return null;
  } catch {
    return null;
  }
}
