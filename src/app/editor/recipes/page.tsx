'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  BookOpen,
  Clock,
  Users,
  ChefHat,
  ArrowLeft,
  Filter,
  CheckCircle2,
  FileEdit,
  Trash2,
  Tag,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { AiDraftModal } from '@/components/editor/AiDraftModal';

interface Recipe {
  id: number;
  slug: string;
  name: string;
  shortDescription: string;
  role: 'MAIN' | 'SOUP' | 'SIDE' | 'ONE_DISH_MEAL' | 'DESSERT' | 'BEVERAGE';
  status: 'DRAFT' | 'SUBMITTED' | 'PUBLISHED' | 'NEEDS_CHANGES' | 'ARCHIVED';
  baseServings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: string;
  caloriesPerServing: number | null;
  dish?: { id: number; name: string };
  author?: { displayName: string; email: string };
  tags?: Array<{ taxonomy: { id: number; name: string; type: string } }>;
  createdAt: string;
  versionNumber?: number;
  revisionOfId?: number | null;
  provenance?: string;
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  MAIN: { label: 'Món chính (Mặn)', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  SOUP: { label: 'Món canh', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  SIDE: { label: 'Món phụ / Rau', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  ONE_DISH_MEAL: { label: 'Món ăn một đĩa', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  DESSERT: { label: 'Tráng miệng', color: 'bg-pink-50 text-pink-800 border-pink-200' },
  BEVERAGE: { label: 'Đồ uống', color: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
};

const STATUS_LABELS: Record<string, { label: string; badge: string }> = {
  DRAFT: { label: 'Bản nháp', badge: 'bg-stone-100 text-stone-700 border-stone-200' },
  SUBMITTED: { label: 'Chờ duyệt', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  PUBLISHED: { label: 'Đã xuất bản', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  NEEDS_CHANGES: { label: 'Cần sửa đổi', badge: 'bg-orange-100 text-orange-800 border-orange-200' },
  ARCHIVED: { label: 'Lưu trữ', badge: 'bg-stone-200 text-stone-500 border-stone-300' },
};

export default function EditorRecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/recipes', window.location.origin);
      if (searchTerm) url.searchParams.set('q', searchTerm);
      if (selectedRole !== 'ALL') url.searchParams.set('role', selectedRole);
      if (selectedStatus !== 'ALL') url.searchParams.set('status', selectedStatus);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setRecipes(data.recipes || []);
      }
    } catch (e) {
      console.error('Error fetching recipes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecipes();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedRole, selectedStatus]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bản nháp công thức "${name}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRecipes((prev) => prev.filter((r) => r.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Không thể xóa công thức');
      }
    } catch (e) {
      alert('Đã xảy ra lỗi khi kết nối máy chủ');
    } finally {
      setDeletingId(null);
    }
  };

  const draftCount = recipes.filter((r) => r.status === 'DRAFT').length;
  const submittedCount = recipes.filter((r) => r.status === 'SUBMITTED').length;
  const publishedCount = recipes.filter((r) => r.status === 'PUBLISHED').length;

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#2D2A26] pb-16">
      {/* Top Header */}
      <header className="bg-white border-b border-[#EADBC8] sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7C6A59] hover:text-[#3F6240] transition-colors p-1.5 rounded-lg hover:bg-[#F3E9DD]"
            >
              <ArrowLeft className="w-4 h-4" />
              Trang chủ
            </Link>
            <div className="h-4 w-px bg-[#EADBC8]" />
            <h1 className="text-xl font-bold text-[#3F6240] flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-[#B75B35]" />
              Kho Công Thức Bữa Cơm
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/editor/ingredients"
              className="px-3 py-2 text-xs font-medium text-[#5C4A3A] hover:bg-[#FAF7F0] border border-[#EADBC8] rounded-xl transition-colors"
            >
              Từ điển nguyên liệu
            </Link>
            <Link
              href="/editor/taxonomies"
              className="px-3 py-2 text-xs font-medium text-[#5C4A3A] hover:bg-[#FAF7F0] border border-[#EADBC8] rounded-xl transition-colors"
            >
              Hệ phân loại
            </Link>
            <Link
              id="review-queue-link"
              href="/editor/recipes/review"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Hàng chờ duyệt
            </Link>
            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-semibold rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all shadow-xs"
              title="Tự động tạo khung công thức bằng AI"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Soạn bằng AI</span>
            </button>
            <Link
              href="/editor/recipes/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3F6240] text-white text-xs font-semibold rounded-xl hover:bg-[#324f33] transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Soạn công thức mới
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-[#EADBC8] shadow-xs">
            <p className="text-xs font-medium text-[#7C6A59]">Tổng công thức</p>
            <p className="text-2xl font-bold text-[#3F6240] mt-1">{recipes.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#EADBC8] shadow-xs">
            <p className="text-xs font-medium text-[#7C6A59]">Bản nháp (Draft)</p>
            <p className="text-2xl font-bold text-[#5C4A3A] mt-1">{draftCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#EADBC8] shadow-xs">
            <p className="text-xs font-medium text-[#7C6A59]">Chờ duyệt (Submitted)</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{submittedCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#EADBC8] shadow-xs">
            <p className="text-xs font-medium text-[#7C6A59]">Đã xuất bản (Live)</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{publishedCount}</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#EADBC8] shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7C6A59]" />
              <input
                type="text"
                placeholder="Tìm công thức theo tên hoặc món ăn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3F6240] focus:bg-white transition-all placeholder:text-[#9C8B7A]"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-xs font-medium text-[#5C4A3A] focus:outline-none focus:ring-2 focus:ring-[#3F6240]"
              >
                <option value="ALL">Mọi vai trò</option>
                <option value="MAIN">Món chính (Mặn)</option>
                <option value="SOUP">Món canh</option>
                <option value="SIDE">Món phụ / Rau</option>
                <option value="ONE_DISH_MEAL">Món một đĩa</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-xs font-medium text-[#5C4A3A] focus:outline-none focus:ring-2 focus:ring-[#3F6240]"
              >
                <option value="ALL">Mọi trạng thái</option>
                <option value="DRAFT">Bản nháp</option>
                <option value="SUBMITTED">Chờ duyệt</option>
                <option value="PUBLISHED">Đã xuất bản</option>
                <option value="NEEDS_CHANGES">Cần sửa đổi</option>
                <option value="ARCHIVED">Phiên bản lưu trữ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Recipe Cards List */}
        {loading ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#EADBC8]">
            <p className="text-sm text-[#7C6A59]">Đang tải danh sách công thức...</p>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#EADBC8] space-y-4">
            <BookOpen className="w-12 h-12 text-[#9C8B7A] mx-auto opacity-50" />
            <div className="space-y-1">
              <h3 className="font-semibold text-[#3F6240]">Chưa có công thức nào phù hợp</h3>
              <p className="text-xs text-[#7C6A59]">
                Bắt đầu bằng việc bấm &ldquo;Soạn công thức mới&rdquo; để đưa món ngon cơm nhà vào hệ thống.
              </p>
            </div>
            <Link
              href="/editor/recipes/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3F6240] text-white text-xs font-semibold rounded-xl hover:bg-[#324f33] transition-all"
            >
              <Plus className="w-4 h-4" />
              Soạn công thức ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recipes.map((recipe) => {
              const roleMeta = ROLE_LABELS[recipe.role] || {
                label: recipe.role,
                color: 'bg-stone-50 text-stone-700 border-stone-200',
              };
              const statusMeta = STATUS_LABELS[recipe.status] || {
                label: recipe.status,
                badge: 'bg-stone-100 text-stone-700 border-stone-200',
              };

              return (
                <div
                  key={recipe.id}
                  className="bg-white rounded-2xl border border-[#EADBC8] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md border ${roleMeta.color}`}
                          >
                            {roleMeta.label}
                          </span>
                          {recipe.provenance === 'AI_ASSISTED' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              <span>AI Assistant</span>
                            </span>
                          )}
                        </div>
                        <h2 className="text-base font-bold text-[#2D2A26] line-clamp-1 hover:text-[#3F6240] transition-colors">
                          {recipe.name}
                          {recipe.versionNumber && recipe.versionNumber > 1 && (
                            <span className="ml-2 align-middle text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#3F6240]/10 text-[#3F6240]">
                              v{recipe.versionNumber}
                            </span>
                          )}
                        </h2>
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${statusMeta.badge}`}
                      >
                        {statusMeta.label}
                      </span>
                    </div>

                    <p className="text-xs text-[#5C4A3A] line-clamp-2 leading-relaxed">
                      {recipe.shortDescription}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#7C6A59] pt-1 border-t border-[#F3E9DD]">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#B75B35]" />
                        {recipe.baseServings} người
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#3F6240]" />
                        {recipe.prepTimeMinutes + recipe.cookTimeMinutes} phút
                      </span>
                      <span className="text-[11px] font-medium px-1.5 py-0.5 bg-[#FAF7F0] rounded text-[#5C4A3A]">
                        {recipe.difficulty}
                      </span>
                    </div>

                    {/* Taxonomy Tags */}
                    {recipe.tags && recipe.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {recipe.tags.slice(0, 4).map((t, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-0.5 text-[10px] font-medium px-2 py-0.5 bg-[#F3E9DD]/60 text-[#5C4A3A] rounded-md"
                          >
                            <Tag className="w-2.5 h-2.5 opacity-60" />
                            {t.taxonomy.name}
                          </span>
                        ))}
                        {recipe.tags.length > 4 && (
                          <span className="text-[10px] text-[#9C8B7A] self-center">
                            +{recipe.tags.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#F3E9DD]">
                    <span className="text-[11px] text-[#9C8B7A]">
                      ID: #{recipe.id} · {new Date(recipe.createdAt).toLocaleDateString('vi-VN')}
                    </span>

                    <div className="flex items-center gap-2">
                      {recipe.status === 'DRAFT' && (
                        <button
                          onClick={() => handleDelete(recipe.id, recipe.name)}
                          disabled={deletingId === recipe.id}
                          className="p-1.5 text-[#9C8B7A] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Xóa bản nháp"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <Link
                        href={`/editor/recipes/${recipe.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FAF7F0] hover:bg-[#F3E9DD] text-[#3F6240] text-xs font-semibold rounded-lg border border-[#EADBC8] transition-colors"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                        Chỉnh sửa
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* AI Authoring Draft Modal */}
      <AiDraftModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
}
