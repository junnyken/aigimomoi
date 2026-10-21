'use client';

import { BookOpen, Sparkles, MapPin, Heart } from 'lucide-react';

interface KitchenStorySectionProps {
  kitchenStory?: string | null;
  sourceAttribution?: string | null;
  region?: string | null;
}

const REGION_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  NORTH: { label: 'Khẩu vị Miền Bắc', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800' },
  CENTRAL: { label: 'Khẩu vị Miền Trung', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800' },
  SOUTH: { label: 'Khẩu vị Miền Nam', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800' },
  GENERAL: { label: 'Hương vị Toàn Quốc', bg: 'bg-stone-50 border-stone-200', text: 'text-stone-800' },
};

export function KitchenStorySection({
  kitchenStory,
  sourceAttribution,
  region = 'GENERAL',
}: KitchenStorySectionProps) {
  if (!kitchenStory && !sourceAttribution) return null;

  const regInfo = REGION_LABELS[region || 'GENERAL'] || REGION_LABELS.GENERAL;

  return (
    <section
      aria-labelledby="kitchen-story-heading"
      className="rounded-3xl border border-[#EADBC8] bg-linear-to-br from-[#FFFDF9] to-[#FBF6ED] p-6 shadow-xs relative overflow-hidden"
    >
      {/* Decorative background icon */}
      <div className="absolute -right-4 -bottom-4 text-[#3F6240]/5 pointer-events-none" aria-hidden="true">
        <Heart className="w-36 h-36" />
      </div>

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EADBC8]/70 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#3F6240]/10 text-[#3F6240] flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 id="kitchen-story-heading" className="text-base font-bold text-[#2A1810]">
              Câu Chuyện Bếp Nhà
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${regInfo.bg} ${regInfo.text}`}
            >
              <MapPin className="w-3 h-3" />
              {regInfo.label}
            </span>
          </div>
        </div>

        {/* Story content */}
        {kitchenStory && (
          <div className="text-sm text-[#4A3B32] leading-relaxed italic bg-white/70 backdrop-blur-2xs p-4 rounded-2xl border border-[#EADBC8]/50 shadow-2xs font-serif">
            &ldquo;{kitchenStory}&rdquo;
          </div>
        )}

        {/* Source Attribution */}
        {sourceAttribution && (
          <div className="flex items-center gap-2 text-xs text-stone-600 pt-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              Nguồn gốc / Truyền dạy bởi:{' '}
              <strong className="font-semibold text-[#2A1810]">{sourceAttribution}</strong>
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
