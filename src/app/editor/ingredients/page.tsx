'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Check, AlertCircle, Trash2, ArrowLeft } from 'lucide-react';

interface Ingredient {
  id: number;
  slug: string;
  name: string;
  category: string;
  standardUnit: string;
  isPantryStaple: boolean;
}

const CATEGORIES = [
  'Tất cả',
  'Thực phẩm tươi sống',
  'Thủy hải sản',
  'Rau củ quả',
  'Gia vị nêm nếm',
  'Đồ khô',
];

export default function EditorIngredientsPage() {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Thực phẩm tươi sống');
  const [newUnit, setNewUnit] = useState('g');
  const [newIsStaple, setNewIsStaple] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchIngredients = async () => {
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
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIngredients();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          category: newCategory,
          standardUnit: newUnit,
          isPantryStaple: newIsStaple,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi thêm nguyên liệu');
      }

      setShowModal(false);
      setNewName('');
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
    } catch (e) {
      alert('Đã có lỗi xảy ra');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang chủ</span>
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Từ điển nguyên liệu chuẩn hóa
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Quản trị danh mục nguyên liệu phục vụ ghép công thức và danh sách đi chợ (Invariants §5.3, §5.4).
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-hover)] transition-colors text-sm shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm nguyên liệu mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên nguyên liệu..."
            className="w-full pl-10 pr-4 py-2 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] text-[var(--color-text-primary)]"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-[var(--color-brand-primary)] text-white'
                  : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-base)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Ingredients Table */}
      <div className="bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-surface-raised)] border-b border-[var(--color-border-base)] text-xs font-semibold text-[var(--color-text-secondary)] uppercase">
              <tr>
                <th className="px-5 py-3.5">Tên nguyên liệu</th>
                <th className="px-5 py-3.5">Slug định danh</th>
                <th className="px-5 py-3.5">Nhóm thực phẩm</th>
                <th className="px-5 py-3.5">Đơn vị chuẩn</th>
                <th className="px-5 py-3.5">Gia vị có sẵn</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)] text-[var(--color-text-primary)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-xs text-[var(--color-text-muted)]">
                    Đang tải danh mục nguyên liệu...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-xs text-[var(--color-text-muted)]">
                    Chưa có nguyên liệu nào phù hợp. Bấm &quot;Thêm nguyên liệu mới&quot; để bổ sung vào từ điển.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--color-surface-raised)] transition-colors">
                    <td className="px-5 py-3 font-semibold">{item.name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[var(--color-text-muted)]">{item.slug}</td>
                    <td className="px-5 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono font-medium">{item.standardUnit}</td>
                    <td className="px-5 py-3">
                      {item.isPantryStaple ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-success-base)]">
                          <Check className="w-3.5 h-3.5" /> Có sẵn
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--color-text-muted)]">Cần mua tươi</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        title="Xóa nguyên liệu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Ingredient Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl p-6 max-w-md w-full shadow-lg">
            <h3 className="text-lg font-bold text-[var(--color-brand-primary)] mb-1">
              Thêm nguyên liệu mới
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mb-4">
              Chuẩn hóa tên gọi và đơn vị trước khi gắn vào công thức.
            </p>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Tên nguyên liệu (*)</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="VD: Thịt ba chỉ heo"
                  className="w-full px-3.5 py-2 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] text-[var(--color-text-primary)]"
                />
              </div>

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

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isStapleInput"
                  checked={newIsStaple}
                  onChange={(e) => setNewIsStaple(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]"
                />
                <label htmlFor="isStapleInput" className="text-xs font-medium cursor-pointer">
                  Đây là gia vị / nếp bếp thường có sẵn trong nhà
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[var(--color-border-subtle)]">
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
