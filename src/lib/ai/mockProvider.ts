// AG-27: Mock / Heuristic AI Provider
// Cung cấp giải pháp Fallback an toàn (Graceful Degradation - Invariants Gate P4)
// Hoạt động độc lập không cần internet hoặc API key bên ngoài, phân tích thông minh tên món Việt
// để bóc tách đúng nguyên liệu thực tế (khớp Bảng FCT Viện Dinh Dưỡng & Giá Bách Hóa Xanh).

import type { AiProvider, AiCompletionOptions, AiCompletionResult } from './types';

interface HeuristicIngredientSpec {
  name: string;
  amount: number;
  unit: string;
  scalePolicy: 'LINEAR' | 'FIXED' | 'MANUAL_ADJUST';
  preparation: string;
  isOptional: boolean;
}

/**
 * Phân tích tên món ăn & văn bản nguồn để trích xuất bộ nguyên liệu chuẩn bếp Việt (không bao giờ dùng tên chung chung)
 */
export function buildSmartVietnameseRecipeFromTitle(
  dishName: string,
  promptText = ''
): {
  role: 'MAIN' | 'SOUP' | 'SIDE';
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  shortDescription: string;
  ingredients: HeuristicIngredientSpec[];
  steps: Array<{
    stepNumber: number;
    phaseName: string;
    instruction: string;
    timerSeconds: number;
    tipText: string;
  }>;
} {
  const lower = dishName.toLowerCase();
  const fullLower = `${dishName} ${promptText}`.toLowerCase();

  let role: 'MAIN' | 'SOUP' | 'SIDE' = 'MAIN';
  if (lower.startsWith('canh') || lower.startsWith('súp') || lower.includes('canh ')) {
    role = 'SOUP';
  } else if (
    lower.startsWith('rau ') ||
    lower.startsWith('bông ') ||
    lower.startsWith('đậu bắp') ||
    lower.startsWith('cải ') ||
    lower.startsWith('su su') ||
    lower.startsWith('bắp cải') ||
    lower.startsWith('dưa leo') ||
    lower.startsWith('nấm ') ||
    lower.startsWith('salad') ||
    lower.startsWith('gỏi') ||
    lower.includes('luộc') ||
    lower.includes('trộn')
  ) {
    role = 'SIDE';
  }

  const ingredients: HeuristicIngredientSpec[] = [];

  // 1. Nhóm Đạm chính (Thịt / Cá / Hải sản / Đậu hũ / Trứng)
  if (lower.includes('ba chỉ') || lower.includes('ba rọi') || lower.includes('heo quay')) {
    ingredients.push({
      name: 'Thịt ba chỉ heo',
      amount: role === 'SOUP' ? 150 : 450,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Rửa sạch với nước muối loãng, thái miếng vừa ăn',
      isOptional: false,
    });
  } else if (lower.includes('sườn')) {
    ingredients.push({
      name: 'Sườn non heo',
      amount: role === 'SOUP' ? 350 : 500,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Chặt miếng 4cm, chần sơ nước sôi khử bọt',
      isOptional: false,
    });
  } else if (lower.includes('chân giò')) {
    ingredients.push({
      name: 'Thịt chân giò heo',
      amount: 500,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Thái miếng vừa ăn, ướp gia vị',
      isOptional: false,
    });
  } else if (lower.includes('thịt băm') || lower.includes('thịt bằm') || lower.includes('nhồi thịt')) {
    ingredients.push({
      name: 'Thịt heo nạc vai băm',
      amount: role === 'SOUP' ? 150 : 250,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Ướp chút hành tím băm và hạt tiêu',
      isOptional: false,
    });
  } else if (lower.includes('ức gà')) {
    ingredients.push({
      name: 'Ức gà phi lê',
      amount: role === 'SIDE' ? 250 : 400,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Thấm khô, khứa nhẹ bề mặt hoặc thái miếng vừa ăn',
      isOptional: false,
    });
  } else if (lower.includes('cánh gà') || lower.includes('gà ta') || lower.includes('canh gà') || lower.includes('gà ')) {
    ingredients.push({
      name: 'Thịt gà ta',
      amount: 500,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Xát muối gừng rửa sạch, chặt miếng vừa ăn',
      isOptional: false,
    });
  } else if (lower.includes('thăn bò') || lower.includes('bò lúc lắc') || lower.includes('thịt bò') || lower.includes('bò ')) {
    ingredients.push({
      name: 'Thịt thăn bò tươi',
      amount: role === 'SIDE' ? 200 : 350,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Thái lát mỏng ngang thớ hoặc cắt quân cờ, ướp tỏi dầu hào',
      isOptional: false,
    });
  } else if (lower.includes('cá hồi')) {
    ingredients.push({
      name: 'Phi lê cá hồi tươi',
      amount: 380,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Thấm khô bề mặt, ướp chút muối tiêu và cốt chanh',
      isOptional: false,
    });
  } else if (
    lower.includes('cá lóc') ||
    lower.includes('cá diêu hồng') ||
    lower.includes('cá basa') ||
    lower.includes('cábasa') ||
    lower.includes('cá nục') ||
    lower.includes('cá rô') ||
    lower.includes('chả cá') ||
    lower.includes('cá thác lác') ||
    lower.includes('cá ')
  ) {
    const fishName = lower.includes('cá lóc')
      ? 'Cá lóc tươi làm sạch'
      : lower.includes('cá diêu hồng')
      ? 'Cá diêu hồng tươi'
      : lower.includes('cá nục')
      ? 'Cá nục tươi'
      : lower.includes('cá thác lác')
      ? 'Cá thác lác nạo'
      : 'Cá basa phi lê / cắt khứa';
    ingredients.push({
      name: fishName,
      amount: role === 'SOUP' ? 350 : 450,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Chà muối chanh khử tanh, rửa sạch để ráo',
      isOptional: false,
    });
  }

  if (lower.includes('tôm')) {
    ingredients.push({
      name: 'Tôm sú tươi',
      amount: role === 'SOUP' ? 200 : 300,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Bóc vỏ, rút chỉ lưng, rửa sạch',
      isOptional: false,
    });
  }
  if (lower.includes('mực')) {
    ingredients.push({
      name: 'Mực ống tươi',
      amount: 350,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Làm sạch, khứa vảy rồng, cắt miếng vừa ăn',
      isOptional: false,
    });
  }
  if (lower.includes('nghêu') || lower.includes('ngao')) {
    ingredients.push({
      name: 'Nghêu (ngao) tươi',
      amount: 400,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Ngâm nước muối ớt nhả sạch cát, rửa kỹ',
      isOptional: false,
    });
  }
  if (lower.includes('cua đồng')) {
    ingredients.push({
      name: 'Cua đồng xay sẵn',
      amount: 300,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Hòa với 1 lít nước lọc lấy nước cốt thịt cua',
      isOptional: false,
    });
  }
  if (lower.includes('đậu hũ') || lower.includes('đậu phụ')) {
    ingredients.push({
      name: 'Đậu phụ trắng (đậu hũ)',
      amount: 350,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Cắt miếng vuông vừa ăn',
      isOptional: false,
    });
  }
  if (lower.includes('trứng')) {
    ingredients.push({
      name: 'Trứng gà ta',
      amount: 4,
      unit: 'quả',
      scalePolicy: 'LINEAR',
      preparation: lower.includes('lòng đào') || lower.includes('kho') ? 'Luộc chín tới, bóc vỏ' : 'Đánh tan với chút nước mắm',
      isOptional: false,
    });
  }

  // 2. Nhóm Rau củ / Nấm / Trái cây nấu kèm
  if (lower.includes('măng')) {
    ingredients.push({
      name: 'Măng tươi',
      amount: 250,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Luộc sơ 2 lần nước sôi cho hết vị đắng, để ráo',
      isOptional: false,
    });
  }
  if (lower.includes('bông cải xanh') || lower.includes('súp lơ')) {
    ingredients.push({
      name: 'Bông cải xanh (súp lơ)',
      amount: 300,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Tách nhánh vừa ăn, ngâm nước muối loãng',
      isOptional: false,
    });
  }
  if (lower.includes('măng tây')) {
    ingredients.push({
      name: 'Măng tây xanh',
      amount: 250,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Bẻ bỏ gốc già, rửa sạch cắt khúc',
      isOptional: false,
    });
  }
  if (lower.includes('rau ngót')) {
    ingredients.push({
      name: 'Rau ngót tươi',
      amount: 300,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Tuốt lá, rửa sạch rồi vò nhẹ cho mềm ngọt',
      isOptional: false,
    });
  }
  if (lower.includes('rau muống')) {
    ingredients.push({
      name: 'Rau muống non',
      amount: 450,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Nhặt lấy ngọn non, rửa sạch để ráo',
      isOptional: false,
    });
  }
  if (lower.includes('bầu')) {
    ingredients.push({
      name: 'Bầu sao non',
      amount: 400,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Gọt vỏ, thái lát hoặc băm sợi vừa ăn',
      isOptional: false,
    });
  }
  if (lower.includes('bí đỏ')) {
    ingredients.push({
      name: 'Bí đỏ dẻo',
      amount: 400,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Gọt vỏ, bỏ ruột, cắt miếng vuông 3cm',
      isOptional: false,
    });
  }
  if (lower.includes('mướp đắng') || lower.includes('khổ qua')) {
    ingredients.push({
      name: 'Khổ qua (mướp đắng)',
      amount: 400,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Mổ bụng bỏ ruột trắng, rửa sạch',
      isOptional: false,
    });
  }
  if (lower.includes('cải bẹ xanh') || lower.includes('cải thìa') || lower.includes('rau dền') || lower.includes('rau đay') || lower.includes('mồng tơi')) {
    ingredients.push({
      name: 'Rau cải xanh tươi',
      amount: 350,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Nhặt rửa sạch, cắt khúc vừa ăn',
      isOptional: false,
    });
  }
  if (lower.includes('bắp cải')) {
    ingredients.push({
      name: 'Bắp cải tươi',
      amount: 350,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Thái sợi vừa ăn, ngâm rửa sạch',
      isOptional: false,
    });
  }
  if (lower.includes('đậu bắp')) {
    ingredients.push({
      name: 'Đậu bắp non',
      amount: 300,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Rửa sạch, cắt bỏ đầu cuống',
      isOptional: false,
    });
  }
  if (lower.includes('nấm')) {
    ingredients.push({
      name: 'Nấm đùi gà / Nấm đông cô tươi',
      amount: 200,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Cắt bỏ chân nấm, ngâm nước muối loãng rồi thái lát',
      isOptional: false,
    });
  }
  if (lower.includes('cà chua') || lower.includes('sốt cà') || lower.includes('canh chua')) {
    ingredients.push({
      name: 'Cà chua chín đỏ',
      amount: 200,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Rửa sạch, bổ múi cau hoặc băm nhuyễn',
      isOptional: false,
    });
  }
  if (lower.includes('thơm') || lower.includes('dứa')) {
    ingredients.push({
      name: 'Thơm (dứa) chín',
      amount: 200,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Gọt sạch mắt, cắt miếng vừa ăn',
      isOptional: false,
    });
  }
  if (lower.includes('ớt chuông')) {
    ingredients.push({
      name: 'Ớt chuông Đà Lạt',
      amount: 200,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Bỏ hạt, thái miếng vuông vừa ăn',
      isOptional: false,
    });
  }
  if (lower.includes('khoai tây') || lower.includes('khoai mỡ') || lower.includes('củ sen')) {
    ingredients.push({
      name: 'Khoai tây / Khoai mỡ tươi',
      amount: 300,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Gọt vỏ, rửa sạch và cắt miếng vừa ăn',
      isOptional: false,
    });
  }

  // Fallback nếu tên món đặc biệt chưa khớp nhóm trên: gán nguyên liệu chuẩn theo role
  if (ingredients.length === 0) {
    if (role === 'SOUP') {
      ingredients.push(
        {
          name: 'Thịt heo nạc vai băm',
          amount: 150,
          unit: 'g',
          scalePolicy: 'LINEAR',
          preparation: 'Ướp chút hành tím và tiêu',
          isOptional: false,
        },
        {
          name: 'Rau cải xanh tươi',
          amount: 350,
          unit: 'g',
          scalePolicy: 'LINEAR',
          preparation: 'Rửa sạch, cắt khúc 3cm',
          isOptional: false,
        }
      );
    } else if (role === 'SIDE') {
      ingredients.push(
        {
          name: 'Rau cải xanh tươi',
          amount: 400,
          unit: 'g',
          scalePolicy: 'LINEAR',
          preparation: 'Nhặt rửa sạch, để ráo nước',
          isOptional: false,
        },
        {
          name: 'Thịt thăn bò tươi',
          amount: 150,
          unit: 'g',
          scalePolicy: 'LINEAR',
          preparation: 'Thái lát mỏng, ướp tỏi',
          isOptional: true,
        }
      );
    } else {
      ingredients.push({
        name: 'Thịt heo nạc vai',
        amount: 400,
        unit: 'g',
        scalePolicy: 'LINEAR',
        preparation: 'Rửa sạch, thái miếng vừa ăn',
        isOptional: false,
      });
    }
  }

  // 3. Nhóm Gia vị & Rau thơm chuẩn bếp Việt
  if (fullLower.includes('gừng')) {
    ingredients.push({
      name: 'Gừng tươi',
      amount: 15,
      unit: 'g',
      scalePolicy: 'FIXED',
      preparation: 'Cạo vỏ, thái sợi chỉ hoặc đập dập',
      isOptional: false,
    });
  }
  ingredients.push(
    {
      name: 'Tỏi khô & Hành tím',
      amount: 20,
      unit: 'g',
      scalePolicy: 'FIXED',
      preparation: 'Bóc vỏ, băm nhỏ',
      isOptional: false,
    },
    {
      name: 'Hành lá',
      amount: 15,
      unit: 'g',
      scalePolicy: 'FIXED',
      preparation: 'Rửa sạch, thái nhỏ',
      isOptional: false,
    },
    {
      name: 'Nước mắm truyền thống',
      amount: role === 'MAIN' ? 3 : 2,
      unit: 'muỗng canh',
      scalePolicy: 'MANUAL_ADJUST',
      preparation: 'Độ đạm cao cho dậy mùi thơm',
      isOptional: false,
    },
    ...(role === 'MAIN'
      ? [
          {
            name: 'Đường cát',
            amount: 1.5,
            unit: 'muỗng canh',
            scalePolicy: 'MANUAL_ADJUST' as const,
            preparation: 'Cân bằng vị mặn ngọt hoặc thắng màu',
            isOptional: false,
          },
        ]
      : []),
    {
      name: 'Dầu ăn thực vật',
      amount: lower.includes('chiên') ? 3 : 1,
      unit: 'muỗng canh',
      scalePolicy: 'FIXED',
      preparation: '',
      isOptional: false,
    }
  );

  const primaryIng = ingredients[0];
  const secondaryIng = ingredients.length > 2 ? ingredients[1] : null;
  const mainIngNames = ingredients
    .slice(0, 2)
    .map((i) => i.name.toLowerCase())
    .join(' kết hợp cùng ');

  const prepTimeMinutes = role === 'SIDE' ? 10 : 15;
  const cookTimeMinutes = role === 'SIDE' ? 10 : role === 'SOUP' ? 20 : 25;

  const shortDescription = `Công thức ${dishName} chuẩn vị cơm nhà Việt Nam, kết hợp hài hòa từ ${mainIngNames}, hướng dẫn chi tiết từng giai đoạn canh lửa giúp ai vào bếp cũng làm thành công ngay lần đầu.`;

  const isFriedSauce =
    lower.includes('chiên nước mắm') ||
    lower.includes('sốt') ||
    lower.includes('rim') ||
    lower.includes('chua ngọt');
  const isBraised = lower.includes('kho');

  let steps: Array<{
    stepNumber: number;
    phaseName: string;
    instruction: string;
    timerSeconds: number;
    tipText: string;
  }> = [];

  if (role === 'SOUP') {
    steps = [
      {
        stepNumber: 1,
        phaseName: 'Sơ chế & Khử mùi',
        instruction: `Chuẩn bị ${primaryIng.amount}${primaryIng.unit} ${primaryIng.name.toLowerCase()}, rửa qua nước muối pha loãng 3 phút rồi xả sạch và để thật ráo nước (${primaryIng.preparation}).`,
        timerSeconds: 300,
        tipText: 'Rửa qua nước muối loãng hoặc gừng đập dập giúp khử sạch mùi tanh và làm nước canh trong veo.',
      },
      {
        stepNumber: 2,
        phaseName: 'Sơ chế & Khử mùi',
        instruction: secondaryIng
          ? `Nhặt rửa sạch ${secondaryIng.amount}${secondaryIng.unit} ${secondaryIng.name.toLowerCase()} (${secondaryIng.preparation}), để ráo. Bóc vỏ và băm nhỏ 20g hành tím, rửa sạch 15g hành lá thái nhỏ để riêng phần đầu hành trắng.`
          : `Bóc vỏ, băm nhỏ 20g hành tím và thái nhỏ 15g hành lá, tách riêng phần đầu hành trắng để phi thơm tạo mùi cho nồi canh.`,
        timerSeconds: 300,
        tipText: 'Để riêng phần đầu hành trắng phi lúc đầu và lá hành xanh rắc lúc tắt bếp giúp canh thơm dậy mùi.',
      },
      {
        stepNumber: 3,
        phaseName: 'Ướp thấm vị & Xào săn',
        instruction: `Ướp ${primaryIng.amount}${primaryIng.unit} ${primaryIng.name.toLowerCase()} với 1 muỗng canh nước mắm, 1/2 phần hành tím băm và 1/3 muỗng cà phê hạt tiêu trong 10 phút. Sau đó làm nóng nồi với 1 muỗng canh dầu ăn ở lửa vừa, phi thơm đầu hành rồi trút nguyên liệu chính vào đảo săn trong 3 phút.`,
        timerSeconds: 780,
        tipText: 'Xào săn nguyên liệu chính trước khi đổ nước giúp giữ trọn vị ngọt tự nhiên trong từng thớ thịt.',
      },
      {
        stepNumber: 4,
        phaseName: 'Ninh nước dùng & Nấu chín',
        instruction: `Chế vào nồi 1,2 lít nước sôi, đun trên lửa lớn đến khi sôi bùng thì hạ xuống lửa vừa và dùng vá hớt sạch lớp bọt trên mặt trong 8 phút.${
          secondaryIng
            ? ` Tiếp tục thả ${secondaryIng.amount}${secondaryIng.unit} ${secondaryIng.name.toLowerCase()} vào nấu thêm 4–5 phút đến khi chín mềm vừa tới.`
            : ''
        }`,
        timerSeconds: 780,
        tipText: 'Luôn chế nước ấm/sôi và không đậy kín nắp nồi sau khi cho rau để rau giữ màu xanh tươi và không bị nồng.',
      },
      {
        stepNumber: 5,
        phaseName: 'Hoàn thành & Trình bày',
        instruction: `Nêm thêm 1 muỗng canh nước mắm truyền thống vào nồi canh trước khi tắt bếp 30 giây để dậy hương thơm. Rắc 15g hành lá thái nhỏ và chút tiêu xay lên mặt, múc ra tô lớn dùng nóng với cơm trắng.`,
        timerSeconds: 60,
        tipText: 'Nêm nước mắm ở bước cuối cùng ngay trước khi tắt bếp giúp canh thơm dịu mà không bị chua nước.',
      },
    ];
  } else if (role === 'SIDE') {
    steps = [
      {
        stepNumber: 1,
        phaseName: 'Sơ chế & Rửa sạch',
        instruction: `Nhặt và rửa sạch ${primaryIng.amount}${primaryIng.unit} ${primaryIng.name.toLowerCase()} (${primaryIng.preparation}), ngâm qua nước muối loãng 5 phút rồi vớt ra rổ vẩy thật ráo nước. Bóc vỏ, đập dập và băm nhỏ 20g tỏi khô chia làm 2 phần bằng nhau.`,
        timerSeconds: 300,
        tipText: 'Rau củ phải để thật ráo nước trước khi cho vào chảo thì khi xào mới giòn ngọt và không bị bắn dầu.',
      },
      {
        stepNumber: 2,
        phaseName: 'Chần sơ giữ sắc xanh',
        instruction: `Đun sôi 1 lít nước với 1/2 muỗng cà phê muối và vài giọt dầu ăn trên lửa lớn. Cho ${primaryIng.name.toLowerCase()} vào trụng nhanh khoảng 45–60 giây đến khi vừa chuyển màu xanh ngọc thì vớt ngay ra đĩa cho ráo.`,
        timerSeconds: 120,
        tipText: 'Trụng nhanh trong nước sôi có chút muối rồi vớt ra ngay giúp rau giữ màu xanh mướt như ngoài hàng.',
      },
      {
        stepNumber: 3,
        phaseName: 'Xào lửa lớn & Pha sốt',
        instruction: `Đặt chảo lên bếp ở lửa lớn nhất, cho 1 muỗng canh dầu ăn vào phi thơm vàng 1/2 lượng tỏi băm (10g).${
          secondaryIng
            ? ` Cho ${secondaryIng.amount}${secondaryIng.unit} ${secondaryIng.name.toLowerCase()} vào đảo săn 2 phút, sau đó trút phần ${primaryIng.name.toLowerCase()} vào đảo nhanh tay cùng 2 muỗng canh nước mắm (hoặc dầu hào) trong 2 phút.`
            : ` Trút toàn bộ ${primaryIng.amount}${primaryIng.unit} ${primaryIng.name.toLowerCase()} vào đảo nhanh tay cùng 2 muỗng canh nước mắm/dầu hào trong 2 phút cho thấm đều.`
        }`,
        timerSeconds: 240,
        tipText: 'Giữ lửa lớn xuyên suốt lúc xào để khóa nước ngọt bên trong rau củ.',
      },
      {
        stepNumber: 4,
        phaseName: 'Hoàn thành & Trình bày',
        instruction: `Cho nốt 10g tỏi băm còn lại và 15g hành lá cắt khúc vào đảo đều 15 giây cho dậy mùi tỏi mới rồi tắt bếp ngay. Gắp ra đĩa rộng để thoát hơi nóng, rắc chút tiêu xay và thưởng thức nóng.`,
        timerSeconds: 60,
        tipText: 'Chia tỏi làm 2 lần (phi đầu và đảo cuối) là bí quyết giúp đĩa đồ xào thơm nức mũi.',
      },
    ];
  } else if (isFriedSauce) {
    steps = [
      {
        stepNumber: 1,
        phaseName: 'Sơ chế & Khử mùi',
        instruction: `Rửa sạch ${primaryIng.amount}${primaryIng.unit} ${primaryIng.name.toLowerCase()} với nước muối loãng và vài lát gừng đập dập trong 3 phút để khử sạch mùi hôi, xả lại nước lạnh rồi dùng khăn giấy bếp thấm thật khô từng miếng (${primaryIng.preparation}).`,
        timerSeconds: 300,
        tipText: 'Thấm thật khô bề mặt nguyên liệu bằng khăn giấy giúp khi chiên da giòn rụm và hoàn toàn không bị văng dầu.',
      },
      {
        stepNumber: 2,
        phaseName: 'Ướp thấm vị & Pha sốt định lượng',
        instruction: `Ướp ${primaryIng.name.toLowerCase()} với 1/2 muỗng cà phê muối và 1/2 muỗng cà phê tiêu xay trong 15 phút (áo nhẹ 2–3 muỗng canh bột mỏng bên ngoài nếu chiên giòn). Trong lúc chờ, băm nhuyễn 20g–40g tỏi ớt và khuấy tan chén sốt chuẩn tỷ lệ gồm: 3 muỗng canh nước mắm truyền thống + 1,5 đến 2 muỗng canh đường cát + 2 muỗng canh nước lọc ấm.`,
        timerSeconds: 900,
        tipText: 'Khuấy tan hoàn toàn đường và nước mắm với 2 muỗng nước lọc ấm ở ngoài chén trước giúp khi rim sốt không bị cháy khét.',
      },
      {
        stepNumber: 3,
        phaseName: 'Chiên vàng giòn & Phi tỏi ớt',
        instruction: `Làm nóng chảo với 3 muỗng canh dầu ăn ở lửa vừa. Xếp từng miếng ${primaryIng.name.toLowerCase()} vào chiên khoảng 4–5 phút mỗi mặt cho đến khi lớp vỏ ngoài chín vàng giòn đều hai mặt thì gắp ra đĩa có lót giấy thấm dầu.`,
        timerSeconds: 600,
        tipText: 'Không lật trở quá sớm trong 3 phút đầu để lớp da định hình giòn rụm và vàng óng đẹp mắt.',
      },
      {
        stepNumber: 4,
        phaseName: 'Áo sốt keo sánh',
        instruction: `Chắt bớt dầu thừa trong chảo, chỉ giữ lại đúng 1 muỗng canh dầu nóng rồi cho 20g tỏi ớt băm vào phi thơm vàng (vớt 1/2 lượng tỏi phi ra để riêng). Đổ chén nước sốt mắm đường đã pha vào đun ở lửa vừa khoảng 1 phút cho sủi bọt sánh nhẹ, sau đó trút ${primaryIng.name.toLowerCase()} vào đảo đều tay ở lửa nhỏ trong 2–3 phút đến khi sốt keo lại màu hổ phách bám bóng mượt quanh từng miếng.`,
        timerSeconds: 240,
        tipText: 'Hạ lửa nhỏ khi áo sốt để lớp sốt mắm đường bọc đều mà vẫn giữ được độ giòn của lớp vỏ.',
      },
      {
        stepNumber: 5,
        phaseName: 'Hoàn thành & Trình bày',
        instruction: `Tắt bếp, rắc phần tỏi phi vàng giòn đã chừa lại cùng 15g hành lá hoặc ngò rí lên trên mặt. Bày ra đĩa dùng ngay khi còn nóng hổi kèm cơm trắng và dưa leo thái lát.`,
        timerSeconds: 60,
        tipText: 'Rắc phần tỏi phi khô lên sau cùng giúp món ăn vừa có vị sốt mặn ngọt đậm đà vừa có tỏi giòn rụm thơm lừng.',
      },
    ];
  } else {
    // Món Kho / Rim / Áp chảo chuẩn 4 giai đoạn · 5 bước
    steps = [
      {
        stepNumber: 1,
        phaseName: 'Sơ chế & Khử mùi',
        instruction: `Rửa sạch ${primaryIng.amount}${primaryIng.unit} ${primaryIng.name.toLowerCase()} với nước muối loãng rồi chần nhanh qua nước sôi khoảng 1–2 phút để loại bỏ tạp chất, sau đó rửa lại và để ráo (${primaryIng.preparation}).${
          secondaryIng
            ? ` Sơ chế sạch ${secondaryIng.amount}${secondaryIng.unit} ${secondaryIng.name.toLowerCase()} (${secondaryIng.preparation}) để riêng.`
            : ''
        }`,
        timerSeconds: 300,
        tipText: 'Trụng sơ qua nước sôi giúp thớ thịt/cá săn chắc, khử mùi tanh và khi kho nước sốt trong, bóng đẹp.',
      },
      {
        stepNumber: 2,
        phaseName: 'Ướp thấm vị chuẩn tỷ lệ',
        instruction: `Cho ${primaryIng.amount}${primaryIng.unit} ${primaryIng.name.toLowerCase()} vào tô lớn, ướp cùng 1/2 lượng hành tỏi băm (10g), 2 muỗng canh nước mắm truyền thống, 1/2 muỗng canh đường cát và 1/2 muỗng cà phê tiêu xay. Đảo đều và để thấm gia vị trong 15–20 phút.`,
        timerSeconds: 900,
        tipText: 'Ướp đủ 15–20 phút giúp gia vị ngấm sâu vào bên trong thớ nguyên liệu trước khi lên bếp.',
      },
      {
        stepNumber: 3,
        phaseName: isBraised ? 'Thắng màu & Xào săn' : 'Áp chảo & Xào săn',
        instruction: isBraised
          ? `Bắc nồi lên bếp ở lửa nhỏ, cho 1 muỗng canh dầu ăn và 1 muỗng canh đường cát vào khuấy khoảng 2 phút đến khi đường tan chảy chuyển màu cánh gián. Cho 10g hành tỏi băm còn lại vào phi thơm rồi trút phần ${primaryIng.name.toLowerCase()} đã ướp vào đảo săn đều ở lửa vừa trong 4–5 phút.`
          : `Làm nóng chảo với 1 muỗng canh dầu ăn ở lửa vừa, phi thơm 10g hành tỏi băm rồi cho ${primaryIng.name.toLowerCase()} vào áp chảo/đảo săn đều hai mặt trong 5 phút cho vàng thơm.`,
        timerSeconds: 360,
        tipText: isBraised
          ? 'Khi đường vừa chuyển màu nâu cánh gián thì cho hành tỏi và thịt/cá vào đảo ngay để màu lên óng ả mà không bị đắng.'
          : 'Đảo trên lửa vừa giúp bề mặt nguyên liệu xém vàng thơm lừng mà bên trong vẫn giữ được độ mọng nước.',
      },
      {
        stepNumber: 4,
        phaseName: isBraised ? 'Kho liu riu thấm vị' : 'Chế biến chín mềm & Thấm sốt',
        instruction: `${
          secondaryIng
            ? `Xếp ${secondaryIng.amount}${secondaryIng.unit} ${secondaryIng.name.toLowerCase()} vào nồi cùng nguyên liệu chính, thêm `
            : 'Chế thêm '
        }150ml nước sôi (hoặc nước dừa tươi) xâm xấp mặt và nêm thêm 1 muỗng canh nước mắm. Đun sôi rồi hạ xuống lửa nhỏ liu riu trong 15–20 phút đến khi nguyên liệu chín mềm và nước sốt cạn bớt, sánh kẹo lại khoảng 1/3 ban đầu.`,
        timerSeconds: 1080,
        tipText: 'Luôn châm nước sôi (tuyệt đối không dùng nước lạnh) để không làm co thớ thịt hay gây tanh cá khi đang nấu.',
      },
      {
        stepNumber: 5,
        phaseName: 'Hoàn thành & Trình bày',
        instruction: `Kiểm tra thấy nước sốt đã sánh bóng bám đều nguyên liệu thì rắc 15g hành lá cắt khúc, vài lát ớt tươi và 1/2 muỗng cà phê tiêu xay lên mặt rồi tắt bếp. Dọn món ra đĩa/tộ dùng nóng với cơm trắng.`,
        timerSeconds: 60,
        tipText: 'Rưới phần nước sốt sánh đậm đà lên cơm nóng hoặc chấm kèm rau củ luộc rất bắt cơm.',
      },
    ];
  }

  return {
    role,
    prepTimeMinutes,
    cookTimeMinutes,
    shortDescription,
    ingredients,
    steps,
  };
}

