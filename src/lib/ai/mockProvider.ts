// AG-27: Mock / Heuristic AI Provider
// Cung cấp giải pháp Fallback an toàn (Graceful Degradation - Invariants Gate P4)
// Hoạt động độc lập không cần internet hoặc API key bên ngoài.

import type { AiProvider, AiCompletionOptions, AiCompletionResult } from './types';

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
        let matchedName = 'Món ăn gia đình gợi ý';
        const titleMatch = options.prompt.match(/(?:tên món|dish|món ăn|công thức)(?:\s*:\s*|\s+cho\s+)?([^\n,.]+)/i);
        if (titleMatch && titleMatch[1]) {
          matchedName = titleMatch[1].trim();
        }

        let detectedRole: 'MAIN' | 'SOUP' | 'SIDE' = 'MAIN';
        if (matchedName.toLowerCase().includes('canh')) {
          detectedRole = 'SOUP';
        } else if (matchedName.toLowerCase().includes('rau') || matchedName.toLowerCase().includes('xào') || matchedName.toLowerCase().includes('gỏi')) {
          detectedRole = 'SIDE';
        }

        responseText = JSON.stringify({
          name: matchedName,
          dishName: matchedName,
          role: detectedRole,
          baseServings: 4,
          prepTimeMinutes: 15,
          cookTimeMinutes: 25,
          difficulty: 'Dễ',
          shortDescription: `Món ${matchedName} chuẩn vị cơm nhà truyền thống, thơm ngon, đậm đà và giàu dinh dưỡng.`,
          ingredients: [
            { name: 'Nguyên liệu chính', amount: 400, unit: 'g', scalePolicy: 'LINEAR', preparation: 'Rửa sạch, cắt miếng vừa ăn', isOptional: false },
            { name: 'Hành tím', amount: 3, unit: 'củ', scalePolicy: 'LINEAR', preparation: 'Bóc vỏ, băm nhỏ', isOptional: false },
            { name: 'Hành lá', amount: 2, unit: 'nhánh', scalePolicy: 'FIXED', preparation: 'Rửa sạch, cắt khúc 2cm', isOptional: false },
            { name: 'Nước mắm', amount: 2, unit: 'muỗng canh', scalePolicy: 'MANUAL_ADJUST', preparation: '', isOptional: false },
            { name: 'Tiêu xay', amount: 0.5, unit: 'muỗng cà phê', scalePolicy: 'MANUAL_ADJUST', preparation: '', isOptional: true },
          ],
          steps: [
            { stepNumber: 1, phaseName: 'Sơ chế', instruction: `Sơ chế sạch các nguyên liệu cho món ${matchedName}, ướp gia vị trong 15 phút.`, timerSeconds: 900, tipText: 'Ướp trước giúp nguyên liệu thấm đều gia vị.' },
            { stepNumber: 2, phaseName: 'Chế biến', instruction: 'Bắc chảo hoặc nồi lên bếp, phi thơm hành rồi nấu chín với lửa vừa cho đến khi dậy mùi thơm.', timerSeconds: 1200, tipText: 'Nấu lửa vừa giúp món ăn chín đều mà không bị cháy.' },
            { stepNumber: 3, phaseName: 'Hoàn thành', instruction: 'Rắc hành lá, tiêu xay lên trên và múc ra đĩa, dùng nóng với cơm trắng.', timerSeconds: 0, tipText: 'Thưởng thức ngay khi còn nóng để cảm nhận trọn vẹn hương vị.' },
          ],
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
