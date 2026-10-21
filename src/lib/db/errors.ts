// Nhận diện lỗi Postgres qua lớp bọc của Drizzle/postgres-js (lỗi gốc có thể nằm ở `cause`).
export function pgErrorCode(error: unknown): string | null {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current && typeof current === 'object'; depth++) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code)) return code;
    current = (current as { cause?: unknown }).cause;
  }
  return null;
}

/** 23505 = unique_violation */
export function isUniqueViolation(error: unknown): boolean {
  return pgErrorCode(error) === '23505';
}
