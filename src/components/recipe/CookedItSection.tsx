'use client';

// AG-34: Cooked-it Feedback & Community Photos Component
// Hiển thị cộng đồng nấu thử thực tế, ảnh đĩa cơm gia đình và mẹo nêm nếm

import { useState, useEffect } from 'react';
import { Camera, Star, MessageSquare, CheckCircle2, X, Send, Sparkles } from 'lucide-react';

interface FeedbackItem {
  id: number;
  cookName: string;
  rating: number;
  notes: string | null;
  photoUrl: string | null;
  createdAt: string;
}

interface FeedbackStats {
  totalCookedCount: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
}

interface CookedItSectionProps {
  recipeId: number;
  recipeName: string;
}

export function CookedItSection({ recipeId, recipeName }: CookedItSectionProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({
    totalCookedCount: 0,
    averageRating: 5,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [cookName, setCookName] = useState('');
  const [cookEmail, setCookEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch(`/api/recipes/${recipeId}/feedback`);
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data.feedbacks || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch {
      // Ignore network errors in public view
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [recipeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/recipes/${recipeId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cookName: cookName.trim(),
          cookEmail: cookEmail.trim() || undefined,
          rating,
          notes: notes.trim() || undefined,
          photoUrl: photoUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Có lỗi xảy ra khi gửi phản hồi.');
      } else {
        setSubmitMessage(data.message || 'Cảm ơn bạn đã chia sẻ trải nghiệm nấu!');
        setNotes('');
        setPhotoUrl('');
        // Refresh feedback list
        fetchFeedbacks();
        setTimeout(() => {
          setIsModalOpen(false);
          setSubmitMessage(null);
        }, 2000);
      }
    } catch {
      setSubmitError('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const photosOnly = feedbacks.filter((f) => f.photoUrl);

  return (
    <section aria-labelledby="cooked-it-heading" className="mt-8 pt-8 border-t border-[var(--color-border-base)]">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 id="cooked-it-heading" className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Camera className="w-5 h-5 text-[var(--color-brand-primary)]" aria-hidden="true" />
            Cộng đồng nấu thử & Ảnh đĩa cơm ({stats.totalCookedCount})
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {stats.totalCookedCount > 0 ? (
              <span className="flex items-center gap-2">
                <span className="font-semibold text-amber-500 flex items-center">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400 inline mr-1" />
                  {stats.averageRating} / 5
                </span>
                <span>• Dựa trên đánh giá thực tế của người nấu tại nhà</span>
              </span>
            ) : (
              'Chưa có ảnh nấu thử nào. Hãy là người đầu tiên khoe thành quả đĩa cơm hôm nay!'
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-hover,#b3391b)] shadow-sm transition-colors"
        >
          <Camera className="w-4 h-4" />
          Tôi đã nấu món này!
        </button>
      </div>

      {/* Community Cooked Photos Grid (nếu có ảnh) */}
      {photosOnly.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
            📸 Ảnh thành phẩm từ người dùng
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photosOnly.map((fb) => (
              <div
                key={fb.id}
                className="group relative aspect-square rounded-xl overflow-hidden border border-[var(--color-border-base)] bg-neutral-100 dark:bg-neutral-800"
              >
                <img
                  src={fb.photoUrl!}
                  alt={`Thành phẩm món ${recipeName} của ${fb.cookName}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5 text-white">
                  <p className="text-xs font-semibold truncate">{fb.cookName}</p>
                  <div className="flex items-center text-amber-300 text-[11px]">
                    <Star className="w-3 h-3 fill-amber-300 inline mr-0.5" />
                    {fb.rating} sao
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback & Review List */}
      {feedbacks.length > 0 ? (
        <div className="space-y-3">
          {feedbacks.map((fb) => (
            <div
              key={fb.id}
              className="p-4 rounded-xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] text-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--color-text-primary)]">{fb.cookName}</span>
                  <div className="flex items-center text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= fb.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {new Date(fb.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
              {fb.notes && (
                <p className="text-[var(--color-text-secondary)] whitespace-pre-line leading-relaxed">
                  {fb.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : !isLoading && (
        <div className="p-6 rounded-2xl border border-dashed border-[var(--color-border-base)] text-center bg-[var(--color-surface-subtle)]">
          <Sparkles className="w-8 h-8 text-[var(--color-brand-primary)] mx-auto mb-2 opacity-70" />
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            Bạn đã nấu thử món này cho gia đình chưa?
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-md mx-auto">
            Hãy chia sẻ chút cảm nhận về độ vừa miệng hoặc mẹo nêm nếm để giúp các bà nội trợ khác tự tin vào bếp nhé!
          </p>
        </div>
      )}

      {/* Modal Form Gửi Feedback & Ảnh */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Camera className="w-5 h-5 text-[var(--color-brand-primary)]" />
              Tôi đã nấu món này!
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Chia sẻ đĩa thức ăn thực tế và cảm nhận của gia đình bạn với món <strong>{recipeName}</strong>.
            </p>

            {submitMessage ? (
              <div className="my-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
                <div className="text-sm font-medium">{submitMessage}</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {submitError && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
                    {submitError}
                  </div>
                )}

                {/* Đánh giá sao */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Độ hài lòng / vừa miệng <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setRating(s)}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            s <= (hoverRating ?? rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-neutral-300 dark:text-neutral-600'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-medium text-[var(--color-text-muted)] ml-2">
                      {rating === 5 && 'Tuyệt vời, cả nhà thích mê!'}
                      {rating === 4 && 'Rất ngon, vừa miệng'}
                      {rating === 3 && 'Ổn, cần gia giảm chút'}
                      {rating === 2 && 'Chưa hợp khẩu vị lắm'}
                      {rating === 1 && 'Cần cải thiện nhiều'}
                    </span>
                  </div>
                </div>

                {/* Tên người nấu */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                      Tên của bạn <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Mẹ Bắp, Bếp Nhà Bo"
                      value={cookName}
                      onChange={(e) => setCookName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border-base)] bg-[var(--color-surface-white)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                      Email (không công khai)
                    </label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={cookEmail}
                      onChange={(e) => setCookEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border-base)] bg-[var(--color-surface-white)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                    />
                  </div>
                </div>

                {/* Link ảnh thành phẩm */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Link ảnh thành phẩm đĩa món ăn (tùy chọn)
                  </label>
                  <input
                    type="url"
                    placeholder="https://... (ảnh đĩa cơm bạn vừa nấu)"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border-base)] bg-[var(--color-surface-white)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                  />
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                    Ảnh sẽ được Ban biên tập kiểm duyệt nhanh để giữ gìn đĩa cơm gia đình ấm cúng.
                  </p>
                </div>

                {/* Ghi chú mẹo nấu */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Mẹo nêm nếm & Cảm nhận thực tế
                  </label>
                  <textarea
                    rows={3}
                    placeholder="VD: Món này nấu bằng nồi đất kho nhỏ lửa thịt mềm rục, gia đình mình bớt 1 thìa đường thì vừa miệng chuẩn vị Bắc..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border-base)] bg-[var(--color-surface-white)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium rounded-lg border border-[var(--color-border-base)] text-[var(--color-text-secondary)] hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-hover,#b3391b)] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      'Đang gửi...'
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Gửi phản hồi
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
