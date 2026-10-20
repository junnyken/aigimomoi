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
} from 'lucide-react';

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
  const [role, setRole] = useState<'MAIN' | 'SOUP' | 'SIDE' | 'ONE_DISH_MEAL'>('MAIN');
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
          const { recipe } = await recipeRes.json();
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

  const isPublished = status === 'PUBLISHED';

  // Dynamic rows handlers
  const addIngredientRow = () => {
    if (isPublished) return;
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
    if (isPublished) return;
    setIngredientRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...updates } : row))
    );
  };

  const removeIngredientRow = (index: number) => {
    if (isPublished) return;
    if (ingredientRows.length <= 1) {
      alert('Công thức cần ít nhất một nguyên liệu');
      return;
    }
    setIngredientRows((prev) => prev.filter((_, i) => i !== index));
  };

  const addStepRow = () => {
    if (isPublished) return;
    const lastPhase = stepRows[stepRows.length - 1]?.phaseName || 'Chế biến';
    setStepRows((prev) => [
      ...prev,
      { phaseName: lastPhase, instruction: '', timerMinutes: '', tipText: '' },
    ]);
  };

  const updateStepRow = (index: number, updates: Partial<StepRow>) => {
    if (isPublished) return;
    setStepRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...updates } : row))
    );
  };

  const removeStepRow = (index: number) => {
    if (isPublished) return;
    if (stepRows.length <= 1) {
      alert('Công thức cần ít nhất một bước thực hiện');
      return;
    }
    setStepRows((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleTaxonomy = (id: number) => {
    if (isPublished) return;
    setSelectedTaxonomyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleUpdate = async (targetStatus?: string) => {
    if (isPublished) {
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
            </h1>
          </div>

          {!isPublished && (
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
        {/* Invariant Banner if Published */}
        {isPublished && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl flex items-start gap-3 text-sm">
            <Lock className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" />
            <div>
              <p className="font-bold">Công thức này đã được xuất bản (PUBLISHED)</p>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Theo quy tắc bất biến <strong>Invariants §5.1</strong>, nội dung công thức đã xuất bản không được chỉnh sửa trực tiếp nhằm bảo vệ tính toàn vẹn cho người nấu. Để cập nhật phiên bản mới, hệ thống sẽ sử dụng cơ chế Revision (AG-15).
              </p>
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
                disabled={isPublished}
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
              disabled={isPublished}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3F6240] disabled:opacity-70 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">Vai trò</label>
              <select
                disabled={isPublished}
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-xs font-medium text-[#5C4A3A] disabled:opacity-70"
              >
                <option value="MAIN">Món chính (Mặn)</option>
                <option value="SOUP">Món canh</option>
                <option value="SIDE">Món phụ / Rau xào</option>
                <option value="ONE_DISH_MEAL">Món một đĩa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">Khẩu phần cơ sở</label>
              <input
                type="number"
                disabled={isPublished}
                value={baseServings}
                onChange={(e) => setBaseServings(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-xs disabled:opacity-70"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">Chuẩn bị (phút)</label>
              <input
                type="number"
                disabled={isPublished}
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-xs disabled:opacity-70"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">Nấu chín (phút)</label>
              <input
                type="number"
                disabled={isPublished}
                value={cookTimeMinutes}
                onChange={(e) => setCookTimeMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-xs disabled:opacity-70"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Nguyên liệu có cấu trúc */}
        <section className="bg-white p-6 rounded-2xl border border-[#EADBC8] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F3E9DD] pb-3">
            <h2 className="text-base font-bold text-[#3F6240]">
              2. Danh sách nguyên liệu ({ingredientRows.length} món)
            </h2>

            {!isPublished && (
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
                    disabled={isPublished}
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
                    disabled={isPublished}
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
                    disabled={isPublished}
                    value={row.unit}
                    onChange={(e) => updateIngredientRow(idx, { unit: e.target.value })}
                    className="w-16 px-2 py-1.5 bg-white border border-[#EADBC8] rounded-lg text-xs disabled:opacity-70"
                  />
                </div>

                <div className="md:col-span-2">
                  <select
                    disabled={isPublished}
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
                    disabled={isPublished}
                    placeholder="Sơ chế..."
                    value={row.preparation}
                    onChange={(e) => updateIngredientRow(idx, { preparation: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#EADBC8] rounded-lg text-xs disabled:opacity-70"
                  />
                </div>

                {!isPublished && (
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

            {!isPublished && (
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
                      disabled={isPublished}
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
                        disabled={isPublished}
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

                    {!isPublished && (
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
                  disabled={isPublished}
                  value={step.instruction}
                  onChange={(e) => updateStepRow(idx, { instruction: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#EADBC8] rounded-xl text-xs text-[#2D2A26] disabled:opacity-70 leading-relaxed"
                />

                <div className="relative">
                  <Sparkles className="w-3.5 h-3.5 text-[#B75B35] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    disabled={isPublished}
                    placeholder="Mẹo nhỏ..."
                    value={step.tipText}
                    onChange={(e) => updateStepRow(idx, { tipText: e.target.value })}
                    className="w-full pl-8 pr-3 py-1.5 bg-[#FAF7F0] border border-[#EADBC8] rounded-lg text-xs text-[#5C4A3A] italic disabled:opacity-70"
                  />
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
                        disabled={isPublished}
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
