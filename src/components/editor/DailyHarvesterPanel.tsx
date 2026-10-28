'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Flame,
  Globe,
  Loader2,
  Play,
  ShieldCheck,
  Sparkles,
  Store,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CuratedSourceSummary {
  id: string;
  name: string;
  domain: string;
  url: string;
  category: 'VIETNAMESE_HOME_COOKING' | 'HEALTHY_FITNESS';
  regionFocus: string;
  strengths: string;
  dishesCount: number;
}

interface HarvestedItem {
  recipeId: number;
  slug: string;
  name: string;
  role: string;
  status: 'PUBLISHED' | 'SUBMITTED' | 'DRAFT';
  sourceName: string;
  qualityScore: number;
  foodMatchRatePercent: number;
  estimatedTotalVnd: number;
  caloriesPerServing: number | null;
  heroImage?: string | null;
  hasRealPhoto?: boolean;
}

interface RecentHarvestedRow {
  id: number;
  slug: string;
  name: string;
  role: string;
  status: string;
  heroImage?: string | null;
  caloriesPerServing: number | null;
  sourceAttribution: string | null;
  reviewNotes: string | null;
  createdAt: string;
}

type HarvesterMode =
  | 'AUTO_PUBLISH_IF_QUALIFIED'
  | 'AUTO_PUBLISH_REAL_PHOTO_ONLY'
  | 'REVIEW_QUEUE';

interface DailyHarvesterPanelProps {
  onHarvestCompleted?: () => void;
}

