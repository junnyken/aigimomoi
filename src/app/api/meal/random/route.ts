import { NextResponse } from 'next/server';
import { getRandomMealSlugs } from '@/lib/meal/mealQueries';

export async function GET() {
  try {
    const meal = await getRandomMealSlugs();
    if (!meal) {
      return NextResponse.json({ error: 'Chưa đủ món ăn để gợi ý mâm cơm' }, { status: 404 });
    }
    return NextResponse.json(meal);
  } catch (err) {
    console.error('Lỗi khi gợi ý mâm cơm:', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
