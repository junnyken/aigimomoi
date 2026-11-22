'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  LogIn,
  Utensils,
  Settings2,
  Plus,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import type { MealDishSummary } from '@/lib/meal/mealPresets';
import {
  DEFAULT_FAMILY_PROFILES,
  calculateMemberPortionFromMeal,
  loadFamilyProfiles,
  pickMemberBadgeColor,
  saveFamilyProfiles,
  type FamilyMemberProfile,
} from '@/lib/nutrition/familyProfiles';
import { markDiaryDateActive } from '@/lib/nutrition/visualDiaryStore';

interface FamilyPortionSplitterProps {
  main: MealDishSummary | null;
  soup: MealDishSummary | null;
  side: MealDishSummary | null;
  sauce: MealDishSummary | null;
  servings: number;
}

export function FamilyPortionSplitter({
  main,
  soup,
  side,
  sauce,
  servings,
}: FamilyPortionSplitterProps) {
  const [profiles, setProfiles] = useState<FamilyMemberProfile[]>(DEFAULT_FAMILY_PROFILES);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    DEFAULT_FAMILY_PROFILES.map((p) => p.id)
  );
  const [isEditingProfiles, setIsEditingProfiles] = useState(false);
  const [draftProfiles, setDraftProfiles] = useState<FamilyMemberProfile[]>(
    DEFAULT_FAMILY_PROFILES
  );

  const [mealSlot, setMealSlot] = useState<'LUNCH' | 'DINNER'>('DINNER');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'auth' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    const stored = loadFamilyProfiles();
    setProfiles(stored);
    setDraftProfiles(stored);
    setSelectedIds(stored.map((p) => p.id));
  }, []);

  const dishes = [main, soup, side, sauce].filter((d): d is MealDishSummary => Boolean(d));
  if (dishes.length === 0) return null;

  const baseDishKcal = dishes.reduce((sum, d) => sum + (d.caloriesPerServing ?? 0), 0);
  const baseProtein = dishes.reduce((sum, d) => sum + (d.macrosPerServing?.protein ?? 0), 0);
  const baseFat = dishes.reduce((sum, d) => sum + (d.macrosPerServing?.fat ?? 0), 0);
  const baseCarbs = dishes.reduce((sum, d) => sum + (d.macrosPerServing?.carbs ?? 0), 0);
  const baseFiber = dishes.reduce((sum, d) => sum + (d.macrosPerServing?.fiber ?? 0), 0);
  const baseSodium = dishes.reduce((sum, d) => sum + (d.macrosPerServing?.sodium ?? 0), 0);

  const hasHighSodiumMember = profiles.some((p) => p.lowSodium) && baseSodium > 800;

  const toggleMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  function openEditor() {
    setDraftProfiles(profiles);
    setIsEditingProfiles((prev) => !prev);
  }

  function updateDraftField<K extends keyof FamilyMemberProfile>(
    idx: number,
    key: K,
    value: FamilyMemberProfile[K]
  ) {
    setDraftProfiles((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [key]: value } : item))
    );
  }

  function addDraftMember() {
    if (draftProfiles.length >= 5) return;
    const nextIdx = draftProfiles.length;
    const newProfile: FamilyMemberProfile = {
      id: `member-${Date.now()}`,
      memberName: `Thành viên ${nextIdx + 1}`,
      roleTitle: `👤 Thành viên ${nextIdx + 1}`,
      badgeColor: pickMemberBadgeColor(nextIdx),
      targetMealKcal: 550,
      isBrownRice: false,
      lowSodium: false,
      noSpicy: false,
    };
    setDraftProfiles((prev) => [...prev, newProfile]);
  }

  function removeDraftMember(idx: number) {
    if (draftProfiles.length <= 2) return;
    setDraftProfiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSaveProfiles() {
    const synced = draftProfiles.map((p) => ({
      ...p,
      roleTitle:
        p.roleTitle.includes(p.memberName) || !p.memberName.trim()
          ? p.roleTitle
          : `${p.memberName.trim()}`,
    }));
    const saved = saveFamilyProfiles(synced);
    setProfiles(saved);
    setDraftProfiles(saved);
    setSelectedIds(saved.map((p) => p.id));
    setIsEditingProfiles(false);
    setFeedback({
      type: 'success',
      message: `Đã lưu hồ sơ ${saved.length} thành viên gia đình. Khẩu phần chia trên mâm đã cập nhật!`,
    });
  }

  function handleResetDefaultProfiles() {
    const saved = saveFamilyProfiles(DEFAULT_FAMILY_PROFILES);
    setProfiles(saved);
    setDraftProfiles(saved);
    setSelectedIds(saved.map((p) => p.id));
  }

  function computeMemberTotals(member: FamilyMemberProfile) {
    const portion = calculateMemberPortionFromMeal(member, baseDishKcal);
    const ricePerBowl = member.isBrownRice
      ? { kcal: 110, protein: 2.6, fat: 0.9, carbs: 23.0, fiber: 1.8, sodium: 4 }
      : { kcal: 130, protein: 2.7, fat: 0.3, carbs: 28.2, fiber: 0.4, sodium: 2 };

    const sodiumMultiplier = member.lowSodium ? portion.dishFactor * 0.8 : portion.dishFactor;

    const kcal = Math.round(
      portion.riceBowls * ricePerBowl.kcal + baseDishKcal * portion.dishFactor
    );
    const protein =
      Math.round(
        (portion.riceBowls * ricePerBowl.protein + baseProtein * portion.dishFactor) * 10
      ) / 10;
    const fat =
      Math.round((portion.riceBowls * ricePerBowl.fat + baseFat * portion.dishFactor) * 10) / 10;
    const carbs =
      Math.round(
        (portion.riceBowls * ricePerBowl.carbs + baseCarbs * portion.dishFactor) * 10
      ) / 10;
    const fiber =
      Math.round(
        (portion.riceBowls * ricePerBowl.fiber + baseFiber * portion.dishFactor) * 10
      ) / 10;
    const sodium = Math.round(
      portion.riceBowls * ricePerBowl.sodium + baseSodium * sodiumMultiplier
    );

    return {
      ...portion,
      kcal,
      protein,
      fat,
      carbs,
      fiber,
      sodium,
    };
  }

  async function handleLogMembersToDiary() {
    const activeMembers = profiles.filter((p) => selectedIds.includes(p.id));
    if (activeMembers.length === 0) return;

    setSaving(true);
    setFeedback(null);
    const todayStr = new Date().toISOString().split('T')[0];
    const mealNameSummary = [main?.name, soup?.name, side?.name].filter(Boolean).join(' + ');

    try {
      const responses = await Promise.all(
        activeMembers.map((member) => {
          const stats = computeMemberTotals(member);
          return fetch('/api/diary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipeName: `🍽️ ${mealNameSummary || 'Mâm cơm gia đình'} (${stats.riceLabel})`,
              diaryDate: todayStr,
              mealType: mealSlot,
              memberName: member.memberName,
              consumedPortion: 1,
              customCalories: stats.kcal,
              customProtein: stats.protein,
              customFat: stats.fat,
              customCarbs: stats.carbs,
              customFiber: stats.fiber,
              customSodium: stats.sodium,
            }),
          });
        })
      );

      if (responses.some((r) => r.status === 401)) {
        setFeedback({
          type: 'auth',
          message: 'Hãy đăng nhập để ghi khẩu phần chia sẵn cho từng thành viên vào Nhật ký.',
        });
        return;
      }

      if (responses.every((r) => r.ok)) {
        markDiaryDateActive(todayStr);
        setFeedback({
          type: 'success',
          message: `Đã ghi khẩu phần của ${activeMembers
            .map((m) => m.memberName)
            .join(', ')} vào Nhật ký hôm nay!`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: 'Một số khẩu phần chưa lưu được. Vui lòng thử lại.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Lỗi kết nối khi lưu Nhật ký gia đình.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      aria-labelledby="family-portion-splitter-heading"
      className="rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-5 sm:p-6 shadow-xs space-y-4"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-brand-primary)]">
            <Users className="w-3.5 h-3.5" />
            <span>
              1 Nồi – {profiles.length} Nhịp Ăn Khác Nhau ({servings} người)
            </span>
          </div>
          <h2
            id="family-portion-splitter-heading"
            className="text-base sm:text-lg font-extrabold text-[var(--color-text-primary)] mt-0.5"
          >
            Chia khẩu phần cùng 1 mâm cơm cho từng thành viên
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Nấu chung một mâm nhưng tự động co giãn chén cơm &amp; lượng gắp theo mục tiêu Calo của từng người trong nhà.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={openEditor}
            className="min-h-10 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--color-border-base)] bg-[var(--color-surface-subtle)] hover:bg-[var(--color-surface-raised)] text-xs font-bold text-[var(--color-text-primary)] cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-[var(--color-brand-primary)]" />
            <span>Hồ sơ gia đình ({profiles.length})</span>
          </button>

          <div className="inline-flex rounded-xl border border-[var(--color-border-base)] bg-[var(--color-surface-subtle)] p-1">
            {(
              [
                { key: 'LUNCH', label: '🌤️ Bữa trưa' },
                { key: 'DINNER', label: '🌙 Bữa tối' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setMealSlot(opt.key)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  mealSlot === opt.key
                    ? 'bg-[var(--color-surface-white)] text-[var(--color-brand-primary)] shadow-2xs'
                    : 'text-[var(--color-text-secondary)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleLogMembersToDiary}
            disabled={saving || selectedIds.length === 0}
            className="min-h-10 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-brand-primary)] text-white text-xs font-extrabold hover:opacity-95 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <HeartPulse className="w-4 h-4" />
            <span>
              {saving
                ? 'Đang ghi...'
                : `📝 Ghi Nhật ký (${selectedIds.length} người)`}
            </span>
          </button>
        </div>
      </div>

      {/* Trình chỉnh sửa Hồ sơ 2-5 Thành viên Gia đình */}
      {isEditingProfiles && (
        <div className="p-4 rounded-2xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-base)] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-[var(--color-text-primary)]">
                Tùy chỉnh hồ sơ 2–5 thành viên nhà bạn
              </h3>
              <p className="text-[11px] text-[var(--color-text-secondary)]">
                Lưu trên trình duyệt để dùng cho cả bảng chia mâm cơm và gợi ý nhanh ở Nhật ký.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetDefaultProfiles}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--color-border-base)] bg-[var(--color-surface-white)] text-[11px] font-semibold text-[var(--color-text-secondary)] hover:text-red-600 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Mặc định</span>
              </button>
              {draftProfiles.length < 5 && (
                <button
                  type="button"
                  onClick={addDraftMember}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm người ({draftProfiles.length}/5)</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {draftProfiles.map((member, idx) => (
              <div
                key={member.id}
                className="p-3 rounded-xl bg-[var(--color-surface-white)] border border-[var(--color-border-subtle)] space-y-2"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={24}
                    value={member.memberName}
                    onChange={(e) => updateDraftField(idx, 'memberName', e.target.value)}
                    placeholder="Tên (VD: Bố, Mẹ, Na...)"
                    className="flex-1 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-[var(--color-border-base)] bg-[var(--color-surface-white)] text-[var(--color-text-primary)]"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      min={300}
                      max={1100}
                      step={20}
                      value={member.targetMealKcal}
                      onChange={(e) =>
                        updateDraftField(
                          idx,
                          'targetMealKcal',
                          Math.min(1100, Math.max(300, Number(e.target.value) || 500))
                        )
                      }
                      className="w-20 px-2 py-1.5 text-xs font-bold text-right rounded-lg border border-[var(--color-border-base)] bg-[var(--color-surface-white)] text-[var(--color-text-primary)]"
                    />
                    <span className="text-[11px] text-[var(--color-text-muted)]">kcal</span>
                  </div>
                  {draftProfiles.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeDraftMember(idx)}
                      aria-label={`Xóa ${member.memberName}`}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => updateDraftField(idx, 'isBrownRice', !member.isBrownRice)}
                    className={`px-2 py-0.5 rounded-md border font-semibold cursor-pointer ${
                      member.isBrownRice
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]'
                    }`}
                  >
                    🌾 Gạo lứt
                  </button>
                  <button
                    type="button"
                    onClick={() => updateDraftField(idx, 'lowSodium', !member.lowSodium)}
                    className={`px-2 py-0.5 rounded-md border font-semibold cursor-pointer ${
                      member.lowSodium
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]'
                    }`}
                  >
                    🧂 Ít muối
                  </button>
                  <button
                    type="button"
                    onClick={() => updateDraftField(idx, 'noSpicy', !member.noSpicy)}
                    className={`px-2 py-0.5 rounded-md border font-semibold cursor-pointer ${
                      member.noSpicy
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]'
                    }`}
                  >
                    🌶️ Không cay
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditingProfiles(false)}
              className="px-3 py-1.5 rounded-lg border border-[var(--color-border-base)] text-xs font-semibold text-[var(--color-text-secondary)] cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSaveProfiles}
              className="px-4 py-1.5 rounded-lg bg-[var(--color-brand-primary)] text-white text-xs font-bold hover:opacity-95 cursor-pointer"
            >
              Lưu hồ sơ gia đình
            </button>
          </div>
        </div>
      )}

      {hasHighSodiumMember && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Lưu ý cho thành viên ăn nhạt / huyết áp:</strong> Tổng lượng Natri ước tính của 1 phần đầy đủ đang ở mức ~
            {Math.round(baseSodium)}mg. Nên gắp phần thịt/cá ráo nước kho, ưu tiên ăn canh thanh và không chấm thêm nước mắm mặn.
          </span>
        </div>
      )}

      <div
        className={`grid grid-cols-1 sm:grid-cols-2 ${
          profiles.length >= 5 ? 'xl:grid-cols-5 lg:grid-cols-3' : 'lg:grid-cols-4'
        } gap-3`}
      >
        {profiles.map((member) => {
          const checked = selectedIds.includes(member.id);
          const stats = computeMemberTotals(member);
          return (
            <div
              key={member.id}
              onClick={() => toggleMember(member.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleMember(member.id);
                }
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                checked
                  ? 'bg-[var(--color-surface-subtle)] border-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/40'
                  : 'bg-[var(--color-surface-white)] border-[var(--color-border-base)] opacity-65'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[11px] font-bold ${member.badgeColor}`}
                  >
                    {member.roleTitle}
                  </span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleMember(member.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Chọn ghi nhật ký cho ${member.memberName}`}
                    className="w-4 h-4 accent-[var(--color-brand-primary)] cursor-pointer mt-0.5"
                  />
                </div>

                <div className="flex items-baseline justify-between gap-1.5 pt-1">
                  <div>
                    <strong className="text-lg font-black text-[var(--color-accent-primary)]">
                      {stats.kcal}
                    </strong>
                    <span className="text-[11px] font-semibold text-[var(--color-text-muted)] ml-1">
                      kcal/bữa
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[var(--color-text-secondary)]">
                    Mục tiêu ~{member.targetMealKcal}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-[var(--color-text-secondary)]">
                  <span>Đạm {stats.protein}g</span>
                  <span>• Béo {stats.fat}g</span>
                  <span>• Bột {stats.carbs}g</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-secondary)] leading-snug flex items-start gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-[var(--color-brand-primary)] shrink-0 mt-0.5" />
                <span>{stats.guidance}</span>
              </div>
            </div>
          );
        })}
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : feedback.type === 'auth'
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-red-50 border-red-300 text-red-950'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <LogIn className="w-4 h-4 text-amber-700 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          {feedback.type === 'success' ? (
            <Link
              href="/nhat-ky"
              className="shrink-0 px-3 py-1 rounded-lg bg-[var(--color-brand-primary)] text-white text-xs font-bold"
            >
              Mở Nhật ký Gia đình →
            </Link>
          ) : feedback.type === 'auth' ? (
            <Link
              href="/login?from=/meal"
              className="shrink-0 px-3 py-1 rounded-lg bg-[var(--color-brand-primary)] text-white text-xs font-bold"
            >
              Đăng nhập ngay
            </Link>
          ) : null}
        </div>
      )}
    </section>
  );
}
