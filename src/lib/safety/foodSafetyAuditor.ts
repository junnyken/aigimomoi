// Hệ thống Kiểm định An toàn Thực phẩm, Độc tố Tự nhiên, Tương kỵ Ẩm thực & Chất lượng Công thức
// Pure TypeScript module (dùng chung cho Client UI, Server API, Publishing Gate và Trang Công khai).

export type SafetyVerdict = 'SAFE' | 'CAUTION' | 'DANGER';

export interface SafetyCheckItem {
  id: string;
  category:
    | 'TOXIN_AND_FORBIDDEN'
    | 'FOOD_INCOMPATIBILITY'
    | 'THERMAL_AND_PREP_SAFETY'
    | 'DOSAGE_AND_SEASONING'
    | 'RECIPE_QUALITY_AND_COHERENCE';
  title: string;
  level: SafetyVerdict;
  detail: string;
  recommendation?: string;
}

export interface AllergenBadge {
  key: string;
  label: string;
  note: string;
}

export interface FoodSafetyAuditInput {
  name?: string | null;
  shortDescription?: string | null;
  baseServings?: number | null;
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  ingredients?: Array<{
    name?: string | null;
    ingredient?: { name?: string | null } | null;
    amount?: number | string | null;
    unit?: string | null;
    preparation?: string | null;
  }>;
  steps?: Array<{
    phaseName?: string | null;
    instruction?: string | null;
    tipText?: string | null;
    timerSeconds?: number | null;
  }>;
}

export interface FoodSafetyAuditReport {
  verdict: SafetyVerdict;
  safetyScore: number; // 0 - 100
  qualityScore: number; // 0 - 100
  headline: string;
  adminGuidance: string;
  checks: SafetyCheckItem[];
  allergens: AllergenBadge[];
  recommendedSafetyTips: string[];
  rejectionReasonTemplate: string | null;
}

// 1. DANH MỤC CẤM TUYỆT ĐỐI (Độc tố chết người, món sống nguy cơ cao, hóa chất cấm)
const FORBIDDEN_HAZARDS: Array<{
  pattern: RegExp;
  label: string;
  hazardReason: string;
}> = [
  {
    pattern: /\b(tiết canh|tiet canh)\b/i,
    label: 'Tiết canh sống',
    hazardReason:
      'Tiết canh sống tiềm ẩn nguy cơ nhiễm liên cầu khuẩn lợn (Streptococcus suis) gây viêm màng não, nhiễm trùng huyết nguy kịch.',
  },
  {
    pattern: /\b(cá nóc|ca noc|trứng cá nóc|gan cá nóc)\b/i,
    label: 'Cá nóc (chứa độc tố Tetrodotoxin)',
    hazardReason:
      'Cá nóc chứa độc tố thần kinh Tetrodotoxin cực mạnh, không bị phân hủy ở nhiệt độ sôi 100°C và bị cấm chế biến thực phẩm.',
  },
  {
    pattern: /\b(mật cá|mat ca tram|mật cá trắm|mật cá chép|nuốt mật)\b/i,
    label: 'Mật cá (chứa độc tố 5α-cyprinol)',
    hazardReason:
      'Mật cá họ cá chép/cá trắm chứa độc tố 5α-cyprinol gây suy thận cấp và suy gan cấp nguy hiểm tính mạng.',
  },
  {
    pattern: /\b(khoai tây mọc mầm|khoai tay moc mam|khoai tây mầm|mầm khoai tây|vỏ khoai tây xanh)\b/i,
    label: 'Khoai tây mọc mầm / vỏ xanh (chứa Solanine)',
    hazardReason:
      'Khoai tây mọc mầm hoặc chuyển màu xanh chứa hàm lượng cao độc tố Glycoalkaloid (Solanine & Chaconine) gây ngộ độc tiêu hóa và thần kinh.',
  },
  {
    pattern: /\b(thịt cóc|gan cóc|trứng cóc|da cóc|mật cóc)\b/i,
    label: 'Thịt/Gan/Trứng cóc (chứa Bufotoxin)',
    hazardReason:
      'Da, gan, trứng và nhựa cóc chứa độc tố Bufotoxin cực độc gây loạn nhịp tim và tử vong nhanh chóng.',
  },
  {
    pattern: /\b(gỏi cá mè sống|gỏi cá nước ngọt sống|cá nước ngọt ăn sống|thịt lợn sống|thịt heo sống|gà sống|nem chua sống tự ủ không chuẩn)\b/i,
    label: 'Thịt heo / Gia cầm / Cá nước ngọt ăn sống',
    hazardReason:
      'Thịt heo, gia cầm và cá nước ngọt chưa nấu chín tiềm ẩn sán lá gan, giun xoắn, khuẩn Salmonella và liên cầu khuẩn.',
  },
  {
    pattern: /\b(hàn the|han the|borax|phẩm màu công nghiệp|diêm tiêu|diem tieu|formol|cồn công nghiệp|methanol|chất tẩy trắng)\b/i,
    label: 'Phụ gia / Hóa chất cấm trong thực phẩm',
    hazardReason:
      'Hàn the (Borax), formol, diêm tiêu công nghiệp là hóa chất bị Bộ Y tế cấm tuyệt đối sử dụng trong chế biến món ăn.',
  },
  {
    pattern: /\b(nấm rừng lạ|nấm lạ|nấm độc|nấm tán trắng)\b/i,
    label: 'Nấm lạ chưa rõ nguồn gốc',
    hazardReason:
      'Các loại nấm rừng lạ không rõ chủng loại có nguy cơ chứa độc tố Amatoxin gây hoại tử gan cấp tính.',
  },
];

