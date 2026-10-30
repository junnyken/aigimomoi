// API Quản trị Cấu hình AI & Khóa API (DeepSeek / Gemini / OpenAI) — CHỈ DÀNH RIÊNG CHO ADMIN
// Bảo mật theo chuẩn webapp-security:
// - Bắt buộc user.role === 'ADMIN'.
// - Bắt buộc kiểm tra CSRF (isCrossSiteRequest & isSameOrigin) và Rate Limit (checkRateLimitShared).
// - Tuyệt đối không bao giờ trả khóa API thô về client; chỉ trả trạng thái hasKey + chuỗi che (maskedKey).
// - Lưu trữ mã hóa AES-256-GCM xuống PostgreSQL & đĩa bền vững.

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { checkRateLimitShared, getClientIp } from '@/lib/auth/rateLimit';
import { isCrossSiteRequest, isSameOrigin } from '@/lib/http/sameOrigin';
import {
  getEffectiveAiConfig,
  saveStoredAiSettings,
  maskApiKey,
  type AiPrimaryOrder,
} from '@/lib/ai/configStore';
import { DeepSeekProvider } from '@/lib/ai/deepseekProvider';
import { GeminiProvider } from '@/lib/ai/geminiProvider';
import { OpenAiProvider } from '@/lib/ai/openaiProvider';
import { aiGateway } from '@/lib/ai/gateway';
import { logger } from '@/lib/logger';

const VALID_ORDERS: AiPrimaryOrder[] = ['DEEPSEEK_FIRST', 'GEMINI_FIRST', 'OPENAI_FIRST'];

