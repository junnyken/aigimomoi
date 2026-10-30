'use client';

import React, { useState, useEffect } from 'react';
import { AdminTopNav } from '@/components/editor/AdminTopNav';
import {
  Sparkles,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Save,
  Trash2,
  Eye,
  EyeOff,
  ArrowRight,
  Cpu,
  Lock,
} from 'lucide-react';

type AiPrimaryOrder = 'DEEPSEEK_FIRST' | 'GEMINI_FIRST' | 'OPENAI_FIRST';

interface ProviderStatus {
  hasKey: boolean;
  maskedKey: string;
  source: 'ADMIN_CONFIG' | 'ENV' | 'NONE';
  model: string;
  baseUrl?: string;
}

interface AiSettingsResponse {
  primaryOrder: AiPrimaryOrder;
  activeChainOrder: string[];
  providers: {
    deepseek: ProviderStatus;
    gemini: ProviderStatus;
    openai: ProviderStatus;
  };
  updatedAt: string | null;
  updatedByEmail: string | null;
}

interface TestConnectionResult {
  ok: boolean;
  provider?: string;
  model?: string;
  latencyMs?: number;
  sampleReply?: string;
  error?: string;
}

export default function AdminAiSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [forbiddenError, setForbiddenError] = useState<string | null>(null);

  const [primaryOrder, setPrimaryOrder] = useState<AiPrimaryOrder>('DEEPSEEK_FIRST');
  const [providers, setProviders] = useState<AiSettingsResponse['providers']>({
    deepseek: { hasKey: false, maskedKey: '', source: 'NONE', model: 'deepseek-chat', baseUrl: 'https://api.deepseek.com' },
    gemini: { hasKey: false, maskedKey: '', source: 'NONE', model: 'gemini-2.5-flash' },
    openai: { hasKey: false, maskedKey: '', source: 'NONE', model: 'gpt-4o-mini' },
  });
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [updatedByEmail, setUpdatedByEmail] = useState<string | null>(null);

  // Input khóa mới (chỉ gửi lên khi người dùng nhập mới)
  const [deepseekInputKey, setDeepseekInputKey] = useState('');
  const [deepseekModel, setDeepseekModel] = useState('deepseek-chat');
  const [showDeepseekKey, setShowDeepseekKey] = useState(false);

  const [geminiInputKey, setGeminiInputKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  const [openaiInputKey, setOpenaiInputKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);

  const [bannerMsg, setBannerMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestConnectionResult>>({});

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/editor/ai-settings');
      const data = await res.json();
      if (!res.ok) {
        setForbiddenError(data.error || 'Bạn không có quyền truy cập trang cấu hình AI.');
        return;
      }
      setPrimaryOrder(data.primaryOrder || 'DEEPSEEK_FIRST');
      setProviders(data.providers);
      setDeepseekModel(data.providers.deepseek?.model || 'deepseek-chat');
      setGeminiModel(data.providers.gemini?.model || 'gemini-2.5-flash');
      setOpenaiModel(data.providers.openai?.model || 'gpt-4o-mini');
      setUpdatedAt(data.updatedAt);
      setUpdatedByEmail(data.updatedByEmail);
    } catch {
      setBannerMsg({ type: 'error', text: 'Không thể kết nối máy chủ để tải cấu hình AI.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (extraPayload?: Record<string, unknown>) => {
    try {
      setSaving(true);
      setBannerMsg(null);

      const payload: Record<string, unknown> = {
        primaryOrder,
        deepseekModel,
        geminiModel,
        openaiModel,
        ...(deepseekInputKey.trim() ? { deepseekApiKey: deepseekInputKey.trim() } : {}),
        ...(geminiInputKey.trim() ? { geminiApiKey: geminiInputKey.trim() } : {}),
        ...(openaiInputKey.trim() ? { openaiApiKey: openaiInputKey.trim() } : {}),
        ...extraPayload,
      };

      const res = await fetch('/api/editor/ai-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setBannerMsg({ type: 'error', text: data.error || 'Không thể lưu cấu hình AI.' });
        return;
      }

      setPrimaryOrder(data.primaryOrder);
      setProviders(data.providers);
      setUpdatedAt(data.updatedAt);
      setUpdatedByEmail(data.updatedByEmail);
      setDeepseekInputKey('');
      setGeminiInputKey('');
      setOpenaiInputKey('');
      setBannerMsg({
        type: 'success',
        text: data.message || 'Đã lưu cấu hình AI & mã hóa khóa AES-256-GCM thành công!',
      });
    } catch {
      setBannerMsg({ type: 'error', text: 'Lỗi kết nối khi lưu cấu hình AI.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (provider: 'deepseek' | 'gemini' | 'openai' | 'auto') => {
    try {
      setTestingProvider(provider);
      setTestResults((prev) => {
        const copy = { ...prev };
        delete copy[provider];
        return copy;
      });

      const testApiKey =
        provider === 'deepseek'
          ? deepseekInputKey.trim() || undefined
          : provider === 'gemini'
          ? geminiInputKey.trim() || undefined
          : provider === 'openai'
          ? openaiInputKey.trim() || undefined
          : undefined;

      const testModel =
        provider === 'deepseek'
          ? deepseekModel
          : provider === 'gemini'
          ? geminiModel
          : provider === 'openai'
          ? openaiModel
          : undefined;

      const res = await fetch('/api/editor/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          testApiKey,
          testModel,
        }),
      });
      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [provider]: data,
      }));
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [provider]: { ok: false, error: 'Lỗi mạng khi gọi kiểm tra kết nối.' },
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const sourceBadge = (source: ProviderStatus['source'], hasKey: boolean) => {
    if (!hasKey) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[11px] font-bold border border-stone-200">
          Chưa cài khóa
        </span>
      );
    }
    if (source === 'ADMIN_CONFIG') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Đã lưu trong Admin (Mã hóa AES-256)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold border border-blue-200">
        <ShieldCheck className="w-3.5 h-3.5" />
        Đang dùng từ Biến môi trường Server
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#2D2A26] pb-16">
      <AdminTopNav
        title="Trung Tâm Kết Nối AI (DeepSeek · Gemini · OpenAI)"
        subtitle="Quản lý khóa API mã hóa AES-256-GCM và thiết lập chế độ Song kiếm hợp bích (AI số 1 + AI dự phòng)"
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {forbiddenError ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-900 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
            <div>
              <h2 className="font-bold text-base">Từ chối truy cập</h2>
              <p className="text-sm">{forbiddenError}</p>
            </div>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-2xl border border-[#EADBC8] p-8 text-center text-sm text-[#7C6A59]">
            Đang tải cấu hình AI bảo mật...
          </div>
        ) : (
          <>
            {/* Banner thông báo bảo mật */}
            <div className="bg-gradient-to-r from-[#1E3A2F] via-[#2D4F3E] to-[#3F6240] rounded-2xl p-5 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-emerald-100 text-[11px] font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  BẢO MẬT CẤP ĐỘ QUẢN TRỊ VIÊN (AES-256-GCM)
                </div>
                <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  Kết nối DeepSeek & Gemini — Nâng cấp Trí tuệ Đầu bếp & Kiểm định An toàn
                </h2>
                <p className="text-xs text-emerald-100/90 max-w-2xl">
                  Khóa API bạn nhập tại đây được mã hóa chuẩn <strong>AES-256-GCM</strong> trên máy chủ và lưu vào CSDL PostgreSQL.
                  Sau khi lưu, khóa không bao giờ hiển thị lại dạng văn bản thô để chống lộ lọt tuyệt đối.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleTestConnection('auto')}
                disabled={testingProvider === 'auto'}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-extrabold transition-all shadow-xs cursor-pointer shrink-0 disabled:opacity-60"
              >
                <Zap className="w-4 h-4" />
                <span>{testingProvider === 'auto' ? 'Đang gọi AI...' : '⚡ Test Chuỗi AI Đang Chạy'}</span>
              </button>
            </div>

            {testResults.auto && (
              <div
                className={`rounded-2xl p-4 border text-xs ${
                  testResults.auto.ok
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {testResults.auto.ok ? (
                  <div className="space-y-1">
                    <div className="font-extrabold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>
                        Chuỗi AI phản hồi thành công qua <strong>{testResults.auto.provider?.toUpperCase()}</strong> ({testResults.auto.model}) — Tốc độ: {testResults.auto.latencyMs}ms
                      </span>
                    </div>
                    <p className="text-emerald-800 italic">&ldquo;{testResults.auto.sampleReply}&rdquo;</p>
                  </div>
                ) : (
                  <div className="font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>{testResults.auto.error}</span>
                  </div>
                )}
              </div>
            )}

            {bannerMsg && (
              <div
                className={`rounded-2xl p-4 border text-sm font-bold flex items-center justify-between ${
                  bannerMsg.type === 'success'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {bannerMsg.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <span>{bannerMsg.text}</span>
                </div>
              </div>
            )}

            {/* PHẦN 1: CHỌN THỨ TỰ ƯU TIÊN AI (CHẾ ĐỘ SONG KIẾM HỢP BÍCH) */}
            <section className="bg-white rounded-2xl border border-[#EADBC8] p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-[#2F4F30] flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-[#B75B35]" />
                    1. Chọn Chế độ Ưu tiên AI (Tự động chuyển đổi dự phòng 0 giây)
                  </h3>
                  <p className="text-xs text-[#7C6A59] mt-0.5">
                    Nếu AI số 1 bận hoặc hết hạn mức, hệ thống tự động chuyển ngay sang AI số 2 mà không làm gián đoạn việc tạo công thức hay kiểm duyệt.
                  </p>
                </div>
                {updatedAt && (
                  <span className="text-[11px] text-[#7C6A59] bg-[#FAF7F0] px-3 py-1 rounded-xl border border-[#EADBC8]">
                    Cập nhật gần nhất: {new Date(updatedAt).toLocaleString('vi-VN')} {updatedByEmail ? `(${updatedByEmail})` : ''}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => setPrimaryOrder('DEEPSEEK_FIRST')}
                  className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    primaryOrder === 'DEEPSEEK_FIRST'
                      ? 'border-[#3F6240] bg-emerald-50/70 shadow-xs'
                      : 'border-[#E5DAC8] bg-[#FAF7F0] hover:border-[#B75B35]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-900 bg-indigo-100 px-2.5 py-0.5 rounded-full border border-indigo-200">
                      ⭐ Khuyên dùng khi có DeepSeek
                    </span>
                    {primaryOrder === 'DEEPSEEK_FIRST' && (
                      <CheckCircle2 className="w-5 h-5 text-[#3F6240]" />
                    )}
                  </div>
                  <div className="font-extrabold text-sm text-[#2D2A26] flex items-center gap-1.5">
                    <span>DeepSeek (Số 1 - Chính)</span>
                    <ArrowRight className="w-4 h-4 text-[#7C6A59]" />
                    <span>Gemini (Số 2 - Dự phòng)</span>
                  </div>
                  <p className="text-xs text-[#5C4A3A] mt-1">
                    Ưu tiên dùng <strong>DeepSeek-V3 (`deepseek-chat`)</strong> để viết công thức tiếng Việt 4–6 giai đoạn cực chi tiết và phân tích độc chất học sâu; dùng <strong>Gemini</strong> làm lá chắn dự phòng.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPrimaryOrder('GEMINI_FIRST')}
                  className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    primaryOrder === 'GEMINI_FIRST'
                      ? 'border-[#3F6240] bg-emerald-50/70 shadow-xs'
                      : 'border-[#E5DAC8] bg-[#FAF7F0] hover:border-[#B75B35]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                      ⚡ Tốc độ phản hồi nhanh
                    </span>
                    {primaryOrder === 'GEMINI_FIRST' && (
                      <CheckCircle2 className="w-5 h-5 text-[#3F6240]" />
                    )}
                  </div>
                  <div className="font-extrabold text-sm text-[#2D2A26] flex items-center gap-1.5">
                    <span>Gemini (Số 1 - Chính)</span>
                    <ArrowRight className="w-4 h-4 text-[#7C6A59]" />
                    <span>DeepSeek (Số 2 - Dự phòng)</span>
                  </div>
                  <p className="text-xs text-[#5C4A3A] mt-1">
                    Ưu tiên gọi <strong>Google Gemini</strong> trước để lấy tốc độ nhanh, và tự động chuyển sang <strong>DeepSeek</strong> ngay khi Gemini chạm giới hạn hoặc quá tải.
                  </p>
                </button>
              </div>
            </section>

            {/* PHẦN 2: CẤU HÌNH KHÓA DEEPSEEK API KEY */}
            <section className="bg-white rounded-2xl border-2 border-indigo-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-2xs">
                    DS
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-indigo-950">
                      2. Cấu hình DeepSeek AI (`api.deepseek.com`)
                    </h3>
                    <p className="text-xs text-[#7C6A59]">
                      Nhập API Key từ <code className="bg-stone-100 px-1.5 py-0.5 rounded">platform.deepseek.com</code> (bắt đầu bằng <code className="bg-stone-100 px-1.5 py-0.5 rounded">sk-...</code>)
                    </p>
                  </div>
                </div>
                {sourceBadge(providers.deepseek.source, providers.deepseek.hasKey)}
              </div>

              {providers.deepseek.hasKey && (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50/70 border border-indigo-200 rounded-xl px-4 py-3 text-xs">
                  <div className="flex items-center gap-2 text-indigo-950">
                    <KeyRound className="w-4 h-4 text-indigo-700" />
                    <span>Khóa hiện tại đang hoạt động:</span>
                    <code className="font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-indigo-200 text-indigo-900">
                      {providers.deepseek.maskedKey}
                    </code>
                  </div>
                  {providers.deepseek.source === 'ADMIN_CONFIG' && (
                    <button
                      type="button"
                      onClick={() => handleSave({ clearDeepseekKey: true })}
                      disabled={saving}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa khóa đã lưu</span>
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-[#2D2A26]">
                    {providers.deepseek.hasKey
                      ? 'Nhập DeepSeek API Key mới (Để trống nếu giữ nguyên khóa hiện tại)'
                      : 'Nhập DeepSeek API Key (sk-...)'}
                  </label>
                  <div className="relative">
                    <input
                      type={showDeepseekKey ? 'text' : 'password'}
                      value={deepseekInputKey}
                      onChange={(e) => setDeepseekInputKey(e.target.value)}
                      placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      autoComplete="off"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#D8C7B0] bg-[#FAF7F0] text-sm font-mono focus:outline-none focus:border-indigo-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeepseekKey((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C6A59] hover:text-[#2D2A26] cursor-pointer"
                      title={showDeepseekKey ? 'Ẩn khóa' : 'Hiện khóa'}
                    >
                      {showDeepseekKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2D2A26]">
                    Model DeepSeek
                  </label>
                  <select
                    value={deepseekModel}
                    onChange={(e) => setDeepseekModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B0] bg-[#FAF7F0] text-sm font-semibold focus:outline-none focus:border-indigo-600"
                  >
                    <option value="deepseek-chat">deepseek-chat (DeepSeek-V3 — Nhanh & Chuẩn JSON)</option>
                    <option value="deepseek-reasoner">deepseek-reasoner (DeepSeek-R1 — Suy luận sâu)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleTestConnection('deepseek')}
                  disabled={testingProvider === 'deepseek'}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
                >
                  <Zap className="w-4 h-4 text-indigo-700" />
                  <span>
                    {testingProvider === 'deepseek'
                      ? 'Đang kiểm tra kết nối DeepSeek...'
                      : '⚡ Kiểm tra kết nối DeepSeek ngay'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3F6240] hover:bg-[#324f33] text-white text-xs font-extrabold transition-all shadow-xs cursor-pointer disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Đang mã hóa & lưu...' : 'Lưu Cấu Hình DeepSeek & Thứ Tự AI'}</span>
                </button>
              </div>

              {testResults.deepseek && (
                <div
                  className={`rounded-xl p-3.5 border text-xs ${
                    testResults.deepseek.ok
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  {testResults.deepseek.ok ? (
                    <div className="space-y-1">
                      <div className="font-extrabold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>
                          Kết nối DeepSeek ({testResults.deepseek.model}) THÀNH CÔNG! Thời gian phản hồi: {testResults.deepseek.latencyMs}ms
                        </span>
                      </div>
                      <p className="italic text-emerald-800">&ldquo;{testResults.deepseek.sampleReply}&rdquo;</p>
                    </div>
                  ) : (
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>{testResults.deepseek.error}</span>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* PHẦN 3: CẤU HÌNH GOOGLE GEMINI & OPENAI DỰ PHÒNG */}
            <section className="bg-white rounded-2xl border border-[#EADBC8] p-5 sm:p-6 shadow-2xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-[#2F4F30]">
                    3. Cấu hình Google Gemini & OpenAI (Đồng hành / Dự phòng)
                  </h3>
                  <p className="text-xs text-[#7C6A59]">
                    Nếu máy chủ đã có sẵn biến môi trường <code className="bg-stone-100 px-1 rounded">GEMINI_API_KEY</code>, bạn không cần nhập lại trừ khi muốn thay bằng khóa mới.
                  </p>
                </div>
                {sourceBadge(providers.gemini.source, providers.gemini.hasKey)}
              </div>

              {providers.gemini.hasKey && (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-50/60 border border-emerald-200 rounded-xl px-4 py-2.5 text-xs">
                  <div className="flex items-center gap-2 text-emerald-950">
                    <KeyRound className="w-4 h-4 text-emerald-700" />
                    <span>Khóa Gemini đang hoạt động:</span>
                    <code className="font-mono font-bold bg-white px-2.5 py-0.5 rounded border border-emerald-200">
                      {providers.gemini.maskedKey}
                    </code>
                  </div>
                  {providers.gemini.source === 'ADMIN_CONFIG' && (
                    <button
                      type="button"
                      onClick={() => handleSave({ clearGeminiKey: true })}
                      disabled={saving}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa khóa riêng (về mặc định Server)</span>
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-[#2D2A26]">
                    Ghi đè Google Gemini API Key (Tùy chọn — Để trống nếu dùng khóa mặc định của Server)
                  </label>
                  <div className="relative">
                    <input
                      type={showGeminiKey ? 'text' : 'password'}
                      value={geminiInputKey}
                      onChange={(e) => setGeminiInputKey(e.target.value)}
                      placeholder="AIzaSy..."
                      autoComplete="off"
                      className="w-full px-3.5 py-2 pr-10 rounded-xl border border-[#D8C7B0] bg-[#FAF7F0] text-sm font-mono focus:outline-none focus:border-[#3F6240]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C6A59] hover:text-[#2D2A26] cursor-pointer"
                    >
                      {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2D2A26]">
                    Model Gemini
                  </label>
                  <select
                    value={geminiModel}
                    onChange={(e) => setGeminiModel(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#D8C7B0] bg-[#FAF7F0] text-sm font-semibold focus:outline-none focus:border-[#3F6240]"
                  >
                    <option value="gemini-2.5-flash">gemini-2.5-flash (Cân bằng & Mạnh mẽ)</option>
                    <option value="gemini-2.5-pro">gemini-2.5-pro (Chuyên sâu)</option>
                    <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Siêu tốc)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleTestConnection('gemini')}
                  disabled={testingProvider === 'gemini'}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FAF7F0] hover:bg-emerald-50 text-[#2F4F30] border border-[#D8C7B0] text-xs font-bold transition-colors cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{testingProvider === 'gemini' ? 'Đang kiểm tra...' : 'Test kết nối Gemini'}</span>
                </button>
              </div>

              {testResults.gemini && (
                <div
                  className={`rounded-xl p-3 border text-xs ${
                    testResults.gemini.ok
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  {testResults.gemini.ok ? (
                    <span>
                      ✅ Kết nối Gemini ({testResults.gemini.model}) thành công ({testResults.gemini.latencyMs}ms): &ldquo;{testResults.gemini.sampleReply}&rdquo;
                    </span>
                  ) : (
                    <span>❌ {testResults.gemini.error}</span>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