// 2. MA TRẬN TƯƠNG KỴ THỰC PHẨM VIỆT NAM & DINH DƯỠNG KHOA HỌC
const INCOMPATIBILITY_MATRIX: Array<{
  groupA: RegExp;
  groupB: RegExp;
  pairName: string;
  severity: 'CAUTION' | 'DANGER';
  explanation: string;
  advice: string;
}> = [
  {
    groupA: /\b(gan heo|gan lợn|gan bò|gan gà|gan vịt|gan động vật)\b/i,
    groupB: /\b(giá đỗ|gia do|cần tây|can tay|rau cần)\b/i,
    pairName: 'Gan động vật + Giá đỗ / Cần tây',
    severity: 'CAUTION',
    explanation:
      'Lượng đồng (Cu) và sắt (Fe) dồi dào trong gan động vật sẽ làm oxy hóa hoàn toàn Vitamin C trong giá đỗ/cần tây; đồng thời chất xơ thô kết hợp tạo hợp chất cản trở hấp thu sắt, dễ gây đầy bụng.',
    advice:
      'Nên thay giá đỗ/cần tây bằng hành tây, hẹ hoặc ớt chuông đảo nhanh ở cuối bước xào.',
  },
  {
    groupA: /\b(thịt gà|gà ta|cánh gà|đùi gà|ức gà)\b/i,
    groupB: /\b(kinh giới|rau kinh giới)\b/i,
    pairName: 'Thịt gà + Rau kinh giới',
    severity: 'CAUTION',
    explanation:
      'Theo kinh nghiệm ẩm thực và y học cổ truyền Việt Nam, thịt gà tính ấm kết hợp với kinh giới vị cay tính ấm dễ gây hoa mắt, ù tai hoặc ngứa ngáy khó tiêu ở người cơ địa nhạy cảm.',
    advice: 'Món gà nên kết hợp với lá chanh thái chỉ, hành hoa hoặc ngò rí sẽ hợp vị và lành tính hơn.',
  },
  {
    groupA: /\b(sữa đậu nành|sua dau nanh)\b/i,
    groupB: /\b(trứng gà|trứng vịt|đường đỏ|đường đen)\b/i,
    pairName: 'Sữa đậu nành + Trứng / Đường đỏ',
    severity: 'CAUTION',
    explanation:
      'Men Trypsin trong sữa đậu nành và axit hữu cơ trong đường đỏ kết hợp với lòng trắng trứng tạo kết tủa protein, gây đầy bụng khó tiêu và giảm giá trị dinh dưỡng.',
    advice: 'Không đun chung trứng hoặc đường đỏ trực tiếp trong sữa đậu nành.',
  },
  {
    groupA: /\b(đậu phụ|đậu hũ|dau phu|dau hu)\b/i,
    groupB: /\b(mật ong|mat ong)\b/i,
    pairName: 'Đậu phụ (Đậu hũ) + Mật ong',
    severity: 'CAUTION',
    explanation:
      'Thạch cao/khoáng chất trong đậu phụ tác dụng với các enzyme và axit hữu cơ trong mật ong dễ gây chướng bụng, tiêu chảy ở người có hệ tiêu hóa yếu.',
    advice: 'Tránh dùng mật ong làm gia vị ướp hoặc rưới trực tiếp lên món đậu phụ.',
  },
  {
    groupA: /\b(cua biển|cua đồng|ghẹ|tôm|tôm sú|tôm thẻ|hải sản|nghêu|sò|ốc)\b/i,
    groupB: /\b(quả hồng|trái hồng|trà đặc|ước chè đặc|quả lựu|ổi xanh)\b/i,
    pairName: 'Hải sản giàu đạm/canxi + Thực phẩm giàu Tannin (Hồng/Trà đặc)',
    severity: 'CAUTION',
    explanation:
      'Axit tannic (Tannin) cao kết hợp với protein và canxi trong tôm/cua/hải sản tạo thành muối canxi không tan và kết tủa đạm trong dạ dày, gây đau bụng, buồn nôn.',
    advice: 'Không nấu chung hoặc dùng ngay sau bữa ăn hải sản.',
  },
  {
    groupA: /\b(thịt ba ba|ba ba|cua đồng|cua biển)\b/i,
    groupB: /\b(rau sam|kinh giới)\b/i,
    pairName: 'Ba ba / Cua + Rau sam / Kinh giới',
    severity: 'CAUTION',
    explanation:
      'Hai nhóm thực phẩm có tính hàn cao khi kết hợp dễ gây lạnh bụng, rối loạn tiêu hóa cấp tính.',
    advice: 'Nên dùng kèm gừng tươi, tía tô hoặc lá lốt để cân bằng tính hàn.',
  },
  {
    groupA: /\b(mật ong|mat ong)\b/i,
    groupB: /\b(trẻ sơ sinh|bé dưới 1 tuổi|ăn dặm 6 tháng|ăn dặm 7 tháng|ăn dặm 8 tháng)\b/i,
    pairName: 'Mật ong cho trẻ dưới 12 tháng tuổi',
    severity: 'DANGER',
    explanation:
      'Mật ong có thể chứa bào tử vi khuẩn Clostridium botulinum. Hệ tiêu hóa của trẻ dưới 1 tuổi chưa đủ axit để bất hoạt bào tử này, có nguy cơ gây ngộ độc Botulinum liệt cơ nguy hiểm.',
    advice: 'Tuyệt đối không dùng mật ong trong công thức món ăn dặm cho trẻ dưới 1 tuổi.',
  },
];

