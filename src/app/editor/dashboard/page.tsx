'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  BookOpen,
  Carrot,
  Flame,
  Calendar,
  Heart,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Camera,
  UserPlus,
  Plus,
  MessageSquare,
  Flag,
} from 'lucide-react';
import { AdminTopNav } from '@/components/editor/AdminTopNav';

interface OverviewResponse {
  userMetrics: {
    total: number;
    admins: number;
    editors: number;
    cooks: number;
    newLast7Days: number;
    recentUsers: Array<{
      id: number;
      displayName: string;
      email: string;
      role: string;
      createdAt: string;
    }>;
  };
  recipeMetrics: {
    total: number;
    published: number;
    draft: number;
    submitted: number;
    needsChanges: number;
    editorialReviewed: number;
    cookTested: number;
    nutritionVerified: number;
    avgCaloriesPerServing: number;
    byRole: {
      MAIN: number;
      SOUP: number;
      SIDE: number;
      DIPPING_SAUCE: number;
      OTHER: number;
    };
  };
  catalogMetrics: {
    ingredientsCount: number;
    nutritionVerifiedIngredients: number;
    taxonomiesCount: number;
  };
  activityMetrics: {
    totalSavedRecipes: number;
    totalDiaryEntries: number;
    totalMealPlans: number;
    totalPantryItems: number;
    totalFeedbacks: number;
    totalReports: number;
  };
  topRecipes: Array<{
    id: number;
    slug: string;
    name: string;
    role: string;
    caloriesPerServing: number | null;
    savesCount: number;
    plansCount: number;
    engagementScore: number;
  }>;
  recentDiaryFeed: Array<{
    id: number;
    userId: number;
    userDisplayName: string;
    userEmail: string;
    recipeName: string;
    diaryDate: string;
    mealType: string;
    calories: number;
    protein: number;
    isAiScan: boolean;
    createdAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadOverview() {
    setLoading(true);
    try {
      const res = await fetch('/api/editor/overview');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Lỗi tải dữ liệu tổng quan Admin:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#2D2A26] pb-16">
      <AdminTopNav
        title="Bảng Điều Khiển & Số Liệu Toàn Hệ Thống (Admin Dashboard)"
        subtitle="Theo dõi thời gian thực: Thành viên, Bài viết công thức, Dữ liệu Calo Viện Dinh Dưỡng & Nhật ký Quét ảnh AI"
      />

      <main className="w-full mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {loading || !data ? (
          <div className="p-16 bg-white rounded-3xl border border-[#EADBC8] text-center text-xs text-[#7C6A59]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#3F6240]" />
            Đang tổng hợp số liệu toàn hệ thống...
          </div>
        ) : (
          <>
            {/* HÀNG 1: 6 THẺ KPI TOÀN HỆ THỐNG */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
              <Link
                href="/editor/users"
                className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs hover:border-[#3F6240] transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#5C4A3A]">👥 Thành viên</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold">
                    +{data.userMetrics.newLast7Days} tuần này
                  </span>
                </div>
                <p className="text-2xl font-black text-[#2F4F30] my-1.5">
                  {data.userMetrics.total}
                </p>
                <p className="text-[11px] text-[#7C6A59]">
                  {data.userMetrics.admins} Admin • {data.userMetrics.editors} Editor •{' '}
                  {data.userMetrics.cooks} Cook
                </p>
              </Link>

              <Link
                href="/editor/recipes"
                className="bg-white p-4 rounded-2xl border border-[#EADBC8] shadow-2xs hover:border-[#3F6240] transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#5C4A3A]">🍲 Bài viết / Món ăn</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[10px] font-extrabold">
                    TB ~{data.recipeMetrics.avgCaloriesPerServing} kcal
                  </span>
                </div>
                <p className="text-2xl font-black text-[#2F4F30] my-1.5">
                  {data.recipeMetrics.published}/{data.recipeMetrics.total}
                </p>
                <p className="text-[11px] text-[#7C6A59]">
                  {data.recipeMetrics.draft} bản nháp • {data.recipeMetrics.submitted} chờ duyệt
                </p>
              </Link>

              <Link
                href="/editor/ingredients"
                className="bg-white p-4 rounded-2xl border border-[#EADBC8] shadow-2xs hover:border-[#3F6240] transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#5C4A3A]">🥦 Nguyên liệu FCT</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold">
                    Chuẩn VDD
                  </span>
                </div>
                <p className="text-2xl font-black text-[#2F4F30] my-1.5">
                  {data.catalogMetrics.ingredientsCount}
                </p>
                <p className="text-[11px] text-[#7C6A59]">
                  {data.catalogMetrics.nutritionVerifiedIngredients} đã gắn thông số Calo/100g
                </p>
              </Link>

              <Link
                href="/editor/taxonomies"
                className="bg-white p-4 rounded-2xl border border-[#EADBC8] shadow-2xs hover:border-[#3F6240] transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#5C4A3A]">🏷️ Nhãn phân loại</span>
                  <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-extrabold">
                    4 Trục
                  </span>
                </div>
                <p className="text-2xl font-black text-[#2F4F30] my-1.5">
                  {data.catalogMetrics.taxonomiesCount}
                </p>
                <p className="text-[11px] text-[#7C6A59]">
                  Vùng miền • Cách nấu • Gym/Yoga • Dịp ăn
                </p>
              </Link>

              <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900">📸 Nhật ký &amp; Quét AI</span>
                  <Flame className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-2xl font-black text-[#B75B35] my-1.5">
                  {data.activityMetrics.totalDiaryEntries}
                </p>
                <p className="text-[11px] text-[#7C6A59]">
                  {data.activityMetrics.totalMealPlans} lịch tuần •{' '}
                  {data.activityMetrics.totalPantryItems} món tủ lạnh
                </p>
              </div>

              <Link
                href="/editor/feedbacks"
                className="bg-white p-4 rounded-2xl border border-rose-200 shadow-2xs hover:border-rose-400 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-900">❤️ Lưu &amp; Đánh giá</span>
                  <Heart className="w-4 h-4 text-rose-600" />
                </div>
                <p className="text-2xl font-black text-rose-700 my-1.5">
                  {data.activityMetrics.totalSavedRecipes}
                </p>
                <p className="text-[11px] text-[#7C6A59]">
                  {data.activityMetrics.totalFeedbacks} đánh giá •{' '}
                  {data.activityMetrics.totalReports} báo cáo
                </p>
              </Link>
            </div>

            {/* HÀNG 2: CẤU TRÚC KHO BÀI VIẾT & CHẤT LƯỢNG KIỂM CHỨNG Y KHOA */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Cột Trái (7/12): Phân bổ Bài viết theo Vai trò & 3 Nhãn Kiểm Chứng */}
              <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-[#EADBC8] shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm sm:text-base font-extrabold text-[#2F4F30]">
                    📊 Cấu Trúc Kho Bài Viết &amp; Chỉ Số Kiểm Chứng Dinh Dưỡng
                  </h2>
                  <Link
                    href="/editor/recipes"
                    className="text-xs font-bold text-[#3F6240] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Quản lý tất cả bài viết</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* 4 Khối Vai trò Món ăn */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                    <span className="text-[11px] font-bold text-emerald-900 block">
                      🥩 Món Chính (Mặn)
                    </span>
                    <span className="text-xl font-black text-emerald-800">
                      {data.recipeMetrics.byRole.MAIN}
                    </span>
                    <span className="text-[10px] text-emerald-700 block">món ăn</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200">
                    <span className="text-[11px] font-bold text-blue-900 block">
                      🍲 Món Canh
                    </span>
                    <span className="text-xl font-black text-blue-800">
                      {data.recipeMetrics.byRole.SOUP}
                    </span>
                    <span className="text-[10px] text-blue-700 block">món ăn</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
                    <span className="text-[11px] font-bold text-amber-900 block">
                      🥦 Món Rau / Phụ
                    </span>
                    <span className="text-xl font-black text-amber-800">
                      {data.recipeMetrics.byRole.SIDE}
                    </span>
                    <span className="text-[10px] text-amber-700 block">món ăn</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200">
                    <span className="text-[11px] font-bold text-purple-900 block">
                      🥣 Nước Chấm &amp; Bowl
                    </span>
                    <span className="text-xl font-black text-purple-800">
                      {data.recipeMetrics.byRole.DIPPING_SAUCE + data.recipeMetrics.byRole.OTHER}
                    </span>
                    <span className="text-[10px] text-purple-700 block">công thức</span>
                  </div>
                </div>

                {/* 3 Thanh Tiến Độ Kiểm Chứng Chất Lượng Bài Viết */}
                <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E5DAC8] space-y-3">
                  <p className="text-xs font-extrabold text-[#3F6240]">
                    🛡️ Tỷ lệ phủ 3 Nhãn Kiểm Chứng Uy Tín trên {data.recipeMetrics.total} công thức:
                  </p>

                  {[
                    {
                      label: '✓ Đã tính & kiểm chứng Calo chuẩn Viện Dinh Dưỡng (FCT)',
                      count: data.recipeMetrics.nutritionVerified,
                      total: Math.max(1, data.recipeMetrics.total),
                      barClass: 'bg-emerald-600',
                    },
                    {
                      label: '✓ Đã duyệt nội dung bởi Ban Biên Tập (Editorial Reviewed)',
                      count: data.recipeMetrics.editorialReviewed,
                      total: Math.max(1, data.recipeMetrics.total),
                      barClass: 'bg-amber-600',
                    },
                    {
                      label: '✓ Đã nấu thử thực tế tại Bếp Mẫu (Cook-Tested)',
                      count: data.recipeMetrics.cookTested,
                      total: Math.max(1, data.recipeMetrics.total),
                      barClass: 'bg-rose-600',
                    },
                  ].map((item) => {
                    const pct = Math.min(100, Math.round((item.count / item.total) * 100));
                    return (
                      <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#2D2A26]">{item.label}</span>
                          <span className="font-extrabold text-[#2F4F30]">
                            {item.count}/{data.recipeMetrics.total} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className={`h-full rounded-full ${item.barClass}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cột Phải (5/12): Danh sách Thành viên mới & Lối tắt Quản trị nhanh */}
              <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-[#EADBC8] shadow-2xs flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm sm:text-base font-extrabold text-[#2F4F30]">
                      👥 Tài Khoản Thành Viên Mới Nhất
                    </h2>
                    <Link
                      href="/editor/users"
                      className="text-xs font-bold text-[#3F6240] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Quản lý &amp; Tạo TK</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="divide-y divide-[#F0E6D8]">
                    {data.userMetrics.recentUsers.map((u) => (
                      <div key={u.id} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-[#2D2A26] truncate">
                            {u.displayName}{' '}
                            <span className="text-[10px] font-normal text-[#7C6A59]">
                              (#{u.id})
                            </span>
                          </p>
                          <p className="text-[11px] text-[#6B5A48] truncate">{u.email}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${
                            u.role === 'ADMIN'
                              ? 'bg-rose-100 text-rose-900 border-rose-300'
                              : u.role === 'EDITOR'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          }`}
                        >
                          {u.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#EADBC8]">
                  <Link
                    href="/editor/users?create=1"
                    className="py-2.5 px-3 rounded-xl bg-[#FAF7F0] hover:bg-emerald-50 border border-[#D8C7B0] text-xs font-extrabold text-[#2F4F30] inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
                    <span>+ Tạo Tài Khoản</span>
                  </Link>
                  <Link
                    href="/editor/recipes/new"
                    className="py-2.5 px-3 rounded-xl bg-[#3F6240] hover:bg-[#324f33] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Soạn Bài Mới</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* HÀNG 3: TOP MÓN ĂN ĐƯỢC YÊU THÍCH & NHẬT KÝ QUÉT ẢNH AI THỜI GIAN THỰC */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Top Món Ăn */}
              <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-[#EADBC8] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm sm:text-base font-extrabold text-[#2F4F30]">
                    🏆 Top Bài Viết / Món Ăn Tương Tác Cao
                  </h2>
                  <Link
                    href="/editor/recipes"
                    className="text-xs font-bold text-[#3F6240] hover:underline"
                  >
                    Xem tất cả →
                  </Link>
                </div>

                <div className="divide-y divide-[#F0E6D8]">
                  {data.topRecipes.map((rec, idx) => (
                    <div
                      key={rec.id}
                      className="py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-[#FAF7F0] border border-[#D8C7B0] font-black text-[11px] text-[#3F6240] inline-flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={`/editor/recipes/${rec.id}`}
                            className="font-bold text-[#2D2A26] hover:text-[#3F6240] truncate block"
                          >
                            {rec.name}
                          </Link>
                          <span className="text-[11px] text-[#7C6A59]">
                            {rec.caloriesPerServing || '—'} kcal/phần • Vai trò: {rec.role}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-[11px] font-bold">
                        <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-800">
                          ❤️ {rec.savesCount} lưu
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800">
                          📅 {rec.plansCount} lịch
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nhật ký Bữa ăn & Quét ảnh AI gần đây */}
              <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-[#EADBC8] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm sm:text-base font-extrabold text-[#2F4F30] flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-700" />
                    <span>Nhật Ký Calo &amp; Quét Ảnh Đĩa Ăn AI Gần Đây</span>
                  </h2>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    Trực tiếp từ người dùng
                  </span>
                </div>

                {data.recentDiaryFeed.length === 0 ? (
                  <p className="text-xs text-[#7C6A59] py-8 text-center">
                    Chưa có bản ghi nhật ký bữa ăn nào.
                  </p>
                ) : (
                  <div className="divide-y divide-[#F0E6D8] max-h-80 overflow-y-auto pr-1">
                    {data.recentDiaryFeed.map((entry) => (
                      <div
                        key={entry.id}
                        className="py-2.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            {entry.isAiScan && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[10px] font-extrabold shrink-0">
                                AI Scan
                              </span>
                            )}
                            <span className="font-bold text-[#2D2A26] truncate">
                              {entry.recipeName}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#7C6A59] truncate">
                            Bởi: <strong>{entry.userDisplayName}</strong> • Ngày {entry.diaryDate} (
                            {entry.mealType})
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-black text-[#B75B35] block">
                            {entry.calories} kcal
                          </span>
                          <span className="text-[10px] font-bold text-rose-800">
                            {entry.protein}g Đạm
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
