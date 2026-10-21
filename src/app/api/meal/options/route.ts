import { NextResponse } from 'next/server';
import { queryPublishedMealOptions, type MealSlotRole } from '@/lib/meal/mealQueries';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get('role');
    const role: MealSlotRole | undefined =
      roleParam === 'MAIN' ||
      roleParam === 'SOUP' ||
      roleParam === 'SIDE' ||
      roleParam === 'DIPPING_SAUCE'
        ? roleParam
        : undefined;

    const options = await queryPublishedMealOptions(role);
    return NextResponse.json({ options });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'digest' in err &&
      (err as { digest: string }).digest === 'NEXT_PRERENDER_INTERRUPTED'
    ) {
      throw err;
    }
    console.error('Lỗi khi lấy danh sách món ăn cho mâm cơm:', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
