'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  GitBranch,
  Send,
  Undo2,
  AlertCircle,
  Inbox,
  ChefHat,
  Lock,
  Loader2,
} from 'lucide-react';
import {
  evaluateGateChecks,
  validateVerificationFlags,
  REVIEW_NOTES_MAX,
  REVIEW_NOTES_MIN,
  type VerificationFlags,
} from '@/lib/recipes/gate';

interface QueueItem {
  id: number;
  name: string;
  shortDescription: string;
  versionNumber: number;
  revisionOfId: number | null;
  updatedAt: string;
  author?: { displayName: string };
}

interface RecipeDetail extends QueueItem {
  heroImage: string | null;
  baseServings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: string;
  caloriesPerServing: number | null;
  status: string;
  ingredients: Array<{
    ingredientId: number;
    amount: number;
    unit: string;
    preparation: string | null;
    isOptional: boolean;
    ingredient?: { name: string };
  }>;
  steps: Array<{ stepNumber: number; phaseName: string; instruction: string; timerSeconds: number | null }>;
}

const FLAG_META: Array<{ key: keyof VerificationFlags; label: string; hint: string }> = [
  {
    key: 'isEditorialReviewed',
    label: 'Đã biên tập (Editorial Reviewed)',
    hint: 'Câu chữ, định dạng, đơn vị đã chuẩn hoá. Bắt buộc để xuất bản.',
  },
  {
    key: 'isCookTested',
    label: 'Đã nấu thử (Cook Tested)',
    hint: 'Chỉ bật khi đã nấu thực tế, xác nhận thời gian và định lượng (D23).',
  },
  {
    key: 'isNutritionVerified',
    label: 'Đã kiểm chứng dinh dưỡng (Nutrition Verified)',
    hint: 'Chỉ bật khi có nguồn và số liệu calo đã được kiểm (D23).',
  },
];

const EMPTY_FLAGS: VerificationFlags = {
  isEditorialReviewed: false,
  isCookTested: false,
  isNutritionVerified: false,
};

