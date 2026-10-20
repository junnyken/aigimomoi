'use client';

// AG-31: Contributor Recipe Edit & Resubmit Page
// Cho phép tác giả cập nhật bản nháp hoặc chỉnh sửa theo góp ý của ban biên tập rồi nộp lại.

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  ChefHat,
  Plus,
  Trash2,
  Save,
  Send,
  AlertCircle,
  ShieldCheck,
  MessageSquareWarning,
} from 'lucide-react';
import { ImageUpload } from '@/components/ui/ImageUpload';

interface IngredientOption {
  id: number;
  name: string;
  category: string;
  standardUnit: string;
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

export default function ContributorEditRecipePage() {
  const router = useRouter();
  const params = useParams();
  const recipeId = params?.id as string;

  const [availableIngredients, setAvailableIngredients] = useState<IngredientOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [role, setRole] = useState<'MAIN' | 'SOUP' | 'SIDE' | 'ONE_DISH_MEAL'>('MAIN');
  const [status, setStatus] = useState<string>('DRAFT');
  const [reviewNotes, setReviewNotes] = useState<string | null>(null);
  const [baseServings, setBaseServings] = useState<number>(4);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number>(15);
  const [cookTimeMinutes, setCookTimeMinutes] = useState<number>(30);
  const [difficulty, setDifficulty] = useState('Dễ');
  const [heroImage, setHeroImage] = useState('');

  // Structured Ingredients & Steps
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>([]);
  const [stepRows, setStepRows] = useState<StepRow[]>([]);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingData(true);
        const [ingRes, recRes] = await Promise.all([
          fetch('/api/ingredients'),
          fetch(`/api/contribute/recipes/${recipeId}`),
        ]);

        if (ingRes.ok) {
          const data = await ingRes.json();
          setAvailableIngredients(data.ingredients || []);
        }

        if (recRes.ok) {
          const { recipe } = await recRes.json();
          setName(recipe.name);
          setShortDescription(recipe.shortDescription);
          setRole(recipe.role);
          setStatus(recipe.status);
          setReviewNotes(recipe.reviewNotes || null);
          setBaseServings(recipe.baseServings);
          setPrepTimeMinutes(recipe.prepTimeMinutes);
          setCookTimeMinutes(recipe.cookTimeMinutes);
          setDifficulty(recipe.difficulty);
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
        } else {
          setErrorMsg('Không thể tải bài đóng góp này.');
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu bài đóng góp:', err);
      } finally {
        setLoadingData(false);
      }
    }