// 3. NGUYÊN LIỆU NHẠY CẢM CẦN SƠ CHẾ KHỬ ĐỘC ĐÚNG KỸ THUẬT
const SENSITIVE_PREP_RULES: Array<{
  ingredientPattern: RegExp;
  name: string;
  requiredStepKeyword: RegExp;
  hazardNote: string;
  safetyTipToInject: string;
}> = [
  {
    ingredientPattern: /\b(măng tươi|măng củ|măng tre|măng trúc|măng vầu|măng nứa)\b/i,
    name: 'Măng tươi',
    requiredStepKeyword: /\b(luộc|mở vung|mở nắp|xả nước|ngâm)\b/i,
    hazardNote:
      'Măng tươi chứa độc tố Cyanogenic glycoside (chuyển hóa thành acid cyanhydric). Công thức bắt buộc phải có bước luộc kỹ mở vung từ 15–20 phút và đổ bỏ nước luộc đầu.',
    safetyTipToInject:
      'Lưu ý an toàn thực phẩm: Măng tươi bắt buộc luộc sôi mở vung ít nhất 15–20 phút (thay nước 1–2 lần) để bay hơi hết độc tố tự nhiên trước khi xào/nấu.',
  },
  {
    ingredientPattern: /\b(sắn tươi|khoai mì|củ sắn dây tươi|củ khoai mì)\b/i,
    name: 'Sắn (Khoai mì)',
    requiredStepKeyword: /\b(lột vỏ|bóc vỏ|ngâm nước|mở vung|mở nắp)\b/i,
    hazardNote:
      'Vỏ và hai đầu củ sắn (khoai mì) chứa hàm lượng cao acid cyanhydric gây ngộ độc (say sắn). Bắt buộc gọt sạch vỏ dày, cắt bỏ hai đầu, ngâm nước muối/nước vo gạo ít nhất 2 giờ và luộc mở vung.',
    safetyTipToInject:
      'Lưu ý an toàn thực phẩm: Gọt sạch lớp vỏ hồng của củ sắn (khoai mì), cắt bỏ 2 đầu, ngâm nước sạch trước khi nấu và mở vung khi luộc sôi để khử độc tố.',
  },
  {
    ingredientPattern: /\b(đậu cô ve|đậu que|đậu ván|đậu đũa)\b/i,
    name: 'Đậu cô ve / Đậu ván',
    requiredStepKeyword: /\b(chín|luộc|xào chín|nấu chín)\b/i,
    hazardNote:
      'Đậu cô ve và đậu ván sống chứa độc tố Lectin (Phytohaemagglutinin) gây buồn nôn, đau bụng nếu chỉ xào tái.',
    safetyTipToInject:
      'Lưu ý an toàn thực phẩm: Đậu cô ve / đậu ván cần xào hoặc chần chín hoàn toàn ở nhiệt độ sôi để phân hủy hết lectin tự nhiên, tránh ăn tái sống.',
  },
  {
    ingredientPattern: /\b(nấm rơm|nấm đùi gà|nấm kim châm|nấm hương|nấm bào ngư|nấm đông cô|nấm mỡ)\b/i,
    name: 'Nấm ăn các loại',
    requiredStepKeyword: /\b(rửa|muối|chín|sôi)\b/i,
    hazardNote:
      'Các loại nấm tươi cần ngâm rửa nước muối loãng nhẹ nhàng và nấu chín sôi hoàn toàn (tối thiểu 5–7 phút ở nhiệt độ sôi), không ăn tái.',
    safetyTipToInject:
      'Lưu ý an toàn thực phẩm: Rửa nấm nhanh với nước muối pha loãng, vắt ráo và nấu chín kỹ hoàn toàn ở nhiệt độ sôi trước khi thưởng thức.',
  },
];

