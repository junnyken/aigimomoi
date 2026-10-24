'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  ShieldCheck,
  KeyRound,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Award,
  BookOpen,
  Heart,
  Calendar,
  Flame,
  Edit3,
  X,
} from 'lucide-react';
import { AdminTopNav } from '@/components/editor/AdminTopNav';

interface AdminUserItem {
  id: number;
  email: string;
  displayName: string;
  role: 'ADMIN' | 'EDITOR' | 'COOK';
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  stats: {
    recipesCount: number;
    savedCount: number;
    diaryCount: number;
    mealPlansCount: number;
    pantryCount: number;
  };
  creator: {
    slug: string;
    identityVerified: boolean;
    isProfessional: boolean;
  } | null;
}

const ROLE_META: Record<
  AdminUserItem['role'],
  { label: string; badgeClass: string; desc: string }
> = {
  ADMIN: {
    label: '🛡️ Quản trị viên (ADMIN)',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    desc: 'Toàn quyền hệ thống, tài khoản, duyệt xuất bản & cấu hình',
  },
  EDITOR: {
    label: '✍️ Biên tập viên (EDITOR)',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    desc: 'Soạn bài viết, công thức, nguyên liệu FCT & kiểm duyệt phản hồi',
  },
  COOK: {
    label: '👨‍🍳 Thành viên (COOK)',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    desc: 'Lưu món, lập thực đơn tuần, ghi Nhật ký Calo & góp món ngon',
  },
};

