// AG-40: Sync Checked Shopping Items to Pantry (1-Click Move to Fridge)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pantryItems, ingredients } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { ilike } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập để đồng bộ vào tủ lạnh.' }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Danh sách món cần chuyển rỗng.' }, { status: 400 });
    }

    const now = new Date();
    const insertedItems = [];

    for (const item of items) {
      if (!item.name || typeof item.name !== 'string') continue;
      const cleanName = item.name.trim();
      const quantity = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
      const unit = item.unit ? String(item.unit).trim() : 'gam';
      const category = item.category ? String(item.category).toLowerCase() : '';

      // Tự động phân loại vị trí bảo quản và thời hạn khuyến nghị
      let location: 'FRIDGE' | 'FREEZER' | 'DRY_PANTRY' = 'FRIDGE';
      let shelfDays = 7; // mặc định 7 ngày trong tủ mát

      if (category.includes('tươi sống') || cleanName.toLowerCase().includes('thịt') || cleanName.toLowerCase().includes('cá') || cleanName.toLowerCase().includes('tôm')) {
        location = 'FREEZER';
        shelfDays = 30; // 1 tháng trong tủ đông
      } else if (category.includes('khô') || category.includes('gia vị') || category.includes('bột') || cleanName.toLowerCase().includes('gạo') || cleanName.toLowerCase().includes('đường') || cleanName.toLowerCase().includes('mắm')) {
        location = 'DRY_PANTRY';
        shelfDays = 90; // 3 tháng trong kho khô
      } else if (category.includes('rau') || category.includes('củ')) {
        location = 'FRIDGE';
        shelfDays = 5; // 5 ngày cho rau củ
      }

      const expiresAt = new Date(now.getTime() + shelfDays * 24 * 60 * 60 * 1000);

      // Thử tìm ingredient trong DB
      const matchedIng = await db.query.ingredients.findFirst({
        where: ilike(ingredients.name, cleanName),
      });

      const [pItem] = await db.insert(pantryItems).values({
        userId: user.id,
        ingredientId: matchedIng ? matchedIng.id : null,
        customName: cleanName,
        quantity,
        unit,
        location,
        expiresAt,
        notes: 'Chuyển từ Giỏ hàng đi chợ',
      }).returning();

      insertedItems.push(pItem);
    }

    logger.info('Synced items from shopping to pantry', { userId: user.id, count: insertedItems.length });
    return NextResponse.json({
      success: true,
      message: `Đã chuyển thành công ${insertedItems.length} nguyên liệu vào tủ lạnh/kho bếp!`,
      items: insertedItems,
    });
  } catch (error) {
    logger.error('Error syncing shopping to pantry', { error });
    return NextResponse.json({ error: 'Lỗi máy chủ khi chuyển món vào tủ lạnh.' }, { status: 500 });
  }
}
