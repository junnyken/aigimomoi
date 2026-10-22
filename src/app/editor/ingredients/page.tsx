'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Check,
  AlertCircle,
  Trash2,
  ArrowLeft,
  RefreshCw,
  Flame,
  BookOpen,
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Ingredient {
  id: number;
  slug: string;
  name: string;
  category: string;
  standardUnit: string;
  isPantryStaple: boolean;
  calories100g?: number | null;
  protein100g?: number | null;
  fat100g?: number | null;
  carbs100g?: number | null;
  fiber100g?: number | null;
  sodium100g?: number | null;
  edibleRate?: number | null;
  nutritionSource?: string | null;
  nutritionNotes?: string | null;
}

const ITEMS_PER_PAGE = 30;

const CATEGORIES = [
  'Tất cả',
  'Thực phẩm tươi sống',
  'Thủy hải sản',
  'Rau củ quả',
  'Gia vị nêm nếm',
  'Đồ khô',
];

const OFFICIAL_NUTRITION_SOURCES = [
  {
    code: 'VIETNAM_FCT_2007',
    title: 'Bảng Thành Phần Thực Phẩm Việt Nam (Viện Dinh Dưỡng Quốc Gia — Bộ Y Tế)',
    desc: 'Chuẩn gốc hơn 500 nguyên liệu tươi sống, thịt cá, rau muống, rau ngót, mắm truyền thống và gia vị 3 miền Việt Nam (kèm tỷ lệ phần ăn được sau khi bỏ xương/vỏ).',
    url: 'https://viendinhduong.vn',
    badge: 'Chuẩn Bộ Y Tế Việt Nam',
  },
  {
    code: 'ASEANFOODS_FAO',
    title: 'FAO / INFOODS — ASEAN Food Composition Database',
    desc: 'Cơ sở dữ liệu thực phẩm Đông Nam Á của Tổ chức Lương thực & Nông nghiệp Liên Hợp Quốc (rau rừng, măng, nấm nhiệt đới, rong biển, chế phẩm đậu nành).',
    url: 'https://www.fao.org/infoods/infoods/tables-and-databases/asia/en/',
    badge: 'Chuẩn FAO Đông Nam Á',
  },
  {
    code: 'USDA_FDC',
    title: 'USDA FoodData Central (Bộ Nông nghiệp Hoa Kỳ)',
    desc: 'Chuẩn dinh dưỡng quốc tế cho nhóm nguyên liệu Eat Clean, Giảm cân & Tập Gym hiện đại (Yến mạch, Hạt chia, Cá hồi phi lê, Sữa chua Hy Lạp, Dầu ô liu, Bơ sáp).',
    url: 'https://fdc.nal.usda.gov/',
    badge: 'Chuẩn Eat Clean & Gym',
  },
  {
    code: 'OPEN_FOOD_FACTS_VN',
    title: 'Open Food Facts Vietnam (Kho dữ liệu thực phẩm đóng gói tại Việt Nam)',
    desc: 'Tra cứu nhanh mã vạch & thành phần dinh dưỡng của các loại nước chấm, gia vị đóng chai, mì, bún khô, sữa hạt bán tại siêu thị Việt Nam.',
    url: 'https://vn.openfoodfacts.org/',
    badge: 'Gia vị & Đồ đóng gói',
  },
];

