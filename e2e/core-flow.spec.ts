// R3 — E2E luồng nấu bếp cốt lõi trên trình duyệt thật, dữ liệu seed thật (Postgres test).
// Mỗi kịch bản ghi rõ lỗi/quyết định nó bảo vệ (B1–B6, D39, D40, D61).
import { test, expect, type Page } from '@playwright/test';

const THIT_KHO = 'thit-ba-chi-kho-tieu';
const CANH_CHUA = 'canh-chua-ca-loc';
const RAU_MUONG = 'rau-muong-xao-toi';
const MEAL_6 = `/meal?main=${THIT_KHO}&soup=${CANH_CHUA}&side=${RAU_MUONG}&servings=6`;

function shoppingRow(page: Page, name: string) {
  return page.getByRole('checkbox').filter({ hasText: name });
}

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'trang không được tràn ngang').toBeLessThanOrEqual(1);
}

async function expectTouchTarget(page: Page, locator: ReturnType<Page['locator']>, label: string) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, `${label} phải hiển thị`).not.toBeNull();
  expect(box!.height, `${label}: chiều cao vùng chạm ≥ 44px`).toBeGreaterThanOrEqual(44);
  expect(box!.width, `${label}: chiều rộng vùng chạm ≥ 44px`).toBeGreaterThanOrEqual(44);
}

