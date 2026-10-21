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
  Eye,
  CheckCircle2,
  Tag,
  PackagePlus,
  Layers,
  X,
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
  price?: number;
  isFree?: boolean;
  provenance?: string;
  createdAt: string;
}

interface CreatorBundle {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  status: string;
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
  const [bundles, setBundles] = useState<CreatorBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // State cho Modal đặt giá món lẻ (R8)
  const [pricingRecipe, setPricingRecipe] = useState<ContributorRecipe | null>(null);
  const [priceInput, setPriceInput] = useState<string>('0');
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  // State cho Modal tạo Bộ công thức / Combo (R8)
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [bundleTitle, setBundleTitle] = useState('');
  const [bundleDesc, setBundleDesc] = useState('');
  const [bundlePrice, setBundlePrice] = useState('45000');
  const [selectedBundleRecipeIds, setSelectedBundleRecipeIds] = useState<number[]>([]);
  const [savingBundle, setSavingBundle] = useState(false);
  const [bundleError, setBundleError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMyRecipes() {
      try {
        setLoading(true);
        const [res, bundleRes] = await Promise.all([
          fetch('/api/contribute/recipes'),
          fetch('/api/creator/bundles'),
        ]);
        if (res.status === 401) {
          setErrorMsg('Vui lòng đăng nhập để xem danh sách công thức của bạn.');
          return;
        }
        if (!res.ok) {
          throw new Error('Lỗi khi tải danh sách công thức.');
        }
        const data = await res.json();
        setRecipes(data.recipes || []);

        if (bundleRes.ok) {
          const bData = await bundleRes.json();
          setBundles(bData.bundles || []);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Không thể tải danh sách công thức.');
      } finally {
        setLoading(false);
      }
    }

    loadMyRecipes();
  }, []);

