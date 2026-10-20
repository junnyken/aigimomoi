'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChefHat,
  Plus,
  Trash2,
  Clock,
  Save,
  Send,
  AlertCircle,
  HelpCircle,
  Check,
  Tag,
  Sparkles,
} from 'lucide-react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { AiDraftModal } from '@/components/editor/AiDraftModal';
import type { AiRecipeDraftPayload } from '@/lib/ai/recipeDraftGenerator';

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
const SCALE_POLICIES = [
  { value: 'LINEAR', label: 'Tỉ lệ thuận (LINEAR)', desc: 'Co giãn theo số người' },
  { value: 'FIXED', label: 'Cố định (FIXED)', desc: 'Dầu mỡ, lá thơm, gia vị cơ bản' },
  { value: 'MANUAL_ADJUST', label: 'Tùy chỉnh (MANUAL)', desc: 'Gia vị cần nếm thử' },
];

export default function NewRecipePage() {
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
  const [baseServings, setBaseServings] = useState<number>(4);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number>(15);
  const [cookTimeMinutes, setCookTimeMinutes] = useState<number>(30);
  const [difficulty, setDifficulty] = useState('Dễ');
  const [caloriesPerServing, setCaloriesPerServing] = useState<number | ''>('');
  const [heroImage, setHeroImage] = useState('');

  // Structured Ingredients
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>([
    { ingredientId: 0, amount: 400, unit: 'g', scalePolicy: 'LINEAR', preparation: '', isOptional: false },
  ]);

  // Structured Steps
  const [stepRows, setStepRows] = useState<StepRow[]>([
    { phaseName: 'Sơ chế', instruction: '', timerMinutes: '', tipText: '' },
    { phaseName: 'Chế biến', instruction: '', timerMinutes: '', tipText: '' },
  ]);

  // Selected Taxonomies
  const [selectedTaxonomyIds, setSelectedTaxonomyIds] = useState<number[]>([]);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  useEffect(() => {
    async function loadRefs() {
      try {
        setLoadingData(true);
        const [ingRes, taxRes] = await Promise.all([
          fetch('/api/ingredients'),
          fetch('/api/taxonomies'),
        ]);

        if (ingRes.ok) {
          const ingData = await ingRes.json();
          setAvailableIngredients(ingData.ingredients || []);
          if (ingData.ingredients && ingData.ingredients.length > 0) {
            setIngredientRows((prev) =>
              prev.map((r) =>
                r.ingredientId === 0
                  ? { ...r, ingredientId: ingData.ingredients[0].id, unit: ingData.ingredients[0].standardUnit }
                  : r
              )
            );
          }
        }

        if (taxRes.ok) {
          const taxData = await taxRes.json();
          setAvailableTaxonomies(taxData.taxonomies || []);
        }
      } catch (e) {
        console.error('Failed loading form references', e);
      } finally {
        setLoadingData(false);
      }
    }

    loadRefs();
  }, []);

  // Handle Ingredients Dynamic Rows
  const addIngredientRow = () => {
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
    setIngredientRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...updates } : row))
    );
  };

  const removeIngredientRow = (index: number) => {
    if (ingredientRows.length <= 1) {
      alert('Công thức cần ít nhất một nguyên liệu');
      return;
    }
    setIngredientRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Steps Dynamic Rows
  const addStepRow = () => {
    const lastPhase = stepRows[stepRows.length - 1]?.phaseName || 'Chế biến';
    setStepRows((prev) => [
      ...prev,
      { phaseName: lastPhase, instruction: '', timerMinutes: '', tipText: '' },
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

  // Taxonomy toggle
  const toggleTaxonomy = (id: number) => {
    setSelectedTaxonomyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Áp dụng bản nháp từ AI Assistant
  const handleApplyDraft = (draft: AiRecipeDraftPayload) => {
    setName(draft.name);
    setDishName(draft.dishName);
    setShortDescription(draft.shortDescription);
    setRole(draft.role);
    setDifficulty(draft.difficulty);
    setBaseServings(draft.baseServings);
    setPrepTimeMinutes(draft.prepTimeMinutes);
    setCookTimeMinutes(draft.cookTimeMinutes);

    if (draft.ingredients.length > 0) {
      setIngredientRows(
        draft.ingredients.map((ing) => ({
          ingredientId: ing.ingredientId,
          amount: ing.amount,
          unit: ing.unit,
          scalePolicy: ing.scalePolicy,
          preparation: ing.preparation || '',
          isOptional: ing.isOptional,
        }))
      );
    }

    if (draft.steps.length > 0) {
      setStepRows(
        draft.steps.map((st) => ({
          phaseName: st.phaseName,
          instruction: st.instruction,
          timerMinutes: st.timerSeconds > 0 ? Math.round(st.timerSeconds / 60) : '',
          tipText: st.tipText || '',
        }))
      );
    }
  };

  // Submit Handler
  const handleSubmit = async (targetStatus: 'DRAFT' | 'SUBMITTED') => {
    setErrorMsg(null);

    // Basic Validation
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập tên công thức món ăn.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!shortDescription.trim()) {
      setErrorMsg('Vui lòng nhập tóm tắt ngắn về món ăn / hương vị.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    for (let i = 0; i < ingredientRows.length; i++) {
      const ing = ingredientRows[i];
      if (!ing.ingredientId || ing.amount === '' || Number(ing.amount) <= 0) {
        setErrorMsg(`Dòng nguyên liệu #${i + 1} chưa chọn hoặc định lượng chưa hợp lệ (> 0).`);
        return;
      }
    }

    for (let i = 0; i < stepRows.length; i++) {
      const st = stepRows[i];
      if (!st.instruction.trim()) {
        setErrorMsg(`Bước thực hiện #${i + 1} chưa có nội dung hướng dẫn.`);
        return;
      }
    }

    try {
      setSubmitting(true);

      const payload = {
        name: name.trim(),
        dishName: (dishName || name).trim(),
        shortDescription: shortDescription.trim(),
        role,
        status: targetStatus,
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

      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Lỗi khi lưu công thức');
      }

      router.push('/editor/recipes');
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã xảy ra lỗi kết nối');
    } finally {
      setSubmitting(false);
    }
  };

  // Group taxonomies by type
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
              Soạn Thảo Công Thức Mới
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-semibold rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all shadow-xs"
              title="Sử dụng AI để tự động tạo khung công thức"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Soạn bằng AI</span>
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('DRAFT')}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-[#5C4A3A] border border-[#EADBC8] text-xs font-semibold rounded-xl hover:bg-[#FAF7F0] transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#7C6A59]" />
              Lưu bản nháp
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('SUBMITTED')}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3F6240] text-white text-xs font-semibold rounded-xl hover:bg-[#324f33] transition-all disabled:opacity-50 shadow-xs"
            >
              <Send className="w-4 h-4" />
              Gửi phê duyệt
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
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
            <span>1. Thông tin chung & Định lượng bữa cơm</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">
                Tên công thức <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: Thịt kho hột vịt nước dừa Nam Bộ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3F6240] focus:bg-white transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">
                Khái niệm Món ăn (Dish concept)
              </label>
              <input
                type="text"
                placeholder="VD: Thịt kho tàu (để trống nếu trùng tên)"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3F6240] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">
              Mô tả ngắn hương vị & cảm quan <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="Thịt ba rọi mềm rục béo ngậy ngấm nước dừa ngọt dịu, trứng vịt bùi thơm, màu cánh gián tự nhiên không phẩm màu."
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3F6240] focus:bg-white transition-all leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">
                Vai trò mâm cơm
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-xs font-medium text-[#5C4A3A] focus:outline-none focus:ring-2 focus:ring-[#3F6240]"
              >
                <option value="MAIN">Món chính (Mặn)</option>
                <option value="SOUP">Món canh</option>
                <option value="SIDE">Món phụ / Rau xào</option>
                <option value="ONE_DISH_MEAL">Món ăn một đĩa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">
                Khẩu phần cơ sở (người)
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={baseServings}
                onChange={(e) => setBaseServings(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3F6240]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">
                Chuẩn bị (phút)
              </label>
              <input
                type="number"
                min={0}
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3F6240]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">
                Nấu chín (phút)
              </label>
              <input
                type="number"
                min={0}
                value={cookTimeMinutes}
                onChange={(e) => setCookTimeMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3F6240]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">Độ khó</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-xs font-medium text-[#5C4A3A] focus:outline-none focus:ring-2 focus:ring-[#3F6240]"
              >
                <option value="Dễ">Dễ (Ai cũng nấu được)</option>
                <option value="Trung bình">Trung bình (Cần canh lửa/kho)</option>
                <option value="Cầu kỳ">Cầu kỳ (Mâm cỗ/ngày lễ)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">
                Calo ước tính / người (kcal)
              </label>
              <input
                type="number"
                placeholder="VD: 350"
                value={caloriesPerServing}
                onChange={(e) =>
                  setCaloriesPerServing(e.target.value ? Number(e.target.value) : '')
                }
                className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3F6240]"
              />
            </div>

            <div>
              <ImageUpload
                label="Ảnh đại diện món ăn (Hero image)"
                value={heroImage}
                onChange={setHeroImage}
                onRemove={() => setHeroImage('')}
                hint="Tải ảnh món cơm nhà hấp dẫn (JPG/PNG/WebP, tối đa 5MB)"
                aspectRatio="video"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Nguyên liệu có cấu trúc */}
        <section className="bg-white p-6 rounded-2xl border border-[#EADBC8] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F3E9DD] pb-3">
            <div>
              <h2 className="text-base font-bold text-[#3F6240] flex items-center gap-2">
                <span>2. Nguyên liệu chuẩn hóa (Invariants §5.3, §5.4)</span>
              </h2>
              <p className="text-xs text-[#7C6A59] mt-0.5">
                Mỗi nguyên liệu liên kết từ điển, hỗ trợ thuật toán co giãn khẩu phần và gộp giỏ đi chợ.
              </p>
            </div>

            <button
              type="button"
              onClick={addIngredientRow}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FAF7F0] hover:bg-[#F3E9DD] text-[#3F6240] text-xs font-semibold rounded-xl border border-[#EADBC8] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm dòng
            </button>
          </div>

          <div className="space-y-3">
            {ingredientRows.map((row, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-[#FAF7F0] rounded-xl border border-[#EADBC8] grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
              >
                {/* 1. Chọn nguyên liệu */}
                <div className="md:col-span-4">
                  <label className="block text-[11px] font-semibold text-[#7C6A59] mb-1">
                    Nguyên liệu #{idx + 1}
                  </label>
                  <select
                    value={row.ingredientId}
                    onChange={(e) => {
                      const selId = Number(e.target.value);
                      const target = availableIngredients.find((i) => i.id === selId);
                      updateIngredientRow(idx, {
                        ingredientId: selId,
                        unit: target ? target.standardUnit : row.unit,
                      });
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#EADBC8] rounded-lg text-xs font-medium text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#3F6240]"
                  >
                    {availableIngredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.category}) {ing.isPantryStaple ? '★ Gia vị bếp' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Định lượng & Đơn vị */}
                <div className="md:col-span-2 flex gap-1.5">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-[#7C6A59] mb-1">
                      Số lượng
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={row.amount}
                      onChange={(e) =>
                        updateIngredientRow(idx, {
                          amount: e.target.value === '' ? '' : Number(e.target.value),
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-[#EADBC8] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#3F6240]"
                    />
                  </div>
                  <div className="w-16">
                    <label className="block text-[11px] font-semibold text-[#7C6A59] mb-1">
                      Đơn vị
                    </label>
                    <input
                      type="text"
                      value={row.unit}
                      onChange={(e) => updateIngredientRow(idx, { unit: e.target.value })}
                      className="w-full px-2 py-1.5 bg-white border border-[#EADBC8] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#3F6240]"
                    />
                  </div>
                </div>

                {/* 3. Chính sách co giãn */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-[#7C6A59] mb-1">
                    Co giãn
                  </label>
                  <select
                    value={row.scalePolicy}
                    onChange={(e) =>
                      updateIngredientRow(idx, { scalePolicy: e.target.value as any })
                    }
                    className="w-full px-2 py-1.5 bg-white border border-[#EADBC8] rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#3F6240]"
                  >
                    <option value="LINEAR">Tỉ lệ thuận</option>
                    <option value="FIXED">Cố định</option>
                    <option value="MANUAL_ADJUST">Tùy chỉnh</option>
                  </select>
                </div>

                {/* 4. Sơ chế */}
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-semibold text-[#7C6A59] mb-1">
                    Chỉ dẫn sơ chế
                  </label>
                  <input
                    type="text"
                    placeholder="VD: thái miếng vừa ăn, rửa sạch..."
                    value={row.preparation}
                    onChange={(e) => updateIngredientRow(idx, { preparation: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#EADBC8] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#3F6240]"
                  />
                </div>

                {/* 5. Nút xóa */}
                <div className="md:col-span-1 flex justify-end md:pt-4">
                  <button
                    type="button"
                    onClick={() => removeIngredientRow(idx)}
                    className="p-1.5 text-[#9C8B7A] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
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
            <div>
              <h2 className="text-base font-bold text-[#3F6240] flex items-center gap-2">
                <span>3. Các bước nấu theo giai đoạn (Invariants §5.2)</span>
              </h2>
              <p className="text-xs text-[#7C6A59] mt-0.5">
                Tích hợp bộ hẹn giờ an toàn, mẹo nấu dân gian, không tự động chuyển bước.
              </p>
            </div>

            <button
              type="button"
              onClick={addStepRow}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FAF7F0] hover:bg-[#F3E9DD] text-[#3F6240] text-xs font-semibold rounded-xl border border-[#EADBC8] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm bước
            </button>
          </div>

          <div className="space-y-4">
            {stepRows.map((step, idx) => (
              <div
                key={idx}
                className="p-4 bg-[#FAF7F0] rounded-xl border border-[#EADBC8] space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#3F6240] text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <select
                      value={step.phaseName}
                      onChange={(e) => updateStepRow(idx, { phaseName: e.target.value })}
                      className="px-2.5 py-1 bg-white border border-[#EADBC8] rounded-lg text-xs font-semibold text-[#5C4A3A] focus:outline-none focus:ring-2 focus:ring-[#3F6240]"
                    >
                      {PHASES.map((p) => (
                        <option key={p} value={p}>
                          Giai đoạn: {p}
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
                        placeholder="0"
                        min={0}
                        value={step.timerMinutes}
                        onChange={(e) =>
                          updateStepRow(idx, {
                            timerMinutes: e.target.value === '' ? '' : Number(e.target.value),
                          })
                        }
                        className="w-12 text-xs font-medium text-[#2D2A26] focus:outline-none text-right"
                      />
                      <span className="text-[11px] text-[#7C6A59]">phút</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeStepRow(idx)}
                      className="p-1 text-[#9C8B7A] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <textarea
                    rows={2}
                    placeholder={`Mô tả chi tiết bước #${idx + 1} cần làm gì...`}
                    value={step.instruction}
                    onChange={(e) => updateStepRow(idx, { instruction: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#EADBC8] rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#3F6240] leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  <div className="md:col-span-2 relative">
                    <Sparkles className="w-3.5 h-3.5 text-[#B75B35] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Mẹo nhỏ của mẹ (VD: thắng đường vừa ngả màu cánh gián cho nước dừa vào ngay...)"
                      value={step.tipText}
                      onChange={(e) => updateStepRow(idx, { tipText: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 bg-[#FAF7F0] border border-[#EADBC8] rounded-lg text-xs text-[#5C4A3A] italic placeholder:not-italic focus:outline-none focus:ring-2 focus:ring-[#3F6240]"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <ImageUpload
                      value={step.image}
                      onChange={(url) => updateStepRow(idx, { image: url })}
                      onRemove={() => updateStepRow(idx, { image: '' })}
                      hint="Ảnh bước nấu (tùy chọn)"
                      aspectRatio="wide"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Hệ phân loại Taxonomies */}
        <section className="bg-white p-6 rounded-2xl border border-[#EADBC8] shadow-xs space-y-4">
          <div className="border-b border-[#F3E9DD] pb-3">
            <h2 className="text-base font-bold text-[#3F6240] flex items-center gap-2">
              <span>4. Phân loại đa trục (Taxonomies)</span>
            </h2>
            <p className="text-xs text-[#7C6A59] mt-0.5">
              Gắn thẻ giúp người nấu dễ dàng lọc mâm cơm theo vùng miền, dịp ăn và thói quen gia đình.
            </p>
          </div>

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
                        onClick={() => toggleTaxonomy(item.id)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                          isSelected
                            ? 'bg-[#3F6240] text-white border-[#3F6240]'
                            : 'bg-white text-[#5C4A3A] border-[#EADBC8] hover:border-[#3F6240]'
                        }`}
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

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EADBC8]">
          <Link
            href="/editor/recipes"
            className="px-4 py-2.5 text-xs font-semibold text-[#7C6A59] hover:text-[#2D2A26] rounded-xl hover:bg-[#F3E9DD] transition-colors"
          >
            Hủy bỏ
          </Link>
          <button
            type="button"
            onClick={() => handleSubmit('DRAFT')}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-[#5C4A3A] border border-[#EADBC8] text-xs font-semibold rounded-xl hover:bg-[#FAF7F0] transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-[#7C6A59]" />
            Lưu bản nháp
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('SUBMITTED')}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#3F6240] text-white text-xs font-semibold rounded-xl hover:bg-[#324f33] transition-all disabled:opacity-50 shadow-xs"
          >
            <Send className="w-4 h-4" />
            Gửi phê duyệt (SUBMITTED)
          </button>
        </div>
      </main>

      {/* AI Authoring Draft Modal */}
      <AiDraftModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyDraft={handleApplyDraft}
      />
    </div>
  );
}
