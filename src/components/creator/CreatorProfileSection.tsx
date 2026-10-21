'use client';

// R7 — Khu "Hồ sơ người nấu" trên /profile: tạo/sửa hồ sơ công khai, xem bậc uy tín
// và các điều kiện còn thiếu. Xác minh danh tính & "Tiệm/Đầu bếp" do Ban quản trị đặt.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Store, CheckCircle2, AlertCircle, BadgeCheck, ExternalLink } from 'lucide-react';
import { CREATOR_TIER_LABELS, suggestCreatorSlug, type CreatorTier } from '@/lib/creators/tier';
import { CREATOR_BIO_MAX, CREATOR_REGIONS, type CreatorRegion } from '@/lib/creators/profileInput';

interface OwnProfileResponse {
  profile: {
    slug: string;
    bio: string | null;
    region: string;
    isPublic: boolean;
    isProfessional: boolean;
    identityVerified: boolean;
    sellerTermsAccepted: boolean;
  } | null;
  tier: CreatorTier;
  missingForNextTier: string[];
  stats: { publishedCommunityRecipes: number; distinctRaters: number; averageRating: number | null };
}

export function CreatorProfileSection({ displayName }: { displayName: string }) {
  const [data, setData] = useState<OwnProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState('');
  const [bio, setBio] = useState('');
  const [region, setRegion] = useState<CreatorRegion>('GENERAL');
  const [isPublic, setIsPublic] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function applyData(d: OwnProfileResponse) {
    setData(d);
    if (d.profile) {
      setSlug(d.profile.slug);
      setBio(d.profile.bio ?? '');
      setRegion((d.profile.region in CREATOR_REGIONS ? d.profile.region : 'GENERAL') as CreatorRegion);
      setIsPublic(d.profile.isPublic);
      setAcceptTerms(d.profile.sellerTermsAccepted);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch('/api/creator/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: OwnProfileResponse | null) => {
        if (cancelled || !d) return;
        applyData(d);
        if (!d.profile) setSlug(suggestCreatorSlug(displayName));
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [displayName]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const res = await fetch('/api/creator/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, bio, region, isPublic, acceptSellerTerms: acceptTerms }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Không lưu được hồ sơ.');
      applyData(json as OwnProfileResponse);
      setSuccess('Đã lưu hồ sơ người nấu.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs h-40 animate-pulse" aria-busy="true" />;
  }

  const tier = data?.tier ?? 0;
  const termsLocked = Boolean(data?.profile?.sellerTermsAccepted);

  return (
    <section
      className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs"
      aria-labelledby="creator-profile-heading"
      data-testid="creator-profile-section"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-amber-600" aria-hidden="true" />
          <h2 id="creator-profile-heading" className="text-lg font-bold text-gray-900">Hồ sơ người nấu</h2>
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full border bg-amber-50 text-amber-700 border-amber-200">
            {CREATOR_TIER_LABELS[tier]}
          </span>
          {data?.profile?.identityVerified && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
              <BadgeCheck className="w-4 h-4" aria-hidden="true" /> Đã xác minh
            </span>
          )}
        </div>
        {data?.profile?.isPublic && (
          <Link
            href={`/nguoi-nau/${data.profile.slug}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 hover:underline"
          >
            Xem trang công khai <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>

      <p className="text-sm text-stone-600 mb-4">
        Chia sẻ công thức của bạn lên <strong>Chợ công thức</strong> qua trang{' '}
        <Link href="/contribute" className="text-amber-700 font-semibold hover:underline">Đóng góp công thức</Link>.
        Hiện tại mọi công thức đều <strong>miễn phí</strong> cho người xem.
      </p>

      {data && (
        <dl className="grid grid-cols-3 gap-3 mb-4 text-center">
          <div className="rounded-xl bg-stone-50 border border-stone-200 p-3">
            <dt className="text-[11px] text-stone-500">Món đã xuất bản</dt>
            <dd className="text-lg font-bold text-stone-800">{data.stats.publishedCommunityRecipes}</dd>
          </div>
          <div className="rounded-xl bg-stone-50 border border-stone-200 p-3">
            <dt className="text-[11px] text-stone-500">Người đã nấu</dt>
            <dd className="text-lg font-bold text-stone-800">{data.stats.distinctRaters}</dd>
          </div>
          <div className="rounded-xl bg-stone-50 border border-stone-200 p-3">
            <dt className="text-[11px] text-stone-500">Điểm trung bình</dt>
            <dd className="text-lg font-bold text-stone-800">{data.stats.averageRating ?? '—'}</dd>
          </div>
        </dl>
      )}

      {data && data.missingForNextTier.length > 0 && (
        <div className="mb-4 rounded-xl border border-stone-200 bg-stone-50 p-3">
          <p className="text-xs font-semibold text-stone-700 mb-1">Để lên bậc tiếp theo, bạn cần:</p>
          <ul className="list-disc pl-5 text-xs text-stone-600 space-y-0.5">
            {data.missingForNextTier.map((m) => <li key={m}>{m}</li>)}
          </ul>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2" role="status">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden="true" /> {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" aria-hidden="true" /> {error}
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="creator-slug" className="block text-xs font-medium text-stone-700 mb-1">
            Đường dẫn hồ sơ
          </label>
          <div className="flex items-center rounded-xl border border-stone-300 focus-within:ring-2 focus-within:ring-amber-500 overflow-hidden">
            <span className="px-2 text-xs text-stone-400 bg-stone-50 self-stretch flex items-center">/nguoi-nau/</span>
            <input
              id="creator-slug"
              type="text"
              required
              minLength={3}
              maxLength={40}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              className="flex-1 px-2 py-2 text-sm outline-none"
            />
          </div>
        </div>
        <div>
          <label htmlFor="creator-region" className="block text-xs font-medium text-stone-700 mb-1">Vùng miền</label>
          <select
            id="creator-region"
            value={region}
            onChange={(e) => setRegion(e.target.value as CreatorRegion)}
            className="block w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white"
          >
            {Object.entries(CREATOR_REGIONS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="creator-bio" className="block text-xs font-medium text-stone-700 mb-1">
            Giới thiệu ngắn ({bio.length}/{CREATOR_BIO_MAX})
          </label>
          <textarea
            id="creator-bio"
            rows={3}
            maxLength={CREATOR_BIO_MAX}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Ví dụ: Mẹ hai con ở Huế, chuyên món kho và canh chua."
            className="block w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
        <label className="flex items-start gap-2 text-sm text-stone-700">
          <input id="creator-public" type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="mt-1" />
          Hiển thị hồ sơ công khai
        </label>
        <label className="flex items-start gap-2 text-sm text-stone-700">
          <input
            id="creator-terms"
            type="checkbox"
            checked={acceptTerms}
            disabled={termsLocked}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-1"
          />
          <span>
            Tôi cam kết công thức là của tôi hoặc tôi có quyền chia sẻ, và tự chịu trách nhiệm về nội dung đăng tải.
            {termsLocked && <span className="block text-xs text-emerald-700">Đã đồng ý.</span>}
          </span>
        </label>
        <div className="md:col-span-2">
          <button
            id="creator-save"
            type="submit"
            disabled={saving}
            className="min-h-[44px] px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Đang lưu...' : data?.profile ? 'Lưu hồ sơ' : 'Tạo hồ sơ người nấu'}
          </button>
        </div>
      </form>
    </section>
  );
}