  const handleOpenPricing = (recipe: ContributorRecipe) => {
    setPricingRecipe(recipe);
    setPriceInput(String(recipe.price ?? 0));
    setPriceError(null);
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricingRecipe) return;
    setSavingPrice(true);
    setPriceError(null);
    try {
      const numericPrice = Number(priceInput) || 0;
      const res = await fetch(`/api/creator/recipes/${pricingRecipe.id}/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: numericPrice }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setPriceError(data.message || 'Không thể cập nhật giá bán.');
        return;
      }
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === pricingRecipe.id
            ? { ...r, price: data.price, isFree: data.isFree }
            : r
        )
      );
      setPricingRecipe(null);
      setToastMsg(data.message || 'Đã cập nhật giá công thức!');
      setTimeout(() => setToastMsg(null), 3500);
    } catch {
      setPriceError('Không thể kết nối máy chủ.');
    } finally {
      setSavingPrice(false);
    }
  };

  const toggleBundleRecipe = (id: number) => {
    setSelectedBundleRecipeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBundle(true);
    setBundleError(null);
    try {
      const res = await fetch('/api/creator/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bundleTitle.trim(),
          description: bundleDesc.trim() || undefined,
          price: Number(bundlePrice) || 0,
          recipeIds: selectedBundleRecipeIds,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setBundleError(data.message || 'Không thể tạo bộ công thức.');
        return;
      }
      if (data.bundle) {
        setBundles((prev) => [data.bundle, ...prev]);
      }
      setShowBundleModal(false);
      setBundleTitle('');
      setBundleDesc('');
      setSelectedBundleRecipeIds([]);
      setToastMsg(data.message || 'Tạo bộ công thức thành công!');
      setTimeout(() => setToastMsg(null), 3500);
    } catch {
      setBundleError('Không thể kết nối máy chủ.');
    } finally {
      setSavingBundle(false);
    }
  };

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
        <div className="w-full mx-auto px-4 py-4 flex items-center justify-between gap-4">
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

      <main className="w-full mx-auto px-4 pt-6 space-y-6">
        {toastMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {errorMsg ? (
          <div className="bg-white p-8 rounded-2xl border border-[#EADBC8] text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
            <p className="text-sm font-semibold text-[#5C4A3A]">{errorMsg}</p>
            <Link
              href="/login?from=/contribute"
              className="inline-block px-5 py-2.5 rounded-xl bg-[#3F6240] text-white text-xs font-semibold"
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

                        {/* Pipeline vòng đời xuất bản công thức (4 giai đoạn) */}
                        <RecipeLifecyclePipeline status={recipe.status} />

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
                          <div className="flex flex-wrap items-center justify-between w-full gap-2">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#3F6240] bg-[#FAF7F0] px-2.5 py-1 rounded-lg border border-[#EADBC8]">
                              <Tag className="w-3.5 h-3.5 text-[#B75B35]" />
                              {recipe.price && recipe.price > 0
                                ? `${recipe.price.toLocaleString('vi-VN')} đ`
                                : 'Miễn phí'}
                            </span>
                            <div className="flex items-center gap-2">
                              {recipe.provenance !== 'EDITORIAL' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPricing(recipe)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FAF7F0] hover:bg-[#F3E9DD] text-[#5C4A3A] text-xs font-semibold rounded-lg border border-[#EADBC8] transition-colors"
                                >
                                  <Tag className="w-3.5 h-3.5 text-[#B75B35]" />
                                  <span>Đặt giá bán</span>
                                </button>
                              )}
                              <Link
                                href={`/cong-thuc/${recipe.slug}`}
                                target="_blank"
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Xem bài viết</span>
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Gói D: Quản lý Bộ công thức & Combo món (R8 Creator Studio) */}
            {(publishedCount >= 1 || bundles.length > 0) && (
              <section className="bg-white rounded-2xl border border-[#EADBC8] p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F3E9DD]">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#B75B35]/10 text-[#B75B35] flex items-center justify-center shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#2D2A26]">
                        Bộ Công Thức &amp; Combo Món Của Tôi ({bundles.length})
                      </h2>
                      <p className="text-xs text-[#7C6A59] mt-0.5">
                        Đóng gói từ 2 công thức đã xuất bản trở lên thành bộ thực đơn chủ đề cho người học nấu (dành cho Người nấu Bậc 2).
                      </p>
                    </div>
                  </div>

                  {publishedCount >= 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        setBundleError(null);
                        setShowBundleModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#B75B35] hover:bg-[#9E4B28] text-white text-xs font-semibold transition-colors shrink-0 shadow-xs"
                    >
                      <PackagePlus className="w-4 h-4" />
                      <span>Tạo Bộ công thức mới</span>
                    </button>
                  )}
                </div>

                {bundles.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#7C6A59]">
                    {publishedCount >= 2
                      ? 'Bạn đã có từ 2 công thức xuất bản trở lên! Hãy bấm "Tạo Bộ công thức mới" để đóng gói combo món ngon.'
                      : 'Khi bạn có ít nhất 2 công thức được duyệt xuất bản, bạn có thể đóng gói thành Bộ công thức (Combo) tại đây.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {bundles.map((b) => (
                      <div
                        key={b.id}
                        className="p-4 rounded-xl bg-[#FAF7F0] border border-[#EADBC8] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-[#2D2A26] truncate">{b.title}</h3>
                          {b.description && (
                            <p className="text-xs text-[#7C6A59] line-clamp-1 mt-0.5">{b.description}</p>
                          )}
                          <span className="inline-block mt-1.5 text-[11px] font-bold text-[#B75B35]">
                            Giá bộ: {b.price.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 shrink-0">
                          Đang mở bán
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {/* Modal Đặt giá bán công thức lẻ (R8) */}
      {pricingRecipe && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#EADBC8] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3E9DD]">
              <h3 className="text-base font-bold text-[#2D2A26] flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#B75B35]" />
                <span>Đặt giá bán công thức</span>
              </h3>
              <button
                type="button"
                onClick={() => setPricingRecipe(null)}
                className="p-1 rounded-lg text-[#7C6A59] hover:bg-[#FAF7F0]"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5C4A3A] leading-relaxed">
              Món: <strong>{pricingRecipe.name}</strong>. Chọn <strong>0 đ</strong> nếu bạn muốn chia sẻ miễn phí cho cộng đồng, hoặc đặt mức phí từ <strong>10.000 đ – 200.000 đ</strong> (bội số 1.000 đ, yêu cầu Người nấu Bậc 2).
            </p>

            {priceError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {priceError}
              </div>
            )}

            <form onSubmit={handleSavePrice} className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {[0, 15000, 25000, 39000, 50000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPriceInput(String(preset))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      Number(priceInput) === preset
                        ? 'bg-[#3F6240] text-white border-[#3F6240]'
                        : 'bg-[#FAF7F0] text-[#5C4A3A] border-[#EADBC8] hover:bg-[#F3E9DD]'
                    }`}
                  >
                    {preset === 0 ? 'Miễn phí (0đ)' : `${preset.toLocaleString('vi-VN')} đ`}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">
                  Mức giá (VNĐ)
                </label>
                <input
                  type="number"
                  min={0}
                  max={200000}
                  step={1000}
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EADBC8] bg-[#FAF7F0] text-sm font-bold text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#3F6240]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPricingRecipe(null)}
                  className="px-4 py-2 rounded-xl border border-[#EADBC8] text-xs font-semibold text-[#7C6A59] hover:bg-[#FAF7F0]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingPrice}
                  className="px-5 py-2 rounded-xl bg-[#3F6240] hover:bg-[#324f33] text-white text-xs font-semibold disabled:opacity-50"
                >
                  {savingPrice ? 'Đang lưu...' : 'Lưu mức giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tạo Bộ Công Thức / Combo (R8) */}
      {showBundleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#EADBC8] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3E9DD]">
              <h3 className="text-base font-bold text-[#2D2A26] flex items-center gap-2">
                <PackagePlus className="w-4 h-4 text-[#B75B35]" />
                <span>Tạo Bộ Công Thức (Combo Món)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowBundleModal(false)}
                className="p-1 rounded-lg text-[#7C6A59] hover:bg-[#FAF7F0]"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {bundleError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {bundleError}
              </div>
            )}

            <form onSubmit={handleCreateBundle} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#5C4A3A] mb-1">
                  Tên bộ công thức (3–100 ký tự) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={100}
                  placeholder="Ví dụ: Thực đơn 5 món kho đậm đà đưa cơm ngày mưa"
                  value={bundleTitle}
                  onChange={(e) => setBundleTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EADBC8] bg-[#FAF7F0] text-sm text-[#2D2A26]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#5C4A3A] mb-1">
                  Mô tả ngắn (tùy chọn)
                </label>
                <textarea
                  rows={2}
                  placeholder="Giới thiệu điểm đặc sắc của bộ công thức này..."
                  value={bundleDesc}
                  onChange={(e) => setBundleDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EADBC8] bg-[#FAF7F0] text-sm text-[#2D2A26]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#5C4A3A] mb-1">
                  Giá trọn bộ (30.000 đ – 1.000.000 đ, bội số 1.000 đ)
                </label>
                <input
                  type="number"
                  required
                  min={30000}
                  max={1000000}
                  step={1000}
                  value={bundlePrice}
                  onChange={(e) => setBundlePrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EADBC8] bg-[#FAF7F0] text-sm font-bold text-[#2D2A26]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#5C4A3A] mb-1.5">
                  Chọn các công thức đã xuất bản đưa vào bộ (tối thiểu 2 món, đã chọn {selectedBundleRecipeIds.length}):
                </label>
                <div className="space-y-1.5 max-h-44 overflow-y-auto p-2 rounded-xl border border-[#EADBC8] bg-[#FAF7F0]">
                  {recipes
                    .filter((r) => r.status === 'PUBLISHED')
                    .map((r) => {
                      const checked = selectedBundleRecipeIds.includes(r.id);
                      return (
                        <label
                          key={r.id}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                            checked ? 'bg-[#3F6240]/10 font-bold text-[#3F6240]' : 'hover:bg-white'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleBundleRecipe(r.id)}
                              className="w-4 h-4 rounded text-[#3F6240]"
                            />
                            <span>{r.name}</span>
                          </span>
                          <span className="text-[11px] text-[#7C6A59]">
                            {r.price && r.price > 0 ? `${r.price.toLocaleString('vi-VN')} đ` : 'Miễn phí'}
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBundleModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#EADBC8] font-semibold text-[#7C6A59] hover:bg-[#FAF7F0]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingBundle || selectedBundleRecipeIds.length < 2}
                  className="px-5 py-2 rounded-xl bg-[#B75B35] hover:bg-[#9E4B28] text-white font-semibold disabled:opacity-50"
                >
                  {savingBundle ? 'Đang tạo...' : 'Tạo Bộ công thức'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const LIFECYCLE_STAGES = [
  { key: 'DRAFT', label: '1. Soạn nháp' },
  { key: 'SUBMITTED', label: '2. Gửi duyệt' },
  { key: 'REVIEW', label: '3. Kiểm duyệt' },
  { key: 'PUBLISHED', label: '4. Xuất bản' },
];

function RecipeLifecyclePipeline({ status }: { status: ContributorRecipe['status'] }) {
  const activeStageIndex =
    status === 'DRAFT'
      ? 0
      : status === 'SUBMITTED'
      ? 1
      : status === 'NEEDS_CHANGES'
      ? 2
      : status === 'PUBLISHED' || status === 'ARCHIVED'
      ? 3
      : 0;

  return (
    <div className="pt-1" aria-label="Tiến trình kiểm duyệt công thức">
      <div className="grid grid-cols-4 gap-1.5">
        {LIFECYCLE_STAGES.map((stage, idx) => {
          const isDone = idx < activeStageIndex || status === 'PUBLISHED';
          const isCurrent = idx === activeStageIndex && status !== 'PUBLISHED';
          const isNeedsChanges = isCurrent && status === 'NEEDS_CHANGES';

          return (
            <div key={stage.key} className="flex flex-col gap-1">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  isNeedsChanges
                    ? 'bg-orange-500'
                    : isDone
                    ? 'bg-[#3F6240]'
                    : isCurrent
                    ? 'bg-amber-500'
                    : 'bg-[#EADBC8]'
                }`}
              />
              <span
                className={`text-[10px] font-semibold truncate ${
                  isNeedsChanges
                    ? 'text-orange-700 font-bold'
                    : isDone
                    ? 'text-[#3F6240]'
                    : isCurrent
                    ? 'text-amber-800 font-bold'
                    : 'text-[#9C8B7A]'
                }`}
              >
                {isNeedsChanges && idx === 2 ? '3. Cần sửa' : stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
