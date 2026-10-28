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
function buildSmartVietnameseRecipeFromTitle(
  dishName: string,
  promptText: string
): {
  role: 'MAIN' | 'SOUP' | 'SIDE';
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  shortDescription: string;
  ingredients: HeuristicIngredientSpec[];
  steps: Array<{
    stepNumber: number;
    phaseName: 'Sơ chế' | 'Chế biến' | 'Hoàn thành';
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
      amount: 2,
      unit: 'muỗng canh',
      scalePolicy: 'MANUAL_ADJUST',
      preparation: '',
      isOptional: false,
    },
    {
      name: 'Dầu ăn thực vật',
      amount: 1,
      unit: 'muỗng canh',
      scalePolicy: 'FIXED',
      preparation: '',
      isOptional: false,
    }
  );

  const mainIngNames = ingredients
    .slice(0, 2)
    .map((i) => i.name.toLowerCase())
    .join(' kết hợp cùng ');

  const prepTimeMinutes = role === 'SIDE' ? 10 : 15;
  const cookTimeMinutes = role === 'SIDE' ? 10 : role === 'SOUP' ? 18 : 25;

  const shortDescription = `Công thức ${dishName} chuẩn vị cơm nhà Việt Nam, kết hợp hài hòa từ ${mainIngNames}, giàu dinh dưỡng và dễ thực hiện mỗi ngày.`;

  const steps: Array<{
    stepNumber: number;
    phaseName: 'Sơ chế' | 'Chế biến' | 'Hoàn thành';
    instruction: string;
    timerSeconds: number;
    tipText: string;
  }> = [
    {
      stepNumber: 1,
      phaseName: 'Sơ chế',
      instruction: `Sơ chế sạch sẽ ${mainIngNames} với nước muối loãng rồi để ráo. Ướp nguyên liệu chính với hành tỏi băm và 1 muỗng canh nước mắm trong 15 phút cho thấm vị.`,
      timerSeconds: 900,
      tipText: 'Thấm khô bề mặt nguyên liệu trước khi ướp giúp gia vị rút sâu và khi nấu không bị ra nước.',
    },
    {
      stepNumber: 2,
      phaseName: 'Chế biến',
      instruction:
        role === 'SOUP'
          ? `Phi thơm hành tím với chút dầu ăn, cho nguyên liệu vào xào săn rồi chế 1 lít nước sôi. Đun sôi và hớt sạch bọt trên lửa vừa khoảng 12–15 phút cho nước canh ngọt thanh.`
          : role === 'SIDE'
          ? `Đun nóng chảo trên lửa lớn, phi thơm tỏi băm rồi cho nguyên liệu vào đảo nhanh tay 3–5 phút để giữ trọn độ giòn ngọt và màu xanh tự nhiên.`
          : `Phi thơm hành tỏi trên chảo/nồi, cho nguyên liệu chính vào đảo săn đều hai mặt, sau đó hạ lửa vừa rim/nấu chín trong 15–20 phút cho nước sốt sánh quyện đậm đà.`,
      timerSeconds: role === 'SIDE' ? 300 : 1080,
      tipText:
        role === 'SOUP'
          ? 'Chế nước sôi và hớt bọt kỹ giúp nước canh trong veo, ngọt tự nhiên.'
          : 'Canh nhiệt độ lửa phù hợp giúp món ăn chín mềm mọng mà không bị khô.',
    },
    {
      stepNumber: 3,
      phaseName: 'Hoàn thành',
      instruction: `Nếm lại gia vị cho vừa khẩu vị gia đình, rắc hành lá thái nhỏ và chút tiêu xay lên trên rồi bày ra đĩa/tô thưởng thức nóng cùng cơm trắng.`,
      timerSeconds: 60,
      tipText: 'Dọn kèm chén nước mắm ớt tươi để bữa cơm gia đình thêm tròn vị.',
    },
  ];

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