export default function EditorIngredientsPage() {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [currentPage, setCurrentPage] = useState(1);
  const [showSourcesPanel, setShowSourcesPanel] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Thực phẩm tươi sống');
  const [newUnit, setNewUnit] = useState('g');
  const [newIsStaple, setNewIsStaple] = useState(false);
  const [newCalories, setNewCalories] = useState('');
  const [newProtein, setNewProtein] = useState('');
  const [newFat, setNewFat] = useState('');
  const [newCarbs, setNewCarbs] = useState('');
  const [newEdiblePercent, setNewEdiblePercent] = useState('100');
  const [newNotes, setNewNotes] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchIngredients = useCallback(async () => {
    try {
      setLoading(true);
      const url = new URL('/api/ingredients', window.location.origin);
      if (searchTerm) url.searchParams.set('q', searchTerm);
      if (selectedCategory !== 'Tất cả') url.searchParams.set('category', selectedCategory);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setItems(data.ingredients || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIngredients();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchIngredients]);

  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSyncVietnamCatalog = async () => {
    setSyncing(true);
    setSyncNotice(null);
    try {
      const res = await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_vietnam_catalog' }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Không thể đồng bộ từ điển nguyên liệu');
        return;
      }
      setSyncNotice(data.message || 'Đã đồng bộ đầy đủ kho nguyên liệu chuẩn Việt Nam!');
      await fetchIngredients();
    } catch {
      alert('Lỗi kết nối khi đồng bộ kho nguyên liệu');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    try {
      const parsedCal = newCalories.trim() !== '' ? Number(newCalories) : undefined;
      const parsedPro = newProtein.trim() !== '' ? Number(newProtein) : undefined;
      const parsedFat = newFat.trim() !== '' ? Number(newFat) : undefined;
      const parsedCarb = newCarbs.trim() !== '' ? Number(newCarbs) : undefined;
      const parsedEdible =
        newEdiblePercent.trim() !== '' ? Math.min(100, Math.max(10, Number(newEdiblePercent))) / 100 : 1.0;

      const res = await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          category: newCategory,
          standardUnit: newUnit,
          isPantryStaple: newIsStaple,
          calories100g: parsedCal,
          protein100g: parsedPro,
          fat100g: parsedFat,
          carbs100g: parsedCarb,
          edibleRate: parsedEdible,
          nutritionNotes: newNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi thêm nguyên liệu');
      }

      setShowModal(false);
      setNewName('');
      setNewCalories('');
      setNewProtein('');
      setNewFat('');
      setNewCarbs('');
      setNewEdiblePercent('100');
      setNewNotes('');
      fetchIngredients();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setModalError(err.message);
      } else {
        setModalError('Đã có lỗi xảy ra');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa nguyên liệu "${name}"?`)) return;

    try {
      const res = await fetch(`/api/ingredients/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Lỗi xóa nguyên liệu');
        return;
      }
      fetchIngredients();
    } catch {
      alert('Đã có lỗi xảy ra');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <Link
              href="/editor/recipes"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại Ban biên tập</span>
            </Link>
            <span className="text-[var(--color-border-strong)]">•</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Hiện có {totalCount} nguyên liệu chuẩn hóa ({ITEMS_PER_PAGE} dòng/trang)</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">
            Từ điển Nguyên liệu & Dinh dưỡng Bếp Việt
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
            Tổng hợp đầy đủ 5 nhóm nguyên liệu Việt Nam (Thịt cá, Thủy hải sản, Rau củ nấm, Rau thơm gia vị, Đồ khô & Hạt) kèm chỉ số Calo/Đạm/Béo/Đường bột chuẩn Viện Dinh Dưỡng.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowSourcesPanel((v) => !v)}
            className="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-[var(--color-surface-white)] text-[var(--color-text-primary)] border border-[var(--color-border-base)] hover:bg-[var(--color-surface-raised)] transition-colors text-xs sm:text-sm shadow-2xs"
          >
            <BookOpen className="w-4 h-4 text-[var(--color-brand-primary)]" />
            <span>{showSourcesPanel ? 'Ẩn nguồn tra cứu' : 'Nguồn dữ liệu nguyên liệu'}</span>
          </button>

          <button
            type="button"
            onClick={handleSyncVietnamCatalog}
            disabled={syncing}
            className="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors text-xs sm:text-sm shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-amber-700 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Đang nạp bộ nguyên liệu...' : 'Đồng bộ Kho Nguyên Liệu VN (180+ loại)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-hover)] transition-colors text-xs sm:text-sm shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm nguyên liệu mới</span>
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-medium flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncNotice(null)}
            className="text-xs font-bold underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Nguồn dữ liệu nguyên liệu & Bảng Thành Phần Thực Phẩm */}
      {showSourcesPanel && (
        <section className="rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--color-border-subtle)]">
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[var(--color-brand-primary)]" />
                <span>4 Nguồn Dữ Liệu Nguyên Liệu & Dinh Dưỡng Chuẩn Đang Kết Nối</span>
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Mọi nguyên liệu trong từ điển đều được đối chiếu chỉ số Năng lượng (kcal/100g), Đạm, Béo, Tinh bột và Tỷ lệ phần ăn được (Edible Portion) từ các nguồn y khoa dưới đây:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {OFFICIAL_NUTRITION_SOURCES.map((src) => (
              <a
                key={src.code}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 rounded-2xl bg-[var(--color-bg-primary)]/70 hover:bg-[var(--color-brand-light)]/40 border border-[var(--color-border-subtle)] hover:border-[var(--color-brand-border)] transition-all flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--color-surface-white)] border border-[var(--color-border-base)] text-[var(--color-brand-primary)]">
                      {src.badge}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                      {src.code}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-primary)] flex items-center gap-1.5">
                    <span>{src.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                    {src.desc}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm nhanh: ức gà, cá lóc, bông điên điển, mắm nêm, yến mạch..."
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] text-[var(--color-text-primary)]"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                selectedCategory === cat
                  ? 'bg-[var(--color-brand-primary)] text-white shadow-2xs'
                  : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-base)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Ingredients Table + Pagination */}
      <div className="bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl overflow-hidden shadow-xs">
        {/* Top Pagination Summary Bar */}
        {!loading && totalCount > 0 && (
          <div className="px-4 sm:px-5 py-3 bg-[var(--color-bg-primary)]/60 border-b border-[var(--color-border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-secondary)]">
            <span>
              Hiển thị <strong>{startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, totalCount)}</strong> trong tổng số{' '}
              <strong className="text-[var(--color-brand-primary)]">{totalCount}</strong> nguyên liệu
            </span>
            <span>
              Trang <strong>{safePage}</strong> / <strong>{totalPages}</strong> (mỗi trang {ITEMS_PER_PAGE} dòng)
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-surface-raised)] border-b border-[var(--color-border-base)] text-xs font-semibold text-[var(--color-text-secondary)] uppercase">
              <tr>
                <th className="px-4 sm:px-5 py-3.5 w-12">#</th>
                <th className="px-4 sm:px-5 py-3.5">Tên nguyên liệu & Công dụng</th>
                <th className="px-4 py-3.5">Nhóm thực phẩm</th>
                <th className="px-4 py-3.5">Đơn vị chuẩn</th>
                <th className="px-4 py-3.5">Dinh dưỡng / 100g ăn được</th>
                <th className="px-4 py-3.5">Tỷ lệ thực ăn & Nguồn</th>
                <th className="px-4 py-3.5">Tủ bếp</th>
                <th className="px-4 sm:px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)] text-[var(--color-text-primary)]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-xs text-[var(--color-text-muted)]">
                    Đang tải từ điển nguyên liệu Việt Nam...
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-xs text-[var(--color-text-muted)]">
                    Chưa có nguyên liệu nào khớp bộ lọc. Hãy bấm <strong>&quot;Đồng bộ Kho Nguyên Liệu VN&quot;</strong> hoặc <strong>&quot;Thêm nguyên liệu mới&quot;</strong>.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  const rowNumber = startIndex + idx + 1;
                  const hasCal = typeof item.calories100g === 'number';
                  const ediblePct = Math.round((item.edibleRate ?? 1) * 100);
                  return (
                    <tr key={item.id} className="hover:bg-[var(--color-surface-raised)]/70 transition-colors">
                      <td className="px-4 sm:px-5 py-3 text-xs font-mono text-[var(--color-text-muted)]">
                        {rowNumber}
                      </td>
                      <td className="px-4 sm:px-5 py-3">
                        <div className="font-bold text-[var(--color-text-primary)]">{item.name}</div>
                        <div className="text-[11px] text-[var(--color-text-muted)] flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="font-mono">{item.slug}</span>
                          {item.nutritionNotes && (
                            <>
                              <span>·</span>
                              <span className="text-[var(--color-text-secondary)]">{item.nutritionNotes}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-xs whitespace-nowrap">
                        {item.standardUnit}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {hasCal ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 font-bold text-amber-800 text-xs">
                              <Flame className="w-3.5 h-3.5 text-amber-500" />
                              {item.calories100g} kcal
                            </span>
                            <span className="text-[11px] text-[var(--color-text-secondary)]">
                              Đạm <strong>{item.protein100g ?? 0}g</strong> · Béo <strong>{item.fat100g ?? 0}g</strong> · Bột <strong>{item.carbs100g ?? 0}g</strong>
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)]">Tự động suy luận FCT</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="font-semibold text-[var(--color-text-primary)]">
                            Ăn được: {ediblePct}%
                          </span>
                          <span className="text-[10px] font-mono text-emerald-700">
                            {item.nutritionSource || 'VIETNAM_FCT_2007'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.isPantryStaple ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-success-base)]">
                            <Check className="w-3.5 h-3.5" /> Sẵn ở bếp
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)]">Mua tươi</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-5 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.name)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          title="Xóa nguyên liệu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Numbered Pagination Bar (1, 2, 3, 4, 5...) */}
        {!loading && totalPages > 1 && (
          <div className="px-4 sm:px-5 py-4 bg-[var(--color-surface-raised)]/50 border-t border-[var(--color-border-base)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-[var(--color-text-secondary)]">
              Đang xem dòng <strong>{startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, totalCount)}</strong> trên{' '}
              <strong>{totalCount}</strong> nguyên liệu
            </span>

            <nav aria-label="Phân trang danh sách nguyên liệu" className="flex flex-wrap items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--color-border-base)] bg-[var(--color-surface-white)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trước</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const isActive = pageNum === safePage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`min-w-8 h-8 px-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[var(--color-brand-primary)] text-white shadow-2xs'
                        : 'bg-[var(--color-surface-white)] border border-[var(--color-border-base)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--color-border-base)] bg-[var(--color-surface-white)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <span>Sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Add Ingredient Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl p-6 max-w-lg w-full shadow-lg my-8">
            <h3 className="text-lg font-bold text-[var(--color-brand-primary)] mb-1">
              Thêm nguyên liệu mới vào Từ điển
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mb-4">
              Chuẩn hóa tên gọi, nhóm quầy chợ và chỉ số dinh dưỡng / 100g (nếu bỏ trống số Calo, hệ thống sẽ tự động tra cứu từ Bảng Thành Phần Thực Phẩm Việt Nam).
            </p>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">Tên nguyên liệu (*)</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="VD: Cá lăng tươi, Bông thiên lý, Hạt óc chó..."
                  className="w-full px-3.5 py-2 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] text-[var(--color-text-primary)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Nhóm thực phẩm</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] text-[var(--color-text-primary)]"
                  >
                    {CATEGORIES.filter((c) => c !== 'Tất cả').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Đơn vị đo chuẩn</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] text-[var(--color-text-primary)]"
                  >
                    <option value="g">Gam (g)</option>
                    <option value="kg">Kilogam (kg)</option>
                    <option value="ml">Mililit (ml)</option>
                    <option value="l">Lít (l)</option>
                    <option value="quả">Quả / Trái</option>
                    <option value="củ">Củ</option>
                    <option value="bó">Bó / Mớ</option>
                    <option value="cây">Cây</option>
                    <option value="tép">Tép</option>
                    <option value="thìa cà phê">Thìa cà phê</option>
                    <option value="thìa canh">Thìa canh</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] space-y-3">
                <div className="text-xs font-bold text-[var(--color-text-primary)] flex items-center justify-between">
                  <span>Thông số dinh dưỡng / 100g ăn được (Tùy chọn)</span>
                  <span className="text-[10px] font-normal text-[var(--color-text-muted)]">Bỏ trống để tự suy luận FCT</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">Calo (kcal)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={newCalories}
                      onChange={(e) => setNewCalories(e.target.value)}
                      placeholder="VD: 110"
                      className="w-full px-2.5 py-1.5 bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">Đạm (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={newProtein}
                      onChange={(e) => setNewProtein(e.target.value)}
                      placeholder="20.5"
                      className="w-full px-2.5 py-1.5 bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">Béo (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={newFat}
                      onChange={(e) => setNewFat(e.target.value)}
                      placeholder="2.5"
                      className="w-full px-2.5 py-1.5 bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">Bột (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={newCarbs}
                      onChange={(e) => setNewCarbs(e.target.value)}
                      placeholder="0.0"
                      className="w-full px-2.5 py-1.5 bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-lg text-xs"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">Ăn được (%)</label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={newEdiblePercent}
                      onChange={(e) => setNewEdiblePercent(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-lg text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">Ghi chú món thường dùng / đặc điểm</label>
                  <input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="VD: Nấu canh chua, kho tộ, giàu Omega-3..."
                    className="w-full px-2.5 py-1.5 bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isStapleInput"
                  checked={newIsStaple}
                  onChange={(e) => setNewIsStaple(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]"
                />
                <label htmlFor="isStapleInput" className="text-xs font-medium cursor-pointer">
                  Đây là gia vị / đồ khô thường có sẵn trong tủ bếp gia đình
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-[var(--color-border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-[var(--color-surface-raised)] hover:bg-[var(--color-border-base)] transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Thêm nguyên liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
