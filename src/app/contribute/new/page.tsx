'use client';

// AG-31: Contributor New Recipe Editor Page
// Tái sử dụng Structured Recipe Editor cho người dùng cộng đồng đóng góp món ngon gia đình.
// Invariants Gate P5: Contributor chỉ có thể chọn 'Lưu bản nháp' hoặc 'Gửi duyệt (SUBMITTED)'.

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChefHat,
  Plus,
  Trash2,
  Save,
  Send,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { AiDraftModal } from '@/components/editor/AiDraftModal';
import type { AiRecipeDraftPayload } from '@/lib/ai/recipeDraftGenerator';

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

export default function ContributorNewRecipePage() {
  const router = useRouter();

  const [availableIngredients, setAvailableIngredients] = useState<IngredientOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [dishName, setDishName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [role, setRole] = useState<'MAIN' | 'SOUP' | 'SIDE' | 'DIPPING_SAUCE' | 'ONE_DISH_MEAL' | 'DESSERT' | 'BEVERAGE'>('MAIN');
  const [baseServings, setBaseServings] = useState<number>(4);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number>(15);
  const [cookTimeMinutes, setCookTimeMinutes] = useState<number>(30);
  const [difficulty, setDifficulty] = useState('Dễ');
  const [heroImage, setHeroImage] = useState('');

  // Structured Ingredients & Steps
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>([
    { ingredientId: 0, amount: 400, unit: 'g', scalePolicy: 'LINEAR', preparation: '', isOptional: false },
  ]);

  const [stepRows, setStepRows] = useState<StepRow[]>([
    { phaseName: 'Sơ chế', instruction: '', timerMinutes: '', tipText: '' },
    { phaseName: 'Chế biến', instruction: '', timerMinutes: '', tipText: '' },
  ]);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  useEffect(() => {
    async function loadIngredients() {
      try {
        setLoadingData(true);
        const [authRes, res] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/ingredients'),
        ]);
        if (authRes.ok) {
          const authData = await authRes.json();
          if (!authData.user) {
            setIsUnauthorized(true);
            return;
          }
        } else if (authRes.status === 401) {
          setIsUnauthorized(true);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setAvailableIngredients(data.ingredients || []);
          if (data.ingredients && data.ingredients.length > 0) {
            setIngredientRows((prev) =>
              prev.map((r) =>
                r.ingredientId === 0
                  ? { ...r, ingredientId: data.ingredients[0].id, unit: data.ingredients[0].standardUnit }
                  : r
              )
            );
          }
        }
      } catch (err) {
        console.error('Lỗi khi nạp danh mục nguyên liệu:', err);
      } finally {
        setLoadingData(false);
      }
    }

    loadIngredients();
  }, []);

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

  const handleApplyAiDraft = (draft: AiRecipeDraftPayload) => {
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

  const handleSubmit = async (submitNow: boolean) => {
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập tên món ăn.');
      return;
    }
    if (!shortDescription.trim()) {
      setErrorMsg('Vui lòng nhập mô tả ngắn về hương vị món ăn.');
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

      const res = await fetch('/api/contribute/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Lỗi khi gửi công thức.');
      }

      router.push('/contribute');
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!loadingData && isUnauthorized) {
    return (
      <div className="min-h-screen bg-[#FAF7F0] text-[#2D2A26] py-16 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-3xl border border-[#EADBC8] p-8 text-center shadow-xs space-y-4">
          <ChefHat className="w-12 h-12 text-[#3F6240] mx-auto" />
          <h1 className="text-xl font-bold text-[#3F6240]">
            Đăng nhập để đóng góp món ngon gia đình
          </h1>
          <p className="text-xs sm:text-sm text-[#5C4A3A] leading-relaxed">
            Để lưu bản nháp công thức và gửi bài cho Ban biên tập Ăn Gì Mom, vui lòng đăng nhập tài khoản của bạn trước khi bắt đầu viết nhé!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/login?from=/contribute/new"
              className="min-h-11 inline-flex items-center px-6 py-2.5 rounded-xl bg-[#3F6240] hover:bg-[#324f33] text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs"
            >
              Đăng nhập ngay
            </Link>
            <Link
              href="/register?from=/contribute/new"
              className="min-h-11 inline-flex items-center px-5 py-2.5 rounded-xl bg-[#FAF7F0] hover:bg-[#F3E9DD] text-[#5C4A3A] border border-[#EADBC8] text-xs sm:text-sm font-semibold transition-colors"
            >
              Tạo tài khoản mới
            </Link>
          </div>
        </div>
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
              Đóng Góp Món Ngon Gia Đình
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-semibold rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all shadow-xs"
              title="Nhập tên món ăn để AI gợi ý khung nguyên liệu và bước nấu"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Gợi ý AI</span>
            </button>

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
              <span>Gửi cho Ban biên tập</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Intro banner */}
        <div className="bg-white p-5 rounded-2xl border border-[#EADBC8] flex items-start gap-3 shadow-xs">
          <ShieldCheck className="w-5 h-5 text-[#3F6240] shrink-0 mt-0.5" />
          <p className="text-xs text-[#5C4A3A] leading-relaxed">
            <strong>Chào mừng bạn đến với Bếp Nhà Ăn Gì Mom!</strong> Công thức của bạn sẽ được lưu thành bản nháp hoặc gửi tới Ban biên tập để nấu thử và kiểm duyệt trước khi chính thức xuất bản. Hãy chia sẻ thật chi tiết định lượng và mẹo nhỏ của gia đình mình nhé!
          </p>
        </div>

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
                placeholder="Ví dụ: Cá kho tộ kiểu bà ngoại, Canh chua bông điên điển..."
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
                <option value="DIPPING_SAUCE">Nước chấm / Sốt</option>
                <option value="ONE_DISH_MEAL">Món ăn một đĩa</option>
                <option value="DESSERT">Tráng miệng</option>
                <option value="BEVERAGE">Đồ uống</option>
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
              placeholder="Chia sẻ ngắn gọn điều gì khiến món ăn này trở nên đặc biệt trong bữa cơm gia đình bạn..."
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
            <label className="block text-xs font-semibold text-[#5C4A3A] mb-1">Ảnh món ăn hoàn chỉnh</label>
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
                    placeholder="Đơn vị (g, ml, củ...)"
                    className="w-full px-3 py-2 bg-white border border-[#EADBC8] rounded-lg text-xs text-center"
                  />
                </div>

                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={row.preparation}
                    onChange={(e) => updateIngredientRow(index, { preparation: e.target.value })}
                    placeholder="Sơ chế (thái lát, để ráo...)"
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

          {/* Tóm tắt Pipeline Giai đoạn nấu */}
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[#FAF7F0] border border-[#EADBC8]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7C6A59] mr-1">
              Pipeline giai đoạn:
            </span>
            {['Sơ chế', 'Chế biến', 'Hoàn thành'].map((phaseName, pIdx) => {
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
                  placeholder="💡 Mẹo nhỏ cho bước này (ví dụ: vặn nhỏ lửa, thêm chút tiêu khi tắt bếp...)"
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
            {submitting ? 'Đang gửi...' : 'Nộp cho Ban biên tập (SUBMITTED)'}
          </button>
        </div>
      </main>

      {/* AI Assistant Modal for Contributor */}
      <AiDraftModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyDraft={handleApplyAiDraft}
      />
    </div>
  );
}
