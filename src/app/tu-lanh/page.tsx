'use client';

// AG-40: Trang Quản lý Kho Thực phẩm & Tủ lạnh Gia đình (Pantry)
import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { 
  Refrigerator, 
  Snowflake, 
  Package, 
  Plus, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  Check, 
  ArrowRight,
  ShoppingBag,
  Calendar,
  Clock
} from 'lucide-react';

interface PantryItem {
  id: number;
  customName: string;
  quantity: number;
  unit: string;
  location: 'FRIDGE' | 'FREEZER' | 'DRY_PANTRY';
  expiresAt: string | null;
  notes: string | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
  ingredient?: {
    name: string;
    category: string;
  } | null;
}

interface PantryStats {
  totalItems: number;
  expiringSoonCount: number;
  expiredCount: number;
  fridgeCount: number;
  freezerCount: number;
  dryCount: number;
}

function PantryContent() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [stats, setStats] = useState<PantryStats>({
    totalItems: 0,
    expiringSoonCount: 0,
    expiredCount: 0,
    fridgeCount: 0,
    freezerCount: 0,
    dryCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'FRIDGE' | 'FREEZER' | 'DRY_PANTRY'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form thêm món mới
  const [formName, setFormName] = useState('');
  const [formQuantity, setFormQuantity] = useState('1');
  const [formUnit, setFormUnit] = useState('gam');
  const [formLocation, setFormLocation] = useState<'FRIDGE' | 'FREEZER' | 'DRY_PANTRY'>('FRIDGE');
  const [formExpiresDays, setFormExpiresDays] = useState('7');
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const fetchPantry = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pantry');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error('Failed to load pantry', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPantry();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setSubmitting(true);
    try {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + Number(formExpiresDays));

      const res = await fetch('/api/pantry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customName: formName.trim(),
          quantity: Number(formQuantity),
          unit: formUnit,
          location: formLocation,
          expiresAt: expDate.toISOString(),
          notes: formNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        setFormName('');
        setFormNotes('');
        setShowAddModal(false);
        setMessage('Đã thêm thực phẩm vào tủ lạnh!');
        setTimeout(() => setMessage(''), 3000);
        fetchPantry();
      }
    } catch (err) {
      console.error('Add item error', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa món này khỏi tủ lạnh?')) return;
    try {
      const res = await fetch(`/api/pantry/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        fetchPantry();
      }
    } catch (err) {
      console.error('Delete item error', err);
    }
  };

  const handleUpdateQuantity = async (id: number, delta: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const newQty = Math.max(0.1, Math.round((item.quantity + delta) * 10) / 10);
    try {
      const res = await fetch(`/api/pantry/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, quantity: newQty } : i))
        );
      }
    } catch (err) {
      console.error('Update qty error', err);
    }
  };

  const filteredItems = items.filter((item) => {
    if (activeTab === 'ALL') return true;
    return item.location === activeTab;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl">🧊</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-brand-primary)]">
              Tủ Lạnh & Kho Bếp Gia Đình
            </h1>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">
            Theo dõi nguyên liệu sẵn có trong nhà, cảnh báo hạn dùng và tránh mua thừa khi đi chợ.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/shopping"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 bg-white hover:bg-stone-50 font-medium text-sm transition-colors shadow-xs"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Giỏ đi chợ</span>
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-brand-primary)] text-white hover:opacity-95 font-semibold text-sm transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm thực phẩm</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-medium flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Cảnh báo cận hạn */}
      {stats.expiringSoonCount > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm">
              Có {stats.expiringSoonCount} thực phẩm sắp hết hạn trong 3 ngày tới!
            </h3>
            <p className="text-xs text-amber-700 mt-0.5">
              Hãy ưu tiên nấu các món sử dụng nguyên liệu này trước để tránh lãng phí thực phẩm.
            </p>
          </div>
        </div>
      )}

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div 
          onClick={() => setActiveTab('ALL')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'ALL' 
              ? 'bg-[var(--color-brand-primary)] text-white shadow-md border-transparent' 
              : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium uppercase tracking-wider opacity-80">Tổng số món</span>
            <Refrigerator className="w-4 h-4 opacity-75" />
          </div>
          <div className="text-2xl font-black">{stats.totalItems}</div>
        </div>

        <div 
          onClick={() => setActiveTab('FRIDGE')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'FRIDGE' 
              ? 'bg-blue-600 text-white shadow-md border-transparent' 
              : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium uppercase tracking-wider opacity-80">❄️ Ngăn mát</span>
            <Snowflake className="w-4 h-4 opacity-75" />
          </div>
          <div className="text-2xl font-black">{stats.fridgeCount}</div>
        </div>

        <div 
          onClick={() => setActiveTab('FREEZER')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'FREEZER' 
              ? 'bg-cyan-600 text-white shadow-md border-transparent' 
              : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium uppercase tracking-wider opacity-80">🧊 Ngăn đông</span>
            <Snowflake className="w-4 h-4 opacity-75" />
          </div>
          <div className="text-2xl font-black">{stats.freezerCount}</div>
        </div>

        <div 
          onClick={() => setActiveTab('DRY_PANTRY')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'DRY_PANTRY' 
              ? 'bg-amber-700 text-white shadow-md border-transparent' 
              : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium uppercase tracking-wider opacity-80">🌾 Kho khô & Gia vị</span>
            <Package className="w-4 h-4 opacity-75" />
          </div>
          <div className="text-2xl font-black">{stats.dryCount}</div>
        </div>
      </div>

      {/* Danh sách thực phẩm */}
      {loading ? (
        <div className="text-center py-16 text-stone-400">Đang tải kho thực phẩm gia đình...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8 shadow-xs">
          <div className="text-5xl mb-4">🧊</div>
          <h3 className="text-lg font-bold text-stone-800 mb-1">Chưa có thực phẩm nào trong ngăn này</h3>
          <p className="text-sm text-stone-500 max-w-md mx-auto mb-6">
            Bấm nút bên dưới để thêm các nguyên liệu sẵn có trong tủ lạnh hoặc kho gia vị của nhà bạn.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-brand-primary)] text-white hover:opacity-95 font-semibold text-sm transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm thực phẩm ngay</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border bg-white shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${
                item.isExpired 
                  ? 'border-red-300 bg-red-50/20' 
                  : item.isExpiringSoon 
                  ? 'border-amber-300 bg-amber-50/20' 
                  : 'border-stone-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-bold text-base text-stone-800 leading-snug">
                    {item.customName}
                  </h4>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    item.location === 'FREEZER'
                      ? 'bg-cyan-100 text-cyan-800'
                      : item.location === 'DRY_PANTRY'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {item.location === 'FREEZER' ? '🧊 Đông' : item.location === 'DRY_PANTRY' ? '🌾 Kho khô' : '❄️ Mát'}
                  </span>
                </div>

                {item.notes && (
                  <p className="text-xs text-stone-500 italic mb-3">{item.notes}</p>
                )}

                {/* Hạn sử dụng */}
                {item.expiresAt && (
                  <div className="flex items-center gap-1.5 text-xs mb-4">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span className={item.isExpired ? 'text-red-600 font-semibold' : item.isExpiringSoon ? 'text-amber-700 font-medium' : 'text-stone-500'}>
                      {item.isExpired 
                        ? 'Đã hết hạn!' 
                        : item.isExpiringSoon 
                        ? 'Sắp hết hạn!' 
                        : `HSD: ${new Date(item.expiresAt).toLocaleDateString('vi-VN')}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Điều chỉnh số lượng & Xóa */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleUpdateQuantity(item.id, -1)}
                    className="w-7 h-7 rounded-lg border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 text-sm font-bold"
                  >
                    -
                  </button>
                  <span className="font-bold text-sm text-stone-800 px-2">
                    {item.quantity} {item.unit}
                  </span>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, 1)}
                    className="w-7 h-7 rounded-lg border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 text-sm font-bold"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Xóa khỏi tủ lạnh"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal thêm thực phẩm */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 animate-scale-in">
            <h3 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
              <span>🧊</span> Thêm thực phẩm vào tủ lạnh
            </h3>

            <form onSubmit={handleAddItem} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Tên thực phẩm / nguyên liệu</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Thịt ba chỉ, Trứng gà, Cà chua..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Số lượng</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Đơn vị</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                  >
                    <option value="gam">gam</option>
                    <option value="kg">kg</option>
                    <option value="lạng">lạng</option>
                    <option value="quả">quả</option>
                    <option value="củ">củ</option>
                    <option value="bó">bó</option>
                    <option value="hộp">hộp</option>
                    <option value="chai">chai</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Vị trí bảo quản</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'FRIDGE', label: '❄️ Ngăn mát' },
                    { id: 'FREEZER', label: '🧊 Ngăn đông' },
                    { id: 'DRY_PANTRY', label: '🌾 Kho khô' },
                  ].map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setFormLocation(loc.id as any)}
                      className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all ${
                        formLocation === loc.id
                          ? 'bg-[var(--color-brand-primary)] text-white border-transparent shadow-xs'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Thời hạn sử dụng</label>
                <select
                  value={formExpiresDays}
                  onChange={(e) => setFormExpiresDays(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                >
                  <option value="3">3 ngày (Rau lá, thịt tươi)</option>
                  <option value="7">7 ngày (Rau củ, trứng gà)</option>
                  <option value="15">15 ngày (Đồ đông lạnh ăn sớm)</option>
                  <option value="30">1 tháng (Thịt cá cấp đông)</option>
                  <option value="90">3 tháng (Gia vị, đồ khô)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Ghi chú (Tùy chọn)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Mua ở siêu thị chiều nay"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-50 font-medium text-sm transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[var(--color-brand-primary)] text-white hover:opacity-95 font-bold text-sm transition-all shadow-xs"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu vào tủ lạnh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PantryPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-16 text-center text-stone-400">Đang tải tủ lạnh gia đình...</div>}>
      <PantryContent />
    </Suspense>
  );
}
