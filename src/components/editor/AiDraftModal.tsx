'use client';

// AG-29: AI Recipe Authoring Assistant Modal
// Cho phép Biên tập viên tạo nhanh khung công thức chuẩn mực từ tên món ăn.
// Đảm bảo tuân thủ Invariants Gate P4 (bản nháp AI luôn là DRAFT, có provenance).

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, AlertCircle, ChefHat, Check, X, ArrowRight, ShieldCheck } from 'lucide-react';
import type { AiRecipeDraftPayload } from '@/lib/ai/recipeDraftGenerator';

interface AiDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDraft?: (draft: AiRecipeDraftPayload) => void;
}

export function AiDraftModal({ isOpen, onClose, onApplyDraft }: AiDraftModalProps) {
  const router = useRouter();

  // Inputs
  const [dishTitle, setDishTitle] = useState('');
  const [role, setRole] = useState<'MAIN' | 'SOUP' | 'SIDE' | 'ONE_DISH_MEAL'>('MAIN');
  const [region, setRegion] = useState('Toàn quốc');
  const [styleNotes, setStyleNotes] = useState('');

  // States
  const [loading, setLoading] = useState(false);
  const [savingDirectly, setSavingDirectly] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<AiRecipeDraftPayload | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishTitle.trim()) {
      setErrorMsg('Vui lòng nhập tên món ăn.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/recipe-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishTitle: dishTitle.trim(),
          role,
          region,
          styleNotes: styleNotes.trim(),
          mode: 'GENERATE',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Không thể tạo bản thảo lúc này.');
      }

      const data = await res.json();
      setGeneratedDraft(data.draft);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi kết nối tới Trợ lý AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToForm = () => {
    if (generatedDraft && onApplyDraft) {
      onApplyDraft(generatedDraft);
      onClose();
    }
  };

  const handleSaveDirectly = async () => {
    if (!dishTitle.trim()) return;

    setSavingDirectly(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/recipe-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishTitle: dishTitle.trim(),
          role,
          region,
          styleNotes: styleNotes.trim(),
          mode: 'SAVE_DRAFT',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Không thể lưu bản nháp.');
      }

      const data = await res.json();
      onClose();
      router.push(`/editor/recipes/${data.recipeId}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi lưu bản nháp vào cơ sở dữ liệu.');
    } finally {
      setSavingDirectly(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-draft-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="ai-draft-modal-title" className="text-xl font-bold text-stone-900">
                Trợ lý Soạn thảo Bản nháp AI
              </h2>
              <p className="text-xs text-stone-500">
                Tự động tạo khung công thức chuẩn cấu trúc từ tên món ăn (Bản nháp luôn là DRAFT)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Input Form */}
        {!generatedDraft ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label htmlFor="dishTitleInput" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Tên món ăn <span className="text-rose-500">*</span>
              </label>
              <input
                id="dishTitleInput"
                type="text"
                value={dishTitle}
                onChange={(e) => setDishTitle(e.target.value)}
                placeholder="Ví dụ: Cá lóc kho tộ miền Tây, Canh cua mồng tơi mướp, Sườn ram mặn ngọt..."
                className="w-full px-4 py-3 rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-stone-900"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="roleSelect" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Vai trò trong mâm cơm
                </label>
                <select
                  id="roleSelect"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-stone-900 bg-white"
                >
                  <option value="MAIN">Món mặn (MAIN)</option>
                  <option value="SOUP">Món canh (SOUP)</option>
                  <option value="SIDE">Món rau / xào (SIDE)</option>
                  <option value="ONE_DISH_MEAL">Món ăn một đĩa</option>
                </select>
              </div>

              <div>
                <label htmlFor="regionSelect" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Vùng miền ẩm thực
                </label>
                <select
                  id="regionSelect"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-stone-900 bg-white"
                >
                  <option value="Toàn quốc">Toàn quốc (Phổ biến)</option>
                  <option value="Miền Bắc">Miền Bắc (Thanh đạm, vừa vị)</option>
                  <option value="Miền Trung">Miền Trung (Đậm đà, cay thơm)</option>
                  <option value="Miền Nam">Miền Nam (Ngọt thanh, béo ngậy)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="styleNotesInput" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Ghi chú phong cách nấu (Tùy chọn)
              </label>
              <input
                id="styleNotesInput"
                type="text"
                value={styleNotes}
                onChange={(e) => setStyleNotes(e.target.value)}
                placeholder="Ví dụ: Kho bằng nồi đất, ít ngọt, có tóp mỡ, thời gian nấu nhanh..."
                className="w-full px-4 py-3 rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-stone-900"
              />
            </div>

            {/* Invariant Note */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Quy chuẩn Gate P4:</strong> Bản thảo do AI tạo sẽ được lưu ở trạng thái <code>DRAFT</code> kèm nhãn <code>provenance: AI_ASSISTED</code>, không bao giờ tự động xuất bản hay đánh dấu đã nấu thử.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-sm font-semibold transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading || !dishTitle.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow-md transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{loading ? 'Đang phân tích...' : 'Tạo bản thảo AI'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Draft Preview Section */
          <div className="space-y-6">
            <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-semibold text-xs inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Bản nháp AI: {generatedDraft.role}
                </span>
                <span className="text-xs text-stone-500 font-medium">
                  {generatedDraft.prepTimeMinutes + generatedDraft.cookTimeMinutes} phút · Khẩu phần {generatedDraft.baseServings} người
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900">{generatedDraft.name}</h3>
              <p className="text-sm text-stone-600 italic leading-relaxed">
                &ldquo;{generatedDraft.shortDescription}&rdquo;
              </p>
            </div>

            {/* Ingredients Preview */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Nguyên liệu định lượng ({generatedDraft.ingredients.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {generatedDraft.ingredients.map((ing, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-stone-900">{ing.name}</span>
                      {ing.preparation && <span className="text-stone-500 ml-1.5">({ing.preparation})</span>}
                    </div>
                    <span className="font-medium text-stone-700 bg-white px-2 py-0.5 rounded border border-stone-200">
                      {ing.amount} {ing.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Steps Preview */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Các bước thực hiện ({generatedDraft.steps.length})
              </h4>
              <div className="space-y-2 text-xs">
                {generatedDraft.steps.map((st) => (
                  <div key={st.stepNumber} className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-700">
                        Bước {st.stepNumber} · {st.phaseName}
                      </span>
                      {st.timerSeconds > 0 && (
                        <span className="text-stone-500 font-medium">
                          ⏱ {Math.round(st.timerSeconds / 60)} phút
                        </span>
                      )}
                    </div>
                    <p className="text-stone-700">{st.instruction}</p>
                    {st.tipText && (
                      <p className="text-amber-800 text-[11px] bg-amber-50/80 p-1.5 rounded-lg border border-amber-200/50">
                        💡 Mẹo: {st.tipText}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setGeneratedDraft(null)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold"
              >
                ← Tạo lại món khác
              </button>

              <div className="flex items-center gap-3">
                {onApplyDraft && (
                  <button
                    type="button"
                    onClick={handleApplyToForm}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-amber-600 text-amber-700 hover:bg-amber-50 text-sm font-semibold transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Điền vào biểu mẫu này</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveDirectly}
                  disabled={savingDirectly}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow-md transition-all disabled:opacity-50"
                >
                  {savingDirectly ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  <span>{savingDirectly ? 'Đang lưu...' : 'Lưu bản nháp & Chỉnh sửa'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
