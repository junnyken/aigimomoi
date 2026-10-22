import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ingredients, ingredientNutrition } from '@/lib/db/schema';
import { ensureDatabaseBootstrapped } from '@/lib/db/autoBootstrap';
import { getSessionUser } from '@/lib/auth/session';
import { seedNutritionStandards, resolveOrSeedIngredientNutrition } from '@/lib/nutrition/calculator';
import { ilike, eq, and, asc, or } from 'drizzle-orm';

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
    await ensureDatabaseBootstrapped();

    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const stapleParam = searchParams.get('staple');

    const conditions = [];

    if (query && query.trim()) {
      const qTrim = query.trim();
      const qSlug = slugify(qTrim);
      conditions.push(
        or(
          ilike(ingredients.name, `%${qTrim}%`),
          ilike(ingredients.slug, `%${qSlug}%`)
        )
      );
    }
    if (category && category !== 'Tất cả') {
      conditions.push(eq(ingredients.category, category));
    }
    if (stapleParam !== null) {
      conditions.push(eq(ingredients.isPantryStaple, stapleParam === 'true'));
    }

    const rows = await db
      .select({
        id: ingredients.id,
        slug: ingredients.slug,
        name: ingredients.name,
        category: ingredients.category,
        standardUnit: ingredients.standardUnit,
        isPantryStaple: ingredients.isPantryStaple,
        createdAt: ingredients.createdAt,
        calories100g: ingredientNutrition.calories100g,
        protein100g: ingredientNutrition.protein100g,
        fat100g: ingredientNutrition.fat100g,
        carbs100g: ingredientNutrition.carbs100g,
        fiber100g: ingredientNutrition.fiber100g,
        sodium100g: ingredientNutrition.sodium100g,
        edibleRate: ingredientNutrition.edibleRate,
        nutritionSource: ingredientNutrition.source,
        nutritionNotes: ingredientNutrition.notes,
      })
      .from(ingredients)
      .leftJoin(ingredientNutrition, eq(ingredientNutrition.ingredientId, ingredients.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(ingredients.category), asc(ingredients.name));

    return NextResponse.json({ ingredients: rows });
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

    // Cho phép đồng bộ toàn bộ kho nguyên liệu chuẩn Việt Nam (~180+ loại) chỉ với 1 chạm
    if (body?.action === 'sync_vietnam_catalog') {
      const syncedCount = await seedNutritionStandards();
      return NextResponse.json({
        ok: true,
        syncedCount,
        message: `Đã đồng bộ thành công ${syncedCount} nguyên liệu và chỉ số dinh dưỡng chuẩn Việt Nam!`,
      });
    }

    const {
      name,
      category,
      standardUnit,
      isPantryStaple,
      calories100g,
      protein100g,
      fat100g,
      carbs100g,
      edibleRate,
      nutritionSource,
      nutritionNotes,
    } = body;

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

    if (typeof calories100g === 'number' && !Number.isNaN(calories100g)) {
      await db
        .insert(ingredientNutrition)
        .values({
          ingredientId: created.id,
          source: nutritionSource || 'VIETNAM_FCT_2007',
          edibleRate: typeof edibleRate === 'number' && edibleRate > 0 && edibleRate <= 1 ? edibleRate : 1.0,
          calories100g: Number(calories100g),
          protein100g: typeof protein100g === 'number' ? Number(protein100g) : 0,
          fat100g: typeof fat100g === 'number' ? Number(fat100g) : 0,
          carbs100g: typeof carbs100g === 'number' ? Number(carbs100g) : 0,
          isVerified: true,
          notes: nutritionNotes || 'Bổ sung bởi Ban biên tập',
        })
        .onConflictDoNothing();
    } else {
      await resolveOrSeedIngredientNutrition(created.id, created.name);
    }

    return NextResponse.json({ ingredient: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating ingredient:', error);
    return NextResponse.json(
      { error: 'Không thể tạo nguyên liệu mới' },
      { status: 500 }
    );
  }
}