// 4. DANH MỤC CẢNH BÁO DỊ ỨNG TỰ ĐỘNG (ALLERGEN DETECTION)
const ALLERGEN_RULES: Array<{
  key: string;
  pattern: RegExp;
  label: string;
  note: string;
}> = [
  {
    key: 'SHELLFISH',
    pattern: /\b(tôm|cua|ghẹ|bề bề|tôm tích|nghêu|ngao|sò|ốc|hàu|mực|bạch tuộc|hải sản)\b/i,
    label: 'Hải sản & Giáp xác',
    note: 'Có chứa tôm/cua/nhuyễn thể — người có cơ địa dị ứng hải sản cần lưu ý.',
  },
  {
    key: 'PEANUT_NUTS',
    pattern: /\b(đậu phộng|lạc rang|lạc nhân|bơ đậu phộng|hạt điều|mè rang|vừng)\b/i,
    label: 'Đậu phộng (Lạc) & Hạt',
    note: 'Có chứa đậu phộng/vừng/hạt — lưu ý với người dị ứng các loại hạt.',
  },
  {
    key: 'EGG',
    pattern: /\b(trứng gà|trứng vịt|trứng cút|hột vịt)\b/i,
    label: 'Trứng gia cầm',
    note: 'Thành phần có sử dụng trứng gia cầm.',
  },
  {
    key: 'SOY',
    pattern: /\b(đậu phụ|đậu hũ|nước tương|xì dầu|tương bần|chao|sữa đậu nành)\b/i,
    label: 'Đậu nành & Chế phẩm tương',
    note: 'Có chứa chế phẩm từ đậu nành.',
  },
  {
    key: 'DAIRY',
    pattern: /\b(sữa tươi|sữa đặc|bơ lạt|phô mai|kem tươi|whipping cream)\b/i,
    label: 'Sữa & Chế phẩm bơ sữa',
    note: 'Lưu ý với người bất dung nạp Lactose hoặc dị ứng đạm sữa bò.',
  },
];

/**
 * Chuẩn hóa lượng nguyên liệu về đơn vị gram/ml ước tính để kiểm tra ngưỡng quá liều.
 */
function estimateAmountInGrams(amount: number, unitRaw: string): number {
  const unit = (unitRaw || 'g').toLowerCase().trim();
  if (unit === 'kg' || unit === 'l' || unit === 'lít') return amount * 1000;
  if (unit === 'g' || unit === 'gram' || unit === 'ml' || unit === 'gr') return amount;
  if (unit.includes('muỗng canh') || unit === 'tbsp' || unit === 'thìa canh') return amount * 15;
  if (unit.includes('muỗng cà phê') || unit === 'tsp' || unit === 'thìa cà phê') return amount * 5;
  if (unit === 'chén' || unit === 'bát') return amount * 200;
  return amount;
}

