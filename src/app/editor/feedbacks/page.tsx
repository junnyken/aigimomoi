'use client';

// AG-34: Editorial Feedback Moderation Dashboard
// Quản lý và kiểm duyệt hình ảnh, đánh giá nấu thử từ cộng đồng

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Camera,
  Star,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  ArrowLeft,
  Loader2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AdminTopNav } from '@/components/editor/AdminTopNav';

interface FeedbackItem {
  id: number;
  recipeId: number;
  cookName: string;
  cookEmail: string | null;
  rating: number;
  notes: string | null;
  photoUrl: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  approvedAt: string | null;
  recipe: {
    id: number;
    name: string;
    slug: string;
    dish: {
      name: string;
    } | null;
  };
  user: {
    id: number;
    displayName: string;
    email: string;
  } | null;
  approvedBy: {
    id: number;
    displayName: string;
  } | null;
}

export default function EditorialFeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function loadFeedbacks() {
    setLoading(true);
    try {
      const res = await fetch(`/api/editor/feedbacks?status=${statusFilter}`);
      const data = await res.json();
      if (res.ok) {
        setFeedbacks(data.feedbacks || []);
      }
    } catch (e) {
      console.error('Error loading feedbacks', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeedbacks();
  }, [statusFilter]);

  async function handleUpdateStatus(feedbackId: number, newStatus: 'APPROVED' | 'REJECTED') {
    setUpdatingId(feedbackId);
    try {
      const res = await fetch(`/api/editor/feedbacks/${feedbackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Cập nhật local state
        setFeedbacks((prev) =>
          prev.map((item) =>
            item.id === feedbackId
              ? { ...item, status: newStatus, approvedAt: new Date().toISOString() }
              : item
          )
        );
      }
    } catch (e) {
      console.error('Error updating feedback status', e);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-subtle)] pb-16">
      <AdminTopNav
        title="Đánh Giá & Phản Hồi Nấu Thử (Feedbacks)"
        subtitle="Kiểm duyệt hình ảnh đĩa cơm thực tế và nhận xét nêm nếm từ cộng đồng"
      />
      {/* Header */}
      <div className="bg-[var(--color-surface-white)] border-b border-[var(--color-border-base)]">
        <div className="w-full mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/editor/recipes"
              className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] transition-colors"
              title="Quay lại danh sách công thức"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <Camera className="w-5 h-5 text-[var(--color-brand-primary)]" />
                Kiểm duyệt Ảnh & Phản hồi Nấu thử (AG-34)
              </h1>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Duyệt hình ảnh đĩa cơm thực tế và cảm nhận nêm nếm từ cộng đồng độc giả
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadFeedbacks()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border-base)] text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
            <Link
              href="/editor/reports"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border-base)] text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]"
            >
              Hàng đợi Báo cáo
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="w-full mx-auto px-4 flex gap-2 border-t border-[var(--color-border-base)] pt-2 pb-2">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === tab
                  ? 'bg-[var(--color-brand-primary)] text-white shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]'
              }`}
            >
              {tab === 'PENDING' && 'Chờ duyệt'}
              {tab === 'APPROVED' && 'Đã phê duyệt'}
              {tab === 'REJECTED' && 'Đã từ chối'}
              {tab === 'ALL' && 'Tất cả'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full mx-auto px-4 mt-6">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[var(--color-text-secondary)]">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-brand-primary)] mb-3" />
            <p className="text-sm">Đang tải danh sách phản hồi...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl p-12 text-center">
            <Sparkles className="w-10 h-10 text-[var(--color-brand-primary)] mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              Không có phản hồi nào trong mục này
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              {statusFilter === 'PENDING'
                ? 'Hàng đợi sạch sẽ! Mọi phản hồi và ảnh nấu thử đã được duyệt.'
                : 'Chưa có bản ghi nào phù hợp bộ lọc.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feedbacks.map((item) => (
              <div
                key={item.id}
                className="bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  {/* Top info */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
                        Công thức:
                      </span>
                      <Link
                        href={`/cong-thuc/${item.recipe.slug}`}
                        target="_blank"
                        className="text-sm font-bold text-[var(--color-brand-primary)] hover:underline flex items-center gap-1"
                      >
                        {item.recipe.name}
                        <ExternalLink className="w-3.5 h-3.5 inline" />
                      </Link>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        item.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.status === 'REJECTED'
                          ? 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {item.status === 'APPROVED' && 'Đã duyệt'}
                      {item.status === 'REJECTED' && 'Đã từ chối'}
                      {item.status === 'PENDING' && 'Chờ duyệt'}
                    </span>
                  </div>

                  {/* Cooker & Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-semibold text-xs text-[var(--color-text-primary)]">
                      {item.cookName}
                    </span>
                    {item.cookEmail && (
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        ({item.cookEmail})
                      </span>
                    )}
                    <div className="flex items-center text-amber-500 ml-auto">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= item.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-neutral-300 dark:text-neutral-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Photo if any */}
                  {item.photoUrl && (
                    <div className="mb-3 rounded-xl overflow-hidden border border-[var(--color-border-base)] aspect-video bg-neutral-100 dark:bg-neutral-800">
                      <img
                        src={item.photoUrl}
                        alt="Đĩa cơm thành phẩm"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes ? (
                    <p className="text-xs text-[var(--color-text-secondary)] whitespace-pre-line leading-relaxed bg-[var(--color-surface-subtle)] p-3 rounded-xl mb-4">
                      &ldquo;{item.notes}&rdquo;
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--color-text-muted)] italic mb-4">
                      (Không kèm ghi chú nêm nếm)
                    </p>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-[var(--color-border-base)] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    {new Date(item.createdAt).toLocaleString('vi-VN')}
                  </span>

                  <div className="flex items-center gap-2">
                    {item.status !== 'APPROVED' && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'APPROVED')}
                        disabled={updatingId === item.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Duyệt
                      </button>
                    )}
                    {item.status !== 'REJECTED' && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'REJECTED')}
                        disabled={updatingId === item.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-medium hover:bg-neutral-300 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Từ chối
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