test.describe('Luồng nấu bếp cốt lõi (khách, chưa đăng nhập)', () => {
  test('1. Chi tiết món → đổi 6 người → Bắt đầu nấu giữ khẩu phần (B3)', async ({ page }) => {
    await page.goto(`/cong-thuc/${THIT_KHO}`);
    await page.getByRole('button', { name: 'Tăng 1 người' }).click();
    await page.getByRole('button', { name: 'Tăng 1 người' }).click();

    const porkRow = page.locator('li, div').filter({ hasText: /^Thịt ba chỉ heo/ }).first();
    await expect(page.getByText('600 g').first()).toBeVisible();
    await expect(porkRow).toBeVisible();
    await expect.poll(() => new URL(page.url()).searchParams.get('servings')).toBe('6');

    await page.getByRole('link', { name: /Bắt đầu nấu món này/ }).click();
    await expect(page).toHaveURL(new RegExp(`/cong-thuc/${THIT_KHO}/nau\\?servings=6$`));
    await expect(page.getByText('Khẩu phần 6 người')).toBeVisible();
  });

  test('2. Mâm 3 món cho 6 người → Đi chợ: đủ quầy, gộp đúng (B1, B2, B6, D61)', async ({ page }) => {
    await page.goto(MEAL_6);
    await expect(page.getByText(/Thịt ba chỉ kho tiêu/).first()).toBeVisible();
    await expect(page.getByText(/Canh chua cá lóc/).first()).toBeVisible();
    await expect(page.getByText(/Rau muống xào tỏi/).first()).toBeVisible();

    await page.getByRole('link', { name: /Xem danh sách đi chợ cả mâm/ }).click();
    await expect(page).toHaveURL(/\/shopping\?/);
    await expect(page.getByRole('heading', { name: 'Danh sách đi chợ' })).toBeVisible();

    // B1/B2: đủ các quầy, không còn dồn vào "Nguyên liệu khác"
    await expect(page.locator('#heading-meat-seafood')).toBeVisible();
    await expect(page.locator('#heading-produce')).toBeVisible();
    await expect(page.locator('#heading-pantry')).toBeVisible();
    await expect(page.locator('#heading-seasonings')).toBeVisible();
    await expect(page.locator('#heading-other')).toHaveCount(0);

    // Định lượng gộp cho 6 người (gốc 4 → ×1,5)
    await expect(shoppingRow(page, 'Thịt ba chỉ heo')).toContainText('600');
    await expect(shoppingRow(page, 'Cá lóc đồng')).toContainText('600');
    await expect(shoppingRow(page, 'Hành tím')).toContainText('4,5');
    await expect(shoppingRow(page, 'Dứa chín')).toContainText('0,75');

    // D61: tỏi băm thịt kho (3) + tỏi rau muống (6) → (3+6)×1,5 = 13,5 tép, truy vết 2 món
    const garlic = shoppingRow(page, 'Tỏi khô');
    await expect(garlic).toHaveCount(1);
    await expect(garlic).toContainText('13,5');
    await expect(garlic).toContainText('tép');
    // B6: chip truy vết định dạng vi-VN (4,5 chứ không phải 4.5)
    await expect(garlic).toContainText('4,5 tép');
    await expect(garlic).not.toContainText('4.5');

    // D61: nước mắm LINEAR ở thịt kho & canh chua → (2+2)×1,5 = 6 muỗng canh
    await expect(shoppingRow(page, 'Nước mắm truyền thống')).toContainText('6');
    await expect(shoppingRow(page, 'Nước mắm truyền thống')).toContainText('muỗng canh');

    // Gia vị nêm tay (MANUAL_ADJUST) tách riêng
    await expect(shoppingRow(page, 'Hạt tiêu đen')).toBeVisible();
    await expect(shoppingRow(page, 'Dầu hào')).toBeVisible();

    // D40 Guest-first: không bị đẩy sang trang đăng nhập
    expect(page.url()).not.toContain('/login');
  });

  test('3. Sao chép gửi Zalo có mục gia vị & đồ khô (B2)', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Quyền clipboard chỉ cấp được trên Chromium');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(`/shopping?main=${THIT_KHO}&soup=${CANH_CHUA}&side=${RAU_MUONG}&servings=6`);
    await page.getByRole('button', { name: /Sao chép gửi Zalo/ }).click();
    await expect(page.getByText('Đã sao chép!')).toBeVisible();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain('Khẩu phần: 6 người');
    expect(text).toContain('🧄 GIA VỊ & ĐỒ KHÔ CẦN MUA:');
    expect(text).toContain('- Tỏi khô: 13,5 tép');
    expect(text).toContain('- Thịt ba chỉ heo: 600 g');
    expect(text).not.toMatch(/NaN|undefined|Infinity/);
  });

  test('4. Quay lại từ /shopping giữ nguyên mâm (B4)', async ({ page }) => {
    await page.goto(`/shopping?main=${THIT_KHO}&soup=${CANH_CHUA}&side=${RAU_MUONG}&servings=6`);
    await page.getByRole('link', { name: /Đổi món \/ khẩu phần/ }).click();
    await expect(page).toHaveURL(/\/meal\?/);
    const params = new URL(page.url()).searchParams;
    expect(params.get('main')).toBe(THIT_KHO);
    expect(params.get('soup')).toBe(CANH_CHUA);
    expect(params.get('side')).toBe(RAU_MUONG);
    expect(params.get('servings')).toBe('6');
    await expect(page.getByText(/Canh chua cá lóc/).first()).toBeVisible();
  });

  test('5. Chế độ nấu: hết giờ chỉ báo, KHÔNG tự sang bước, chuông kêu 1 lần (D39, B5)', async ({ page }) => {
    // Đếm số lần tạo âm báo (mỗi lần playBeep tạo 1 AudioContext)
    await page.addInitScript(() => {
      const w = window as unknown as { __beeps: number; AudioContext: typeof AudioContext };
      w.__beeps = 0;
      const Original = w.AudioContext;
      w.AudioContext = class extends Original {
        constructor(...args: ConstructorParameters<typeof AudioContext>) {
          super(...args);
          w.__beeps += 1;
        }
      } as typeof AudioContext;
    });
    await page.clock.install();
    await page.goto(`/cong-thuc/${THIT_KHO}/nau?servings=6`);

    // Bước 1 (ướp, hẹn giờ 15 phút) — có tỏi băm theo D61
    await expect(page.getByText(/hành tím và tỏi băm/)).toBeVisible();
    const timer = page.getByTestId('step-timer');
    await expect(timer).toHaveAttribute('data-state', 'idle');
    await page.getByTestId('step-timer-toggle').click();
    await expect(timer).toHaveAttribute('data-state', 'running');

    await page.clock.fastForward('15:05');
    await expect(timer).toHaveAttribute('data-state', 'finished');
    await expect(page.getByText('Hết giờ hẹn!')).toBeVisible();
    // D39: vẫn ở bước 1
    await expect(page.getByText(/hành tím và tỏi băm/)).toBeVisible();
    await expect(page.getByText(/Đun 1 muỗng đường/)).toHaveCount(0);
    // Hết lỗi kêu 2 lần
    await page.clock.fastForward('00:05');
    expect(await page.evaluate(() => (window as unknown as { __beeps: number }).__beeps)).toBe(1);

    // Ngăn kéo nguyên liệu nhanh hiển thị số đã scale cho 6 người
    await page.getByRole('button', { name: 'Xem nguyên liệu' }).click();
    const sheet = page.locator('[aria-labelledby="quick-ingredients-title"], [role="dialog"]').first();
    await expect(sheet).toContainText('Thịt ba chỉ heo');
    await expect(sheet).toContainText('600');
    await expect(sheet).toContainText('4,5');
    await page.getByRole('button', { name: 'Đóng bảng nguyên liệu' }).click();

    // Người nấu tự bấm sang bước → timer bước mới về trạng thái chờ (remount theo key)
    await page.getByRole('button', { name: /Bước tiếp theo/ }).click();
    await expect(page.getByText(/Đun 1 muỗng đường/)).toBeVisible();
    await expect(page.getByTestId('step-timer')).toHaveAttribute('data-state', 'idle');
    await expect(page.getByTestId('step-timer')).toContainText('3 phút');

    // Bước 4 không có hẹn giờ → không render timer, không có ký tự "0" lạc (B5)
    await page.getByRole('button', { name: /Bước tiếp theo/ }).click();
    await page.getByRole('button', { name: /Bước tiếp theo/ }).click();
    await expect(page.getByText(/Rắc hạt tiêu đen xay/)).toBeVisible();
    await expect(page.getByTestId('step-timer')).toHaveCount(0);
  });

  test('6. Mở /meal không tham số khôi phục mâm đã chọn (fix R3)', async ({ page }) => {
    const chosen = `/meal?main=${THIT_KHO}&soup=canh-rau-ngot-thit-bam&side=dau-cove-xao-toi&servings=3`;
    await page.goto(chosen);
    await expect(page.getByText(/rau ngót/i).first()).toBeVisible();

    await page.goto('/meal');
    await expect.poll(() => new URL(page.url()).searchParams.get('soup')).toBe('canh-rau-ngot-thit-bam');
    const params = new URL(page.url()).searchParams;
    expect(params.get('main')).toBe(THIT_KHO);
    expect(params.get('side')).toBe('dau-cove-xao-toi');
    expect(params.get('servings')).toBe('3');
    await expect(page.getByText(/rau ngót/i).first()).toBeVisible();

    // Link chia sẻ có tham số luôn thắng localStorage
    await page.goto(MEAL_6);
    await expect(page.getByText(/Canh chua cá lóc/).first()).toBeVisible();
    expect(new URL(page.url()).searchParams.get('soup')).toBe(CANH_CHUA);
  });
});