export function auditRecipeSafetyAndQuality(input: FoodSafetyAuditInput): FoodSafetyAuditReport {
  const name = (input.name || '').trim();
  const shortDesc = (input.shortDescription || '').trim();
  const baseServings = Math.max(1, Number(input.baseServings) || 4);
  const cookTimeMinutes = Number(input.cookTimeMinutes) || 0;
  const ingredients = input.ingredients || [];
  const steps = input.steps || [];

  const ingredientNames = ingredients
    .map((ing) => (ing.name || ing.ingredient?.name || '').trim())
    .filter(Boolean);
  const stepTexts = steps
    .map((s) => `${s.phaseName || ''} ${s.instruction || ''} ${s.tipText || ''}`.trim())
    .filter(Boolean);

  const fullTextCorpus = [
    name,
    shortDesc,
    ...ingredientNames,
    ...ingredients.map((i) => i.preparation || ''),
    ...stepTexts,
  ].join(' | ');

  const checks: SafetyCheckItem[] = [];
  const recommendedSafetyTips: string[] = [];

  // ============================================================================
  // CHỐT 1: KIỂM TRA ĐỘC TỐ TỰ NHIÊN, MÓN SỐNG NGUY HIỂM & HÓA CHẤT CẤM
  // ============================================================================
  const matchedHazards = FORBIDDEN_HAZARDS.filter((h) => h.pattern.test(fullTextCorpus));
  if (matchedHazards.length > 0) {
    for (const h of matchedHazards) {
      checks.push({
        id: `hazard-${h.label}`,
        category: 'TOXIN_AND_FORBIDDEN',
        title: `Phát hiện nguy cơ độc tố / thực phẩm cấm: ${h.label}`,
        level: 'DANGER',
        detail: h.hazardReason,
        recommendation:
          'Từ chối duyệt ngay lập tức. Yêu cầu tác giả loại bỏ hoàn toàn nguyên liệu hoặc phương pháp ăn sống nguy hiểm này.',
      });
    }
  } else {
    checks.push({
      id: 'toxin-clean',
      category: 'TOXIN_AND_FORBIDDEN',
      title: 'An toàn Độc tố & Thực phẩm cấm',
      level: 'SAFE',
      detail:
        'Không phát hiện cá nóc, mật cá, tiết canh sống, khoai tây mọc mầm, nấm lạ hay phụ gia/hóa chất cấm.',
    });
  }

  // ============================================================================
  // CHỐT 2: KIỂM TRA MA TRẬN TƯƠNG KỴ THỰC PHẨM VIỆT NAM
  // ============================================================================
  const matchedIncompatibilities = INCOMPATIBILITY_MATRIX.filter(
    (rule) => rule.groupA.test(fullTextCorpus) && rule.groupB.test(fullTextCorpus)
  );
  if (matchedIncompatibilities.length > 0) {
    for (const inc of matchedIncompatibilities) {
      checks.push({
        id: `incompat-${inc.pairName}`,
        category: 'FOOD_INCOMPATIBILITY',
        title: `Phát hiện cặp thực phẩm tương kỵ: ${inc.pairName}`,
        level: inc.severity,
        detail: inc.explanation,
        recommendation: inc.advice,
      });
      recommendedSafetyTips.push(`${inc.pairName}: ${inc.advice}`);
    }
  } else {
    checks.push({
      id: 'incompatibility-clean',
      category: 'FOOD_INCOMPATIBILITY',
      title: 'Tương hợp Nguyên liệu (Không kỵ nhau)',
      level: 'SAFE',
      detail:
        'Các nguyên liệu trong công thức phối hợp hài hòa, không vi phạm các cặp thực phẩm đại kỵ gây khó tiêu hoặc kết tủa.',
    });
  }

  // ============================================================================
  // CHỐT 3: SƠ CHẾ KHỬ ĐỘC TỰ NHIÊN & NHIỆT ĐỘ NẤU CHÍN AN TOÀN
  // ============================================================================
  const stepsJoined = stepTexts.join(' ');
  let prepWarningFound = false;

  for (const rule of SENSITIVE_PREP_RULES) {
    if (rule.ingredientPattern.test(fullTextCorpus)) {
      const hasProperPrep = rule.requiredStepKeyword.test(stepsJoined);
      recommendedSafetyTips.push(rule.safetyTipToInject);
      if (!hasProperPrep) {
        prepWarningFound = true;
        checks.push({
          id: `prep-${rule.name}`,
          category: 'THERMAL_AND_PREP_SAFETY',
          title: `Cần bổ sung bước sơ chế khử độc cho "${rule.name}"`,
          level: 'CAUTION',
          detail: rule.hazardNote,
          recommendation: `Bấm "Chèn Lưu ý An toàn" hoặc bổ sung rõ bước luộc/ngâm khử độc cho ${rule.name} trước khi duyệt.`,
        });
      }
    }
  }

  // Kiểm tra thịt lợn / thịt gà / cá nhưng thời gian nấu quá ngắn (< 5 phút) hoặc hướng dẫn ăn sống/tái
  const hasHighRiskMeat = /\b(thịt heo|thịt lợn|ba rọi|ba chỉ|sườn heo|thịt gà|cánh gà|đùi gà|chân gà|thịt vịt)\b/i.test(
    fullTextCorpus
  );
  const mentionsUndercookedPorkOrPoultry = /\b(ăn tái|chần tái|trụng tái|ăn sống|còn đỏ máu)\b/i.test(stepsJoined);

  if (hasHighRiskMeat && mentionsUndercookedPorkOrPoultry) {
    prepWarningFound = true;
    checks.push({
      id: 'thermal-undercooked-meat',
      category: 'THERMAL_AND_PREP_SAFETY',
      title: 'Cảnh báo thịt heo / gia cầm chưa nấu chín kỹ',
      level: 'DANGER',
      detail:
        'Công thức có sử dụng thịt heo hoặc gia cầm nhưng hướng dẫn chế biến tái/sống. Thịt heo và gia cầm bắt buộc phải nấu chín hoàn toàn (nhiệt độ tâm đạt ≥ 75°C) để diệt khuẩn Salmonella và liên cầu khuẩn.',
      recommendation: 'Yêu cầu sửa lại bước nấu chín hoàn toàn, không hướng dẫn ăn tái.',
    });
  } else if (hasHighRiskMeat && cookTimeMinutes > 0 && cookTimeMinutes < 5) {
    prepWarningFound = true;
    checks.push({
      id: 'thermal-short-cooktime',
      category: 'THERMAL_AND_PREP_SAFETY',
      title: `Thời gian nấu (${cookTimeMinutes} phút) quá ngắn so với món thịt/gia cầm`,
      level: 'CAUTION',
      detail: `Món ăn có thịt heo/gia cầm nhưng thời gian nấu khai báo chỉ ${cookTimeMinutes} phút — có nguy cơ thịt chưa chín kỹ từ bên trong.`,
      recommendation: 'Kiểm tra và điều chỉnh lại thời gian nấu chín hợp lý (thường từ 12–30 phút).',
    });
  }

  if (!prepWarningFound) {
    checks.push({
      id: 'thermal-prep-clean',
      category: 'THERMAL_AND_PREP_SAFETY',
      title: 'Quy trình Sơ chế & Nhiệt độ Nấu chín',
      level: 'SAFE',
      detail:
        'Các nguyên liệu đều được hướng dẫn làm sạch và nấu chín ở nhiệt độ an toàn.',
    });
  }

  // ============================================================================
  // CHỐT 4: KIỂM SOÁT NGƯỠNG GIA VỊ & ĐỊNH LƯỢNG BẤT THƯỜNG (NATRI / ĐƯỜNG / DẦU)
  // ============================================================================
  let totalSaltGrams = 0;
  let totalFishSauceMl = 0;
  let totalSugarGrams = 0;
  let dosageIssueFound = false;

  for (const ing of ingredients) {
    const ingName = (ing.name || ing.ingredient?.name || '').toLowerCase();
    const rawAmount = Number(ing.amount) || 0;
    if (rawAmount <= 0) continue;
    const grams = estimateAmountInGrams(rawAmount, ing.unit || 'g');

    if (/\b(muối|muối hạt|muối ăn|bột canh|hạt nêm)\b/i.test(ingName)) {
      totalSaltGrams += grams;
    } else if (/\b(nước mắm|mắm nêm|mắm tôm)\b/i.test(ingName)) {
      totalFishSauceMl += grams;
    } else if (/\b(đường|đường cát|đường phèn|đường thốt nốt)\b/i.test(ingName)) {
      totalSugarGrams += grams;
    }

    // Kiểm tra 1 nguyên liệu đơn lẻ có định lượng phi lý (VD: 50000g)
    if (grams > 5000 && baseServings <= 6) {
      dosageIssueFound = true;
      checks.push({
        id: `dosage-extreme-${ingName}`,
        category: 'DOSAGE_AND_SEASONING',
        title: `Định lượng bất thường: ${ing.name || ing.ingredient?.name} (${rawAmount} ${ing.unit})`,
        level: 'DANGER',
        detail: `Lượng nguyên liệu "${ing.name || ing.ingredient?.name}" lên tới ~${Math.round(grams)}g cho ${baseServings} người ăn. Rất có thể người đăng đã gõ nhầm đơn vị hoặc số 0.`,
        recommendation: 'Kiểm tra và chỉnh lại định lượng đúng thực tế trước khi duyệt.',
      });
    }
  }

  const saltPerServing = totalSaltGrams / baseServings;
  const fishSaucePerServing = totalFishSauceMl / baseServings;
  const sugarPerServing = totalSugarGrams / baseServings;

  if (saltPerServing > 15) {
    dosageIssueFound = true;
    checks.push({
      id: 'dosage-salt-danger',
      category: 'DOSAGE_AND_SEASONING',
      title: `Lượng muối/gia vị mặn quá ngưỡng nguy hiểm (~${Math.round(saltPerServing)}g/người)`,
      level: 'DANGER',
      detail: `Tổ chức Y tế Thế giới (WHO) khuyến nghị tổng lượng muối cả ngày dưới 5g/người. Công thức này dùng tới ${Math.round(totalSaltGrams)}g muối/bột canh cho ${baseServings} người (có thể do nhập nhầm đơn vị g với muỗng hoặc dùng để ngâm rửa nhưng chưa ghi chú).`,
      recommendation:
        'Nếu muối dùng để bóp rửa sơ chế rồi xả bỏ, hãy ghi rõ trong phần sơ chế hoặc giảm về định lượng nêm thực tế (3–8g).',
    });
  } else if (saltPerServing > 8 || fishSaucePerServing > 45) {
    dosageIssueFound = true;
    checks.push({
      id: 'dosage-sodium-caution',
      category: 'DOSAGE_AND_SEASONING',
      title: 'Hàm lượng gia vị mặn (Natri) khá cao trên mỗi khẩu phần',
      level: 'CAUTION',
      detail: `Món ăn có lượng muối/nước mắm khá đậm (~${Math.round(saltPerServing)}g muối, ~${Math.round(fishSaucePerServing)}ml nước mắm/khẩu phần). Cần lưu ý với người cao huyết áp hoặc bệnh thận.`,
      recommendation:
        'Có thể giữ nguyên nếu là món kho mặn ăn kèm nhiều cơm, nhưng nên thêm lưu ý giảm mặn cho gia đình có người lớn tuổi.',
    });
    recommendedSafetyTips.push(
      'Lưu ý dinh dưỡng: Món ăn có vị đậm đà, người cao huyết áp hoặc ăn nhạt nên giảm 1/3 lượng nước mắm/muối khi nêm.'
    );
  }

  if (sugarPerServing > 60) {
    dosageIssueFound = true;
    checks.push({
      id: 'dosage-sugar-caution',
      category: 'DOSAGE_AND_SEASONING',
      title: `Hàm lượng đường cao (~${Math.round(sugarPerServing)}g/người)`,
      level: 'CAUTION',
      detail: `Lượng đường trên mỗi khẩu phần khá cao (~${Math.round(sugarPerServing)}g/người). Người tiểu đường hoặc kiểm soát đường huyết cần cân nhắc.`,
      recommendation: 'Kiểm tra lại định lượng đường hoặc gắn nhãn lưu ý lượng đường.',
    });
  }

  if (!dosageIssueFound) {
    checks.push({
      id: 'dosage-clean',
      category: 'DOSAGE_AND_SEASONING',
      title: 'Định lượng Gia vị & Cân bằng Dinh dưỡng',
      level: 'SAFE',
      detail:
        'Tỉ lệ muối, nước mắm, đường và định lượng nguyên liệu nằm trong ngưỡng an toàn sức khỏe cho khẩu phần gia đình.',
    });
  }

  // ============================================================================
  // CHỐT 5: CHẤT LƯỢNG KỸ THUẬT & ĐỘ KHỚP CÔNG THỨC
  // ============================================================================
  const validSteps = steps.filter((s) => (s.instruction || '').trim().length >= 35);
  const uniquePhases = new Set(steps.map((s) => (s.phaseName || 'Chế biến').trim())).size;

  if (steps.length < 3 || validSteps.length < Math.min(3, steps.length)) {
    checks.push({
      id: 'quality-steps-short',
      category: 'RECIPE_QUALITY_AND_COHERENCE',
      title: `Hướng dẫn nấu còn sơ sài (${steps.length} bước, ${uniquePhases} giai đoạn)`,
      level: 'CAUTION',
      detail:
        'Một số bước hướng dẫn còn quá ngắn hoặc thiếu chỉ dẫn độ lửa, thời gian và định lượng cụ thể khiến người đọc khó làm theo thành công.',
      recommendation:
        'Nên chia thành 4–5 giai đoạn và bổ sung rõ số muỗng/gram gia vị ngay trong câu hướng dẫn nấu.',
    });
  } else {
    checks.push({
      id: 'quality-steps-good',
      category: 'RECIPE_QUALITY_AND_COHERENCE',
      title: `Cấu trúc kỹ thuật rõ ràng (${uniquePhases} giai đoạn · ${steps.length} bước chi tiết)`,
      level: 'SAFE',
      detail:
        'Công thức được chia giai đoạn bài bản, mô tả bước nấu chi tiết, đầy đủ định lượng và dấu hiệu nhận biết độ chín.',
    });
  }

  // ============================================================================
  // PHÁT HIỆN NHÃN DỊ ỨNG (ALLERGENS)
  // ============================================================================
  const allergens: AllergenBadge[] = ALLERGEN_RULES.filter((r) =>
    r.pattern.test(ingredientNames.join(' | ') + ' | ' + name)
  ).map((r) => ({
    key: r.key,
    label: r.label,
    note: r.note,
  }));

  // ============================================================================
  // TỔNG HỢP ĐIỂM SỐ & KẾT LUẬN ĐÈN GIAO THÔNG CHO ADMIN
  // ============================================================================
  const hasDanger = checks.some((c) => c.level === 'DANGER');
  const cautionCount = checks.filter((c) => c.level === 'CAUTION').length;

  let verdict: SafetyVerdict = 'SAFE';
  let safetyScore = 96;
  let headline = '🟢 AN TOÀN & CHUẨN CÔNG THỨC — Có thể yên tâm phê duyệt';
  let adminGuidance =
    'Tất cả nguyên liệu đều lành tính, không có chất độc tự nhiên hay cặp chất đại kỵ, định lượng gia vị an toàn. Bạn có thể yên tâm bấm Phê duyệt & Xuất bản.';

  if (hasDanger) {
    verdict = 'DANGER';
    safetyScore = 20;
    headline = '🔴 NGUY HIỂM AN TOÀN THỰC PHẨM — Đã khóa nút Xuất bản để bảo vệ người dùng';
    adminGuidance =
      'Hệ thống phát hiện nguyên liệu chứa độc tố, món sống nguy hiểm hoặc định lượng sai lệch nghiêm trọng. Tuyệt đối KHÔNG duyệt xuất bản bài này — hãy bấm trả bài kèm lý do bên dưới.';
  } else if (cautionCount > 0) {
    verdict = 'CAUTION';
    safetyScore = Math.max(58, 88 - cautionCount * 12);
    headline = `🟡 CẦN LƯU Ý (${cautionCount} điểm cần kiểm tra) — Xem khuyến nghị trước khi duyệt`;
    adminGuidance =
      'Món ăn không có chất cấm nhưng sử dụng nguyên liệu cần sơ chế kỹ (như măng, nấm...) hoặc cần bổ sung chi tiết bước nấu. Hãy đọc mục màu vàng bên dưới hoặc bấm "Tự động chèn Lưu ý An toàn" trước khi duyệt.';
  }

  const qualityScore = Math.min(
    100,
    Math.round(
      (Math.min(steps.length, 5) / 5) * 40 +
        (Math.min(uniquePhases, 4) / 4) * 30 +
        (Math.min(ingredients.length, 6) / 6) * 30
    )
  );

  const issueChecks = checks.filter((c) => c.level !== 'SAFE');
  const rejectionReasonTemplate =
    issueChecks.length > 0
      ? `Chào bạn, cảm ơn bạn đã đóng góp công thức "${name || 'món ăn'}" cho Bếp Ăn Gì Mom. Qua hệ thống Kiểm định An toàn Thực phẩm & Chất lượng, ban biên tập đề nghị bạn điều chỉnh các điểm sau trước khi xuất bản:\n` +
        issueChecks
          .map(
            (c, idx) =>
              `${idx + 1}. [${c.level === 'DANGER' ? 'Bắt buộc sửa - An toàn thực phẩm' : 'Khuyến nghị'}]: ${c.title} — ${c.recommendation || c.detail}`
          )
          .join('\n')
      : null;

  return {
    verdict,
    safetyScore,
    qualityScore,
    headline,
    adminGuidance,
    checks,
    allergens,
    recommendedSafetyTips: Array.from(new Set(recommendedSafetyTips)),
    rejectionReasonTemplate,
  };
}
