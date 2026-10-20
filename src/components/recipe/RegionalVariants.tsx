'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Layers, MapPin, ArrowRight } from 'lucide-react';
import type { PublicRecipeVariant } from '@/lib/recipes/publicQueries';
import { recipePath } from '@/lib/recipes/labels';

interface RegionalVariantsProps {
  currentDishName?: string;
  variants: PublicRecipeVariant[];
}

const REGION_BADGES: Record<string, { label: string; color: string }> = {
  NORTH: { label: 'Miền Bắc', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  CENTRAL: { label: 'Miền Trung', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  SOUTH: { label: 'Miền Nam', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  GENERAL: { label: 'Toàn quốc', color: 'bg-stone-50 text-stone-700 border-stone-200' },
};

export function RegionalVariants({ currentDishName, variants }: RegionalVariantsProps) {
  if (!variants || variants.length === 0) return null;

  return (
    <section
      aria-labelledby="regional-variants-heading"
      className="rounded-3xl border border-[#EADBC8] bg-white p-6 shadow-xs space-y-4"
    >
      <div className="flex items-center justify-between border-b border-[#F3E9DD] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 id="regional-variants-heading" className="text-base font-bold text-[#2A1810]">
              Biến Thể Vùng Miền Khác ({variants.length})
            </h2>
            <p className="text-xs text-stone-500">
              Khám phá cách nêm nếm và nguyên liệu địa phương đặc trưng của từng miền
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {variants.map((v) => {
          const badge = REGION_BADGES[v.region] || REGION_BADGES.GENERAL;
          return (
            <Link
              key={v.slug}
              href={recipePath(v.slug)}
              className="group flex items-start gap-3 p-3 rounded-2xl border border-[#EADBC8] hover:border-[#3F6240] hover:bg-[#FAF7F2] transition-all"
            >
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                {v.heroImage ? (
                  <Image
                    src={v.heroImage}
                    alt={v.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="64px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs font-bold">
                    ĂGM
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-[#2A1810] group-hover:text-[#3F6240] transition-colors line-clamp-1">
                  {v.name}
                </h3>
                <p className="text-[11px] text-stone-500 line-clamp-1">{v.shortDescription}</p>
              </div>

              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[#3F6240] group-hover:translate-x-0.5 transition-all self-center shrink-0" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
