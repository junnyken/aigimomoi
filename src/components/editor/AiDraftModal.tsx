'use client';

// AG-29+: AI Recipe Authoring & External Cooking Knowledge Importer Modal
// Hỗ trợ 3 chế độ:
// 1. Tạo từ tên món ăn (TITLE)
// 2. Kết nối trang kiến thức nấu ăn qua Link URL hoặc Văn bản thô (URL)
// 3. Nạp hàng loạt nhiều món / nhiều link cùng lúc (BATCH)

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  Globe,
  Layers,
  ChefHat,
  ExternalLink,
} from 'lucide-react';
import type { AiRecipeDraftPayload } from '@/lib/ai/recipeDraftGenerator';

interface AiDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDraft?: (draft: AiRecipeDraftPayload) => void;
  onBatchSaved?: () => void;
}

const PRESET_BATCH_SETS = [
  {
    label: 'Bộ 5 món mặn cơm nhà kinh điển',
    role: 'MAIN' as const,
    items: [
      'Thịt ba chỉ kho củ cải trắng đậm đà',
      'Gà kho sả ớt miền Nam',
      'Cá thu sốt cà chua thơm béo',
      'Sườn non rim mặn ngọt chuẩn vị',
      'Đậu hũ nhồi thịt sốt dầu hào',
    ],
  },
  {
    label: 'Bộ 5 món canh thanh mát dễ nấu',
    role: 'SOUP' as const,
    items: [
      'Canh cua rau đay mồng tơi mướp hương',
      'Canh bí đao nấu tôm tươi ngọt mát',
      'Canh chua cá hú miền Tây',
      'Canh cải ngọt nấu thịt băm gừng tươi',
      'Canh khổ qua nhồi thịt thanh nhiệt',
    ],
  },
  {
    label: 'Bộ 5 món xào / rau nhanh gọn',
    role: 'SIDE' as const,
    items: [
      'Đậu cô ve xào thịt bò tỏi thơm',
      'Bầu non xào tôm tươi ngọt dịu',
      'Khổ qua xào trứng gà không đắng',
      'Cải thìa xào nấm đông cô sốt dầu hào',
      'Giá hẹ xào đậu hũ thanh đạm',
    ],
  },
];

