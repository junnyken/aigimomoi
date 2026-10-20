import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { taxonomies, taxonomyTypeEnum } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { eq, asc } from 'drizzle-orm';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// GET /api/taxonomies?type=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const typeParam = searchParams.get('type') as (typeof taxonomyTypeEnum.enumValues)[number] | null;

    const items = await db
      .select()
      .from(taxonomies)
      .where(typeParam ? eq(taxonomies.type, typeParam) : undefined)
      .orderBy(asc(taxonomies.name));

    return NextResponse.json({ taxonomies: items });
  } catch (error) {
    console.error('Error fetching taxonomies:', error);
    return NextResponse.json({ error: 'Lỗi tải danh mục phân loại' }, { status: 500 });
  }
}

// POST /api/taxonomies (Requires EDITOR or ADMIN)
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
    const { type, name } = body;

    if (!type || !name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Vui lòng cung cấp đầy đủ loại và tên phân loại' }, { status: 400 });
    }

    const slug = slugify(name);

    const [existing] = await db
      .select({ id: taxonomies.id })
      .from(taxonomies)
      .where(eq(taxonomies.slug, slug))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: `Phân loại "${name}" đã tồn tại` }, { status: 409 });
    }

    const [created] = await db
      .insert(taxonomies)
      .values({
        type,
        name: name.trim(),
        slug,
      })
      .returning();

    return NextResponse.json({ taxonomy: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating taxonomy:', error);
    return NextResponse.json({ error: 'Lỗi tạo phân loại' }, { status: 500 });
  }
}