export default function AdminUsersPage() {
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: number; role: string; email: string } | null>(
    null
  );
  const [summary, setSummary] = useState({
    total: 0,
    adminCount: 0,
    editorCount: 0,
    cookCount: 0,
    newLast7Days: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'EDITOR' | 'COOK'>('ALL');

  // Form Tạo tài khoản mới trực tiếp từ Admin
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'COOK' | 'EDITOR' | 'ADMIN'>('COOK');
  const [creating, setCreating] = useState(false);

  // Modal Sửa tài khoản / Đặt lại mật khẩu
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'COOK' | 'EDITOR' | 'ADMIN'>('COOK');
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch('/api/editor/users');
      const data = await res.json();
      if (res.ok && data.ok) {
        setUsersList(data.users || []);
        setSummary(data.summary || summary);
        setCurrentUser(data.currentUser || null);
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Không thể tải danh sách tài khoản.',
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Lỗi kết nối máy chủ.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    if (typeof window !== 'undefined' && window.location.search.includes('create=1')) {
      setShowCreateForm(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return (
          u.displayName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          String(u.id) === q
        );
      }
      return true;
    });
  }, [usersList, roleFilter, searchQuery]);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setCreating(true);

    try {
      const res = await fetch('/api/editor/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: newDisplayName.trim(),
          email: newEmail.trim().toLowerCase(),
          password: newPassword,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Không thể tạo tài khoản.' });
        return;
      }

      setFeedback({
        type: 'success',
        message: `Đã tạo tài khoản "${data.user.displayName}" (${data.user.email}) với quyền ${data.user.role} thành công!`,
      });
      setNewDisplayName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('COOK');
      setShowCreateForm(false);
      await fetchUsers();
    } catch {
      setFeedback({ type: 'error', message: 'Lỗi kết nối khi tạo tài khoản.' });
    } finally {
      setCreating(false);
    }
  }

  async function handleQuickRoleChange(user: AdminUserItem, nextRole: 'ADMIN' | 'EDITOR' | 'COOK') {
    if (user.role === nextRole) return;
    setBusyUserId(user.id);
    setFeedback(null);

    try {
      const res = await fetch(`/api/editor/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u))
        );
        setFeedback({
          type: 'success',
          message: `Đã đổi quyền của "${user.displayName}" sang ${nextRole}.`,
        });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Không thể đổi quyền.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Lỗi kết nối khi đổi quyền.' });
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleToggleCreatorVerified(user: AdminUserItem) {
    setBusyUserId(user.id);
    setFeedback(null);
    const nextVerified = !user.creator?.identityVerified;

    try {
      const res = await fetch(`/api/editor/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identityVerified: nextVerified }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setUsersList((prev) =>
          prev.map((u) =>
            u.id === user.id
              ? {
                  ...u,
                  creator: data.creator,
                }
              : u
          )
        );
        setFeedback({
          type: 'success',
          message: nextVerified
            ? `Đã cấp tích xanh Đầu bếp xác minh cho "${user.displayName}".`
            : `Đã gỡ tích xanh xác minh của "${user.displayName}".`,
        });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Không thể cập nhật tích xanh.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Lỗi kết nối máy chủ.' });
    } finally {
      setBusyUserId(null);
    }
  }

  function openEditModal(user: AdminUserItem) {
    setEditingUser(user);
    setEditName(user.displayName);
    setEditEmail(user.email);
    setEditRole(user.role);
    setResetPasswordVal('');
  }

  async function handleSaveEditModal(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setSavingEdit(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/editor/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: editName.trim(),
          email: editEmail.trim().toLowerCase(),
          role: editRole,
          newPassword: resetPasswordVal.trim() ? resetPasswordVal.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Không thể cập nhật tài khoản.' });
        return;
      }

      setFeedback({
        type: 'success',
        message: `Đã cập nhật tài khoản "${editName}"${
          resetPasswordVal.trim() ? ' (Đã đặt lại mật khẩu mới)' : ''
        } thành công!`,
      });
      setEditingUser(null);
      await fetchUsers();
    } catch {
      setFeedback({ type: 'error', message: 'Lỗi kết nối khi lưu thông tin tài khoản.' });
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteUser(user: AdminUserItem) {
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${user.displayName}" (${user.email}) không?`
      )
    ) {
      return;
    }

    setBusyUserId(user.id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/editor/users/${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.ok) {
        setUsersList((prev) => prev.filter((u) => u.id !== user.id));
        setFeedback({
          type: 'success',
          message: `Đã xóa tài khoản "${user.displayName}" (${user.email}).`,
        });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Không thể xóa tài khoản.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Lỗi kết nối khi xóa tài khoản.' });
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#2D2A26] pb-16">
      <AdminTopNav
        title="Quản Lý Tài Khoản & Phân Quyền Thành Viên"
        subtitle="Tạo tài khoản mới trực tiếp, nâng quyền Biên tập viên / Admin, đặt lại mật khẩu & kiểm soát hoạt động"
        rightActions={
          <button
            type="button"
            onClick={() => setShowCreateForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3F6240] hover:bg-[#324f33] text-white text-xs font-extrabold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showCreateForm ? 'Đóng khung tạo' : '+ Tạo tài khoản mới'}</span>
          </button>
        }
      />

      <main className="w-full mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* 5 Thẻ Chỉ Số Tài Khoản */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-[#EADBC8] shadow-2xs">
            <p className="text-xs font-semibold text-[#7C6A59]">Tổng tài khoản</p>
            <p className="text-2xl font-black text-[#2F4F30] mt-1">{usersList.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-2xs">
            <p className="text-xs font-semibold text-rose-800">🛡️ Quản trị viên (ADMIN)</p>
            <p className="text-2xl font-black text-rose-700 mt-1">
              {usersList.filter((u) => u.role === 'ADMIN').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs">
            <p className="text-xs font-semibold text-amber-900">✍️ Biên tập viên (EDITOR)</p>
            <p className="text-2xl font-black text-amber-700 mt-1">
              {usersList.filter((u) => u.role === 'EDITOR').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs">
            <p className="text-xs font-semibold text-emerald-900">👨‍🍳 Thành viên (COOK)</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              {usersList.filter((u) => u.role === 'COOK').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#EADBC8] shadow-2xs col-span-2 sm:col-span-1">
            <p className="text-xs font-semibold text-[#7C6A59]">✨ Mới trong 7 ngày</p>
            <p className="text-2xl font-black text-[#B75B35] mt-1">{summary.newLast7Days}</p>
          </div>
        </div>

        {/* Thông báo phản hồi */}
        {feedback && (
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-red-50 border-red-300 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs underline cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}

        {/* KHUNG TẠO TÀI KHOẢN MỚI TRỰC TIẾP CHO ADMIN */}
        {showCreateForm && (
          <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-[#3F6240] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#EADBC8] pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#2F4F30] flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#B75B35]" />
                  <span>Tạo Tài Khoản Mới Trực Tiếp (Kích hoạt ngay không cần OTP)</span>
                </h2>
                <p className="text-xs text-[#7C6A59] mt-0.5">
                  Dùng để cấp nhanh tài khoản cho Biên tập viên phụ trách đăng bài, Quản trị viên hoặc Thành viên gia đình.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
              <div>
                <label className="block text-xs font-bold text-[#2D2A26] mb-1">
                  Họ tên / Tên hiển thị *
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="VD: Biên tập viên Lan"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F0] border border-[#D8C7B0] text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#3F6240]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D2A26] mb-1">
                  Địa chỉ Email đăng nhập *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="lan.editor@gmail.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F0] border border-[#D8C7B0] text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#3F6240]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D2A26] mb-1">
                  Mật khẩu khởi tạo (≥ 8 ký tự) *
                </label>
                <input
                  type="text"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="VD: AnGiMom@2026"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F0] border border-[#D8C7B0] text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#3F6240]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D2A26] mb-1">
                  Phân quyền vai trò *
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'COOK' | 'EDITOR' | 'ADMIN')}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#D8C7B0] text-xs font-bold text-[#2F4F30] focus:outline-hidden focus:ring-2 focus:ring-[#3F6240]"
                >
                  <option value="COOK">👨‍🍳 Thành viên (COOK)</option>
                  <option value="EDITOR">✍️ Biên tập viên (EDITOR)</option>
                  <option value="ADMIN">🛡️ Quản trị viên (ADMIN)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-2.5 px-4 rounded-xl bg-[#3F6240] hover:bg-[#324f33] text-white text-xs font-extrabold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {creating ? 'Đang tạo...' : '✓ Tạo & Kích hoạt ngay'}
              </button>
            </form>
          </div>
        )}

        {/* Thanh Tìm Kiếm & Bộ Lọc Vai Trò */}
        <div className="bg-white p-4 rounded-2xl border border-[#EADBC8] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7C6A59]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tài khoản theo tên hiển thị, địa chỉ email hoặc ID..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#FAF7F0] border border-[#EADBC8] text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3F6240]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { key: 'ALL', label: `Tất cả (${usersList.length})` },
                {
                  key: 'ADMIN',
                  label: `🛡️ Admin (${usersList.filter((u) => u.role === 'ADMIN').length})`,
                },
                {
                  key: 'EDITOR',
                  label: `✍️ Biên tập (${usersList.filter((u) => u.role === 'EDITOR').length})`,
                },
                {
                  key: 'COOK',
                  label: `👨‍🍳 Thành viên (${usersList.filter((u) => u.role === 'COOK').length})`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setRoleFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  roleFilter === tab.key
                    ? 'bg-[#3F6240] text-white border-[#3F6240]'
                    : 'bg-[#FAF7F0] text-[#5C4A3A] border-[#E5DAC8] hover:border-[#3F6240]'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <button
              type="button"
              onClick={fetchUsers}
              className="p-2 rounded-xl bg-[#FAF7F0] hover:bg-[#F3E9DD] border border-[#EADBC8] text-[#3F6240] cursor-pointer"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* BẢNG DANH SÁCH TÀI KHOẢN */}
        <div className="bg-white rounded-3xl border border-[#EADBC8] shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-[#7C6A59]">
              Đang tải danh sách tài khoản hệ thống...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#7C6A59]">
              Không tìm thấy tài khoản nào khớp bộ lọc.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF7F0] border-b border-[#EADBC8] text-[11px] font-extrabold text-[#5C4A3A] uppercase">
                    <th className="py-3 px-4">ID &amp; Thành viên</th>
                    <th className="py-3 px-4">Vai trò &amp; Phân quyền</th>
                    <th className="py-3 px-4">Hoạt động trên Web</th>
                    <th className="py-3 px-4">Tích xanh Đầu bếp</th>
                    <th className="py-3 px-4">Ngày tạo</th>
                    <th className="py-3 px-4 text-right">Thao tác quản trị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E6D8] text-xs">
                  {filteredUsers.map((user) => {
                    const roleInfo = ROLE_META[user.role];
                    const isSelf = currentUser?.id === user.id;

                    return (
                      <tr key={user.id} className="hover:bg-[#FAF7F0]/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-[#EAF0EA] text-[#2F4F30] font-black text-xs flex items-center justify-center shrink-0 border border-[#C8DAC8]">
                              {user.displayName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-[#2D2A26] text-xs sm:text-sm">
                                  {user.displayName}
                                </span>
                                <span className="text-[10px] font-bold text-[#9C8B7A] bg-stone-100 px-1.5 py-0.5 rounded">
                                  #{user.id}
                                </span>
                                {isSelf && (
                                  <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded">
                                    Bạn
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#6B5A48] font-medium truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <select
                              value={user.role}
                              disabled={busyUserId === user.id}
                              onChange={(e) =>
                                handleQuickRoleChange(
                                  user,
                                  e.target.value as 'ADMIN' | 'EDITOR' | 'COOK'
                                )
                              }
                              aria-label={`Đổi quyền cho ${user.displayName}`}
                              className={`px-2.5 py-1 rounded-xl text-xs font-extrabold border cursor-pointer ${roleInfo.badgeClass}`}
                            >
                              <option value="COOK">👨‍🍳 Thành viên (COOK)</option>
                              <option value="EDITOR">✍️ Biên tập viên (EDITOR)</option>
                              <option value="ADMIN">🛡️ Quản trị viên (ADMIN)</option>
                            </select>
                            <p className="text-[10px] text-[#7C6A59] max-w-[200px] leading-tight">
                              {roleInfo.desc}
                            </p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                            <span
                              className="px-2 py-0.5 rounded-lg bg-stone-100 text-stone-700 inline-flex items-center gap-1"
                              title="Số công thức đã soạn"
                            >
                              <BookOpen className="w-3 h-3 text-emerald-700" />
                              {user.stats.recipesCount} bài
                            </span>
                            <span
                              className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-800 inline-flex items-center gap-1"
                              title="Số món đã lưu yêu thích"
                            >
                              <Heart className="w-3 h-3 text-rose-600" />
                              {user.stats.savedCount} lưu
                            </span>
                            <span
                              className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 inline-flex items-center gap-1"
                              title="Số bữa đã ghi Nhật ký Calo / Quét AI"
                            >
                              <Flame className="w-3 h-3 text-amber-600" />
                              {user.stats.diaryCount} nhật ký
                            </span>
                            <span
                              className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-900 inline-flex items-center gap-1"
                              title="Số bữa trong Kế hoạch thực đơn tuần"
                            >
                              <Calendar className="w-3 h-3 text-blue-600" />
                              {user.stats.mealPlansCount} lịch
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            disabled={busyUserId === user.id}
                            onClick={() => handleToggleCreatorVerified(user)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border inline-flex items-center gap-1 cursor-pointer transition-colors ${
                              user.creator?.identityVerified
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-emerald-50'
                            }`}
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>
                              {user.creator?.identityVerified ? '✓ Đã xác minh' : 'Cấp tích xanh'}
                            </span>
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-[#6B5A48] whitespace-nowrap">
                          {new Date(user.createdAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(user)}
                              className="px-2.5 py-1.5 rounded-xl bg-[#FAF7F0] hover:bg-amber-50 text-[#3F6240] border border-[#D8C7B0] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                              title="Sửa tên, email hoặc đặt lại mật khẩu"
                            >
                              <KeyRound className="w-3 h-3 text-amber-700" />
                              <span>Sửa / Đổi MK</span>
                            </button>

                            {!isSelf && (
                              <button
                                type="button"
                                disabled={busyUserId === user.id}
                                onClick={() => handleDeleteUser(user)}
                                className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 cursor-pointer"
                                title="Xóa tài khoản này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* MODAL SỬA THÔNG TIN & ĐẶT LẠI MẬT KHẨU */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EADBC8] max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#EADBC8] pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#3F6240]" />
                <h3 className="text-base font-extrabold text-[#2F4F30]">
                  Chỉnh sửa Tài khoản #{editingUser.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditModal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#2D2A26] mb-1">
                  Họ tên / Tên hiển thị
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F0] border border-[#D8C7B0] text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D2A26] mb-1">
                  Địa chỉ Email
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F0] border border-[#D8C7B0] text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D2A26] mb-1">
                  Vai trò trên hệ thống
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'COOK' | 'EDITOR' | 'ADMIN')}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F0] border border-[#D8C7B0] text-xs font-bold text-[#2F4F30]"
                >
                  <option value="COOK">👨‍🍳 Thành viên (COOK)</option>
                  <option value="EDITOR">✍️ Biên tập viên (EDITOR)</option>
                  <option value="ADMIN">🛡️ Quản trị viên (ADMIN)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-stone-100">
                <label className="block text-xs font-bold text-amber-900 mb-1">
                  🔑 Đặt lại mật khẩu mới (Để trống nếu giữ nguyên mật khẩu cũ)
                </label>
                <input
                  type="text"
                  minLength={8}
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="Nhập mật khẩu mới ≥ 8 ký tự..."
                  className="w-full px-3.5 py-2 rounded-xl bg-amber-50/50 border border-amber-300 text-xs font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl bg-[#3F6240] hover:bg-[#324f33] text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
                >
                  {savingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
