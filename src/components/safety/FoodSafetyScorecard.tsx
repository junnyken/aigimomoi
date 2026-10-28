'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Undo2,
  Info,
  Bot,
  Loader2,
  Lock,
} from 'lucide-react';
import type {
  FoodSafetyAuditInput,
  FoodSafetyAuditReport,
} from '@/lib/safety/foodSafetyAuditor';

interface AiDeepSafetyVerdict {
  aiVerdict: 'SAFE' | 'CAUTION' | 'DANGER';
  summaryForReviewer: string;
  toxicologyAndHygieneAnalysis: string;
  culinaryAccuracyAnalysis: string;
  shouldApprove: boolean;
  suggestedFixOrRejectionNote: string;
}

interface FoodSafetyScorecardProps {
  report: FoodSafetyAuditReport;
  recipePayload?: FoodSafetyAuditInput;
  mode?: 'admin' | 'contributor';
  onInjectSafetyTip?: (tip: string) => void;
  onApplyRejectionReason?: (reason: string) => void;
}

export function FoodSafetyScorecard({
  report,
  recipePayload,
  onInjectSafetyTip,
  onApplyRejectionReason,
}: FoodSafetyScorecardProps) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiDeepSafetyVerdict | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleRunAiAudit = async () => {
    if (!recipePayload) return;
    try {
      setAiLoading(true);
      setAiError(null);
      const res = await fetch('/api/editor/safety-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipePayload),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || 'Không thể gọi AI kiểm định lúc này.');
      } else if (data.aiDeepResult) {
        setAiResult(data.aiDeepResult);
      }
    } catch {
      setAiError('Lỗi kết nối khi gọi Chuyên gia AI Kiểm định.');
    } finally {
      setAiLoading(false);
    }
  };

  const effectiveVerdict =
    aiResult?.aiVerdict === 'DANGER' || report.verdict === 'DANGER'
      ? 'DANGER'
      : aiResult?.aiVerdict === 'CAUTION' || report.verdict === 'CAUTION'
      ? 'CAUTION'
      : 'SAFE';

  const isSafe = effectiveVerdict === 'SAFE';
  const isCaution = effectiveVerdict === 'CAUTION';
  const isDanger = effectiveVerdict === 'DANGER';

  const bannerTheme = isDanger
    ? 'bg-red-50 border-red-300 text-red-950'
    : isCaution
    ? 'bg-amber-50 border-amber-300 text-amber-950'
    : 'bg-emerald-50/80 border-emerald-300 text-emerald-950';

  const badgeTheme = isDanger
    ? 'bg-red-600 text-white'
    : isCaution
    ? 'bg-amber-600 text-white'
    : 'bg-[#3F6240] text-white';

  return (
    <section
      aria-label="Hồ sơ Kiểm định An toàn Thực phẩm & Chất lượng Công thức (Chỉ dành cho Người kiểm duyệt)"
      className={`rounded-2xl border-2 p-5 shadow-xs space-y-4 transition-all ${bannerTheme}`}
    >
      {/* Header Đèn Giao Thông */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-black/10 pb-3.5">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl shrink-0 ${badgeTheme}`}>
            {isDanger ? (
              <ShieldAlert className="w-6 h-6" />
            ) : isCaution ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <ShieldCheck className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/90 border border-black/10 text-[#3F6240]">
                <Lock className="w-3 h-3" />
                Chỉ hiển thị cho Người kiểm duyệt
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${badgeTheme}`}>
                An toàn: {report.safetyScore}/100
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white text-[#2D2A26] border border-black/15">
                Kỹ thuật nấu: {report.qualityScore}/100
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold mt-1.5">{report.headline}</h3>
            <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{report.adminGuidance}</p>
          </div>
        </div>

        {/* Nút thao tác nhanh cho Người kiểm duyệt */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {recipePayload && (
            <button
              type="button"
              onClick={handleRunAiAudit}
              disabled={aiLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#3F6240] to-[#2c472d] hover:from-[#324f33] hover:to-[#223823] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-60"
              title="Nhờ AI phân tích sâu độc tố sinh học, tương kỵ nguyên liệu và độ chuẩn công thức cho Người kiểm duyệt"
            >
              {aiLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Bot className="w-3.5 h-3.5 text-amber-200" />
              )}
              <span>{aiLoading ? 'AI đang phân tích...' : '🤖 AI Kiểm định Chuyên sâu'}</span>
            </button>
          )}

          {onInjectSafetyTip && report.recommendedSafetyTips.length > 0 && (
            <button
              type="button"
              onClick={() => onInjectSafetyTip(report.recommendedSafetyTips.join(' '))}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#FAF7F0] text-[#3F6240] border border-[#3F6240]/30 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              title="Tự động gắn lưu ý sơ chế khử độc / dinh dưỡng vào bước đầu tiên của công thức"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B75B35]" />
              <span>Tự động chèn Lưu ý An toàn</span>
            </button>
          )}

          {onApplyRejectionReason &&
            (aiResult?.suggestedFixOrRejectionNote || report.rejectionReasonTemplate) &&
            !isSafe && (
              <button
                type="button"
                onClick={() =>
                  onApplyRejectionReason(
                    aiResult?.suggestedFixOrRejectionNote || report.rejectionReasonTemplate!
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Điền sẵn lý do trả bài</span>
              </button>
            )}
        </div>
      </div>

      {/* Kết quả Phân tích Chuyên sâu từ AI dành riêng cho Kiểm duyệt viên */}
      {aiError && (
        <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-xs text-red-900 font-medium">
          {aiError}
        </div>
      )}

      {aiResult && (
        <div className="p-4 rounded-xl bg-white border-2 border-[#3F6240]/30 shadow-2xs space-y-2.5 text-xs text-[#2D2A26]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EADBC8] pb-2">
            <span className="font-bold text-[#3F6240] inline-flex items-center gap-1.5 text-xs sm:text-sm">
              <Bot className="w-4 h-4 text-[#B75B35]" />
              Kết luận của Chuyên gia AI cho Người kiểm duyệt:
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                aiResult.shouldApprove
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-red-100 text-red-900 border border-red-300'
              }`}
            >
              {aiResult.shouldApprove
                ? '✓ AI Khuyến nghị: An toàn để Phê duyệt'
                : '⚠️ AI Khuyến nghị: Cần chỉnh sửa / Từ chối'}
            </span>
          </div>

          <p className="font-semibold text-[#2D2A26] leading-relaxed">
            {aiResult.summaryForReviewer}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            <div className="p-2.5 rounded-lg bg-[#FAF7F0] border border-[#EADBC8]">
              <strong className="text-[#3F6240] block mb-0.5">
                🔬 Đánh giá Độc tố, Tương kỵ &amp; An toàn cơ thể:
              </strong>
              <span className="text-[#5C4A3A] leading-relaxed">
                {aiResult.toxicologyAndHygieneAnalysis}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#FAF7F0] border border-[#EADBC8]">
              <strong className="text-[#3F6240] block mb-0.5">
                🍳 Đánh giá Định lượng &amp; Kỹ thuật công thức:
              </strong>
              <span className="text-[#5C4A3A] leading-relaxed">
                {aiResult.culinaryAccuracyAnalysis}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5 Chốt Kiểm định Chi tiết */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {report.checks.map((chk) => {
          const itemStyle =
            chk.level === 'DANGER'
              ? 'bg-white border-red-300 text-red-950'
              : chk.level === 'CAUTION'
              ? 'bg-white border-amber-300 text-amber-950'
              : 'bg-white/90 border-emerald-200 text-[#2D2A26]';

          return (
            <div
              key={chk.id}
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${itemStyle}`}
            >
              {chk.level === 'DANGER' ? (
                <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              ) : chk.level === 'CAUTION' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 flex-1">
                <div className="font-bold">{chk.title}</div>
                <p className="text-[11px] opacity-85 leading-relaxed">{chk.detail}</p>
                {chk.recommendation && (
                  <p className="text-[11px] font-semibold text-[#B75B35] pt-0.5">
                    💡 Khuyến nghị: {chk.recommendation}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Nhãn cảnh báo Dị ứng & Lưu ý tự động */}
      {report.allergens.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/10 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold inline-flex items-center gap-1 text-[11px]">
              <Info className="w-3.5 h-3.5" /> Nhãn lưu ý cơ địa dị ứng phát hiện trong món:
            </span>
            {report.allergens.map((al) => (
              <span
                key={al.key}
                title={al.note}
                className="px-2 py-0.5 rounded-full bg-white border border-black/15 text-[11px] font-semibold text-[#5C4A3A]"
              >
                ⚠️ {al.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