test.describe('Mobile: bố cục & vùng chạm', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile'), 'Chỉ chạy trên viewport mobile');
  });

  test('7. Không tràn ngang, nút chính ≥ 44px (WCAG 2.5.8)', async ({ page }) => {
    await page.goto(`/cong-thuc/${THIT_KHO}`);
    await expectNoHorizontalScroll(page);
    await expectTouchTarget(page, page.getByRole('link', { name: /Bắt đầu nấu món này/ }), 'Bắt đầu nấu');
    await expectTouchTarget(page, page.getByRole('button', { name: 'Tăng 1 người' }), 'Tăng 1 người');

    await page.goto(MEAL_6);
    await expectNoHorizontalScroll(page);
    await expectTouchTarget(page, page.getByRole('link', { name: /Xem danh sách đi chợ cả mâm/ }), 'Đi chợ');
    await expectTouchTarget(page, page.getByRole('button', { name: 'Tăng khẩu phần cả mâm' }), 'Tăng khẩu phần cả mâm');

    await page.goto(`/shopping?main=${THIT_KHO}&soup=${CANH_CHUA}&side=${RAU_MUONG}&servings=6`);
    await expectNoHorizontalScroll(page);
    await expectTouchTarget(page, page.getByRole('button', { name: /Sao chép gửi Zalo/ }), 'Sao chép gửi Zalo');
    await expectTouchTarget(page, page.getByRole('link', { name: /Đổi món \/ khẩu phần/ }), 'Đổi món');

    await page.goto(`/cong-thuc/${THIT_KHO}/nau?servings=6`);
    await expectNoHorizontalScroll(page);
    await expectTouchTarget(page, page.getByRole('button', { name: /Bước tiếp theo/ }), 'Bước tiếp theo');
    await expectTouchTarget(page, page.getByRole('button', { name: 'Xem nguyên liệu' }), 'Xem nguyên liệu');
    await expectTouchTarget(page, page.getByTestId('step-timer-toggle'), 'Bắt đầu hẹn giờ');
  });
});
