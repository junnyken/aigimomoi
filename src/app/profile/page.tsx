'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Calendar, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  ShoppingCart, 
  UtensilsCrossed, 
  Settings,
  ArrowRight,
  Refrigerator,
  CalendarDays,
  Flame,
  ChefHat
} from 'lucide-react';
import { CreatorProfileSection } from '@/components/creator/CreatorProfileSection';
import { PersonalHealthBmrCalculator } from '@/components/profile/PersonalHealthBmrCalculator';

interface UserProfile {
  id: number;
  email: string;
  displayName: string;
  role: 'ADMIN' | 'EDITOR' | 'COOK';
  createdAt?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Form cập nhật thông tin
  const [displayName, setDisplayName] = useState('');
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState<string | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);

  // Form đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/user/profile');
        if (res.status === 401) {
          router.push('/login?from=/profile');
          return;
        }
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setDisplayName(data.user.displayName || '');
        }
      } catch (err) {
        console.error('Lỗi khi tải hồ sơ:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoError(null);
    setInfoSuccess(null);
    setInfoSaving(true);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cập nhật thất bại.');
      }
      setInfoSuccess('Đã lưu thông tin họ tên thành công!');
      if (user) {
        setUser({ ...user, displayName });
      }
    } catch (err: unknown) {
      setInfoError(err instanceof Error ? err.message : 'Có lỗi xảy ra.');
    } finally {
      setInfoSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (newPassword !== confirmPassword) {
      setPwError('Mật khẩu mới xác nhận không khớp.');
      return;
    }

    if (newPassword.length < 8) {
      setPwError('Mật khẩu mới phải có tối thiểu 8 ký tự.');
      return;
    }

    setPwSaving(true);

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đổi mật khẩu thất bại.');
      }
      setPwSuccess('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : 'Có lỗi xảy ra.');
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.assign('/');
    } catch (err) {
      console.error('Lỗi khi đăng xuất:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-stone-600">Đang tải thông tin tài khoản...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const roleLabels: Record<string, { label: string; color: string }> = {
    ADMIN: { label: 'Quản trị viên', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    EDITOR: { label: 'Biên tập viên', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    COOK: { label: 'Bếp chính gia đình', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  };

  const userRole = roleLabels[user.role] || roleLabels.COOK;

  return (
    <div className="min-h-screen bg-[#faf8f5] py-6 px-2 sm:px-4">
      <div className="w-full mx-auto space-y-6">
        {/* Header navigation bar */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl">🍲</span>
            <span className="font-extrabold text-xl tracking-tight text-[#15803d]">ĂN GÌ MOM</span>
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>

        {/* Profile overview card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-bold text-3xl shrink-0 shadow-inner">
              {user.displayName.slice(0, 2).toUpperCase() || 'AM'}
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold text-gray-900 truncate">{user.displayName}</h1>
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${userRole.color}`}>
                  {userRole.label}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-stone-400" />
                  {user.email}
                </span>
                {user.createdAt && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-stone-400" />
                    Tham gia: {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Shortcuts: Hệ sinh thái Bếp Gia Đình Cá Nhân */}
          <div className="mt-6 pt-6 border-t border-stone-100">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
              Không Gian Bếp Gia Đình Của Bạn
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                href="/meal"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 hover:bg-emerald-50 text-stone-700 hover:text-emerald-700 border border-stone-200 transition-colors"
              >
                <UtensilsCrossed className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold block">Mâm cơm 4 ô</span>
                  <span className="text-[10px] text-stone-500">Mặn • Canh • Rau • Chấm</span>
                </div>
              </Link>
              <Link
                href="/tu-lanh"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 hover:bg-emerald-50 text-stone-700 hover:text-emerald-700 border border-stone-200 transition-colors"
              >
                <Refrigerator className="w-4 h-4 text-sky-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold block">Tủ lạnh gia đình</span>
                  <span className="text-[10px] text-stone-500">Quản lý hạn dùng</span>
                </div>
              </Link>
              <Link
                href="/ke-hoach-tuan"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 hover:bg-emerald-50 text-stone-700 hover:text-emerald-700 border border-stone-200 transition-colors"
              >
                <CalendarDays className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold block">Thực đơn 7 ngày</span>
                  <span className="text-[10px] text-stone-500">Lịch ăn cả tuần</span>
                </div>
              </Link>
              <Link
                href="/nhat-ky"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 hover:bg-emerald-50 text-stone-700 hover:text-emerald-700 border border-stone-200 transition-colors"
              >
                <Flame className="w-4 h-4 text-orange-500 shrink-0" />
                <div>
                  <span className="text-xs font-bold block">Nhật ký Calo</span>
                  <span className="text-[10px] text-stone-500">Theo dõi sức khỏe</span>
                </div>
              </Link>
              <Link
                href="/shopping"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 hover:bg-emerald-50 text-stone-700 hover:text-emerald-700 border border-stone-200 transition-colors"
              >
                <ShoppingCart className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold block">Giỏ đi chợ</span>
                  <span className="text-[10px] text-stone-500">Gộp nguyên liệu</span>
                </div>
              </Link>
              <Link
                href="/da-luu"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 hover:bg-emerald-50 text-stone-700 hover:text-emerald-700 border border-stone-200 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold block">Sổ tay đã lưu</span>
                  <span className="text-[10px] text-stone-500">Món tủ yêu thích</span>
                </div>
              </Link>
              <Link
                href="/contribute"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/70 hover:bg-amber-100/80 text-amber-900 border border-amber-200 transition-colors"
              >
                <ChefHat className="w-4 h-4 text-amber-700 shrink-0" />
                <div>
                  <span className="text-xs font-bold block">Đóng góp món</span>
                  <span className="text-[10px] text-amber-700">Chia sẻ công thức</span>
                </div>
              </Link>
              {(user.role === 'ADMIN' || user.role === 'EDITOR') && (
                <Link
                  href="/editor/recipes"
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors"
                >
                  <Settings className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold block">Quản trị & Biên tập</span>
                    <span className="text-[10px] text-purple-600">Kho món & Kiểm duyệt</span>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Khu 2: Hồ Sơ Thể Trạng & Máy Tính BMR / TDEE Chuẩn Bác Sĩ Dinh Dưỡng */}
        <PersonalHealthBmrCalculator />

        {/* 2 Form Sections: Update Profile & Change Password */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Thông tin cá nhân */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-gray-900">Thông tin cá nhân</h2>
              </div>

              {infoSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  {infoSuccess}
                </div>
              )}
              {infoError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  {infoError}
                </div>
              )}

              <form onSubmit={handleUpdateInfo} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    Địa chỉ email (Không thể thay đổi)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="block w-full px-3 py-2 text-sm bg-stone-100 border border-stone-200 rounded-xl text-stone-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Tên hiển thị (Tên người nấu)
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={50}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="block w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={infoSaving}
                    className="min-h-[44px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {infoSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Card 2: Bảo mật & Đổi mật khẩu */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-gray-900">Đổi mật khẩu</h2>
            </div>

            {pwSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                {pwSuccess}
              </div>
            )}
            {pwError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                {pwError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu đang dùng"
                  className="block w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Mật khẩu mới (Tối thiểu 8 ký tự)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mật khẩu mới an toàn"
                  className="block w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="block w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={pwSaving}
                  className="min-h-[44px] px-5 py-2.5 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {pwSaving ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* R7: Hồ sơ người nấu (Chợ công thức) */}
        <CreatorProfileSection displayName={user.displayName} />
      </div>
    </div>
  );
}
