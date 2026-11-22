// Helper quy đổi đơn vị chuẩn (g / ml) sang đơn vị đong đếm thân thiện kiểu Bếp Nhà Việt Nam
// VD: 300g -> "3 lạng", 500g -> "5 lạng (nửa cân)", 400ml -> "2 chén ăn cơm", 15g đường -> "1 muỗng canh"

function roundFriendly(num: number): string {
  const rounded = Math.round(num * 2) / 2;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace('.0', '');
}

const SPOON_SEASONING_HINTS = [
  'muối',
  'đường',
  'nước mắm',
  'nước tương',
  'xì dầu',
  'dầu ăn',
  'dầu ô liu',
  'dầu mè',
  'dầu hào',
  'mật ong',
  'giấm',
  'tương ớt',
  'bột ngọt',
  'hạt nêm',
  'tiêu',
  'bột năng',
  'bột bắp',
  'mè',
  'tỏi băm',
  'hành băm',
];

export function formatHouseholdMeasure(
  amount: number,
  unit: string,
  ingredientName: string
): string {
  const cleanUnit = unit.trim().toLowerCase();
  const cleanName = ingredientName.trim().toLowerCase();
  const isSeasoningLike = SPOON_SEASONING_HINTS.some((kw) => cleanName.includes(kw));

  if (cleanUnit === 'g' || cleanUnit === 'gam') {
    if (amount >= 100) {
      const lang = amount / 100;
      if (Math.abs(amount - 500) <= 5) return '5 lạng (nửa cân)';
      if (Math.abs(amount - 1000) <= 10) return '1 cân (1 kg)';
      return `${roundFriendly(lang)} lạng`;
    }

    if (isSeasoningLike) {
      if (amount >= 12) {
        return `${roundFriendly(amount / 15)} muỗng canh`;
      }
      return `${roundFriendly(Math.max(0.5, amount / 5))} muỗng cà phê`;
    }

    if (amount >= 45 && amount < 100) {
      return `~${roundFriendly(amount / 100)} lạng`;
    }
    return `${roundFriendly(amount)} ${unit}`;
  }

  if (cleanUnit === 'ml') {
    if (amount >= 1000 && amount % 500 === 0) {
      return `${roundFriendly(amount / 1000)} lít`;
    }
    if (amount >= 150) {
      return `${roundFriendly(amount / 200)} chén cơm`;
    }
    if (amount >= 12) {
      return `${roundFriendly(amount / 15)} muỗng canh`;
    }
    return `${roundFriendly(Math.max(0.5, amount / 5))} muỗng cà phê`;
  }

  return `${roundFriendly(amount)} ${unit}`;
}
