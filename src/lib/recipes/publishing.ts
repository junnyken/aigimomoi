// AG-15 — Publishing & Revision service (server-only).
// Toàn bộ chuyển trạng thái nhạy cảm (publish / reject / revision) đi qua đây để
// API routes và script kiểm thử dùng chung một nguồn sự thật.
import { db } from '@/lib/db';
import {
  recipes,
  recipeIngredients,
  cookingSteps,
  recipeTags,
} from '@/lib/db/schema';
import { and, asc, eq, inArray } from 'drizzle-orm';
import {
  failedGateChecks,
  validateVerificationFlags,
  REVIEW_NOTES_MAX,
  REVIEW_NOTES_MIN,
  type GateCheckItem,
  type VerificationFlags,
} from './gate';

export class PublishingError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: { failedChecks?: GateCheckItem[]; openRevisionId?: number }
  ) {
    super(message);
    this.name = 'PublishingError';
  }
}

// Các trạng thái được coi là "bản sửa đổi đang mở" (chưa xuất bản, chưa lưu trữ)
export const OPEN_REVISION_STATUSES = ['DRAFT', 'SUBMITTED', 'NEEDS_CHANGES', 'APPROVED'] as const;

export function revisionSlug(canonicalSlug: string, version: number): string {
  return `${canonicalSlug}--rev-${version}`;
}

export function archivedSlug(canonicalSlug: string, version: number): string {
  return `${canonicalSlug}--v${version}`;
}

/**
 * ADMIN phê duyệt & xuất bản. Nếu là bản sửa đổi, bản PUBLISHED cũ được chuyển
 * ARCHIVED (giữ nguyên nội dung) và bản mới tiếp quản slug công khai.
 */
export async function publishRecipe(recipeId: number, adminId: number, flags: VerificationFlags) {
  return db.transaction(async (tx) => {
    const [target] = await tx
      .select()
      .from(recipes)
      .where(eq(recipes.id, recipeId))
      .for('update');

    if (!target) throw new PublishingError(404, 'Không tìm thấy công thức');
    if (target.status !== 'SUBMITTED') {
      throw new PublishingError(409, `Chỉ xuất bản được công thức đang chờ duyệt (SUBMITTED). Trạng thái hiện tại: ${target.status}`);
    }

    const [ings, steps] = await Promise.all([
      tx
        .select({ ingredientId: recipeIngredients.ingredientId, amount: recipeIngredients.amount })
        .from(recipeIngredients)
        .where(eq(recipeIngredients.recipeId, recipeId)),
      tx
        .select({ instruction: cookingSteps.instruction })
        .from(cookingSteps)
        .where(eq(cookingSteps.recipeId, recipeId)),
    ]);

    const failed = failedGateChecks({ ...target, ingredients: ings, steps });
    if (failed.length > 0) {
      throw new PublishingError(422, 'Công thức chưa đạt điều kiện Gate Check', { failedChecks: failed });
    }

    const flagErrors = validateVerificationFlags(flags, target);
    if (flagErrors.length > 0) {
      throw new PublishingError(422, flagErrors.join(' '));
    }

    let finalSlug = target.slug;

    if (target.revisionOfId !== null) {
      const [source] = await tx
        .select()
        .from(recipes)
        .where(eq(recipes.id, target.revisionOfId))
        .for('update');

      if (!source || source.status !== 'PUBLISHED') {
        throw new PublishingError(409, 'Bản gốc của bản sửa đổi này không còn ở trạng thái PUBLISHED.');
      }

      finalSlug = source.slug;
      // Đổi slug bản cũ trước để giải phóng ràng buộc UNIQUE cho bản mới.
      await tx
        .update(recipes)
        .set({
          status: 'ARCHIVED',
          slug: archivedSlug(source.slug, source.versionNumber),
          updatedAt: new Date(),
        })
        .where(eq(recipes.id, source.id));
    }

    const now = new Date();
    const [published] = await tx
      .update(recipes)
      .set({
        status: 'PUBLISHED',
        slug: finalSlug,
        isEditorialReviewed: flags.isEditorialReviewed,
        isCookTested: flags.isCookTested,
        isNutritionVerified: flags.isNutritionVerified,
        reviewNotes: null,
        reviewedById: adminId,
        reviewedAt: now,
        publishedAt: now,
        updatedAt: now,
      })
      .where(eq(recipes.id, recipeId))
      .returning();

    return published;
  });
}

