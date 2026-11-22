// Hồ sơ thành viên gia đình có thể tùy chỉnh (2–5 người) dùng cho Chia Khẩu Phần 1 Mâm Cơm & Nhật Ký

export const FAMILY_PROFILES_STORAGE_KEY = 'angimom_family_members_v1';

export interface FamilyMemberProfile {
  id: string;
  memberName: string;
  roleTitle: string;
  badgeColor: string;
  targetMealKcal: number;
  isBrownRice: boolean;
  lowSodium: boolean;
  noSpicy: boolean;
}

const BADGE_PALETTE = [
  'bg-blue-50 text-blue-900 border-blue-200',
  'bg-emerald-50 text-emerald-900 border-emerald-200',
  'bg-amber-50 text-amber-900 border-amber-200',
  'bg-rose-50 text-rose-900 border-rose-200',
  'bg-violet-50 text-violet-900 border-violet-200',
];

export const DEFAULT_FAMILY_PROFILES: FamilyMemberProfile[] = [
  {
    id: 'bo',
    memberName: 'Bố',
    roleTitle: '💪 Bố / Người lao động',
    badgeColor: BADGE_PALETTE[0],
    targetMealKcal: 720,
    isBrownRice: false,
    lowSodium: false,
    noSpicy: false,
  },
  {
    id: 'me',
    memberName: 'Mẹ',
    roleTitle: '🥗 Mẹ giữ dáng / Giảm cân',
    badgeColor: BADGE_PALETTE[1],
    targetMealKcal: 440,
    isBrownRice: true,
    lowSodium: false,
    noSpicy: false,
  },
  {
    id: 'be',
    memberName: 'Bé',
    roleTitle: '🧒 Bé nhỏ',
    badgeColor: BADGE_PALETTE[2],
    targetMealKcal: 500,
    isBrownRice: false,
    lowSodium: false,
    noSpicy: true,
  },
  {
    id: 'ongba',
    memberName: 'Ông Bà',
    roleTitle: '🩺 Ông Bà / Huyết áp & Đường huyết',
    badgeColor: BADGE_PALETTE[3],
    targetMealKcal: 470,
    isBrownRice: false,
    lowSodium: true,
    noSpicy: true,
  },
];

export function pickMemberBadgeColor(index: number): string {
  return BADGE_PALETTE[index % BADGE_PALETTE.length];
}

export function normalizeFamilyProfiles(raw: unknown): FamilyMemberProfile[] {
  if (!Array.isArray(raw)) return DEFAULT_FAMILY_PROFILES;

  const valid = raw
    .filter((item): item is Partial<FamilyMemberProfile> => Boolean(item) && typeof item === 'object')
    .slice(0, 5)
    .map((item, idx) => {
      const memberName =
        typeof item.memberName === 'string' && item.memberName.trim()
          ? item.memberName.trim().slice(0, 24)
          : `Thành viên ${idx + 1}`;
      const roleTitle =
        typeof item.roleTitle === 'string' && item.roleTitle.trim()
          ? item.roleTitle.trim().slice(0, 48)
          : memberName;
      const targetMealKcal =
        typeof item.targetMealKcal === 'number' && Number.isFinite(item.targetMealKcal)
          ? Math.min(1100, Math.max(300, Math.round(item.targetMealKcal)))
          : 550;

      return {
        id:
          typeof item.id === 'string' && item.id.trim()
            ? item.id.trim().slice(0, 32)
            : `member-${idx + 1}`,
        memberName,
        roleTitle,
        badgeColor:
          typeof item.badgeColor === 'string' && item.badgeColor.trim()
            ? item.badgeColor
            : pickMemberBadgeColor(idx),
        targetMealKcal,
        isBrownRice: Boolean(item.isBrownRice),
        lowSodium: Boolean(item.lowSodium),
        noSpicy: Boolean(item.noSpicy),
      };
    });

  return valid.length >= 2 ? valid : DEFAULT_FAMILY_PROFILES;
}

export function loadFamilyProfiles(): FamilyMemberProfile[] {
  if (typeof window === 'undefined') return DEFAULT_FAMILY_PROFILES;
  try {
    const raw = localStorage.getItem(FAMILY_PROFILES_STORAGE_KEY);
    if (!raw) return DEFAULT_FAMILY_PROFILES;
    return normalizeFamilyProfiles(JSON.parse(raw));
  } catch {
    return DEFAULT_FAMILY_PROFILES;
  }
}

export function saveFamilyProfiles(profiles: FamilyMemberProfile[]): FamilyMemberProfile[] {
  const normalized = normalizeFamilyProfiles(profiles);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(FAMILY_PROFILES_STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      // Ignore storage quota errors
    }
  }
  return normalized;
}

function formatRiceLabel(riceBowls: number, isBrownRice: boolean): string {
  const riceKind = isBrownRice ? 'cơm gạo lứt' : 'cơm trắng';
  if (riceBowls === 0.5) return `½ chén ${riceKind}`;
  if (riceBowls === 0.75) return `¾ chén ${riceKind}`;
  return `${riceBowls} chén ${riceKind}`;
}

export function calculateMemberPortionFromMeal(
  member: FamilyMemberProfile,
  baseDishKcal: number
): {
  riceBowls: number;
  riceLabel: string;
  dishFactor: number;
  guidance: string;
} {
  let riceBowls = 1.0;
  if (member.targetMealKcal <= 450) riceBowls = 0.5;
  else if (member.targetMealKcal <= 520) riceBowls = 0.75;
  else if (member.targetMealKcal <= 640) riceBowls = 1.0;
  else if (member.targetMealKcal <= 820) riceBowls = 1.5;
  else riceBowls = 2.0;

  const riceKcalPerBowl = member.isBrownRice ? 110 : 130;
  const remainingDishKcal = Math.max(150, member.targetMealKcal - riceBowls * riceKcalPerBowl);

  let dishFactor =
    member.targetMealKcal >= 650 ? 1.2 : member.targetMealKcal <= 460 ? 0.85 : 0.9;
  if (baseDishKcal > 40) {
    dishFactor = Math.min(
      1.4,
      Math.max(0.6, Math.round((remainingDishKcal / baseDishKcal) * 20) / 20)
    );
  }

  const riceLabel = formatRiceLabel(riceBowls, member.isBrownRice);
  const dishShareText =
    dishFactor === 1
      ? '1 phần chuẩn món mặn & canh'
      : `${dishFactor} phần đạm món mặn`;

  const extraRules: string[] = [];
  if (member.lowSodium) {
    extraRules.push('gắp ráo nước kho, hạn chế chấm thêm nước mắm');
  }
  if (member.noSpicy) {
    extraRules.push('ưu tiên món mềm thanh ngọt, tránh ớt cay');
  }
  if (!member.lowSodium && !member.noSpicy) {
    extraRules.push(
      member.targetMealKcal <= 480
        ? 'ăn rau & canh trước khi dùng cơm'
        : 'rau xanh & canh thoải mái'
    );
  }

  return {
    riceBowls,
    riceLabel,
    dishFactor,
    guidance: `${riceLabel} + ${dishShareText}, ${extraRules.join(', ')}.`,
  };
}
