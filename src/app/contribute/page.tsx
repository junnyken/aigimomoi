'use client';

// AG-31: Community Contributor Dashboard
// Quản lý các công thức do người dùng đóng góp cho cộng đồng Bếp Ăn Gì Mom.

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChefHat,
  Plus,
  Clock,
  Users,
  AlertCircle,
  FileEdit,
  Trash2,
  Send,
  Eye,
  CheckCircle2,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface ContributorRecipe {
  id: number;
  slug: string;
  name: string;
  shortDescription: string;
  role: 'MAIN' | 'SOUP' | 'SIDE' | 'ONE_DISH_MEAL';
  status: 'DRAFT' | 'SUBMITTED' | 'NEEDS_CHANGES' | 'PUBLISHED' | 'ARCHIVED';
  baseServings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: string;
  heroImage: string | null;
  reviewNotes: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badge: string; desc: string }
> = {
  DRAFT: {
    label: 'Bản nháp',
    badge: 'bg-stone-100 text-stone-700 border-stone-200',
    desc: 'Chỉ bạn có thể nhìn thấy. Hãy hoàn thiện và bấm Nộp duyệt.',
  },
  SUBMITTED: {
    label: 'Chờ duyệt',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    desc: 'Đang trong hàng đợi kiểm duyệt của Ban biên tập.',
  },
  NEEDS_CHANGES: {
    label: 'Cần sửa đổi',
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    desc: 'Ban biên tập có phản hồi, vui lòng xem góp ý và gửi lại.',
  },
  PUBLISHED: {
    label: 'Đã xuất bản',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    desc: 'Công thức đã xuất hiện trên trang chủ Ăn Gì Mom!',
  },
  ARCHIVED: {
    label: 'Lưu trữ',
    badge: 'bg-stone-200 text-stone-500 border-stone-300',
    desc: 'Công thức đã lưu trữ.',
  },
};

