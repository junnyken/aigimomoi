// R8 — E2E Khóa nội dung, Server-side Gating & Claim Entitlement miễn phí (D66)
import { test, expect } from '@playwright/test';
import { E2E_CREATOR } from '../src/scripts/seed_e2e_creator';

const PAID_RECIPE = E2E_CREATOR.paidRecipeSlug;

test.describe('R8 — Khóa nội dung & Quyền sở hữu (Server-side Gating)', () => {
  test('1. Khách vãng lai mở món có phí: bị khóa nguyên liệu, các bước, chặn chế độ nấu', async ({ page }) => {
    await page.goto(`/cong-thuc/${PAID_RECIPE}`);

    // Banner khóa nội dung
    const banner = page.getByTestId('gated-recipe-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Công thức được khóa bởi');
    await expect(banner).toContainText('35.000 ₫');

    // Nút đăng nhập để nhận
    await expect(banner.getByTestId('login-to-claim-button')).toBeVisible();

    // Invariant D66: Không có nguyên liệu hay các bước trong DOM
    await expect(page.locator('aside').getByRole('heading', { name: /Nguyên liệu/ })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Các bước thực hiện/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Bắt đầu nấu món này/ })).toHaveCount(0);

    // Chặn truy cập chế độ nấu khi chưa sở hữu
    await page.goto(`/cong-thuc/${PAID_RECIPE}/nau`);
    await expect(page).toHaveURL(new RegExp(`/cong-thuc/${PAID_RECIPE}$`));
  });

  test('2. Người dùng đăng nhập: Bấm nhận thử nghiệm -> mở khóa trọn vẹn', async ({ page }) => {
    // Đăng ký tài khoản người dùng mới và chuyển hướng về món ăn
    const email = `r8_e2e_cook_${Date.now()}@angimom.test`;
    await page.goto(`/register?from=/cong-thuc/${PAID_RECIPE}`);
    await page.getByLabel(/Họ và tên/).fill('Người Dùng E2E R8');
    await page.getByLabel(/Địa chỉ email/).fill(email);
    await page.getByLabel(/^Mật khẩu/).fill('MatKhauAnToan2026!');
    await page.getByLabel(/Xác nhận lại mật khẩu/).fill('MatKhauAnToan2026!');
    await page.getByRole('button', { name: /Đăng ký/ }).click();

    // Chuyển hướng sau đăng ký thành công về trang món ăn
    await expect(page).toHaveURL(new RegExp(`/cong-thuc/${PAID_RECIPE}$`), { timeout: 15_000 });

    const banner = page.getByTestId('gated-recipe-banner');
    await expect(banner).toBeVisible();

    // Bấm nút mở khóa dùng thử miễn phí
    const claimButton = banner.getByTestId('claim-recipe-promo-button');
    await expect(claimButton).toBeVisible();
    await claimButton.click();

    // Banner biến mất, toàn bộ nội dung mở khóa
    await expect(page.getByText('Thịt vịt xát muối gừng khử mùi hôi đặc trưng')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Nguyên liệu/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Bắt đầu nấu món này/ })).toBeVisible();

    // Vào được chế độ nấu
    await page.getByRole('link', { name: /Bắt đầu nấu món này/ }).click();
    await expect(page).toHaveURL(new RegExp(`/cong-thuc/${PAID_RECIPE}/nau`));
    await expect(page.getByText('Thịt vịt xát muối gừng').first()).toBeVisible();
  });
});