export class MockHeuristicProvider implements AiProvider {
  readonly name = 'mock' as const;

  isAvailable(): boolean {
    return true; // Luôn sẵn sàng hoạt động
  }

  async generateCompletion(options: AiCompletionOptions): Promise<AiCompletionResult> {
    const promptLower = options.prompt.toLowerCase();

    // Giả lập thời gian xử lý nhanh (50ms)
    await new Promise((resolve) => setTimeout(resolve, 50));

    let responseText = '';

    if (options.jsonMode) {
      if (promptLower.includes('soạn thảo') || promptLower.includes('công thức') || promptLower.includes('recipe')) {
        // Trích xuất tên món nếu có
        let matchedName = 'Thịt ba chỉ kho tiêu đậm đà';
        const titleMatch = options.prompt.match(
          /(?:tên gợi ý\s*\/\s*tiêu đề gốc|tên món ăn|tên món|dish|công thức)(?:\s*:\s*|\s+cho\s+)?([^\n]+)/i
        );
        if (titleMatch && titleMatch[1]) {
          matchedName = titleMatch[1].trim();
        }

        const smartSpec = buildSmartVietnameseRecipeFromTitle(matchedName, options.prompt);

        responseText = JSON.stringify({
          name: matchedName,
          dishName: matchedName.replace(/\s*\([^)]*\)\s*/g, '').trim(),
          role: smartSpec.role,
          baseServings: 4,
          prepTimeMinutes: smartSpec.prepTimeMinutes,
          cookTimeMinutes: smartSpec.cookTimeMinutes,
          difficulty: 'Dễ',
          shortDescription: smartSpec.shortDescription,
          ingredients: smartSpec.ingredients,
          steps: smartSpec.steps,
        });
      } else if (promptLower.includes('mâm cơm') || promptLower.includes('meal') || promptLower.includes('gợi ý')) {
        responseText = JSON.stringify({
          rationale: 'Gợi ý mâm cơm gia đình cân bằng dinh dưỡng truyền thống dựa trên thuật toán heuristic.',
          mainSlug: 'thit-ba-chi-kho-tieu',
          soupSlug: 'canh-rau-ngot-thit-bam',
          sideSlug: 'rau-muong-xao-toi',
          recommendation: {
            mainSlug: 'thit-ba-chi-kho-tieu',
            mainName: 'Thịt ba chỉ kho tiêu đậm đà',
            soupSlug: 'canh-rau-ngot-thit-bam',
            soupName: 'Canh rau ngót thịt băm thanh mát',
            sideSlug: 'rau-muong-xao-toi',
            sideName: 'Rau muống xào tỏi giòn xanh',
          },
          matchingIngredients: ['thịt ba chỉ', 'rau ngót', 'rau muống'],
        });
      } else {
        responseText = JSON.stringify({
          status: 'success',
          message: 'Heuristic fallback processing complete',
          query: options.prompt.slice(0, 100),
        });
      }
    } else {
      responseText = `[ĂN GÌ MOM AI HEURISTIC] Gợi ý bữa cơm nhà thanh mát: Thịt ba chỉ kho tiêu kết hợp Canh rau ngót thịt băm và Rau muống xào tỏi.`;
    }

    return {
      text: responseText,
      provider: 'mock',
      model: 'angimom-heuristic-v1',
      tokensUsed: {
        promptTokens: Math.ceil(options.prompt.length / 4),
        completionTokens: Math.ceil(responseText.length / 4),
        totalTokens: Math.ceil((options.prompt.length + responseText.length) / 4),
      },
      isFallback: true,
    };
  }
}