export default function ContributorDashboardPage() {
  const [recipes, setRecipes] = useState<ContributorRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadMyRecipes() {
      try {
        setLoading(true);
        const res = await fetch('/api/contribute/recipes');
        if (res.status === 401) {
          setErrorMsg('Vui lòng đăng nhập để xem danh sách công thức của bạn.');
          return;
        }
        if (!res.ok) {
          throw new Error('Lỗi khi tải danh sách công thức.');
        }
        const data = await res.json();
        setRecipes(data.recipes || []);
      } catch (err: any) {
        setErrorMsg(err.message || 'Không thể tải danh sách công thức.');
      } finally {
        setLoading(false);
      }
    }

    loadMyRecipes();
  }, []);

  const handleDeleteDraft = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bản nháp công thức này?')) return;
    try {
      const res = await fetch(`/api/contribute/recipes/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Lỗi khi xóa bản nháp.');
        return;
      }
      setRecipes((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert('Không thể kết nối đến máy chủ.');
    }
  };

  const draftCount = recipes.filter((r) => r.status === 'DRAFT').length;
  const submittedCount = recipes.filter((r) => r.status === 'SUBMITTED').length;
  const changesCount = recipes.filter((r) => r.status === 'NEEDS_CHANGES').length;
  const publishedCount = recipes.filter((r) => r.status === 'PUBLISHED').length;

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#2D2A26] pb-24">
      {/* Header */}
      <header className="bg-white border-b border-[#EADBC8] sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#3F6240]/10 text-[#3F6240] flex items-center justify-center">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#3F6240]">Bếp Nhà Của Tôi</h1>
              <p className="text-xs text-[#7C6A59]">
                Đóng góp công thức món ngon gia đình cho cộng đồng Ăn Gì Mom
              </p>
            </div>
          </div>

          <Link
            href="/contribute/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#3F6240] hover:bg-[#324f33] text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Đóng góp món mới</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {errorMsg ? (
          <div className="bg-white p-8 rounded-2xl border border-[#EADBC8] text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
            <p className="text-sm font-semibold text-[#5C4A3A]">{errorMsg}</p>
            <Link
              href="/login"
              className="inline-block px-5 py-2 rounded-xl bg-[#3F6240] text-white text-xs font-semibold"
            >
              Đăng nhập ngay
            </Link>
          </div>
        ) : (
          <>
            {/* Stat Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-[#EADBC8] shadow-xs">
                <span className="text-xs text-[#7C6A59] font-medium">Bản nháp</span>
                <p className="text-2xl font-bold text-[#5C4A3A] mt-1">{draftCount}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-[#EADBC8] shadow-xs">
                <span className="text-xs text-amber-700 font-medium">Chờ duyệt</span>
                <p className="text-2xl font-bold text-amber-700 mt-1">{submittedCount}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-[#EADBC8] shadow-xs">
                <span className="text-xs text-orange-700 font-medium">Cần chỉnh sửa</span>
                <p className="text-2xl font-bold text-orange-700 mt-1">{changesCount}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-[#EADBC8] shadow-xs">
                <span className="text-xs text-emerald-700 font-medium">Đã xuất bản</span>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{publishedCount}</p>
              </div>
            </div>

            {/* List */}
            {loading ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#EADBC8]">
                <p className="text-sm text-[#7C6A59]">Đang tải danh sách công thức của bạn...</p>
              </div>
            ) : recipes.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#EADBC8] space-y-4">
                <ChefHat className="w-12 h-12 text-[#B75B35] mx-auto opacity-40" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#2D2A26]">Chưa có công thức nào</h3>
                  <p className="text-xs text-[#7C6A59] max-w-md mx-auto">
                    Mỗi gia đình đều có những món ăn mang đậm dấu ấn riêng. Hãy chia sẻ món tủ của nhà bạn để mọi người cùng thưởng thức nhé!
                  </p>
                </div>
                <Link
                  href="/contribute/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3F6240] text-white text-xs font-semibold rounded-xl hover:bg-[#324f33] transition-all shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Viết công thức đầu tiên</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recipes.map((recipe) => {
                  const statusInfo = STATUS_CONFIG[recipe.status] || {
                    label: recipe.status,
                    badge: 'bg-stone-100 text-stone-700 border-stone-200',
                    desc: '',
                  };

                  return (
                    <div
                      key={recipe.id}
                      className="bg-white rounded-2xl border border-[#EADBC8] p-5 shadow-xs flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.badge}`}>
                            {statusInfo.label}
                          </span>
                          <span className="text-[11px] text-[#7C6A59]">
                            {new Date(recipe.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>

                        <div>
                          <h2 className="text-base font-bold text-[#2D2A26] line-clamp-1">{recipe.name}</h2>
                          <p className="text-xs text-[#5C4A3A] line-clamp-2 mt-1 leading-relaxed">
                            {recipe.shortDescription}
                          </p>
                        </div>

                        {/* Feedback / Review Notes */}
                        {recipe.status === 'NEEDS_CHANGES' && recipe.reviewNotes && (
                          <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-900 space-y-1">
                            <span className="font-semibold block text-[11px] text-orange-800">
                              💬 Góp ý từ Ban biên tập:
                            </span>
                            <p className="italic">{recipe.reviewNotes}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-[#7C6A59] pt-2 border-t border-[#F3E9DD]">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-[#B75B35]" />
                            {recipe.baseServings} người
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#3F6240]" />
                            {recipe.prepTimeMinutes + recipe.cookTimeMinutes} phút
                          </span>
                          <span className="text-[11px] font-medium text-[#5C4A3A]">
                            Độ khó: {recipe.difficulty}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F3E9DD]">
                        {recipe.status === 'DRAFT' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleDeleteDraft(recipe.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa</span>
                            </button>
                            <Link
                              href={`/contribute/${recipe.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FAF7F0] hover:bg-[#F3E9DD] text-[#3F6240] text-xs font-semibold rounded-lg border border-[#EADBC8] transition-colors"
                            >
                              <FileEdit className="w-3.5 h-3.5" />
                              <span>Sửa & Nộp</span>
                            </Link>
                          </>
                        )}

                        {recipe.status === 'NEEDS_CHANGES' && (
                          <Link
                            href={`/contribute/${recipe.id}`}
                            className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg transition-colors"
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                            <span>Sửa và nộp lại</span>
                          </Link>
                        )}

                        {recipe.status === 'SUBMITTED' && (
                          <span className="text-xs text-amber-700 italic flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Đang chờ phản hồi
                          </span>
                        )}

                        {recipe.status === 'PUBLISHED' && (
                          <Link
                            href={`/cong-thuc/${recipe.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem bài viết</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