    if (recipeId) {
      loadData();
    }
  }, [recipeId]);

  const addIngredientRow = () => {
    const firstId = availableIngredients.length > 0 ? availableIngredients[0].id : 0;
    const firstUnit = availableIngredients.length > 0 ? availableIngredients[0].standardUnit : 'g';
    setIngredientRows((prev) => [
      ...prev,
      { ingredientId: firstId, amount: 100, unit: firstUnit, scalePolicy: 'LINEAR', preparation: '', isOptional: false },
    ]);
  };

  const updateIngredientRow = (index: number, updates: Partial<IngredientRow>) => {
    setIngredientRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...updates } : row))
    );
  };

  const removeIngredientRow = (index: number) => {
    if (ingredientRows.length <= 1) {
      alert('Công thức cần có ít nhất một nguyên liệu');
      return;
    }
    setIngredientRows((prev) => prev.filter((_, i) => i !== index));
  };

  const addStepRow = () => {
    setStepRows((prev) => [
      ...prev,
      { phaseName: 'Chế biến', instruction: '', timerMinutes: '', tipText: '' },
    ]);
  };

  const updateStepRow = (index: number, updates: Partial<StepRow>) => {
    setStepRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...updates } : row))
    );
  };

  const removeStepRow = (index: number) => {
    if (stepRows.length <= 1) {
      alert('Công thức cần ít nhất một bước thực hiện');
      return;
    }
    setStepRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (submitNow: boolean) => {
    setErrorMsg(null);

    if (!name.trim() || !shortDescription.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ tên và mô tả món ăn.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        shortDescription: shortDescription.trim(),
        role,
        baseServings: Number(baseServings),
        prepTimeMinutes: Number(prepTimeMinutes),
        cookTimeMinutes: Number(cookTimeMinutes),
        difficulty,
        heroImage: heroImage.trim() || null,
        ingredients: ingredientRows.map((r) => ({
          ingredientId: Number(r.ingredientId),
          amount: Number(r.amount),
          unit: r.unit,
          scalePolicy: r.scalePolicy,
          preparation: r.preparation.trim() || null,
          isOptional: r.isOptional,
        })),
        steps: stepRows.map((s, idx) => ({
          stepNumber: idx + 1,
          phaseName: s.phaseName,
          instruction: s.instruction.trim(),
          timerMinutes: s.timerMinutes ? Number(s.timerMinutes) : null,
          tipText: s.tipText.trim() || null,
        })),
        submitNow,
      };

      const res = await fetch(`/api/contribute/recipes/${recipeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Lỗi khi cập nhật công thức.');
      }

      router.push('/contribute');
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setSubmitting(false);
    }
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
              href="/contribute"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7C6A59] hover:text-[#3F6240] p-1.5 rounded-lg hover:bg-[#F3E9DD] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Bếp nhà của tôi
            </Link>
            <div className="h-4 w-px bg-[#EADBC8]" />
            <h1 className="text-base font-bold text-[#3F6240] flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-[#B75B35]" />
              Chỉnh Sửa Công Thức #{recipeId}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-[#5C4A3A] border border-[#EADBC8] text-xs font-semibold rounded-xl hover:bg-[#FAF7F0] transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#7C6A59]" />
              <span>Lưu nháp</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3F6240] text-white text-xs font-semibold rounded-xl hover:bg-[#324f33] transition-all disabled:opacity-50 shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>{status === 'NEEDS_CHANGES' ? 'Nộp lại sau khi sửa' : 'Gửi cho Ban biên tập'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {/* Editor Review Notes if NEEDS_CHANGES */}
        {status === 'NEEDS_CHANGES' && reviewNotes && (
          <div className="bg-orange-50 border border-orange-200 p-5 rounded-2xl flex items-start gap-3">
            <MessageSquareWarning className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-orange-900">Góp ý từ Ban biên tập:</h3>
              <p className="text-xs text-orange-800 leading-relaxed italic">&ldquo;{reviewNotes}&rdquo;</p>
              <p className="text-[11px] text-orange-700 pt-1">
                Vui lòng cập nhật các nội dung trên và bấm <strong>Nộp lại sau khi sửa</strong> để Ban biên tập tiến hành duyệt lại.
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Section 1: Thông tin cơ bản */}
        <section className="bg-white p-6 rounded-2xl border border-[#EADBC8] shadow-xs space-y-5">
          <h2 className="text-base font-bold text-[#3F6240] border-b border-[#F3E9DD] pb-3">
            1. Thông tin chung về món ăn
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">
                Tên công thức <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3F6240]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">
                Vai trò trong mâm cơm
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3F6240]"
              >
                <option value="MAIN">Món chính (Mặn)</option>
                <option value="SOUP">Món canh</option>
                <option value="SIDE">Món phụ / Rau xào</option>
                <option value="ONE_DISH_MEAL">Món ăn một đĩa</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">
              Mô tả ngắn hương vị & nguồn gốc <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3F6240]"
              required
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">Khẩu phần chuẩn</label>
              <input
                type="number"
                min={1}
                max={20}
                value={baseServings}
                onChange={(e) => setBaseServings(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-sm text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">Sơ chế (phút)</label>
              <input
                type="number"
                min={0}
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-sm text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">Nấu chín (phút)</label>
              <input
                type="number"
                min={0}
                value={cookTimeMinutes}
                onChange={(e) => setCookTimeMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-sm text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">Độ khó</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-sm"
              >
                <option value="Dễ">Dễ</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Khó">Khó</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">Ảnh món ăn</label>
            <ImageUpload
              value={heroImage}
              onChange={setHeroImage}
              hint="Tải lên ảnh chụp mâm cơm thật của gia đình bạn"
            />
          </div>
        </section>

        {/* Section 2: Nguyên liệu */}
        <section className="bg-white p-6 rounded-2xl border border-[#EADBC8] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F3E9DD] pb-3">
            <h2 className="text-base font-bold text-[#3F6240]">
              2. Nguyên liệu định lượng ({ingredientRows.length})
            </h2>
            <button
              type="button"
              onClick={addIngredientRow}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FAF7F0] hover:bg-[#F3E9DD] text-[#3F6240] text-xs font-semibold rounded-lg border border-[#EADBC8] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm nguyên liệu</span>
            </button>
          </div>

          <div className="space-y-3">
            {ingredientRows.map((row, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-[#FAF7F0] border border-[#EADBC8] grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
              >
                <div className="sm:col-span-4">
                  <select
                    value={row.ingredientId}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      const found = availableIngredients.find((i) => i.id === id);
                      updateIngredientRow(index, {
                        ingredientId: id,
                        unit: found ? found.standardUnit : row.unit,
                      });
                    }}
                    className="w-full px-3 py-2 bg-white border border-[#EADBC8] rounded-lg text-xs font-medium"
                  >
                    {availableIngredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="number"
                    min={0.1}
                    step="any"
                    value={row.amount}
                    onChange={(e) => updateIngredientRow(index, { amount: e.target.value === '' ? '' : Number(e.target.value) })}
                    placeholder="Số lượng"
                    className="w-full px-3 py-2 bg-white border border-[#EADBC8] rounded-lg text-xs text-center"
                  />
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={row.unit}
                    onChange={(e) => updateIngredientRow(index, { unit: e.target.value })}
                    placeholder="Đơn vị"
                    className="w-full px-3 py-2 bg-white border border-[#EADBC8] rounded-lg text-xs text-center"
                  />
                </div>

                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={row.preparation}
                    onChange={(e) => updateIngredientRow(index, { preparation: e.target.value })}
                    placeholder="Sơ chế"
                    className="w-full px-3 py-2 bg-white border border-[#EADBC8] rounded-lg text-xs"
                  />
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeIngredientRow(index)}
                    className="p-1.5 text-stone-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Các bước thực hiện */}
        <section className="bg-white p-6 rounded-2xl border border-[#EADBC8] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F3E9DD] pb-3">
            <h2 className="text-base font-bold text-[#3F6240]">
              3. Các bước thực hiện ({stepRows.length})
            </h2>
            <button
              type="button"
              onClick={addStepRow}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FAF7F0] hover:bg-[#F3E9DD] text-[#3F6240] text-xs font-semibold rounded-lg border border-[#EADBC8] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm bước</span>
            </button>
          </div>

          <div className="space-y-4">
            {stepRows.map((step, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-[#FAF7F0] border border-[#EADBC8] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#3F6240] text-white text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <select
                      value={step.phaseName}
                      onChange={(e) => updateStepRow(index, { phaseName: e.target.value })}
                      className="px-2.5 py-1 bg-white border border-[#EADBC8] rounded-lg text-xs font-medium"
                    >
                      <option value="Sơ chế">Sơ chế</option>
                      <option value="Chế biến">Chế biến</option>
                      <option value="Hoàn thành">Hoàn thành</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-[#7C6A59]">
                      <span>Hẹn giờ:</span>
                      <input
                        type="number"
                        min={0}
                        value={step.timerMinutes}
                        onChange={(e) => updateStepRow(index, { timerMinutes: e.target.value === '' ? '' : Number(e.target.value) })}
                        placeholder="phút"
                        className="w-16 px-2 py-1 bg-white border border-[#EADBC8] rounded text-center text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeStepRow(index)}
                      className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={step.instruction}
                  onChange={(e) => updateStepRow(index, { instruction: e.target.value })}
                  placeholder={`Hướng dẫn chi tiết bước ${index + 1}...`}
                  className="w-full px-3 py-2 bg-white border border-[#EADBC8] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#3F6240]"
                  required
                />

                <input
                  type="text"
                  value={step.tipText}
                  onChange={(e) => updateStepRow(index, { tipText: e.target.value })}
                  placeholder="💡 Mẹo nhỏ cho bước này..."
                  className="w-full px-3 py-1.5 bg-amber-50/50 border border-amber-200/60 rounded-lg text-xs text-[#5C4A3A]"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EADBC8]">
          <Link
            href="/contribute"
            className="px-4 py-2.5 text-xs font-semibold text-[#7C6A59] hover:bg-[#F3E9DD] rounded-xl transition-colors"
          >
            Hủy bỏ
          </Link>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="px-5 py-2.5 bg-white text-[#5C4A3A] border border-[#EADBC8] text-xs font-semibold rounded-xl hover:bg-[#FAF7F0] transition-all disabled:opacity-50"
          >
            Lưu bản nháp (DRAFT)
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            className="px-6 py-2.5 bg-[#3F6240] text-white text-xs font-semibold rounded-xl hover:bg-[#324f33] transition-all disabled:opacity-50 shadow-xs"
          >
            {submitting ? 'Đang gửi...' : status === 'NEEDS_CHANGES' ? 'Nộp lại sau khi sửa' : 'Gửi cho Ban biên tập'}
          </button>
        </div>
      </main>
    </div>
  );
}