export function AiDraftModal({ isOpen, onClose, onApplyDraft, onBatchSaved }: AiDraftModalProps) {
  const router = useRouter();

  // Tabs: TITLE | URL | BATCH
  const [activeTab, setActiveTab] = useState<'TITLE' | 'URL' | 'BATCH'>('URL');

  // Inputs
  const [dishTitle, setDishTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [batchText, setBatchText] = useState('');
  const [role, setRole] = useState<'MAIN' | 'SOUP' | 'SIDE' | 'ONE_DISH_MEAL'>('MAIN');
  const [region, setRegion] = useState('Toàn quốc');
  const [styleNotes, setStyleNotes] = useState('');

  // States
  const [loading, setLoading] = useState(false);
  const [savingDirectly, setSavingDirectly] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<AiRecipeDraftPayload | null>(null);
  const [batchResults, setBatchResults] = useState<Array<{
    recipeId: number;
    slug: string;
    name: string;
    role: string;
  }> | null>(null);
  const [batchErrors, setBatchErrors] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (activeTab === 'TITLE' && !dishTitle.trim()) {
      setErrorMsg('Vui lòng nhập tên món ăn.');
      return;
    }

    if (activeTab === 'URL' && !sourceUrl.trim() && !sourceText.trim()) {
      setErrorMsg('Vui lòng dán đường link (URL) bài viết nấu ăn hoặc nội dung văn bản công thức.');
      return;
    }

    if (activeTab === 'BATCH') {
      const lines = batchText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length === 0) {
        setErrorMsg('Vui lòng nhập ít nhất 1 tên món hoặc 1 đường link (mỗi dòng 1 mục).');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/ai/recipe-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            batchItems: lines.slice(0, 6),
            role,
            region,
            styleNotes: styleNotes.trim(),
            mode: 'BATCH_SAVE_DRAFT',
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Không thể nạp danh sách món lúc này.');
        }

        setBatchResults(data.createdRecipes || []);
        setBatchErrors(data.errors || []);
        if (onBatchSaved) onBatchSaved();
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi nạp hàng loạt công thức.');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/ai/recipe-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishTitle: dishTitle.trim(),
          sourceUrl: activeTab === 'URL' ? sourceUrl.trim() : '',
          sourceText: activeTab === 'URL' ? sourceText.trim() : '',
          role,
          region,
          styleNotes: styleNotes.trim(),
          mode: 'GENERATE',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Không thể tạo bản thảo lúc này.');
      }

      const data = await res.json();
      setGeneratedDraft(data.draft);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi kết nối tới Trợ lý AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToForm = () => {
    if (generatedDraft && onApplyDraft) {
      onApplyDraft(generatedDraft);
      onClose();
    }
  };

  const handleSaveDirectly = async () => {
    setSavingDirectly(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/recipe-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishTitle: (generatedDraft?.name || dishTitle).trim(),
          sourceUrl: activeTab === 'URL' ? sourceUrl.trim() : '',
          sourceText: activeTab === 'URL' ? sourceText.trim() : '',
          role: generatedDraft?.role || role,
          region,
          styleNotes: styleNotes.trim(),
          mode: 'SAVE_DRAFT',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Không thể lưu bản nháp.');
      }

      const data = await res.json();
      if (onBatchSaved) onBatchSaved();
      onClose();
      router.push(`/editor/recipes/${data.recipeId}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi lưu bản nháp vào cơ sở dữ liệu.');
    } finally {
      setSavingDirectly(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-draft-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="ai-draft-modal-title" className="text-xl font-bold text-stone-900">
                Trợ lý AI & Kết nối Kiến thức Ẩm thực
              </h2>
              <p className="text-xs text-stone-500">
                Nhập công thức từ Link trang web nấu ăn, soạn theo tên món hoặc nạp hàng loạt vào kho
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        {!generatedDraft && !batchResults && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-stone-100 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('URL');
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'URL'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Globe className="w-4 h-4 text-amber-600" />
              <span>Nhập từ Link Web / Bài viết</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('BATCH');
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'BATCH'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Nạp hàng loạt (Tăng kho món)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('TITLE');
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'TITLE'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ChefHat className="w-4 h-4 text-stone-600" />
              <span>Soạn từ Tên món</span>
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Batch Results View */}
        {batchResults ? (
          <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
              <h3 className="text-base font-bold text-emerald-900 flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600" />
                Đã nạp thành công {batchResults.length} công thức mới vào kho!
              </h3>
              <p className="text-xs text-emerald-800">
                Tất cả công thức đã được chuẩn hóa nguyên liệu, định lượng và các bước nấu ở trạng thái Bản nháp (DRAFT).
              </p>
            </div>

            <div className="space-y-2">
              {batchResults.map((item) => (
                <div
                  key={item.recipeId}
                  className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="font-bold text-sm text-stone-900">{item.name}</span>
                    <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      {item.role}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push(`/editor/recipes/${item.recipeId}`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-xs font-semibold text-stone-800"
                  >
                    <span>Mở duyệt</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {batchErrors.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-bold">Một số mục gặp lỗi:</p>
                {batchErrors.map((e, idx) => (
                  <p key={idx}>• {e}</p>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => {
                  setBatchResults(null);
                  setBatchErrors([]);
                  setBatchText('');
                }}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold"
              >
                ← Nạp thêm đợt khác
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-xs"
              >
                Hoàn tất & Xem danh sách
              </button>
            </div>
          </div>
        ) : !generatedDraft ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            {activeTab === 'URL' && (
              <>
                <div>
                  <label htmlFor="sourceUrlInput" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Đường dẫn (URL) trang kiến thức nấu ăn
                  </label>
                  <input
                    id="sourceUrlInput"
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://www.dienmayxanh.com/vao-bep/... hoặc Cookpad, Bách Hóa Xanh, VnExpress..."
                    className="w-full px-4 py-3 rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-stone-900"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Hệ thống tự động tải bài viết từ đường link, lọc bỏ quảng cáo và bóc tách nguyên liệu + bước nấu chuẩn cấu trúc Ăn Gì Mom.
                  </p>
                </div>

                <div>
                  <label htmlFor="sourceTextInput" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Hoặc dán trực tiếp nội dung công thức từ trang khác (Tùy chọn)
                  </label>
                  <textarea
                    id="sourceTextInput"
                    rows={4}
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Nếu trang web chặn đọc tự động, bạn có thể copy nhanh đoạn nguyên liệu & cách làm rồi dán vào đây..."
                    className="w-full px-4 py-3 rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-stone-900"
                  />
                </div>

                <div>
                  <label htmlFor="optionalTitleInput" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Tên món ăn (Để trống AI sẽ tự lấy theo bài viết)
                  </label>
                  <input
                    id="optionalTitleInput"
                    type="text"
                    value={dishTitle}
                    onChange={(e) => setDishTitle(e.target.value)}
                    placeholder="Ví dụ: Thịt kho tàu nước dừa tươi..."
                    className="w-full px-4 py-2.5 rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-stone-900"
                  />
                </div>
              </>
            )}

            {activeTab === 'BATCH' && (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="batchTextarea" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                      Danh sách món hoặc Link bài viết (Tối đa 6 mục / lượt, mỗi dòng 1 mục)
                    </label>
                  </div>
                  <textarea
                    id="batchTextarea"
                    rows={5}
                    value={batchText}
                    onChange={(e) => setBatchText(e.target.value)}
                    placeholder={`Ví dụ:\nCá bống kho tiêu miền Trung\nCanh hến nấu chua dọc mùng\nhttps://www.dienmayxanh.com/vao-bep/...`}
                    className="w-full px-4 py-3 rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-stone-900"
                  />
                </div>

                {/* Preset Quick Fill Sets */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                    Gợi ý bộ món Việt phổ biến (Bấm để điền nhanh):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_BATCH_SETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setRole(preset.role);
                          setBatchText(preset.items.join('\n'));
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-colors"
                      >
                        + {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'TITLE' && (
              <div>
                <label htmlFor="dishTitleInput" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Tên món ăn <span className="text-rose-500">*</span>
                </label>
                <input
                  id="dishTitleInput"
                  type="text"
                  value={dishTitle}
                  onChange={(e) => setDishTitle(e.target.value)}
                  placeholder="Ví dụ: Cá lóc kho tộ miền Tây, Canh cua mồng tơi mướp, Sườn ram mặn ngọt..."
                  className="w-full px-4 py-3 rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-stone-900"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="roleSelect" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Vai trò trong mâm cơm
                </label>
                <select
                  id="roleSelect"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'MAIN' | 'SOUP' | 'SIDE' | 'ONE_DISH_MEAL')}
                  className="w-full px-4 py-3 rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-stone-900 bg-white"
                >
                  <option value="MAIN">Món mặn (MAIN)</option>
                  <option value="SOUP">Món canh (SOUP)</option>
                  <option value="SIDE">Món rau / xào (SIDE)</option>
                  <option value="ONE_DISH_MEAL">Món ăn một đĩa</option>
                </select>
              </div>

              <div>
                <label htmlFor="regionSelect" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Vùng miền ẩm thực
                </label>
                <select
                  id="regionSelect"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-stone-900 bg-white"
                >
                  <option value="Toàn quốc">Toàn quốc (Phổ biến)</option>
                  <option value="Miền Bắc">Miền Bắc (Thanh đạm, vừa vị)</option>
                  <option value="Miền Trung">Miền Trung (Đậm đà, cay thơm)</option>
                  <option value="Miền Nam">Miền Nam (Ngọt thanh, béo ngậy)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="styleNotesInput" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Ghi chú phong cách nấu (Tùy chọn)
              </label>
              <input
                id="styleNotesInput"
                type="text"
                value={styleNotes}
                onChange={(e) => setStyleNotes(e.target.value)}
                placeholder="Ví dụ: Kho bằng nồi đất, ít ngọt, có tóp mỡ, thời gian nấu nhanh..."
                className="w-full px-4 py-3 rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-stone-900"
              />
            </div>

            {/* Invariant Note */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Chuẩn hóa tự động:</strong> AI sẽ tự khớp nguyên liệu vào Từ điển Dinh dưỡng của Ăn Gì Mom và lưu ở trạng thái <code>DRAFT</code> để bạn duyệt trước khi xuất bản.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-sm font-semibold transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow-md transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>
                  {loading
                    ? 'Đang trích xuất & biên soạn...'
                    : activeTab === 'URL'
                    ? 'Trích xuất Công thức từ Nguồn'
                    : activeTab === 'BATCH'
                    ? 'Nạp hàng loạt vào Kho'
                    : 'Tạo bản thảo AI'}
                </span>
              </button>
            </div>
          </form>
        ) : (
          /* Draft Preview Section */
          <div className="space-y-6">
            <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-semibold text-xs inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Bản nháp AI: {generatedDraft.role}
                </span>
                <span className="text-xs text-stone-500 font-medium">
                  {generatedDraft.prepTimeMinutes + generatedDraft.cookTimeMinutes} phút · Khẩu phần {generatedDraft.baseServings} người
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900">{generatedDraft.name}</h3>
              <p className="text-sm text-stone-600 italic leading-relaxed">
                &ldquo;{generatedDraft.shortDescription}&rdquo;
              </p>
            </div>

            {/* Ingredients Preview */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Nguyên liệu định lượng ({generatedDraft.ingredients.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {generatedDraft.ingredients.map((ing, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-stone-900">{ing.name}</span>
                      {ing.preparation && <span className="text-stone-500 ml-1.5">({ing.preparation})</span>}
                    </div>
                    <span className="font-medium text-stone-700 bg-white px-2 py-0.5 rounded border border-stone-200">
                      {ing.amount} {ing.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Steps Preview */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Các bước thực hiện ({generatedDraft.steps.length})
              </h4>
              <div className="space-y-2 text-xs">
                {generatedDraft.steps.map((st) => (
                  <div key={st.stepNumber} className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-700">
                        Bước {st.stepNumber} · {st.phaseName}
                      </span>
                      {st.timerSeconds > 0 && (
                        <span className="text-stone-500 font-medium">
                          ⏱ {Math.round(st.timerSeconds / 60)} phút
                        </span>
                      )}
                    </div>
                    <p className="text-stone-700">{st.instruction}</p>
                    {st.tipText && (
                      <p className="text-amber-800 text-[11px] bg-amber-50/80 p-1.5 rounded-lg border border-amber-200/50">
                        💡 Mẹo: {st.tipText}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setGeneratedDraft(null)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold"
              >
                ← Tạo lại món khác
              </button>

              <div className="flex items-center gap-3">
                {onApplyDraft && (
                  <button
                    type="button"
                    onClick={handleApplyToForm}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-amber-600 text-amber-700 hover:bg-amber-50 text-sm font-semibold transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Điền vào biểu mẫu này</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveDirectly}
                  disabled={savingDirectly}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow-md transition-all disabled:opacity-50"
                >
                  {savingDirectly ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  <span>{savingDirectly ? 'Đang lưu...' : 'Lưu bản nháp & Chỉnh sửa'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