function buildSafeResponsePayload(cfg: Awaited<ReturnType<typeof getEffectiveAiConfig>>) {
  const chainOrder =
    cfg.primaryOrder === 'GEMINI_FIRST'
      ? ['gemini', 'deepseek', 'openai']
      : cfg.primaryOrder === 'OPENAI_FIRST'
      ? ['openai', 'deepseek', 'gemini']
      : ['deepseek', 'gemini', 'openai'];

  return {
    primaryOrder: cfg.primaryOrder,
    activeChainOrder: chainOrder,
    providers: {
      deepseek: {
        hasKey: Boolean(cfg.deepseek.apiKey),
        maskedKey: maskApiKey(cfg.deepseek.apiKey),
        source: cfg.deepseek.source,
        model: cfg.deepseek.model,
        baseUrl: cfg.deepseek.baseUrl,
      },
      gemini: {
        hasKey: Boolean(cfg.gemini.apiKey),
        maskedKey: maskApiKey(cfg.gemini.apiKey),
        source: cfg.gemini.source,
        model: cfg.gemini.model,
      },
      openai: {
        hasKey: Boolean(cfg.openai.apiKey),
        maskedKey: maskApiKey(cfg.openai.apiKey),
        source: cfg.openai.source,
        model: cfg.openai.model,
      },
    },
    updatedAt: cfg.updatedAt || null,
    updatedByEmail: cfg.updatedByEmail || null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập Quản trị.' }, { status: 401 });
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Chỉ Quản trị viên tối cao (ADMIN) mới có quyền xem và cấu hình khóa AI.' },
        { status: 403 }
      );
    }

    const cfg = await getEffectiveAiConfig(true);
    return NextResponse.json(buildSafeResponsePayload(cfg), {
      headers: { 'Cache-Control': 'private, no-store, no-cache, must-revalidate' },
    });
  } catch (err) {
    logger.error('Failed to load AI settings for admin', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Không thể tải cấu hình AI lúc này.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (isCrossSiteRequest(request) || !isSameOrigin(request)) {
      return NextResponse.json(
        { error: 'Yêu cầu bị từ chối do khác nguồn gốc (CSRF).' },
        { status: 403 }
      );
    }

    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập Quản trị.' }, { status: 401 });
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Chỉ Quản trị viên tối cao (ADMIN) mới có quyền cập nhật khóa AI.' },
        { status: 403 }
      );
    }

    const rate = await checkRateLimitShared(
      'admin-ai-settings-write',
      `${user.id}:${getClientIp(request)}`,
      20,
      60_000
    );
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Thao tác lưu cấu hình quá nhanh. Vui lòng thử lại sau ít giây.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    await saveStoredAiSettings((curr) => {
      const next = { ...curr };

      if (
        typeof body.primaryOrder === 'string' &&
        VALID_ORDERS.includes(body.primaryOrder as AiPrimaryOrder)
      ) {
        next.primaryOrder = body.primaryOrder as AiPrimaryOrder;
      }

      // DeepSeek Key & Model
      if (body.clearDeepseekKey === true) {
        delete next.deepseekApiKey;
      } else if (typeof body.deepseekApiKey === 'string' && body.deepseekApiKey.trim().length > 0) {
        next.deepseekApiKey = body.deepseekApiKey.trim();
      }
      if (typeof body.deepseekModel === 'string' && body.deepseekModel.trim().length > 0) {
        next.deepseekModel = body.deepseekModel.trim().slice(0, 80);
      }
      if (typeof body.deepseekBaseUrl === 'string' && body.deepseekBaseUrl.trim().length > 0) {
        next.deepseekBaseUrl = body.deepseekBaseUrl.trim().slice(0, 150);
      }

      // Gemini Key & Model
      if (body.clearGeminiKey === true) {
        delete next.geminiApiKey;
      } else if (typeof body.geminiApiKey === 'string' && body.geminiApiKey.trim().length > 0) {
        next.geminiApiKey = body.geminiApiKey.trim();
      }
      if (typeof body.geminiModel === 'string' && body.geminiModel.trim().length > 0) {
        next.geminiModel = body.geminiModel.trim().slice(0, 80);
      }

      // OpenAI Key & Model
      if (body.clearOpenaiKey === true) {
        delete next.openaiApiKey;
      } else if (typeof body.openaiApiKey === 'string' && body.openaiApiKey.trim().length > 0) {
        next.openaiApiKey = body.openaiApiKey.trim();
      }
      if (typeof body.openaiModel === 'string' && body.openaiModel.trim().length > 0) {
        next.openaiModel = body.openaiModel.trim().slice(0, 80);
      }

      next.updatedAt = new Date().toISOString();
      next.updatedByEmail = user.email;
      return next;
    });

    const refreshed = await getEffectiveAiConfig(true);
    logger.info('Admin updated AI Gateway settings', {
      adminId: user.id,
      primaryOrder: refreshed.primaryOrder,
      hasDeepseek: Boolean(refreshed.deepseek.apiKey),
      hasGemini: Boolean(refreshed.gemini.apiKey),
    });

    return NextResponse.json({
      ok: true,
      message: 'Đã lưu cấu hình AI & mã hóa khóa API (AES-256-GCM) thành công!',
      ...buildSafeResponsePayload(refreshed),
    });
  } catch (err) {
    logger.error('Failed to update AI settings', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Không thể lưu cấu hình AI lúc này.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (isCrossSiteRequest(request) || !isSameOrigin(request)) {
      return NextResponse.json(
        { error: 'Yêu cầu bị từ chối do khác nguồn gốc (CSRF).' },
        { status: 403 }
      );
    }

    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập Quản trị.' }, { status: 401 });
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Chỉ Quản trị viên tối cao (ADMIN) mới có quyền kiểm tra kết nối AI.' },
        { status: 403 }
      );
    }

    const rate = await checkRateLimitShared(
      'admin-ai-settings-test',
      `${user.id}:${getClientIp(request)}`,
      15,
      60_000
    );
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Thao tác kiểm tra kết nối quá nhanh. Vui lòng đợi ít giây.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const targetProvider =
      body.provider === 'deepseek' || body.provider === 'gemini' || body.provider === 'openai'
        ? body.provider
        : 'auto';
    const overrideKey =
      typeof body.testApiKey === 'string' && body.testApiKey.trim().length > 0
        ? body.testApiKey.trim()
        : undefined;
    const overrideModel =
      typeof body.testModel === 'string' && body.testModel.trim().length > 0
        ? body.testModel.trim()
        : undefined;

    const cfg = await getEffectiveAiConfig(true);
    const startMs = Date.now();

    const testPrompt =
      'Trả lời đúng 1 câu tiếng Việt ngắn gọn dưới 25 từ: Xác nhận kết nối Đầu bếp AI Ăn Gì Mom thành công.';

    let result;
    if (targetProvider === 'deepseek') {
      const ds = new DeepSeekProvider(
        overrideKey || cfg.deepseek.apiKey,
        overrideModel || cfg.deepseek.model,
        cfg.deepseek.baseUrl
      );
      if (!ds.isAvailable()) {
        return NextResponse.json(
          { ok: false, error: 'Chưa có khóa DeepSeek API Key để kiểm tra. Hãy nhập khóa vào ô bên trên.' },
          { status: 400 }
        );
      }
      result = await ds.generateCompletion({
        prompt: testPrompt,
        maxTokens: 120,
        temperature: 0.2,
        timeoutMs: 15000,
      });
    } else if (targetProvider === 'gemini') {
      const gm = new GeminiProvider(
        overrideKey || cfg.gemini.apiKey,
        overrideModel || cfg.gemini.model
      );
      if (!gm.isAvailable()) {
        return NextResponse.json(
          { ok: false, error: 'Chưa có khóa Gemini API Key để kiểm tra.' },
          { status: 400 }
        );
      }
      result = await gm.generateCompletion({
        prompt: testPrompt,
        maxTokens: 120,
        temperature: 0.2,
        timeoutMs: 15000,
      });
    } else if (targetProvider === 'openai') {
      const oa = new OpenAiProvider(
        overrideKey || cfg.openai.apiKey,
        overrideModel || cfg.openai.model
      );
      if (!oa.isAvailable()) {
        return NextResponse.json(
          { ok: false, error: 'Chưa có khóa OpenAI API Key để kiểm tra.' },
          { status: 400 }
        );
      }
      result = await oa.generateCompletion({
        prompt: testPrompt,
        maxTokens: 120,
        temperature: 0.2,
        timeoutMs: 15000,
      });
    } else {
      result = await aiGateway.complete(
        {
          prompt: testPrompt,
          maxTokens: 120,
          temperature: 0.2,
          timeoutMs: 15000,
        },
        `admin-test-${user.id}`
      );
    }

    const latencyMs = Date.now() - startMs;
    return NextResponse.json({
      ok: true,
      provider: result.provider,
      model: result.model,
      isFallback: Boolean(result.isFallback),
      latencyMs,
      sampleReply: result.text.trim().slice(0, 220),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? `Không thể kết nối AI: ${err.message}`
            : 'Lỗi không xác định khi kiểm tra kết nối AI.',
      },
      { status: 400 }
    );
  }
}
