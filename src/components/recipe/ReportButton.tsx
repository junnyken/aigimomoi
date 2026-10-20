'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { ReportRecipeModal } from '@/components/recipes/ReportRecipeModal';

interface ReportButtonProps {
  recipeId: number;
  recipeName: string;
}

export function ReportButton({ recipeId, recipeName }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors py-2 px-3 rounded-lg hover:bg-stone-100"
        title="Báo cáo công thức này nếu có sai sót hoặc vi phạm"
      >
        <Flag className="w-3.5 h-3.5" />
        <span>Báo cáo nội dung</span>
      </button>

      <ReportRecipeModal
        recipeId={recipeId}
        recipeName={recipeName}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
