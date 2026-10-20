'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Tag, ArrowLeft, Trash2, AlertCircle } from 'lucide-react';

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
    desc: 'Phân loại công thức theo phong vị Miền Bắc, Miền Trung, Miền Nam, Miền Tây.',
  },
  {
    key: 'COOKING_METHOD',
    title: 'Phương pháp chế biến',
    desc: 'Cách nấu chính của món: Kho, Xào, Canh, Luộc/Hấp, Chiên, Nướng.',
  },
  {
    key: 'DIET_PREFERENCE',
    title: 'Đặc tính & dinh dưỡng',
    desc: 'Thanh đạm, Ít dầu mỡ, Giải nhiệt mùa hè, Ấm bụng mùa đông, Ăn chay.',
  },
  {
    key: 'OCCASION',
    title: 'Dịp & bữa cơm',
    desc: 'Cơm gia đình hàng ngày, Cuối tuần sum họp, Đám giỗ, Ngày lễ tết.',
  },
];

export default function EditorTaxonomiesPage() {
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [loading, setLoading] = useState(true);

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
    } catch (e) {
      alert('Đã có lỗi xảy ra');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Top Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại trang chủ</span>
        </Link>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Hệ thống phân loại đa trục (Taxonomies)
        </h1>
        <p className="text-xs text-[var(--color-text-secondary)]">
          Quản lý các nhãn phân loại phục vụ tìm kiếm thông minh và lọc mâm cơm cân đối.
        </p>
      </div>

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

        <form onSubmit={handleCreate} className="flex flex-wrap items-center gap-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as Taxonomy['type'])}
            className="px-3.5 py-2 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] text-[var(--color-text-primary)]"
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
            placeholder="Tên nhãn mới (VD: Món hấp, Ăn chay...)"
            className="flex-1 min-w-[200px] px-3.5 py-2 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] text-[var(--color-text-primary)]"
          />

          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-50"
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
              <div className="mb-4">
                <h3 className="text-base font-bold text-[var(--color-brand-primary)] flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  <span>{group.title}</span>
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  {group.desc}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 flex-1 items-start">
                {loading ? (
                  <span className="text-xs text-[var(--color-text-muted)]">Đang tải...</span>
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
