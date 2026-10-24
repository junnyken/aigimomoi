'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Flag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  ShieldAlert,
  Loader2,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react';
import { AdminTopNav } from '@/components/editor/AdminTopNav';

interface ReportItem {
  id: number;
  recipeId: number;
  reason: 'UNSAFE_FOOD' | 'INCORRECT_RECIPE' | 'COPYRIGHT' | 'INAPPROPRIATE' | 'OTHER';
  details: string | null;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  moderatorNotes: string | null;
  createdAt: string;
  resolvedAt: string | null;
  reporterEmail: string | null;
  recipe: {
    id: number;
    name: string;
    slug: string;
    status: string;
    heroImage: string | null;
    author: {
      id: number;
      displayName: string;
      email: string;
    } | null;
    dish: {
      name: string;
    } | null;
  };
  reporter: {
    id: number;
    displayName: string;
    email: string;
  } | null;
  resolvedBy: {
    id: number;
    displayName: string;
  } | null;
}

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  UNSAFE_FOOD: { label: 'An toàn thực phẩm', color: 'bg-red-50 text-red-700 border-red-200' },
  INCORRECT_RECIPE: { label: 'Sai lệch công thức', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  COPYRIGHT: { label: 'Vi phạm bản quyền', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  INAPPROPRIATE: { label: 'Nội dung phản cảm', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  OTHER: { label: 'Lý do khác', color: 'bg-stone-50 text-stone-700 border-stone-200' },
};

export default function EditorialReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED' | 'DISMISSED'>('PENDING');
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadReports() {
    setLoading(true);
    try {
      const res = await fetch(`/api/editor/reports?status=${statusFilter}`);
      const data = await res.json();
      if (res.ok) {
        setReports(data.reports || []);
      }
    } catch (e) {
      console.error('Error loading reports', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  async function handleResolve(reportId: number, status: 'RESOLVED' | 'DISMISSED', action: 'TAKEDOWN' | 'NONE') {
    setSubmittingAction(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/editor/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          action,
          moderatorNotes: actionNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể xử lý báo cáo.');
      }

      setSelectedReport(null);
      setActionNotes('');
      await loadReports();
    } catch (err: any) {
      setActionError(err.message || 'Lỗi khi xử lý.');
    } finally {
      setSubmittingAction(false);
    }
  }

  const counts = {
    all: reports.length,
    pending: reports.filter((r) => r.status === 'PENDING').length,
    resolved: reports.filter((r) => r.status === 'RESOLVED').length,
    dismissed: reports.filter((r) => r.status === 'DISMISSED').length,
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2A1810] pb-12">
      <AdminTopNav
        title="Báo Cáo Vi Phạm & An Toàn Thực Phẩm"
        subtitle="Tiếp nhận và xử lý phản ánh từ người dùng để bảo vệ an toàn bữa cơm gia đình"
      />
      <div className="w-full mx-auto space-y-6 pt-6 px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EADBC8] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/editor/recipes"
                className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-[#3F6240] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Về quản lý công thức
              </Link>
            </div>
            <h1 className="text-2xl font-black text-[#3F6240] tracking-tight flex items-center gap-2.5">
              <ShieldAlert className="w-7 h-7 text-red-600" />
              Hàng Đợi Kiểm Duyệt & Xử Lý Báo Cáo
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              Tiếp nhận và xử lý phản ánh từ cộng đồng người dùng để bảo vệ an toàn bữa cơm gia đình.
            </p>
          </div>

          <button
            onClick={loadReports}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#EADBC8] rounded-xl text-xs font-medium hover:bg-stone-50 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: 'PENDING', label: 'Chờ xử lý', count: counts.pending },
              { key: 'RESOLVED', label: 'Đã giải quyết', count: counts.resolved },
              { key: 'DISMISSED', label: 'Đã bác bỏ', count: counts.dismissed },
              { key: 'ALL', label: 'Tất cả báo cáo', count: counts.all },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                statusFilter === tab.key
                  ? 'bg-[#3F6240] text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-[#EADBC8] hover:bg-stone-50'
              }`}
            >
              <span>{tab.label}</span>
              {tab.key === 'PENDING' && tab.count > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-bold">
                  {tab.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Content List */}
        {loading ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#EADBC8] space-y-3">
            <Loader2 className="w-8 h-8 text-[#3F6240] animate-spin mx-auto" />
            <p className="text-xs text-stone-500">Đang tải dữ liệu hàng đợi báo cáo...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#EADBC8] space-y-3">
            <CheckCircle className="w-12 h-12 text-[#3F6240] mx-auto opacity-40" />
            <h3 className="text-base font-bold text-stone-700">Hàng đợi đang trống</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Không có báo cáo vi phạm nào trong mục này. Mọi công thức hiện đang vận hành an toàn!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const reasonInfo = REASON_LABELS[report.reason] || REASON_LABELS.OTHER;

              return (
                <div
                  key={report.id}
                  className="bg-white rounded-2xl border border-[#EADBC8] p-5 shadow-xs hover:border-[#3F6240]/40 transition-all space-y-4"
                >
                  {/* Top info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3E9DD] pb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${reasonInfo.color}`}>
                        {reasonInfo.label}
                      </span>
                      <span className="text-xs text-stone-400">
                        Gửi lúc: {new Date(report.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          report.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : report.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {report.status === 'PENDING'
                          ? 'Đang chờ xử lý'
                          : report.status === 'RESOLVED'
                          ? 'Đã giải quyết'
                          : 'Đã bác bỏ'}
                      </span>
                    </div>
                  </div>

                  {/* Recipe & Reporter Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#EADBC8]/60 space-y-1.5">
                      <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
                        Công thức bị báo cáo
                      </div>
                      <div className="font-bold text-sm text-[#2A1810] flex items-center gap-1.5">
                        <Link
                          href={`/cong-thuc/${report.recipe.slug}`}
                          target="_blank"
                          className="hover:underline hover:text-[#3F6240] flex items-center gap-1"
                        >
                          {report.recipe.name}
                          <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                        </Link>
                      </div>
                      <div className="text-xs text-stone-600">
                        Tác giả:{' '}
                        <span className="font-medium">
                          {report.recipe.author?.displayName || 'Ẩn danh'}
                        </span>
                        {' · '}
                        Trạng thái hiện tại: <span className="font-bold">{report.recipe.status}</span>
                      </div>
                    </div>

                    <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#EADBC8]/60 space-y-1.5">
                      <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
                        Người gửi phản ánh
                      </div>
                      <div className="text-xs text-stone-800">
                        Người gửi:{' '}
                        <span className="font-semibold">
                          {report.reporter?.displayName || report.reporterEmail || 'Khách vãng lai'}
                        </span>
                      </div>
                      {report.details ? (
                        <div className="text-xs text-stone-600 bg-white p-2.5 rounded-lg border border-[#EADBC8]">
                          &ldquo;{report.details}&rdquo;
                        </div>
                      ) : (
                        <div className="text-xs text-stone-400 italic">Không có mô tả chi tiết thêm.</div>
                      )}
                    </div>
                  </div>

                  {/* Moderator notes if already resolved */}
                  {report.status !== 'PENDING' && (
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
                      <div className="font-semibold text-stone-700 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-stone-500" />
                        Ghi chú xử lý của Ban biên tập:
                      </div>
                      <p className="text-stone-600">{report.moderatorNotes || 'Không có ghi chú.'}</p>
                      {report.resolvedBy && (
                        <div className="text-[11px] text-stone-400 pt-1">
                          Xử lý bởi: {report.resolvedBy.displayName} lúc{' '}
                          {report.resolvedAt ? new Date(report.resolvedAt).toLocaleString('vi-VN') : ''}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions for PENDING */}
                  {report.status === 'PENDING' && (
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#F3E9DD]">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Gỡ bài (Takedown & Yêu cầu sửa)
                      </button>

                      <button
                        onClick={() => handleResolve(report.id, 'RESOLVED', 'NONE')}
                        className="px-3.5 py-2 text-xs font-semibold text-white bg-[#3F6240] hover:bg-[#2D472E] rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Đã giải quyết
                      </button>

                      <button
                        onClick={() => handleResolve(report.id, 'DISMISSED', 'NONE')}
                        className="px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 border border-[#EADBC8] hover:bg-stone-50 rounded-xl transition-colors"
                      >
                        Bác bỏ báo cáo
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Takedown */}
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-200 space-y-4">
              <div className="flex items-center gap-3 border-b border-red-100 pb-3">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-red-900">Gỡ bài & Yêu cầu chỉnh sửa</h3>
                  <p className="text-xs text-stone-500 line-clamp-1">{selectedReport.recipe.name}</p>
                </div>
              </div>

              {actionError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                  {actionError}
                </div>
              )}

              <p className="text-xs text-stone-600 leading-relaxed">
                Hành động này sẽ ngay lập tức chuyển công thức từ <b>{selectedReport.recipe.status}</b> về trạng thái{' '}
                <span className="font-bold text-red-700">NEEDS_CHANGES</span>. Công thức sẽ bị gỡ khỏi trang chủ và tác giả sẽ nhận được yêu cầu sửa đổi kèm lý do.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">
                  Ghi chú góp ý cho tác giả (Bắt buộc)
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Ghi rõ nội dung sai sót cần tác giả bổ sung hoặc chỉnh sửa..."
                  rows={3}
                  className="w-full text-xs rounded-xl border border-[#EADBC8] p-3 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F3E9DD]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReport(null);
                    setActionNotes('');
                  }}
                  disabled={submittingAction}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={submittingAction || !actionNotes.trim()}
                  onClick={() => handleResolve(selectedReport.id, 'RESOLVED', 'TAKEDOWN')}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {submittingAction ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <span>Xác nhận Gỡ bài</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
