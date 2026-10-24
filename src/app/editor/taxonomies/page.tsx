'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Tag, ArrowLeft, Trash2, AlertCircle, RefreshCw, Check, ShieldCheck } from 'lucide-react';
import { AdminTopNav } from '@/components/editor/AdminTopNav';

interface Taxonomy {
  id: number;
  type: 'CUISINE_REGION' | 'COOKING_METHOD' | 'DIET_PREFERENCE' | 'OCCASION';
  name: string;
  slug: string;
}

const TAXONOMY_TYPES: { key: Taxonomy['type']; title: string; desc: string }[] = [
  {
    key: 'CUISINE_REGION',
    title: 'Vùng miền ẩm thực',
    desc: 'Phân loại công thức theo phong vị Miền Bắc, Miền Trung, Miền Nam, Miền Tây, Cố đô Huế, Tây Nguyên và Giao thoa Á – Âu.',
  },
  {
    key: 'COOKING_METHOD',
    title: 'Phương pháp chế biến',
    desc: 'Cách nấu chính của món: Kho, Xào, Canh, Luộc/Hấp, Áp chảo/Nướng, Nồi chiên không dầu, Hầm, Gỏi/Salad, Cuốn, Nước chấm.',
  },
  {
    key: 'DIET_PREFERENCE',
    title: 'Đặc tính & dinh dưỡng',
    desc: 'Giảm cân · Ít Calo, Tập Gym · Tăng cơ, Eat Clean, Giàu Protein, Low-Carb, Ít muối tốt huyết áp, Ăn chay, Mẹ bầu, Cho bé.',
  },
  {
    key: 'OCCASION',
    title: 'Dịp & bữa cơm',
    desc: 'Bữa cơm hàng ngày, Nhanh gọn ≤ 20 phút, Mang cơm đi làm (Meal Prep), Bữa tối nhẹ bụng, Cuối tuần, Đãi tiệc, Lễ Tết.',
  },
];

export default function EditorTaxonomiesPage() {
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Form State
  const [selectedType, setSelectedType] = useState<Taxonomy['type']>('CUISINE_REGION');
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTaxonomies = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/taxonomies');
      if (res.ok) {
        const data = await res.json();
        setTaxonomies(data.taxonomies || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxonomies();
  }, []);

  const handleSyncStandardTaxonomies = async () => {
    setSyncing(true);
    setSyncNotice(null);
    try {
      const res = await fetch('/api/taxonomies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_standard_taxonomies' }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Không thể đồng bộ bộ nhãn phân loại');
        return;
      }
      setSyncNotice(data.message || 'Đã đồng bộ 44 nhãn phân loại chuẩn Việt Nam!');
      await fetchTaxonomies();
    } catch {
      alert('Lỗi kết nối máy chủ khi đồng bộ nhãn');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/taxonomies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType, name: newName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi thêm phân loại');
      }

      setNewName('');
      fetchTaxonomies();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Đã có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa thẻ "${name}"?`)) return;

    try {
      const res = await fetch(`/api/taxonomies/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Lỗi xóa phân loại');
        return;
      }
      fetchTaxonomies();
    } catch {
      alert('Đã có lỗi xảy ra');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminTopNav
        title="Hệ Phân Loại Đa Trục (Taxonomies)"
        subtitle="Quản lý 44+ nhãn Vùng miền, Cách nấu, Dinh dưỡng và Dịp bữa ăn"
      />
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              <span>Đang hoạt động: {taxonomies.length} nhãn trên 4 trục</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">
            Hệ thống phân loại đa trục (Taxonomies)
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
            Quản lý các nhãn Vùng miền, Phương pháp chế biến, Dinh dưỡng (Eat Clean / Gym / Giảm cân) và Dịp bữa ăn phục vụ bộ lọc thông minh.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSyncStandardTaxonomies}
          disabled={syncing}
          className="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors text-xs sm:text-sm shadow-2xs shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-amber-700 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Đang đồng bộ...' : 'Đồng bộ 44 Nhãn Phổ Biến Chuẩn VN'}</span>
        </button>
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

      {/* Quick Add Bar */}
      <div className="p-5 bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl shadow-xs">
        <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[var(--color-brand-primary)]" />
          <span>Thêm nhãn phân loại mới</span>
        </h3>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as Taxonomy['type'])}
            className="px-3.5 py-2.5 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] text-[var(--color-text-primary)]"
          >
            {TAXONOMY_TYPES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.title}
              </option>
            ))}
          </select>

          <input
            type="text"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Tên nhãn mới (VD: Nồi chiên không dầu, Ít tinh bột Low-Carb, Mang cơm đi làm...)"
            className="flex-1 min-w-[200px] px-3.5 py-2.5 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] text-[var(--color-text-primary)]"
          />

          <button
            type="submit"
            disabled={submitting}
            className="min-h-11 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-50"
          >
            {submitting ? 'Đang thêm...' : 'Thêm nhãn'}
          </button>
        </form>
      </div>

      {/* Taxonomies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TAXONOMY_TYPES.map((group) => {
          const groupItems = taxonomies.filter((t) => t.type === group.key);

          return (
            <div
              key={group.key}
              className="p-5 bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl shadow-xs flex flex-col"
            >
              <div className="mb-4 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[var(--color-brand-primary)] flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    <span>{group.title}</span>
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                    {group.desc}
                  </p>
                </div>
                <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] border border-[var(--color-brand-border)]">
                  {groupItems.length} nhãn
                </span>
              </div>

              <div className="flex flex-wrap gap-2 flex-1 items-start">
                {loading ? (
                  <span className="text-xs text-[var(--color-text-muted)]">Đang tải danh sách nhãn...</span>
                ) : groupItems.length === 0 ? (
                  <span className="text-xs text-[var(--color-text-muted)] italic">
                    Chưa có nhãn nào trong nhóm này.
                  </span>
                ) : (
                  groupItems.map((item) => (
                    <div
                      key={item.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] text-[var(--color-text-primary)] group hover:border-[var(--color-brand-primary)] transition-colors"
                    >
                      <span>{item.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.name)}
                        className="text-[var(--color-text-muted)] hover:text-red-500 transition-colors ml-0.5"
                        title="Xóa nhãn"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
