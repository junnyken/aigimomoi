// AG-25: Structured Logger & Sensitive Data Redaction Utility
// Đảm bảo Invariants Master Plan: "log không lộ secrets", an toàn khi ghi log trong Docker container/stdout.

const SENSITIVE_KEYS = new Set([
  'password',
  'pass',
  'secret',
  'token',
  'accesstoken',
  'refreshtoken',
  'jwt',
  'authorization',
  'cookie',
  'cookies',
  'database_url',
  'db_password',
  'postgres_password',
  'postgres_user',
  'credential',
  'credentials',
  'apikey',
  'api_key',
  'private_key',
  'auth_secret',
  'authsecret',
  'jwt_secret',
  'deepseek_api_key',
  'deepseekapikey',
  'gemini_api_key',
  'geminiapikey',
  'openai_api_key',
  'openaiapikey',
]);

const POSTGRES_URL_REGEX = /postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^\s?#]+)/gi;
const BEARER_TOKEN_REGEX = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
const JWT_REGEX = /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g;

/**
 * Đệ quy làm sạch các dữ liệu nhạy cảm trước khi ghi ra stdout/JSON log.
 */
export function redactSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    let sanitized = data;
    // Che giấu mật khẩu trong PostgreSQL connection strings
    sanitized = sanitized.replace(POSTGRES_URL_REGEX, 'postgres://$1:[REDACTED]@$3');
    // Che giấu Authorization Bearer header
    sanitized = sanitized.replace(BEARER_TOKEN_REGEX, 'Bearer [REDACTED]');
    // Che giấu JWT tokens
    sanitized = sanitized.replace(JWT_REGEX, '[REDACTED_JWT]');
    return sanitized;
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item));
  }

  if (data instanceof Error) {
    return {
      name: data.name,
      message: redactSensitiveData(data.message) as string,
      stack: redactSensitiveData(data.stack) as string,
    };
  }

  if (typeof data === 'object') {
    const cleanObj: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (SENSITIVE_KEYS.has(lowerKey)) {
        cleanObj[key] = '[REDACTED]';
      } else {
        cleanObj[key] = redactSensitiveData(val);
      }
    }
    return cleanObj;
  }

  return String(data);
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: unknown;
}

function writeLog(level: LogLevel, message: string, meta?: unknown) {
  const sanitizedMeta = meta !== undefined ? redactSensitiveData(meta) : undefined;
  const sanitizedMessage = typeof message === 'string' ? (redactSensitiveData(message) as string) : message;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message: sanitizedMessage,
    ...(sanitizedMeta !== undefined ? { meta: sanitizedMeta } : {}),
  };

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const jsonString = JSON.stringify(entry);
    if (level === 'ERROR') {
      console.error(jsonString);
    } else if (level === 'WARN') {
      console.warn(jsonString);
    } else {
      console.log(jsonString);
    }
  } else {
    const prefix = `[${entry.timestamp}] [${level}]`;
    if (level === 'ERROR') {
      console.error(`${prefix} ${sanitizedMessage}`, sanitizedMeta ?? '');
    } else if (level === 'WARN') {
      console.warn(`${prefix} ${sanitizedMessage}`, sanitizedMeta ?? '');
    } else {
      console.log(`${prefix} ${sanitizedMessage}`, sanitizedMeta ?? '');
    }
  }

  return entry;
}

export const logger = {
  debug: (message: string, meta?: unknown) => writeLog('DEBUG', message, meta),
  info: (message: string, meta?: unknown) => writeLog('INFO', message, meta),
  warn: (message: string, meta?: unknown) => writeLog('WARN', message, meta),
  error: (message: string, meta?: unknown) => writeLog('ERROR', message, meta),
};
