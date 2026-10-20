import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ingredients } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { ilike, eq, and, desc } from 'drizzle-orm';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// GET /api/ingredients?q=...&category=...&staple=true|false
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const stapleParam = searchParams.get('staple');

    const conditions = [];

    if (query) {
      conditions.push(ilike(ingredients.name, `%${query.trim()}%`));
    }
    if (category) {
      conditions.push(eq(ingredients.category, category));
    }
    if (stapleParam !== null) {
      conditions.push(eq(ingredients.isPantryStaple, stapleParam === 'true'));
    }

    const items = await db
      .select()
      .from(ingredients)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(ingredients.createdAt));

    return NextResponse.json({ ingredients: items });
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    return NextResponse.json(
      { error: 'Không thể tải danh sách nguyên liệu' },
      { status: 500 }
    );
  }
}

// POST /api/ingredients (Requires EDITOR or ADMIN)
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
      return NextResponse.json(
        { error: 'Yêu cầu quyền Biên tập viên (EDITOR) hoặc Quản trị viên (ADMIN)' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, category, standardUnit, isPantryStaple } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Tên nguyên liệu không được để trống' },
        { status: 400 }
      );
    }

    const slug = slugify(name);

    // Check if slug exists
    const [existing] = await db
      .select({ id: ingredients.id })
      .from(ingredients)
      .where(eq(ingredients.slug, slug))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: `Nguyên liệu "${name}" đã tồn tại trong từ điển` },
        { status: 409 }
      );
    }

    const [created] = await db
      .insert(ingredients)
      .values({
        name: name.trim(),
        slug,
        category: category || 'Thực phẩm tươi sống',
        standardUnit: standardUnit || 'g',
        isPantryStaple: Boolean(isPantryStaple),
      })
      .returning();

    return NextResponse.json({ ingredient: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating ingredient:', error);
    return NextResponse.json(
      { error: 'Không thể tạo nguyên liệu mới' },
      { status: 500 }
    );
  }
}
