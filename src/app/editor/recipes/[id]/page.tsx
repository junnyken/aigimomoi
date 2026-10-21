'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  ChefHat,
  Plus,
  Trash2,
  Clock,
  Save,
  Send,
  AlertCircle,
  Check,
  Tag,
  Sparkles,
  Lock,
  GitBranch,
  MessageSquareWarning,
  Archive,
  ExternalLink,
} from 'lucide-react';
import { ImageUpload } from '@/components/ui/ImageUpload';

interface IngredientOption {
  id: number;
  name: string;
  category: string;
  standardUnit: string;
  isPantryStaple: boolean;
}

interface TaxonomyOption {
  id: number;
  name: string;
  type: string;
}

interface IngredientRow {
  ingredientId: number;
  amount: number | '';
  unit: string;
  scalePolicy: 'LINEAR' | 'FIXED' | 'MANUAL_ADJUST';
  preparation: string;
  isOptional: boolean;
}

interface StepRow {
  phaseName: string;
  instruction: string;
  timerMinutes: number | '';
  tipText: string;
  image?: string;
}

const PHASES = ['Sơ chế', 'Chế biến', 'Hoàn thành'];

export default function EditRecipePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F0] flex items-center justify-center">
          <p className="text-sm font-medium text-[#7C6A59]">Đang tải dữ liệu công thức...</p>
        </div>
      }
    >
      <EditRecipeContent />
    </Suspense>
  );
}