export default function ReviewQueuePage() {
  const [role, setRole] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<RecipeDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [flags, setFlags] = useState<VerificationFlags>(EMPTY_FLAGS);
  const [notes, setNotes] = useState('');
  const [mode, setMode] = useState<'idle' | 'confirmPublish' | 'reject'>('idle');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const isAdmin = role === 'ADMIN';

  const loadQueue = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const res = await fetch('/api/recipes?status=SUBMITTED');
      if (res.ok) {
        const data = await res.json();
        const items: QueueItem[] = data.recipes || [];
        setQueue(items);
        setSelectedId((cur) => (cur && items.some((i) => i.id === cur) ? cur : items[0]?.id ?? null));
      }
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => setRole(d.user?.role ?? null))
      .catch(() => setRole(null));
    loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    setFlags(EMPTY_FLAGS);
    setNotes('');
    setMode('idle');
    setErrorMsg(null);
    fetch(`/api/recipes/${selectedId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) setDetail(d?.recipe ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const gateChecks = useMemo(() => (detail ? evaluateGateChecks(detail) : []), [detail]);
  const gatePassed = gateChecks.length > 0 && gateChecks.every((c) => c.passed);
  const flagErrors = useMemo(
    () => (detail ? validateVerificationFlags(flags, detail) : []),
    [flags, detail]
  );
  const canPublish = isAdmin && gatePassed && flagErrors.length === 0 && !busy;
  const notesValid = notes.trim().length >= REVIEW_NOTES_MIN && notes.trim().length <= REVIEW_NOTES_MAX;

  const finishAction = (message: string) => {
    setToast(message);
    setMode('idle');
    setSelectedId(null);
    loadQueue();
  };

  const handlePublish = async () => {
    if (!detail || !canPublish) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/recipes/${detail.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flags),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể xuất bản');
      finishAction(`Đã xuất bản "${detail.name}" (v${detail.versionNumber}).`);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Đã xảy ra lỗi');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!detail || !isAdmin || !notesValid) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/recipes/${detail.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể gửi yêu cầu sửa');
      finishAction(`Đã trả "${detail.name}" về biên tập viên kèm góp ý.`);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Đã xảy ra lỗi');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#2D2A26] pb-16">
      <header className="bg-white border-b border-[#EADBC8] sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/editor/recipes"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7C6A59] hover:text-[#3F6240] p-1.5 rounded-lg hover:bg-[#F3E9DD] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kho công thức
            </Link>
            <div className="h-4 w-px bg-[#EADBC8]" />
            <h1 className="text-xl font-bold text-[#3F6240] flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[#B75B35]" />
              Cổng Kiểm Duyệt Xuất Bản
            </h1>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            {queue.length} công thức chờ duyệt
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-4">
        {role && !isAdmin && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl flex items-start gap-3 text-sm">
            <Lock className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" />
            <p>
              Bạn đang xem ở chế độ chỉ đọc. Theo phân quyền <strong>D31</strong>, chỉ tài khoản{' '}
              <strong>ADMIN</strong> mới được phê duyệt xuất bản hoặc yêu cầu sửa.
            </p>
          </div>
        )}

        {toast && (
          <div
            role="status"
            className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-2xl flex items-center gap-2 text-sm animate-in fade-in"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            {toast}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">
          {/* Queue */}
          <aside className="bg-white rounded-2xl border border-[#EADBC8] shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-[#F3E9DD] text-xs font-semibold text-[#7C6A59] uppercase tracking-wide">
              Hàng chờ (SUBMITTED)
            </div>
            {loadingQueue ? (
              <p className="p-6 text-sm text-[#7C6A59] flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
              </p>
            ) : queue.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Inbox className="w-10 h-10 mx-auto text-[#9C8B7A] opacity-60" />
                <p className="text-sm font-semibold text-[#3F6240]">Không có công thức nào chờ duyệt</p>
                <p className="text-xs text-[#7C6A59]">Biên tập viên gửi duyệt sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#F3E9DD]">
                {queue.map((item) => {
                  const active = item.id === selectedId;
                  return (
                    <li key={item.id}>
                      <button
                        id={`review-queue-item-${item.id}`}
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className={`w-full text-left px-4 py-3 transition-colors ${
                          active ? 'bg-[#F3E9DD]/70 border-l-4 border-[#3F6240]' : 'hover:bg-[#FAF7F0] border-l-4 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#2D2A26] line-clamp-1 flex-1">{item.name}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#3F6240]/10 text-[#3F6240]">
                            v{item.versionNumber}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-[#7C6A59]">
                          {item.revisionOfId && (
                            <span className="inline-flex items-center gap-0.5 text-[#B75B35] font-medium">
                              <GitBranch className="w-3 h-3" /> Bản sửa đổi của #{item.revisionOfId}
                            </span>
                          )}
                          <span>{item.author?.displayName ?? 'Không rõ tác giả'}</span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          {/* Detail */}
          <section className="space-y-4">
            {!selectedId ? (
              <div className="bg-white rounded-2xl border border-[#EADBC8] p-12 text-center text-sm text-[#7C6A59]">
                Chọn một công thức trong hàng chờ để bắt đầu kiểm duyệt.
              </div>
            ) : loadingDetail || !detail ? (
              <div className="bg-white rounded-2xl border border-[#EADBC8] p-12 text-center text-sm text-[#7C6A59] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Đang tải chi tiết...
              </div>
            ) : (
              <>
                {/* Summary */}
                <article className="bg-white rounded-2xl border border-[#EADBC8] shadow-xs overflow-hidden">
                  {detail.heroImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={detail.heroImage} alt={`Ảnh bìa ${detail.name}`} className="w-full h-56 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-[#F3E9DD]/60 flex items-center justify-center text-xs text-[#9C8B7A]">
                      <ChefHat className="w-6 h-6 mr-2 opacity-60" /> Chưa có ảnh bìa
                    </div>
                  )}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-[#2D2A26]">{detail.name}</h2>
                        <p className="text-xs text-[#5C4A3A] mt-1 leading-relaxed">{detail.shortDescription}</p>
                      </div>
                      <Link
                        href={`/editor/recipes/${detail.id}`}
                        className="shrink-0 text-xs font-semibold text-[#3F6240] hover:underline"
                      >
                        Mở trình biên tập
                      </Link>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-[#7C6A59] pt-2 border-t border-[#F3E9DD]">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#B75B35]" /> {detail.baseServings} người
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#3F6240]" /> {detail.prepTimeMinutes + detail.cookTimeMinutes} phút
                      </span>
                      <span>{detail.difficulty}</span>
                      <span>{detail.caloriesPerServing ? `${detail.caloriesPerServing} kcal/phần` : 'Chưa có số liệu calo'}</span>
                    </div>
                  </div>
                </article>

                {/* Gate checklist */}
                <div className="bg-white rounded-2xl border border-[#EADBC8] shadow-xs p-5 space-y-3">
                  <h3 className="text-sm font-bold text-[#3F6240] flex items-center gap-2">
                    Gate Check
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        gatePassed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {gatePassed ? 'Đạt' : 'Chưa đạt'}
                    </span>
                  </h3>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {gateChecks.map((c) => (
                      <li
                        key={c.key}
                        className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border ${
                          c.passed ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900' : 'border-red-200 bg-red-50 text-red-800'
                        }`}
                      >
                        {c.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                        {c.label}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Content preview */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-[#EADBC8] shadow-xs p-5">
                    <h3 className="text-sm font-bold text-[#3F6240] mb-3">Nguyên liệu ({detail.ingredients.length})</h3>
                    <ul className="space-y-1.5 text-xs text-[#5C4A3A]">
                      {detail.ingredients.map((ri, idx) => (
                        <li key={idx} className="flex justify-between gap-2 border-b border-dashed border-[#F3E9DD] pb-1">
                          <span>
                            {ri.ingredient?.name ?? `#${ri.ingredientId}`}
                            {ri.preparation ? <span className="text-[#9C8B7A]"> · {ri.preparation}</span> : null}
                            {ri.isOptional ? <span className="text-[#9C8B7A]"> (tuỳ chọn)</span> : null}
                          </span>
                          <span className="font-semibold tabular-nums">
                            {ri.amount} {ri.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white rounded-2xl border border-[#EADBC8] shadow-xs p-5">
                    <h3 className="text-sm font-bold text-[#3F6240] mb-3">Các bước ({detail.steps.length})</h3>
                    <ol className="space-y-2 text-xs text-[#5C4A3A]">
                      {detail.steps.map((s) => (
                        <li key={s.stepNumber} className="flex gap-2">
                          <span className="w-5 h-5 shrink-0 rounded-full bg-[#3F6240] text-white text-[10px] font-bold flex items-center justify-center">
                            {s.stepNumber}
                          </span>
                          <span>
                            <span className="font-semibold text-[#B75B35]">{s.phaseName}: </span>
                            {s.instruction}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Verification + actions */}
                <div className="bg-white rounded-2xl border border-[#EADBC8] shadow-xs p-5 space-y-4">
                  <h3 className="text-sm font-bold text-[#3F6240]">Nhãn kiểm chứng (Invariants §5.5)</h3>
                  <div className="space-y-2">
                    {FLAG_META.map((f) => (
                      <label
                        key={f.key}
                        htmlFor={`flag-${f.key}`}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                          flags[f.key] ? 'border-[#3F6240] bg-[#3F6240]/5' : 'border-[#EADBC8] hover:bg-[#FAF7F0]'
                        } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <input
                          id={`flag-${f.key}`}
                          type="checkbox"
                          disabled={!isAdmin || busy}
                          checked={flags[f.key]}
                          onChange={(e) => setFlags((prev) => ({ ...prev, [f.key]: e.target.checked }))}
                          className="mt-0.5 w-4 h-4 accent-[#3F6240]"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-[#2D2A26]">{f.label}</span>
                          <span className="block text-xs text-[#7C6A59]">{f.hint}</span>
                        </span>
                      </label>
                    ))}
                  </div>

                  {flagErrors.length > 0 && isAdmin && (
                    <ul className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                      {flagErrors.map((e) => (
                        <li key={e}>• {e}</li>
                      ))}
                    </ul>
                  )}

                  {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl flex items-center gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-red-600" /> {errorMsg}
                    </div>
                  )}

                  {mode === 'reject' && (
                    <div className="space-y-2">
                      <label htmlFor="review-notes" className="block text-xs font-semibold text-[#5C4A3A]">
                        Góp ý gửi biên tập viên ({notes.trim().length}/{REVIEW_NOTES_MAX})
                      </label>
                      <textarea
                        id="review-notes"
                        rows={4}
                        maxLength={REVIEW_NOTES_MAX}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ví dụ: Bước 3 thiếu dấu hiệu nhận biết thịt đã săn; ảnh bìa chưa đúng món..."
                        className="w-full px-3.5 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B75B35]"
                      />
                    </div>
                  )}

                  {isAdmin && (
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#F3E9DD]">
                      {mode === 'reject' ? (
                        <>
                          <button
                            id="review-cancel-reject"
                            type="button"
                            onClick={() => setMode('idle')}
                            disabled={busy}
                            className="px-3.5 py-2 text-xs font-semibold text-[#5C4A3A] border border-[#EADBC8] rounded-xl hover:bg-[#FAF7F0]"
                          >
                            Huỷ
                          </button>
                          <button
                            id="review-submit-reject"
                            type="button"
                            onClick={handleReject}
                            disabled={busy || !notesValid}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#B75B35] text-white text-xs font-semibold rounded-xl hover:bg-[#9c4b2a] disabled:opacity-50 transition-all"
                          >
                            <Undo2 className="w-4 h-4" /> Gửi yêu cầu sửa
                          </button>
                        </>
                      ) : mode === 'confirmPublish' ? (
                        <>
                          <span className="text-xs text-[#5C4A3A] mr-auto">
                            {detail.revisionOfId
                              ? `Bản v${detail.versionNumber} sẽ thay thế bản đang chạy #${detail.revisionOfId} (bản cũ được lưu trữ).`
                              : 'Công thức sẽ hiển thị công khai cho người nấu.'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setMode('idle')}
                            disabled={busy}
                            className="px-3.5 py-2 text-xs font-semibold text-[#5C4A3A] border border-[#EADBC8] rounded-xl hover:bg-[#FAF7F0]"
                          >
                            Quay lại
                          </button>
                          <button
                            id="review-confirm-publish"
                            type="button"
                            onClick={handlePublish}
                            disabled={!canPublish}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3F6240] text-white text-xs font-semibold rounded-xl hover:bg-[#324f33] disabled:opacity-50 shadow-xs transition-all"
                          >
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Xác nhận xuất bản
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            id="review-start-reject"
                            type="button"
                            onClick={() => setMode('reject')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#B75B35] border border-[#B75B35]/40 rounded-xl hover:bg-[#B75B35]/5"
                          >
                            <Undo2 className="w-4 h-4" /> Yêu cầu sửa
                          </button>
                          <button
                            id="review-start-publish"
                            type="button"
                            onClick={() => setMode('confirmPublish')}
                            disabled={!canPublish}
                            title={!gatePassed ? 'Chưa đạt Gate Check' : flagErrors[0]}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3F6240] text-white text-xs font-semibold rounded-xl hover:bg-[#324f33] disabled:opacity-50 shadow-xs transition-all"
                          >
                            <ShieldCheck className="w-4 h-4" /> Phê duyệt &amp; Xuất bản
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