export function DailyHarvesterPanel({ onHarvestCompleted }: DailyHarvesterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sources, setSources] = useState<CuratedSourceSummary[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [recentHarvested, setRecentHarvested] = useState<RecentHarvestedRow[]>([]);
  const [publishMode, setPublishMode] = useState<HarvesterMode>('AUTO_PUBLISH_IF_QUALIFIED');
  const [maxItems, setMaxItems] = useState<number>(3);
  const [customUrlText, setCustomUrlText] = useState('');
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<{
    harvested: HarvestedItem[];
    skippedDuplicates: string[];
    errors: string[];
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/editor/daily-harvest');
      if (res.ok) {
        const data = await res.json();
        const srcList: CuratedSourceSummary[] = data.sources || [];
        setSources(srcList);
        if (selectedSourceIds.length === 0 && srcList.length > 0) {
          setSelectedSourceIds(srcList.map((s) => s.id));
        }
        if (
          data.defaultPublishMode === 'REVIEW_QUEUE' ||
          data.defaultPublishMode === 'AUTO_PUBLISH_REAL_PHOTO_ONLY' ||
          data.defaultPublishMode === 'AUTO_PUBLISH_IF_QUALIFIED'
        ) {
          setPublishMode(data.defaultPublishMode);
        }
        setRecentHarvested(data.recentHarvested || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSelectMode = async (mode: HarvesterMode) => {
    setPublishMode(mode);
    try {
      await fetch('/api/editor/daily-harvest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SET_DEFAULT_MODE',
          publishMode: mode,
        }),
      });
    } catch {
      // ignore
    }
  };

  const toggleSource = (id: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleRunHarvestNow = async () => {
    setErrorMsg(null);
    setLastResult(null);
    setRunning(true);

    try {
      const customUrls = customUrlText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('http://') || l.startsWith('https://'));

      const res = await fetch('/api/editor/daily-harvest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceIds: selectedSourceIds,
          customUrls,
          maxItems,
          publishMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Không thể chạy thu thập món ăn.');
      } else if (data.result) {
        setLastResult({
          harvested: data.result.harvested || [],
          skippedDuplicates: data.result.skippedDuplicates || [],
          errors: data.result.errors || [],
        });
        setCustomUrlText('');
        await loadConfig();
        onHarvestCompleted?.();
      }
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ khi chạy thu thập công thức.');
    } finally {
      setRunning(false);
    }
  };

  const vnSources = sources.filter((s) => s.category === 'VIETNAMESE_HOME_COOKING');
  const healthySources = sources.filter((s) => s.category === 'HEALTHY_FITNESS');

  return (
    <section
      aria-label="Bộ Thu Thập & Chuẩn Hóa Món Ngon Mỗi Ngày"
      className="bg-white rounded-2xl border border-[#D5E2D5] shadow-xs overflow-hidden"
    >
      {/* Header Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-[#F2F7F2] via-[#FAF7F0] to-[#FFF8EE] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-[11px] font-bold">
              <CalendarClock className="w-3.5 h-3.5" />
              AUTO HARVESTER · 06:00 SÁNG MỖI NGÀY
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              5 Chốt Kiểm Định: Nguyên Liệu Thật · Calo Chuẩn · Bắt Ảnh Đa Tầng
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-[#2D482E]">
            Bộ Thu Thập Món Ngon Mỗi Ngày từ 10 Chuyên Trang Ẩm Thực Uy Tín (Phương Án 3)
          </h2>
          <p className="text-xs text-[#5C4A3A] leading-relaxed">
            Tự động lấy món mới từ <strong>Món Ngon Mỗi Ngày, Hướng Nghiệp Á Âu, Điện Máy Xanh Vào Bếp, Bách Hóa Xanh, VnExpress, Esheep Kitchen, Cookpad...</strong> — bắt ảnh đa tầng, đối chiếu từ điển thực phẩm Việt, tự tính Calo FCT &amp; Giá Bách Hóa Xanh.
          </p>

          {/* Thanh gạt nhanh chế độ duyệt ngay trên mặt chính */}
          <div className="pt-1 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#3F6240] mr-1">Chế độ hiện tại:</span>
            <button
              type="button"
              onClick={() => handleSelectMode('REVIEW_QUEUE')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                publishMode === 'REVIEW_QUEUE'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                  : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-50'
              }`}
            >
              🟡 Chờ tôi duyệt mới đăng
            </button>
            <button
              type="button"
              onClick={() => handleSelectMode('AUTO_PUBLISH_REAL_PHOTO_ONLY')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                publishMode === 'AUTO_PUBLISH_REAL_PHOTO_ONLY'
                  ? 'bg-sky-700 text-white border-sky-800 shadow-2xs'
                  : 'bg-white text-sky-900 border-sky-200 hover:bg-sky-50'
              }`}
            >
              🔵 Có ảnh gốc + Đạt chuẩn mới tự đăng
            </button>
            <button
              type="button"
              onClick={() => handleSelectMode('AUTO_PUBLISH_IF_QUALIFIED')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                publishMode === 'AUTO_PUBLISH_IF_QUALIFIED'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                  : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              🟢 Tự động đăng món đạt 5 chốt (kèm ảnh minh họa)
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleRunHarvestNow}
            disabled={running}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow-xs transition-all cursor-pointer disabled:opacity-60"
          >
            {running ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang thu thập & kiểm định thực phẩm...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>⚡ Thu thập {maxItems} món mới ngay</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FAF7F0] text-[#3F6240] border border-[#BCD0BE] text-xs font-bold transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Thu gọn cấu hình' : '⚙️ Cấu hình nguồn & Chế độ duyệt'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Kết quả vừa chạy tức thì */}
      {errorMsg && (
        <div className="mx-5 my-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
          {errorMsg}
        </div>
      )}

      {lastResult && (
        <div className="p-4 sm:p-5 bg-emerald-50/70 border-t border-emerald-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-extrabold text-emerald-950 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Đã thu thập & chuẩn hóa thành công {lastResult.harvested.length} món ăn mới!
            </h3>
            {lastResult.skippedDuplicates.length > 0 && (
              <span className="text-[11px] text-emerald-800">
                Đã bỏ qua {lastResult.skippedDuplicates.length} món trùng lặp trong kho
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {lastResult.harvested.map((item) => (
              <div
                key={item.recipeId}
                className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-2xs flex flex-col justify-between gap-2"
              >
                <div className="flex items-start gap-3">
                  {item.heroImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.heroImage}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover border border-stone-200 shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5 mb-1 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {item.status === 'PUBLISHED' ? '🟢 Đã Tự Động Xuất Bản' : '🟡 Chờ Bạn Duyệt'}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700">
                        {item.hasRealPhoto ? '📸 Ảnh bài gốc' : '🖼️ Ảnh minh họa'} · {item.qualityScore}/100
                      </span>
                    </div>
                    <Link
                      href={
                        item.status === 'PUBLISHED'
                          ? `/cong-thuc/${item.slug}`
                          : `/editor/recipes/${item.recipeId}`
                      }
                      className="text-sm font-bold text-[#2D2A26] hover:text-[#3F6240] hover:underline line-clamp-1"
                    >
                      {item.name}
                    </Link>
                    <p className="text-[11px] text-[#7C6A59] mt-0.5 truncate">
                      Nguồn: {item.sourceName}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                  <span className="font-semibold text-emerald-800">
                    Thực phẩm chuẩn: {item.foodMatchRatePercent}%
                  </span>
                  <span className="font-semibold text-amber-800">
                    ~{item.estimatedTotalVnd.toLocaleString('vi-VN')}đ/mâm
                  </span>
                  {item.caloriesPerServing && (
                    <span className="inline-flex items-center gap-0.5 text-orange-700 font-semibold">
                      <Flame className="w-3 h-3" />
                      {item.caloriesPerServing} kcal
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bảng cấu hình chi tiết (Phương án 3) */}
      {isExpanded && (
        <div className="p-4 sm:p-5 border-t border-[#EADBC8] space-y-5 bg-white">
          {/* 1. Chế độ duyệt (Phương án 3) & Số lượng món */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-[#FAF7F0] border border-[#EADBC8]">
            <div className="lg:col-span-3 space-y-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3F6240]">
                1. Chế độ Kiểm duyệt & Xuất bản (Tùy chọn linh hoạt 1 chạm)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSelectMode('REVIEW_QUEUE')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    publishMode === 'REVIEW_QUEUE'
                      ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-500/20'
                      : 'bg-white border-[#EADBC8] hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-900">
                      🟡 Để công thức xong tôi duyệt
                    </span>
                    {publishMode === 'REVIEW_QUEUE' && (
                      <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#5C4A3A] mt-1 leading-snug">
                    Mọi món lấy về được bóc tách sẵn nguyên liệu, tính Calo &amp; Giá, gắn ảnh rồi xếp vào <strong>Chờ duyệt (SUBMITTED)</strong> để bạn kiểm tra chính xác mới lên sóng.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectMode('AUTO_PUBLISH_REAL_PHOTO_ONLY')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    publishMode === 'AUTO_PUBLISH_REAL_PHOTO_ONLY'
                      ? 'bg-sky-50 border-sky-600 ring-2 ring-sky-500/20'
                      : 'bg-white border-[#EADBC8] hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-sky-900">
                      🔵 Có ảnh bài gốc + Đạt chuẩn mới tự đăng
                    </span>
                    {publishMode === 'AUTO_PUBLISH_REAL_PHOTO_ONLY' && (
                      <CheckCircle2 className="w-4 h-4 text-sky-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#5C4A3A] mt-1 leading-snug">
                    Chỉ tự động <strong>PUBLISHED</strong> khi bắt được ảnh chụp thật từ link bài viết gốc và đạt đủ 5 chốt Calo/Thực phẩm; nếu dùng ảnh minh họa sẽ đưa vào Chờ duyệt.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectMode('AUTO_PUBLISH_IF_QUALIFIED')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    publishMode === 'AUTO_PUBLISH_IF_QUALIFIED'
                      ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20'
                      : 'bg-white border-[#EADBC8] hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-900">
                      🟢 Tự động lên sóng nếu đạt đủ 5 chốt
                    </span>
                    {publishMode === 'AUTO_PUBLISH_IF_QUALIFIED' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#5C4A3A] mt-1 leading-snug">
                    Món vượt qua 5 chốt (nguyên liệu thật, khớp thực phẩm ≥75%, Calo chuẩn, tự gắn ảnh bài gốc hoặc ảnh minh họa nhóm món) sẽ tự động <strong>PUBLISHED</strong>.
                  </p>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3F6240]">
                2. Số lượng món mỗi đợt lấy
              </label>
              <select
                value={maxItems}
                onChange={(e) => setMaxItems(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#EADBC8] text-xs font-bold text-[#2D2A26]"
              >
                <option value={2}>2 món mới / đợt</option>
                <option value={3}>3 món mới / đợt (Cân bằng Mặn – Canh – Xào)</option>
                <option value={4}>4 món mới / đợt</option>
                <option value={6}>6 món mới / đợt</option>
              </select>
              <p className="text-[11px] text-[#7C6A59] leading-snug">
                Hệ thống tự động kiểm tra chống trùng lặp 100% với toàn bộ công thức đã có trong kho.
              </p>
            </div>
          </div>

          {/* 2. Danh sách 8 Kênh Cơm Nhà Việt Nam & 2 Nhóm Eat Clean/Gym */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#3F6240] flex items-center gap-1.5">
                <Store className="w-4 h-4" />
                Danh sách Kênh Ẩm Thực Cơm Nhà Việt Nam ({vnSources.length} kênh uy tín)
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedSourceIds(sources.map((s) => s.id))}
                  className="font-semibold text-[#3F6240] hover:underline"
                >
                  Chọn tất cả
                </button>
                <span className="text-stone-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedSourceIds(vnSources.map((s) => s.id))}
                  className="font-semibold text-amber-800 hover:underline"
                >
                  Chỉ chọn kênh Cơm Nhà Việt
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {vnSources.map((src) => {
                const checked = selectedSourceIds.includes(src.id);
                return (
                  <div
                    key={src.id}
                    onClick={() => toggleSource(src.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      checked
                        ? 'bg-[#F5F9F5] border-[#3F6240] shadow-2xs'
                        : 'bg-stone-50/70 border-stone-200 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-[#2D2A26] leading-snug">
                          {src.name}
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="mt-0.5 accent-[#3F6240]"
                        />
                      </div>
                      <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100/80 text-amber-900">
                        {src.regionFocus}
                      </span>
                      <p className="text-[11px] text-[#5C4A3A] mt-1.5 line-clamp-2 leading-snug">
                        {src.strengths}
                      </p>
                    </div>
                    <div className="pt-1.5 border-t border-stone-200/60 flex items-center justify-between text-[10px] text-[#7C6A59]">
                      <span>{src.domain}</span>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-0.5 text-[#3F6240] font-semibold hover:underline"
                      >
                        <span>Xem kênh</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {healthySources.length > 0 && (
              <>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-800 pt-2 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Nhóm Kênh Eat Clean · Giảm Cân · Tập Gym Quốc Tế (Tự động Việt hóa nguyên liệu)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {healthySources.map((src) => {
                    const checked = selectedSourceIds.includes(src.id);
                    return (
                      <div
                        key={src.id}
                        onClick={() => toggleSource(src.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          checked
                            ? 'bg-teal-50/50 border-teal-600'
                            : 'bg-stone-50/70 border-stone-200 opacity-70'
                        }`}
                      >
                        <div>
                          <span className="text-xs font-bold text-[#2D2A26]">{src.name}</span>
                          <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-900">
                            {src.regionFocus}
                          </span>
                          <p className="text-[11px] text-[#5C4A3A] mt-1">{src.strengths}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="mt-1 accent-teal-700"
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* 3. Ô dán thêm URL bài viết cụ thể (nếu muốn chỉ định bài lẻ) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#3F6240]">
              Dán thêm Link URL bài viết công thức cụ thể từ các trang trên (tùy chọn — mỗi dòng 1 link):
            </label>
            <textarea
              rows={2}
              value={customUrlText}
              onChange={(e) => setCustomUrlText(e.target.value)}
              placeholder="VD: https://monngonmoingay.com/... hoặc https://www.dienmayxanh.com/vao-bep/..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#EADBC8] bg-[#FAF7F0] focus:outline-none focus:ring-2 focus:ring-[#3F6240]"
            />
          </div>

          {/* 4. Lịch sử các món thu thập tự động gần đây */}
          {recentHarvested.length > 0 && (
            <div className="pt-2 border-t border-[#EADBC8] space-y-2">
              <h4 className="text-xs font-bold text-[#5C4A3A] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Các món vừa thu thập gần đây ({recentHarvested.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {recentHarvested.map((r) => (
                  <Link
                    key={r.id}
                    href={r.status === 'PUBLISHED' ? `/cong-thuc/${r.slug}` : `/editor/recipes/${r.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF7F0] hover:bg-[#F3E9DD] border border-[#EADBC8] text-xs font-semibold text-[#2D2A26]"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        r.status === 'PUBLISHED' ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}
                    />
                    <span>{r.name}</span>
                    {r.caloriesPerServing && (
                      <span className="text-[10px] text-amber-800">({r.caloriesPerServing} kcal)</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
