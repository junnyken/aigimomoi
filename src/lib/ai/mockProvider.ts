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
      if (promptLower.includes('gợi ý mâm cơm') || promptLower.includes('meal') || promptLower.includes('món ăn')) {
        responseText = JSON.stringify({
          rationale: 'Gợi ý mâm cơm gia đình cân bằng dinh dưỡng truyền thống dựa trên thuật toán heuristic.',
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
      } else if (promptLower.includes('soạn thảo') || promptLower.includes('công thức')) {
        responseText = JSON.stringify({
          name: 'Món ăn gia đình gợi ý',
          role: 'MAIN',
          prepTimeMinutes: 15,
          cookTimeMinutes: 20,
          difficulty: 'Dễ',
          shortDescription: 'Món ăn gia đình thơm ngon đậm đà do trợ lý bếp nhà chuẩn hóa.',
          ingredients: [
            { name: 'Thịt nạc heo', amount: 300, unit: 'g', scalePolicy: 'LINEAR' },
            { name: 'Hành tím', amount: 2, unit: 'củ', scalePolicy: 'LINEAR' },
            { name: 'Nước mắm', amount: 1, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
          ],
          steps: [
            { stepNumber: 1, phaseName: 'Sơ chế', instruction: 'Rửa sạch thịt và thái miếng vừa ăn.', timerSeconds: 300 },
            { stepNumber: 2, phaseName: 'Chế biến', instruction: 'Phi thơm hành rồi đảo thịt chín vàng đều.', timerSeconds: 600 },
          ],
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
