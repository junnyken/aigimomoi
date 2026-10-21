// R7 — Kiểm tra dữ liệu chính chủ gửi lên khi tạo/sửa hồ sơ người nấu (thuần, không DB).
// Allow-list tường minh: người dùng KHÔNG thể tự đặt identityVerified / isProfessional
// (chỉ ADMIN qua /api/editor/creators/[userId]).
import { isValidCreatorSlug } from './tier';

export const CREATOR_REGIONS = {
  GENERAL: 'Toàn quốc',
  NORTH: 'Miền Bắc',
  CENTRAL: 'Miền Trung',
  SOUTH: 'Miền Nam',
} as const;

export type CreatorRegion = keyof typeof CREATOR_REGIONS;

export const CREATOR_BIO_MAX = 500;

/** Slug trùng tên route/hệ thống — tránh mạo danh. */
const RESERVED_SLUGS = new Set([
  'admin', 'editor', 'bep-mom', 'bepmom', 'angimom', 'an-gi-mom', 'ho-tro', 'support',
  'moderator', 'quan-tri', 'ban-bien-tap', 'system', 'api', 'new', 'moi',
]);

export interface CreatorProfileInput {
  slug: string;
  bio: string | null;
  region: CreatorRegion;
  isPublic: boolean;
  acceptSellerTerms: boolean;
}

export type CreatorProfileInputResult =
  | { ok: true; value: CreatorProfileInput }
  | { ok: false; error: string };

export function parseCreatorProfileInput(body: unknown): CreatorProfileInputResult {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Dữ liệu không hợp lệ.' };
  const b = body as Record<string, unknown>;

  const slug = typeof b.slug === 'string' ? b.slug.trim().toLowerCase() : '';
  if (!isValidCreatorSlug(slug)) {
    return {
      ok: false,
      error: 'Đường dẫn hồ sơ dài 3–40 ký tự, chỉ gồm chữ thường không dấu, số và dấu gạch nối.',
    };
  }
  if (RESERVED_SLUGS.has(slug)) {
    return { ok: false, error: 'Đường dẫn hồ sơ này được hệ thống giữ lại, vui lòng chọn tên khác.' };
  }

  let bio: string | null = null;
  if (b.bio !== undefined && b.bio !== null) {
    if (typeof b.bio !== 'string') return { ok: false, error: 'Giới thiệu không hợp lệ.' };
    const trimmed = b.bio.trim();
    if (trimmed.length > CREATOR_BIO_MAX) {
      return { ok: false, error: `Giới thiệu tối đa ${CREATOR_BIO_MAX} ký tự.` };
    }
    bio = trimmed.length > 0 ? trimmed : null;
  }

  const regionRaw = typeof b.region === 'string' ? b.region : 'GENERAL';
  if (!Object.prototype.hasOwnProperty.call(CREATOR_REGIONS, regionRaw)) {
    return { ok: false, error: 'Vùng miền không hợp lệ.' };
  }

  return {
    ok: true,
    value: {
      slug,
      bio,
      region: regionRaw as CreatorRegion,
      isPublic: b.isPublic === undefined ? true : b.isPublic === true,
      acceptSellerTerms: b.acceptSellerTerms === true,
    },
  };
}