function EditRecipeContent() {
  const routeParams = useParams();
  const recipeId = routeParams?.id as string;
  const router = useRouter();

  // Reference data
  const [availableIngredients, setAvailableIngredients] = useState<IngredientOption[]>([]);
  const [availableTaxonomies, setAvailableTaxonomies] = useState<TaxonomyOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [dishName, setDishName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [role, setRole] = useState<'MAIN' | 'SOUP' | 'SIDE' | 'DIPPING_SAUCE' | 'ONE_DISH_MEAL' | 'DESSERT' | 'BEVERAGE'>('MAIN');
  const [status, setStatus] = useState<string>('DRAFT');
  const [baseServings, setBaseServings] = useState<number>(4);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number>(15);
  const [cookTimeMinutes, setCookTimeMinutes] = useState<number>(30);
  const [difficulty, setDifficulty] = useState('Dễ');
  const [caloriesPerServing, setCaloriesPerServing] = useState<number | ''>('');
  const [heroImage, setHeroImage] = useState('');

  // Structured Ingredients & Steps
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>([]);
  const [stepRows, setStepRows] = useState<StepRow[]>([]);
  const [selectedTaxonomyIds, setSelectedTaxonomyIds] = useState<number[]>([]);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // AG-15: Versioning & review state
  const [versionNumber, setVersionNumber] = useState(1);
  const [publicSlug, setPublicSlug] = useState<string | null>(null);
  const [revisionOfId, setRevisionOfId] = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string | null>(null);
  const [openRevisionId, setOpenRevisionId] = useState<number | null>(null);
  const [creatingRevision, setCreatingRevision] = useState(false);
  const [provenance, setProvenance] = useState<string>('MANUAL');
  const [calculatingNut, setCalculatingNut] = useState(false);

  const handleRecalculateNutrition = async () => {
    try {
      setCalculatingNut(true);
      const res = await fetch(`/api/recipes/${recipeId}/nutrition`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.nutrition?.perServing) {
        setCaloriesPerServing(data.nutrition.perServing.calories);
      } else {
        setErrorMsg(data.error || 'Không thể tính toán dinh dưỡng');
      }
    } catch {
      setErrorMsg('Lỗi kết nối khi tính dinh dưỡng');
    } finally {
      setCalculatingNut(false);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        setLoadingData(true);
        const [ingRes, taxRes, recipeRes] = await Promise.all([
          fetch('/api/ingredients'),
          fetch('/api/taxonomies'),
          fetch(`/api/recipes/${recipeId}`),
        ]);

        if (ingRes.ok) {
          const ingData = await ingRes.json();
          setAvailableIngredients(ingData.ingredients || []);
        }

        if (taxRes.ok) {
          const taxData = await taxRes.json();
          setAvailableTaxonomies(taxData.taxonomies || []);
        }

        if (recipeRes.ok) {
          const { recipe, openRevisionId: openRevId } = await recipeRes.json();
          setVersionNumber(recipe.versionNumber ?? 1);
          setPublicSlug(typeof recipe.slug === 'string' ? recipe.slug : null);
          setRevisionOfId(recipe.revisionOfId ?? null);
          setReviewNotes(recipe.reviewNotes ?? null);
          setOpenRevisionId(openRevId ?? null);
          setProvenance(recipe.provenance || 'MANUAL');
          setName(recipe.name);
          setDishName(recipe.dish?.name || '');
          setShortDescription(recipe.shortDescription);
          setRole(recipe.role);
          setStatus(recipe.status);
          setBaseServings(recipe.baseServings);
          setPrepTimeMinutes(recipe.prepTimeMinutes);
          setCookTimeMinutes(recipe.cookTimeMinutes);
          setDifficulty(recipe.difficulty);
          setCaloriesPerServing(recipe.caloriesPerServing ?? '');
          setHeroImage(recipe.heroImage || '');

          if (recipe.ingredients && recipe.ingredients.length > 0) {
            setIngredientRows(
              recipe.ingredients.map((ri: any) => ({
                ingredientId: ri.ingredientId,
                amount: ri.amount,
                unit: ri.unit,
                scalePolicy: ri.scalePolicy,
                preparation: ri.preparation || '',
                isOptional: ri.isOptional,
              }))
            );
          }

          if (recipe.steps && recipe.steps.length > 0) {
            setStepRows(
              recipe.steps.map((st: any) => ({
                phaseName: st.phaseName,
                instruction: st.instruction,
                timerMinutes: st.timerSeconds ? Math.round(st.timerSeconds / 60) : '',
                tipText: st.tipText || '',
                image: st.image || '',
              }))
            );
          }

          if (recipe.tags && recipe.tags.length > 0) {
            setSelectedTaxonomyIds(recipe.tags.map((t: any) => t.taxonomy.id));
          }
        } else {
          setErrorMsg('Không tìm thấy công thức yêu cầu');
        }
      } catch (e) {
        console.error('Failed loading recipe data', e);
        setErrorMsg('Không thể kết nối đến máy chủ');
      } finally {
        setLoadingData(false);
      }
    }

    init();
  }, [recipeId]);

  // PUBLISHED và ARCHIVED đều bất biến (Invariants §5.1)
  const isReadOnly = status === 'PUBLISHED' || status === 'ARCHIVED';

  const handleCreateRevision = async () => {
    if (openRevisionId) {
      router.push(`/editor/recipes/${openRevisionId}`);
      return;
    }
    setErrorMsg(null);
    setCreatingRevision(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/revisions`, { method: 'POST' });
      const data = await res.json();
      if (res.status === 409 && data.openRevisionId) {
        router.push(`/editor/recipes/${data.openRevisionId}`);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Không thể tạo bản sửa đổi');
      router.push(`/editor/recipes/${data.recipe.id}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Đã xảy ra lỗi kết nối');
    } finally {
      setCreatingRevision(false);
    }
  };

  // Dynamic rows handlers
  const addIngredientRow = () => {
    if (isReadOnly) return;
    const defaultIng = availableIngredients[0];
    setIngredientRows((prev) => [
      ...prev,
      {
        ingredientId: defaultIng ? defaultIng.id : 0,
        amount: 100,
        unit: defaultIng ? defaultIng.standardUnit : 'g',
        scalePolicy: 'LINEAR',
        preparation: '',
        isOptional: false,
      },
    ]);
  };

  const updateIngredientRow = (index: number, updates: Partial<IngredientRow>) => {
    if (isReadOnly) return;
    setIngredientRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...updates } : row))
    );
  };

  const removeIngredientRow = (index: number) => {
    if (isReadOnly) return;
    if (ingredientRows.length <= 1) {
      alert('Công thức cần ít nhất một nguyên liệu');
      return;
    }
    setIngredientRows((prev) => prev.filter((_, i) => i !== index));
  };

  const addStepRow = () => {
    if (isReadOnly) return;
    const lastPhase = stepRows[stepRows.length - 1]?.phaseName || 'Chế biến';
    setStepRows((prev) => [
      ...prev,
      { phaseName: lastPhase, instruction: '', timerMinutes: '', tipText: '' },
    ]);
  };

  const updateStepRow = (index: number, updates: Partial<StepRow>) => {
    if (isReadOnly) return;
    setStepRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...updates } : row))
    );
  };

  const removeStepRow = (index: number) => {
    if (isReadOnly) return;
    if (stepRows.length <= 1) {
      alert('Công thức cần ít nhất một bước thực hiện');
      return;
    }
    setStepRows((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleTaxonomy = (id: number) => {
    if (isReadOnly) return;
    setSelectedTaxonomyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleUpdate = async (targetStatus?: string) => {
    if (isReadOnly) {
      alert('Công thức đã xuất bản không được chỉnh sửa trực tiếp (Invariants §5.1)');
      return;
    }

    setErrorMsg(null);
    if (!name.trim() || !shortDescription.trim()) {
      setErrorMsg('Vui lòng điền đủ tên công thức và tóm tắt ngắn.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        shortDescription: shortDescription.trim(),
        role,
        status: targetStatus || status,
        baseServings: Number(baseServings),
        prepTimeMinutes: Number(prepTimeMinutes),
        cookTimeMinutes: Number(cookTimeMinutes),
        difficulty,
        caloriesPerServing: caloriesPerServing ? Number(caloriesPerServing) : null,
        heroImage: heroImage.trim() || null,
        ingredients: ingredientRows.map((r, idx) => ({
          ingredientId: Number(r.ingredientId),
          amount: Number(r.amount),
          unit: r.unit,
          scalePolicy: r.scalePolicy,
          preparation: r.preparation || null,
          isOptional: r.isOptional,
          sortOrder: idx + 1,
        })),
        steps: stepRows.map((s, idx) => ({
          stepNumber: idx + 1,
          phaseName: s.phaseName,
          instruction: s.instruction.trim(),
          timerSeconds: s.timerMinutes ? Number(s.timerMinutes) * 60 : null,
          tipText: s.tipText ? s.tipText.trim() : null,
          image: s.image || null,
        })),
        taxonomyIds: selectedTaxonomyIds,
      };

      const res = await fetch(`/api/recipes/${recipeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Lỗi khi cập nhật công thức');
      }

      router.push('/editor/recipes');
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã xảy ra lỗi kết nối');
    } finally {
      setSubmitting(false);
    }
  };

  const taxonomiesByType = availableTaxonomies.reduce<Record<string, TaxonomyOption[]>>(
    (acc, item) => {
      acc[item.type] = acc[item.type] || [];
      acc[item.type].push(item);
      return acc;
    },
    {}
  );

  const TYPE_NAMES: Record<string, string> = {
    CUISINE_REGION: 'Vùng miền ẩm thực',
    COOKING_METHOD: 'Phương pháp chế biến',
    DIET_PREFERENCE: 'Đặc trưng dinh dưỡng',
    OCCASION: 'Dịp thưởng thức',
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-[#FAF7F0] flex items-center justify-center">
        <p className="text-sm font-medium text-[#7C6A59]">Đang tải dữ liệu công thức...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#2D2A26] pb-24">
      {/* Sticky Header */}
      <header className="bg-white border-b border-[#EADBC8] sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/editor/recipes"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7C6A59] hover:text-[#3F6240] p-1.5 rounded-lg hover:bg-[#F3E9DD] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại danh sách
            </Link>
            <div className="h-4 w-px bg-[#EADBC8]" />
            <h1 className="text-base font-bold text-[#3F6240] flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-[#B75B35]" />
              Chi Tiết / Biên Tập Công Thức #{recipeId}
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#3F6240]/10 text-[#3F6240]">
                v{versionNumber}
              </span>
              {provenance === 'AI_ASSISTED' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Bản thảo AI</span>
                </span>
              )}
              {revisionOfId && (
                <Link
                  href={`/editor/recipes/${revisionOfId}`}
                  className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#B75B35] hover:underline"
                >
                  <GitBranch className="w-3 h-3" /> bản sửa đổi của #{revisionOfId}
                </Link>
              )}
            </h1>
          </div>

          {!isReadOnly && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleUpdate('DRAFT')}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-[#5C4A3A] border border-[#EADBC8] text-xs font-semibold rounded-xl hover:bg-[#FAF7F0] transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-[#7C6A59]" />
                Lưu thay đổi
              </button>
              <button
                type="button"
                onClick={() => handleUpdate('SUBMITTED')}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3F6240] text-white text-xs font-semibold rounded-xl hover:bg-[#324f33] transition-all disabled:opacity-50 shadow-xs"
              >
                <Send className="w-4 h-4" />
                Gửi duyệt (SUBMITTED)
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {/* Pipeline trạng thái công thức (4 chặng) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EADBC8] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7C6A59]">
              Pipeline Vòng đời Công thức (Phiên bản v{versionNumber})
            </span>
            <span className="text-xs font-bold text-[#3F6240]">
              Trạng thái: {status}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { key: 'DRAFT', label: '1. Soạn bản thảo', active: status === 'DRAFT', done: ['SUBMITTED', 'NEEDS_CHANGES', 'PUBLISHED', 'ARCHIVED'].includes(status) },
              { key: 'SUBMITTED', label: '2. Nộp chờ duyệt', active: status === 'SUBMITTED', done: ['PUBLISHED', 'ARCHIVED'].includes(status) },
              { key: 'NEEDS_CHANGES', label: status === 'NEEDS_CHANGES' ? '3. Cần chỉnh sửa' : '3. Kiểm nghiệm Gate', active: status === 'NEEDS_CHANGES', done: ['PUBLISHED', 'ARCHIVED'].includes(status) },
              { key: 'PUBLISHED', label: status === 'ARCHIVED' ? '4. Đã lưu trữ (v cũ)' : '4. Xuất bản công khai', active: status === 'PUBLISHED', done: status === 'PUBLISHED' || status === 'ARCHIVED' },
            ].map((st) => (
              <div
                key={st.key}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  st.key === 'NEEDS_CHANGES' && st.active
                    ? 'bg-orange-50 border-orange-300 text-orange-800'
                    : st.active
                    ? 'bg-[#3F6240] text-white border-[#3F6240]'
                    : st.done
                    ? 'bg-[#EAF0EA] border-[#BCD0BE] text-[#3F6240]'
                    : 'bg-[#FAF7F0] border-[#EADBC8] text-[#9C8B7A]'
                }`}
              >
                <Check className={`w-3.5 h-3.5 shrink-0 ${st.done || st.active ? 'opacity-100' : 'opacity-30'}`} />
                <span className="truncate">{st.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Invariant Banner if Published */}
        {status === 'PUBLISHED' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
            <Lock className="w-5 h-5 shrink-0 text-amber-700" />
            <div className="flex-1">
              <p className="font-bold">Công thức này đã được xuất bản (PUBLISHED · v{versionNumber})</p>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Theo quy tắc bất biến <strong>Invariants §5.1</strong>, nội dung đã xuất bản không được chỉnh sửa trực tiếp. Hãy tạo bản sửa đổi — bản hiện tại vẫn phục vụ người nấu cho đến khi bản mới được duyệt.
              </p>
            </div>
            <button
              id="create-revision-button"
              type="button"
              onClick={handleCreateRevision}
              disabled={creatingRevision}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#3F6240] text-white text-xs font-semibold rounded-xl hover:bg-[#324f33] transition-all disabled:opacity-50 shadow-xs shrink-0"
            >
              <GitBranch className="w-4 h-4" />
              {openRevisionId
                ? `Mở bản sửa đổi đang soạn #${openRevisionId}`
                : creatingRevision
                  ? 'Đang tạo...'
                  : `Tạo bản sửa đổi mới (v${versionNumber + 1})`}
            </button>
            {publicSlug && (
              <Link
                id="view-public-recipe-link"
                href={`/cong-thuc/${encodeURIComponent(publicSlug)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white text-[#3F6240] border border-[#BCD0BE] text-xs font-semibold rounded-xl hover:bg-[#EAF0EA] transition-all shadow-xs shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
                Xem trang công khai
              </Link>
            )}
          </div>
        )}

        {status === 'ARCHIVED' && (
          <div className="bg-stone-100 border border-stone-300 text-stone-700 p-4 rounded-2xl flex items-start gap-3 text-sm">
            <Archive className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Phiên bản lưu trữ (ARCHIVED · v{versionNumber})</p>
              <p className="text-xs mt-1">
                Đây là lịch sử bất biến đã được thay thế bởi một phiên bản mới hơn. Không thể chỉnh sửa hoặc xoá.
              </p>
            </div>
          </div>
        )}

        {status === 'NEEDS_CHANGES' && reviewNotes && (
          <div className="bg-orange-50 border border-orange-200 text-orange-900 p-4 rounded-2xl flex items-start gap-3 text-sm">
            <MessageSquareWarning className="w-5 h-5 shrink-0 text-orange-600 mt-0.5" />
            <div>
              <p className="font-bold">Quản trị viên yêu cầu chỉnh sửa trước khi xuất bản</p>
              <p className="text-xs mt-1 leading-relaxed whitespace-pre-line">{reviewNotes}</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Section 1: Thông tin cơ bản */}
        <section className="bg-white p-6 rounded-2xl border border-[#EADBC8] shadow-xs space-y-5">
          <h2 className="text-base font-bold text-[#3F6240] flex items-center gap-2 border-b border-[#F3E9DD] pb-3">
            <span>1. Thông tin chung & Định lượng</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">Tên công thức</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3F6240] focus:bg-white font-medium disabled:opacity-70"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">Món ăn liên kết</label>
              <input
                type="text"
                disabled
                value={dishName || name}
                className="w-full px-3.5 py-2.5 bg-[#F3E9DD]/50 border border-[#EADBC8] rounded-xl text-sm font-medium text-[#7C6A59]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">Mô tả ngắn</label>
            <textarea
              rows={2}
              disabled={isReadOnly}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3F6240] disabled:opacity-70 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">Vai trò</label>
              <select
                disabled={isReadOnly}
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-xs font-medium text-[#5C4A3A] disabled:opacity-70"
              >
                <option value="MAIN">Món chính (Mặn)</option>
                <option value="SOUP">Món canh</option>
                <option value="SIDE">Món phụ / Rau xào</option>
                <option value="DIPPING_SAUCE">Nước chấm / Sốt</option>
                <option value="ONE_DISH_MEAL">Món một đĩa</option>
                <option value="DESSERT">Tráng miệng</option>
                <option value="BEVERAGE">Đồ uống</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">Khẩu phần cơ sở</label>
              <input
                type="number"
                disabled={isReadOnly}
                value={baseServings}
                onChange={(e) => setBaseServings(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-xs disabled:opacity-70"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">Chuẩn bị (phút)</label>
              <input
                type="number"
                disabled={isReadOnly}
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-xs disabled:opacity-70"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">Nấu chín (phút)</label>
              <input
                type="number"
                disabled={isReadOnly}
                value={cookTimeMinutes}
                onChange={(e) => setCookTimeMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-xs disabled:opacity-70"
              />
            </div>
          </div>

          {/* Khu vực Calo / Khẩu phần & Đồng bộ Viện Dinh Dưỡng (FCT) */}
          <div className="p-3.5 rounded-xl bg-[#FAF7F0] border border-[#EADBC8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                <label className="block text-xs font-bold text-[#3F6240] mb-1">
                  Năng lượng 1 khẩu phần (kcal)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    disabled={isReadOnly}
                    placeholder="Tự động tính..."
                    value={caloriesPerServing}
                    onChange={(e) =>
                      setCaloriesPerServing(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-32 px-3 py-1.5 bg-white border border-[#EADBC8] rounded-lg text-xs font-bold text-[#2D2A26] disabled:opacity-70"
                  />
                  <span className="text-[11px] text-[#7C6A59]">
                    kcal / người (Đã trừ hao hụt phần thải bỏ theo Viện Dinh Dưỡng)
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRecalculateNutrition}
              disabled={calculatingNut}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              {calculatingNut ? 'Đang tính toán...' : '⚡ Tính chuẩn Viện Dinh Dưỡng (FCT)'}
            </button>
          </div>

          <div>
            <ImageUpload
              label="Ảnh đại diện món ăn (Hero image)"
              value={heroImage}
              onChange={setHeroImage}
              onRemove={() => setHeroImage('')}
              hint="Tải ảnh món cơm nhà hấp dẫn (JPG/PNG/WebP, tối đa 5MB)"
              aspectRatio="video"
              disabled={isReadOnly}
            />
          </div>
        </section>

        {/* Section 2: Nguyên liệu có cấu trúc */}
        <section className="bg-white p-6 rounded-2xl border border-[#EADBC8] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F3E9DD] pb-3">
            <h2 className="text-base font-bold text-[#3F6240]">
              2. Danh sách nguyên liệu ({ingredientRows.length} món)
            </h2>

            {!isReadOnly && (
              <button
                type="button"
                onClick={addIngredientRow}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FAF7F0] hover:bg-[#F3E9DD] text-[#3F6240] text-xs font-semibold rounded-xl border border-[#EADBC8] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm dòng
              </button>
            )}
          </div>

          <div className="space-y-3">
            {ingredientRows.map((row, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#FAF7F0] rounded-xl border border-[#EADBC8] grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
              >
                <div className="md:col-span-4">
                  <select
                    disabled={isReadOnly}
                    value={row.ingredientId}
                    onChange={(e) => {
                      const selId = Number(e.target.value);
                      const target = availableIngredients.find((i) => i.id === selId);
                      updateIngredientRow(idx, {
                        ingredientId: selId,
                        unit: target ? target.standardUnit : row.unit,
                      });
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#EADBC8] rounded-lg text-xs font-medium text-[#2D2A26] disabled:opacity-70"
                  >
                    {availableIngredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 flex gap-1.5">
                  <input
                    type="number"
                    step="any"
                    disabled={isReadOnly}
                    value={row.amount}
                    onChange={(e) =>
                      updateIngredientRow(idx, {
                        amount: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                    className="w-full px-2 py-1.5 bg-white border border-[#EADBC8] rounded-lg text-xs disabled:opacity-70"
                  />
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={row.unit}
                    onChange={(e) => updateIngredientRow(idx, { unit: e.target.value })}
                    className="w-16 px-2 py-1.5 bg-white border border-[#EADBC8] rounded-lg text-xs disabled:opacity-70"
                  />
                </div>

                <div className="md:col-span-2">
                  <select
                    disabled={isReadOnly}
                    value={row.scalePolicy}
                    onChange={(e) =>
                      updateIngredientRow(idx, { scalePolicy: e.target.value as any })
                    }
                    className="w-full px-2 py-1.5 bg-white border border-[#EADBC8] rounded-lg text-xs font-medium disabled:opacity-70"
                  >
                    <option value="LINEAR">Tỉ lệ thuận</option>
                    <option value="FIXED">Cố định</option>
                    <option value="MANUAL_ADJUST">Tùy chỉnh</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    placeholder="Sơ chế..."
                    value={row.preparation}
                    onChange={(e) => updateIngredientRow(idx, { preparation: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#EADBC8] rounded-lg text-xs disabled:opacity-70"
                  />
                </div>

                {!isReadOnly && (
                  <div className="md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeIngredientRow(idx)}
                      className="p-1.5 text-[#9C8B7A] hover:text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Các bước thực hiện */}
        <section className="bg-white p-6 rounded-2xl border border-[#EADBC8] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F3E9DD] pb-3">
            <h2 className="text-base font-bold text-[#3F6240]">
              3. Các bước nấu ({stepRows.length} bước)
            </h2>

            {!isReadOnly && (
              <button
                type="button"
                onClick={addStepRow}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FAF7F0] hover:bg-[#F3E9DD] text-[#3F6240] text-xs font-semibold rounded-xl border border-[#EADBC8] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm bước
              </button>
            )}
          </div>

          {/* Tóm tắt Pipeline Giai đoạn nấu */}
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[#FAF7F0] border border-[#EADBC8]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7C6A59] mr-1">
              Pipeline giai đoạn:
            </span>
            {PHASES.map((phaseName, pIdx) => {
              const count = stepRows.filter((s) => s.phaseName === phaseName).length;
              return (
                <span
                  key={phaseName}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                    count > 0
                      ? 'bg-white border-[#BCD0BE] text-[#3F6240]'
                      : 'bg-stone-100/70 border-stone-200 text-stone-400'
                  }`}
                >
                  <span>{pIdx + 1}. {phaseName}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-[#EAF0EA] text-[10px] font-bold">
                    {count} bước
                  </span>
                </span>
              );
            })}
          </div>

          <div className="space-y-4">
            {stepRows.map((step, idx) => (
              <div
                key={idx}
                className="p-4 bg-[#FAF7F0] rounded-xl border border-[#EADBC8] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#3F6240] text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <select
                      disabled={isReadOnly}
                      value={step.phaseName}
                      onChange={(e) => updateStepRow(idx, { phaseName: e.target.value })}
                      className="px-2.5 py-1 bg-white border border-[#EADBC8] rounded-lg text-xs font-semibold text-[#5C4A3A] disabled:opacity-70"
                    >
                      {PHASES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white px-2.5 py-1 border border-[#EADBC8] rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-[#B75B35]" />
                      <span className="text-[11px] text-[#7C6A59]">Hẹn giờ:</span>
                      <input
                        type="number"
                        disabled={isReadOnly}
                        value={step.timerMinutes}
                        onChange={(e) =>
                          updateStepRow(idx, {
                            timerMinutes: e.target.value === '' ? '' : Number(e.target.value),
                          })
                        }
                        className="w-12 text-xs font-medium focus:outline-none text-right disabled:opacity-70"
                      />
                      <span className="text-[11px] text-[#7C6A59]">phút</span>
                    </div>

                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => removeStepRow(idx)}
                        className="p-1 text-[#9C8B7A] hover:text-red-600 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  rows={2}
                  disabled={isReadOnly}
                  value={step.instruction}
                  onChange={(e) => updateStepRow(idx, { instruction: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#EADBC8] rounded-xl text-xs text-[#2D2A26] disabled:opacity-70 leading-relaxed"
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  <div className="md:col-span-2 relative">
                    <Sparkles className="w-3.5 h-3.5 text-[#B75B35] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="Mẹo nhỏ..."
                      value={step.tipText}
                      onChange={(e) => updateStepRow(idx, { tipText: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-lg text-xs text-[#5C4A3A] italic disabled:opacity-70"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <ImageUpload
                      value={step.image}
                      onChange={(url) => updateStepRow(idx, { image: url })}
                      onRemove={() => updateStepRow(idx, { image: '' })}
                      hint="Ảnh bước nấu (tùy chọn)"
                      aspectRatio="wide"
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Hệ phân loại Taxonomies */}
        <section className="bg-white p-6 rounded-2xl border border-[#EADBC8] shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#3F6240] border-b border-[#F3E9DD] pb-3">
            4. Phân loại đa trục (Taxonomies)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(taxonomiesByType).map(([type, list]) => (
              <div key={type} className="p-3.5 bg-[#FAF7F0] rounded-xl border border-[#EADBC8] space-y-2">
                <h3 className="text-xs font-bold text-[#3F6240] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#B75B35]" />
                  {TYPE_NAMES[type] || type}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((item) => {
                    const isSelected = selectedTaxonomyIds.includes(item.id);
                    return (
                      <button
                        type="button"
                        key={item.id}
                        disabled={isReadOnly}
                        onClick={() => toggleTaxonomy(item.id)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                          isSelected
                            ? 'bg-[#3F6240] text-white border-[#3F6240]'
                            : 'bg-white text-[#5C4A3A] border-[#EADBC8]'
                        } disabled:opacity-70`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
