import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  recipes,
  dishes,
  recipeIngredients,
  cookingSteps,
  recipeTags,
  ingredients,
  taxonomies,
  mealRoleEnum,
  recipePublishStatusEnum,
} from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { ilike, eq, ne, and, desc } from 'drizzle-orm';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// GET /api/recipes?q=...&role=...&status=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q');
    const roleParam = searchParams.get('role');
    const statusParam = searchParams.get('status');

    const user = await getSessionUser();
    const staff = user?.role === 'ADMIN' || user?.role === 'EDITOR';

    const conditions = [];

    if (query) {
      conditions.push(ilike(recipes.name, `%${query.trim().slice(0, 100)}%`));
    }
    if (roleParam) {
      if (!(mealRoleEnum.enumValues as readonly string[]).includes(roleParam)) {
        return NextResponse.json({ error: 'Vai trò không hợp lệ' }, { status: 400 });
      }
      conditions.push(eq(recipes.role, roleParam as (typeof mealRoleEnum.enumValues)[number]));
    }

    if (!staff) {
      // AG-15: Draft không công khai
      conditions.push(eq(recipes.status, 'PUBLISHED'));
    } else if (statusParam) {
      if (!(recipePublishStatusEnum.enumValues as readonly string[]).includes(statusParam)) {
        return NextResponse.json({ error: 'Trạng thái không hợp lệ' }, { status: 400 });
      }
      conditions.push(eq(recipes.status, statusParam as (typeof recipePublishStatusEnum.enumValues)[number]));
    } else {
      // Phiên bản cũ đã lưu trữ chỉ hiện khi lọc tường minh
      conditions.push(ne(recipes.status, 'ARCHIVED'));
    }

    const items = await db.query.recipes.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(recipes.createdAt)],
      with: {
        dish: true,
        author: {
          columns: staff
            ? { id: true, displayName: true, email: true, role: true }
            : { id: true, displayName: true },
        },
        tags: {
          with: {
            taxonomy: true,
          },
        },
      },
    });

    if (!staff) {
      return NextResponse.json({
        recipes: items.map(({ reviewNotes: _n, reviewedById: _r, ...rest }) => rest),
      });
    }

    return NextResponse.json({ recipes: items });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      { error: 'Không thể tải danh sách công thức' },
      { status: 500 }
    );
  }
}

// POST /api/recipes (Requires EDITOR or ADMIN)
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
    const {
      name,
      dishId: reqDishId,
      dishName,
      shortDescription,
      role = 'MAIN',
      status = 'DRAFT',
      baseServings = 4,
      prepTimeMinutes = 15,
      cookTimeMinutes = 30,
      difficulty = 'Dễ',
      caloriesPerServing,
      heroImage,
      ingredients: rawIngredients = [],
      steps: rawSteps = [],
      taxonomyIds = [],
    } = body;

    // Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Tên công thức không được để trống' },
        { status: 400 }
      );
    }

    if (!shortDescription || typeof shortDescription !== 'string' || !shortDescription.trim()) {
      return NextResponse.json(
        { error: 'Mô tả ngắn không được để trống' },
        { status: 400 }
      );
    }

    if (baseServings < 1 || baseServings > 50) {
      return NextResponse.json(
        { error: 'Khẩu phần cơ sở (baseServings) phải từ 1 đến 50' },
        { status: 400 }
      );
    }

    let finalSlug = slugify(name);
    // Check if slug exists, if so append unique timestamp
    const [existingRecipe] = await db
      .select({ id: recipes.id })
      .from(recipes)
      .where(eq(recipes.slug, finalSlug))
      .limit(1);

    if (existingRecipe) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-6)}`;
    }

    // Resolve Dish
    let resolvedDishId: number | null = reqDishId ? Number(reqDishId) : null;
    if (!resolvedDishId) {
      const dName = (dishName || name).trim();
      const dishSlug = slugify(dName);
      
      const [existingDish] = await db
        .select({ id: dishes.id })
        .from(dishes)
        .where(eq(dishes.slug, dishSlug))
        .limit(1);

      if (existingDish) {
        resolvedDishId = existingDish.id;
      } else {
        const [newDish] = await db
          .insert(dishes)
          .values({
            name: dName,
            slug: dishSlug,
            defaultRole: role,
            description: shortDescription.trim(),
          })
          .returning();
        resolvedDishId = newDish.id;
      }
    }

    // Execute atomic creation with transaction
    const createdRecipe = await db.transaction(async (tx) => {
      // 1. Insert recipe
      const [rec] = await tx
        .insert(recipes)
        .values({
          dishId: resolvedDishId,
          slug: finalSlug,
          name: name.trim(),
          shortDescription: shortDescription.trim(),
          role,
          status: status === 'SUBMITTED' ? 'SUBMITTED' : 'DRAFT',
          baseServings: Number(baseServings),
          prepTimeMinutes: Number(prepTimeMinutes) || 0,
          cookTimeMinutes: Number(cookTimeMinutes) || 0,
          difficulty: difficulty || 'Dễ',
          caloriesPerServing: caloriesPerServing ? Number(caloriesPerServing) : null,
          heroImage: heroImage || null,
          authorId: user.id,
        })
        .returning();

      // 2. Insert structured ingredients
      if (Array.isArray(rawIngredients) && rawIngredients.length > 0) {
        const ingValues = rawIngredients.map((item: any, idx: number) => ({
          recipeId: rec.id,
          ingredientId: Number(item.ingredientId),
          amount: Number(item.amount) || 0,
          unit: (item.unit || 'g').trim(),
          scalePolicy: (item.scalePolicy || 'LINEAR') as 'LINEAR' | 'FIXED' | 'MANUAL_ADJUST',
          preparation: item.preparation ? item.preparation.trim() : null,
          isOptional: Boolean(item.isOptional),
          sortOrder: idx + 1,
        }));

        await tx.insert(recipeIngredients).values(ingValues);
      }

      // 3. Insert structured cooking steps
      if (Array.isArray(rawSteps) && rawSteps.length > 0) {
        const stepValues = rawSteps.map((s: any, idx: number) => ({
          recipeId: rec.id,
          stepNumber: idx + 1,
          phaseName: (s.phaseName || 'Chế biến').trim(),
          instruction: (s.instruction || '').trim(),
          timerSeconds: s.timerSeconds ? Number(s.timerSeconds) : null,
          tipText: s.tipText ? s.tipText.trim() : null,
          image: s.image || null,
        }));

        await tx.insert(cookingSteps).values(stepValues);
      }

      // 4. Insert recipe taxonomy tags
      if (Array.isArray(taxonomyIds) && taxonomyIds.length > 0) {
        const tagValues = taxonomyIds.map((tid: number) => ({
          recipeId: rec.id,
          taxonomyId: Number(tid),
        }));

        await tx.insert(recipeTags).values(tagValues);
      }

      return rec;
    });

    return NextResponse.json({ recipe: createdRecipe }, { status: 201 });
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json(
      { error: 'Không thể tạo công thức mới. Vui lòng kiểm tra lại dữ liệu đầu vào.' },
      { status: 500 }
    );
  }
}
