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
  Check, 
  ShoppingBag,
  Clock,
  Sparkles,
  LogIn,
  Utensils
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
  const [isUnauthorized, setIsUnauthorized] = useState(false);
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
  const [errorMsg, setErrorMsg] = useState('');

  const fetchPantry = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pantry');
      if (res.status === 401) {
        setIsUnauthorized(true);
        return;
      }
      if (res.ok) {
        setIsUnauthorized(false);
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
        setErrorMsg('');
        setShowAddModal(false);
        setMessage('Đã thêm thực phẩm vào tủ lạnh!');
        setTimeout(() => setMessage(''), 3000);
        fetchPantry();
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.error || 'Không thể lưu thực phẩm. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Add item error', err);
      setErrorMsg('Không thể kết nối máy chủ.');
    } finally {
      setSubmitting(false);
    }
  };

  const QUICK_GROCERY_PRESETS = [
    { customName: 'Thịt ba rọi heo', quantity: 400, unit: 'gam', location: 'FRIDGE' as const, days: 3, emoji: '🥩' },
    { customName: 'Trứng gà ta', quantity: 6, unit: 'quả', location: 'FRIDGE' as const, days: 14, emoji: '🥚' },
    { customName: 'Đậu hũ trắng', quantity: 3, unit: 'bìa', location: 'FRIDGE' as const, days: 2, emoji: '🧈' },
    { customName: 'Rau muống tươi', quantity: 1, unit: 'bó', location: 'FRIDGE' as const, days: 3, emoji: '🥬' },
    { customName: 'Cà chua chín', quantity: 4, unit: 'quả', location: 'FRIDGE' as const, days: 5, emoji: '🍅' },
    { customName: 'Tôm sú tươi', quantity: 300, unit: 'gam', location: 'FREEZER' as const, days: 14, emoji: '🦐' },
    { customName: 'Phi lê cá lóc', quantity: 400, unit: 'gam', location: 'FREEZER' as const, days: 14, emoji: '🐟' },
  ];

  const handleQuickAddPreset = async (preset: (typeof QUICK_GROCERY_PRESETS)[number]) => {
    try {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + preset.days);
      const res = await fetch('/api/pantry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customName: preset.customName,
          quantity: preset.quantity,
          unit: preset.unit,
          location: preset.location,
          expiresAt: expDate.toISOString(),
        }),
      });
      if (res.ok) {
        setMessage(`Đã cất nhanh "${preset.customName} (${preset.quantity} ${preset.unit})" vào tủ lạnh!`);
        setTimeout(() => setMessage(''), 3000);
        fetchPantry();
      }
    } catch {
      // Ignore error
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

  // Ưu tiên nguyên liệu sắp hết hạn trước khi gửi sang Trợ lý Bếp AI
  const prioritizedIngredientNames = Array.from(
    new Set(
      [...items]
        .filter((i) => !i.isExpired)
        .sort((a, b) => (a.isExpiringSoon === b.isExpiringSoon ? 0 : a.isExpiringSoon ? -1 : 1))
        .map((i) => (i.ingredient?.name || i.customName).trim())
        .filter(Boolean)
    )
  ).slice(0, 12);

  const aiMealHref =
    prioritizedIngredientNames.length > 0
      ? `/meal?aiIngredients=${encodeURIComponent(prioritizedIngredientNames.join(','))}`
      : '/meal?aiIngredients=Th%E1%BB%8Bt%20ba%20ch%E1%BB%89,Rau%20mu%E1%BB%91ng';

  if (!loading && isUnauthorized) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-[var(--color-surface-white)] rounded-3xl border border-[var(--color-border-base)] p-8 sm:p-10 text-center shadow-xs space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] border border-[var(--color-brand-border)]/70 flex items-center justify-center mx-auto">
            <Refrigerator className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-brand-primary)]">
              Tủ Lạnh &amp; Kho Bếp Gia Đình
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Lưu lại thực phẩm đang có trong ngăn mát, ngăn đông và kệ gia vị của nhà bạn để nhận cảnh báo cận hạn, tự động trừ nguyên liệu khi đi chợ và gợi ý mâm cơm 3 món từ đồ sẵn có.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/login?from=/tu-lanh"
              className="min-h-11 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-white font-semibold text-sm transition-colors shadow-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập để mở tủ lạnh</span>
            </Link>
            <Link
              href="/register?from=/tu-lanh"
              className="min-h-11 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-subtle)] text-[var(--color-text-primary)] border border-[var(--color-border-base)] font-semibold text-sm transition-colors"
            >
              <span>Tạo tài khoản mới</span>
            </Link>
            <Link
              href="/meal"
              className="min-h-11 inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-[var(--color-accent-text)] bg-[var(--color-accent-light)] hover:opacity-95 font-semibold text-sm transition-colors"
            >
              <Utensils className="w-4 h-4" />
              <span>Ghép mâm cơm ngay (không cần đăng nhập)</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] flex items-center justify-center shrink-0">
              <Refrigerator className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-brand-primary)]">
              Tủ Lạnh &amp; Kho Bếp Gia Đình
            </h1>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Theo dõi nguyên liệu sẵn có trong nhà, cảnh báo hạn dùng và tránh mua thừa khi đi chợ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {items.length > 0 && (
            <Link
              href={aiMealHref}
              className="min-h-11 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)] text-white font-semibold text-sm transition-colors shadow-xs"
              title="Gợi ý mâm cơm 3 món ưu tiên nguyên liệu đang có trong tủ lạnh"
            >
              <Sparkles className="w-4 h-4 text-[var(--color-accent-light)]" />
              <span>Gợi ý mâm cơm từ tủ lạnh</span>
            </Link>
          )}
          <Link
            href="/shopping"
            className="min-h-11 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border-base)] text-[var(--color-text-primary)] bg-[var(--color-surface-white)] hover:bg-[var(--color-surface-raised)] font-medium text-sm transition-colors shadow-xs"
          >
            <ShoppingBag className="w-4 h-4 text-[var(--color-brand-primary)]" />
            <span>Giỏ đi chợ</span>
          </Link>
          <button
            onClick={() => {
              setErrorMsg('');
              setShowAddModal(true);
            }}
            className="min-h-11 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-white font-semibold text-sm transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm thực phẩm</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-xl bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] border border-[var(--color-brand-border)] text-sm font-medium flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Cảnh báo cận hạn */}
      {stats.expiringSoonCount > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
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
          <Link
            href={aiMealHref}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shrink-0 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nhờ AI ghép món giải cứu tủ lạnh</span>
          </Link>
        </div>
      )}

      {/* Cất nhanh đồ tươi mới đi chợ về (1 chạm) */}
      <div className="mb-6 p-4 rounded-2xl bg-[#FFFDF9] border border-[#E8D5B7] shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
            ⚡ Cất nhanh đồ mới đi chợ về (1 chạm)
          </span>
          <span className="text-[11px] text-stone-500">Tự động gán ngăn & hạn dùng chuẩn</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_GROCERY_PRESETS.map((preset) => (
            <button
              key={preset.customName}
              type="button"
              onClick={() => handleQuickAddPreset(preset)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-stone-800 hover:text-emerald-800 border border-stone-200 hover:border-emerald-300 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            >
              <span>{preset.emoji}</span>
              <span>+ {preset.customName}</span>
              <span className="text-[10px] text-stone-400">
                ({preset.quantity} {preset.unit})
              </span>
            </button>
          ))}
        </div>
      </div>

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
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {errorMsg}
                </div>
              )}
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
