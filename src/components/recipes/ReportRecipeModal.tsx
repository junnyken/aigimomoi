'use client';

import { useState } from 'react';
import { Flag, X, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface ReportRecipeModalProps {
  recipeId: number;
  recipeName: string;
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_REASONS = [
  { value: 'UNSAFE_FOOD', label: 'Nguy cơ an toàn thực phẩm / Kết hợp kỵ món' },
  { value: 'INCORRECT_RECIPE', label: 'Sai lệch định lượng hoặc thiếu bước nấu quan trọng' },
  { value: 'COPYRIGHT', label: 'Vi phạm bản quyền hình ảnh hoặc nội dung' },
  { value: 'INAPPROPRIATE', label: 'Ngôn từ phản cảm, quấy rối hoặc quảng cáo rác' },
  { value: 'OTHER', label: 'Lý do khác' },
];

export function ReportRecipeModal({
  recipeId,
  recipeName,
  isOpen,
  onClose,
}: ReportRecipeModalProps) {
  const [reason, setReason] = useState('UNSAFE_FOOD');
  const [details, setDetails] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/recipes/${recipeId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          details: details.trim() || undefined,
          reporterEmail: reporterEmail.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể gửi báo cáo vi phạm.');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDetails('');
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#EADBC8] relative overflow-hidden">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-2 rounded-full hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-8 space-y-3">
            <CheckCircle className="w-16 h-16 text-[#3F6240] mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-[#2A1810]">Đã gửi báo cáo thành công</h3>
            <p className="text-sm text-stone-600 max-w-xs mx-auto">
              Cảm ơn bạn đã đồng hành giữ gìn chất lượng bữa cơm gia đình cùng Ăn Gì Mom!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 border-b border-[#F3E9DD] pb-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2A1810]">Báo cáo công thức vi phạm</h3>
                <p className="text-xs text-stone-500 line-clamp-1">{recipeName}</p>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#5C4A3A]">
                Lý do báo cáo <span className="text-red-500">*</span>
              </label>
              <div className="space-y-1.5">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                      reason === r.value
                        ? 'border-[#3F6240] bg-[#3F6240]/5 font-semibold text-[#2A1810]'
                        : 'border-[#EADBC8] hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={(e) => setReason(e.target.value)}
                      className="accent-[#3F6240]"
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">
                Chi tiết phản ánh (tùy chọn)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Mô tả cụ thể vấn đề hoặc trích dẫn đoạn vi phạm để ban biên tập dễ xác minh..."
                rows={3}
                maxLength={2000}
                className="w-full text-xs rounded-xl border border-[#EADBC8] p-3 focus:outline-none focus:border-[#3F6240] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">
                Email của bạn (tùy chọn, để nhận phản hồi)
              </label>
              <input
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-xs rounded-xl border border-[#EADBC8] px-3 py-2 focus:outline-none focus:border-[#3F6240] transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F3E9DD]">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <Flag className="w-3.5 h-3.5" />
                    <span>Gửi báo cáo</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
