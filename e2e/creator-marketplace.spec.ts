// R7 — E2E Chợ công thức: lọc nguồn, hồ sơ người nấu, gửi đánh giá "Tôi đã nấu".
// Dữ liệu từ src/scripts/seed_e2e_creator.ts (chạy trong e2e/setup-db.ts).
import { test, expect } from '@playwright/test';

const CREATOR_SLUG = 'me-bap-e2e';
const CREATOR_NAME = 'Mẹ Bắp E2E';
const COMMUNITY_RECIPE = 'ga-kho-gung-me-bap-e2e';
const COMMUNITY_RECIPE_NAME = 'Gà kho gừng Mẹ Bắp';
const EDITORIAL_RECIPE_NAME = /Canh chua cá lóc|Rau muống xào tỏi/;

test.describe('R7 — Chợ công thức (khách, chưa đăng nhập)', () => {
  test('1. Lọc Chợ công thức → mở hồ sơ người nấu', async ({ page }) => {
    await page.goto('/mon-an?nguon=cho');
    await expect(page.locator('#source-filter-cho')).toHaveAttribute('aria-current', 'page');

    const card = page.locator('article').filter({ hasText: COMMUNITY_RECIPE_NAME });
    await expect(card).toBeVisible();
    await expect(card.getByTestId('recipe-source-community')).toContainText('Chợ công thức');
    await expect(page.getByText(EDITORIAL_RECIPE_NAME)).toHaveCount(0);

    await card.getByRole('link', { name: CREATOR_NAME }).click();
    await expect(page).toHaveURL(new RegExp(`/nguoi-nau/${CREATOR_SLUG}$`));
    await expect(page.getByRole('heading', { level: 1, name: CREATOR_NAME })).toBeVisible();
    await expect(page.getByTestId('creator-tier')).toHaveText(/Người đóng góp/);
    await expect(page.getByTestId('creator-profile-page').locator('article').filter({ hasText: COMMUNITY_RECIPE_NAME })).toBeVisible();
    // Không lộ email người nấu
    await expect(page.getByText(/@example\.test/)).toHaveCount(0);
  });

  test('2. Lọc Bếp Mom không có món cộng đồng', async ({ page }) => {
    await page.goto('/mon-an?nguon=bep-mom');
    await expect(page.locator('#source-filter-bep-mom')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByText(EDITORIAL_RECIPE_NAME).first()).toBeVisible();
    await expect(page.getByText(COMMUNITY_RECIPE_NAME)).toHaveCount(0);
    await expect(page.getByTestId('recipe-source-community')).toHaveCount(0);
  });

  test('3. Chi tiết món cộng đồng: nhãn rõ ràng, không "Đã nấu thử", gửi đánh giá', async ({ page }) => {
    await page.goto(`/cong-thuc/${COMMUNITY_RECIPE}`);
    const notice = page.getByTestId('community-recipe-notice');
    await expect(notice).toContainText('chưa được Bếp Mom nấu thử');
    await expect(notice.getByRole('link', { name: CREATOR_NAME })).toHaveAttribute('href', `/nguoi-nau/${CREATOR_SLUG}`);
    await expect(page.getByText('Đã nấu thử', { exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: 'Tôi đã nấu món này!' }).click();
    await page.getByPlaceholder('VD: Mẹ Bắp, Bếp Nhà Bo').fill('Khách E2E');
    await page.getByRole('button', { name: /Gửi phản hồi/ }).click();
    // Khách chưa đăng nhập → vào hàng đợi kiểm duyệt
    await expect(page.getByText(/đã được gửi tới Ban biên tập/)).toBeVisible();
  });

  test('4. Hồ sơ không tồn tại → 404', async ({ page }) => {
    const res = await page.goto('/nguoi-nau/khong-ton-tai-e2e');
    expect(res?.status()).toBe(404);
  });
});