/** ADMIN từ chối, trả về biên tập viên kèm góp ý. */
export async function rejectRecipe(recipeId: number, adminId: number, notes: string) {
  const trimmed = (notes || '').trim();
  if (trimmed.length < REVIEW_NOTES_MIN || trimmed.length > REVIEW_NOTES_MAX) {
    throw new PublishingError(400, `Ghi chú góp ý phải dài từ ${REVIEW_NOTES_MIN} đến ${REVIEW_NOTES_MAX} ký tự.`);
  }

  const now = new Date();
  const [updated] = await db
    .update(recipes)
    .set({
      status: 'NEEDS_CHANGES',
      reviewNotes: trimmed,
      reviewedById: adminId,
      reviewedAt: now,
      updatedAt: now,
    })
    // Điều kiện trạng thái nằm trong WHERE để tránh race condition
    .where(and(eq(recipes.id, recipeId), eq(recipes.status, 'SUBMITTED')))
    .returning();

  if (!updated) {
    const existing = await db.query.recipes.findFirst({ where: eq(recipes.id, recipeId) });
    if (!existing) throw new PublishingError(404, 'Không tìm thấy công thức');
    throw new PublishingError(409, `Chỉ từ chối được công thức đang chờ duyệt (SUBMITTED). Trạng thái hiện tại: ${existing.status}`);
  }

  return updated;
}

/**
 * Tạo bản sửa đổi DRAFT (version + 1) từ bản PUBLISHED. Bản cũ giữ nguyên và
 * tiếp tục phục vụ người đọc cho tới khi bản mới được xuất bản.
 */
export async function createRevision(sourceId: number) {
  return db.transaction(async (tx) => {
    // Khóa bản gốc để tuần tự hóa các yêu cầu tạo revision đồng thời
    const [source] = await tx
      .select()
      .from(recipes)
      .where(eq(recipes.id, sourceId))
      .for('update');

    if (!source) throw new PublishingError(404, 'Không tìm thấy công thức');
    if (source.status !== 'PUBLISHED') {
      throw new PublishingError(409, 'Chỉ tạo bản sửa đổi từ công thức đang xuất bản (PUBLISHED).');
    }

    const [open] = await tx
      .select({ id: recipes.id })
      .from(recipes)
      .where(
        and(
          eq(recipes.revisionOfId, sourceId),
          inArray(recipes.status, [...OPEN_REVISION_STATUSES])
        )
      )
      .limit(1);

    if (open) {
      throw new PublishingError(409, 'Công thức này đã có một bản sửa đổi đang mở.', { openRevisionId: open.id });
    }

    const nextVersion = source.versionNumber + 1;

    const [rev] = await tx
      .insert(recipes)
      .values({
        dishId: source.dishId,
        slug: revisionSlug(source.slug, nextVersion),
        name: source.name,
        shortDescription: source.shortDescription,
        role: source.role,
        status: 'DRAFT',
        baseServings: source.baseServings,
        prepTimeMinutes: source.prepTimeMinutes,
        cookTimeMinutes: source.cookTimeMinutes,
        difficulty: source.difficulty,
        caloriesPerServing: source.caloriesPerServing,
        nutritionStatus: source.nutritionStatus,
        heroImage: source.heroImage,
        // D23: nội dung sẽ thay đổi nên nhãn kiểm chứng phải được ADMIN xác nhận lại
        isEditorialReviewed: false,
        isCookTested: false,
        isNutritionVerified: false,
        versionNumber: nextVersion,
        revisionOfId: source.id,
        authorId: source.authorId,
      })
      .returning();

    const [ings, steps, tags] = await Promise.all([
      tx.select().from(recipeIngredients).where(eq(recipeIngredients.recipeId, sourceId)).orderBy(asc(recipeIngredients.sortOrder)),
      tx.select().from(cookingSteps).where(eq(cookingSteps.recipeId, sourceId)).orderBy(asc(cookingSteps.stepNumber)),
      tx.select().from(recipeTags).where(eq(recipeTags.recipeId, sourceId)),
    ]);

    if (ings.length > 0) {
      await tx.insert(recipeIngredients).values(
        ings.map(({ id: _id, recipeId: _r, ...rest }) => ({ ...rest, recipeId: rev.id }))
      );
    }
    if (steps.length > 0) {
      await tx.insert(cookingSteps).values(
        steps.map(({ id: _id, recipeId: _r, ...rest }) => ({ ...rest, recipeId: rev.id }))
      );
    }
    if (tags.length > 0) {
      await tx.insert(recipeTags).values(tags.map((t) => ({ recipeId: rev.id, taxonomyId: t.taxonomyId })));
    }

    return rev;
  });
}

/** Tìm bản sửa đổi đang mở của một công thức PUBLISHED (nếu có). */
export async function findOpenRevisionId(sourceId: number): Promise<number | null> {
  const [open] = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(and(eq(recipes.revisionOfId, sourceId), inArray(recipes.status, [...OPEN_REVISION_STATUSES])))
    .limit(1);
  return open ? open.id : null;
}
