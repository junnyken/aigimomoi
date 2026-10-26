/**
 * Test Suite: Cổng Quản trị & Quản lý tài khoản
 * - /api/auth/admin-login không còn mật khẩu master / tự tạo / tự nâng quyền tài khoản "chủ sở hữu"
 * - EDITOR không được đổi mật khẩu / email / vai trò, không đụng tài khoản quản trị khác
 * - ADMIN không tự hạ quyền / tự xóa chính mình; EDITOR không chạm được vào ADMIN
 * - Đổi vai trò / mật khẩu / xóa tài khoản → mọi phiên cũ mất hiệu lực ngay
 * Chỉ chạy trên DB có tên kết thúc bằng "_test".
 */

import { NextRequest } from 'next/server';
import { eq, inArray, like } from 'drizzle-orm';
import { POST as adminLoginHandler } from '../app/api/auth/admin-login/route';
import { GET as listUsersHandler, POST as createUserHandler } from '../app/api/editor/users/route';
import { PATCH as patchUserHandler, DELETE as deleteUserHandler } from '../app/api/editor/users/[id]/route';
import { SESSION_COOKIE_NAME, getSessionUser, signToken } from '../lib/auth/session';
import { hashPassword } from '../lib/auth/password';
import { db, closeDb } from '../lib/db';
import { users, rateLimitBuckets } from '../lib/db/schema';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${msg}`);
  }
}

const RUN_ID = Date.now();
const ORIGIN = 'http://localhost:3000';
let ipCounter = 1;

type Role = 'ADMIN' | 'EDITOR' | 'COOK';
type TestUser = { id: number; email: string; displayName: string; role: Role; sessionVersion: number };

const createdIds: number[] = [];

async function createUser(tag: string, role: Role, email?: string): Promise<TestUser> {
  const [u] = await db
    .insert(users)
    .values({
      email: email ?? `adm_${tag.toLowerCase()}_${RUN_ID}@example.com`,
      displayName: `Test ${tag}`,
      role,
      passwordHash: await hashPassword('CorrectHorse123'),
    })
    .returning();
  createdIds.push(u.id);
  return u as TestUser;
}

async function tokenFor(u: TestUser): Promise<string> {
  const [fresh] = await db.select().from(users).where(eq(users.id, u.id)).limit(1);
  return signToken({ id: fresh.id, email: fresh.email, displayName: fresh.displayName, role: fresh.role, sv: fresh.sessionVersion });
}

function jsonRequest(url: string, method: string, token: string | null, body?: unknown): NextRequest {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    host: 'localhost:3000',
    origin: ORIGIN,
    'x-forwarded-for': `10.88.${RUN_ID % 200}.${ipCounter++ % 250}`,
  };
  if (token) headers.cookie = `${SESSION_COOKIE_NAME}=${token}`;
  return new NextRequest(`${ORIGIN}${url}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}

const ctx = (id: number) => ({ params: Promise.resolve({ id: String(id) }) });

async function runTests() {
  const dbName = new URL(process.env.DATABASE_URL || 'postgres://x/none').pathname.replace(/^\//, '');
  if (!dbName.endsWith('_test')) {
    console.error(`Từ chối chạy: DATABASE_URL phải trỏ tới DB kết thúc bằng "_test" (hiện tại: "${dbName}")`);
    failed++;
    return;
  }
  process.env.AUTH_SECRET = 'angimom_admin_security_test_secret_32_chars_long';

  console.log('================================================================');
  console.log('  KIỂM THỬ CỔNG QUẢN TRỊ & QUẢN LÝ TÀI KHOẢN');
  console.log('================================================================');

  console.log('\n--- 1. Cổng /admin-login không còn cửa hậu ---');
  {
    await db.delete(users).where(eq(users.email, 'admin@angimom.vn'));
    const res = await adminLoginHandler(
      jsonRequest('/api/auth/admin-login', 'POST', null, { email: 'admin@angimom.vn', password: 'Admin@123456' })
    );
    const [autoCreated] = await db.select().from(users).where(eq(users.email, 'admin@angimom.vn')).limit(1);
    assert(res.status === 401, 'admin@angimom.vn + Admin@123456 (chưa có tài khoản) → 401');
    assert(!autoCreated, 'Không tự tạo tài khoản ADMIN từ mật khẩu master');
    if (autoCreated) createdIds.push(autoCreated.id);
  }
  {
    // Tài khoản COOK mang email "chủ sở hữu" cũ (đăng ký thường) không được nâng quyền bằng mật khẩu master
    await db.delete(users).where(eq(users.email, 'thientrieu753@gmail.com'));
    const owner = await createUser('owner', 'COOK', 'thientrieu753@gmail.com');
    const res = await adminLoginHandler(
      jsonRequest('/api/auth/admin-login', 'POST', null, { email: owner.email, password: 'Admin@123456' })
    );
    const [after] = await db.select().from(users).where(eq(users.id, owner.id)).limit(1);
    assert(res.status === 401, 'Email chủ sở hữu + mật khẩu master → 401');
    assert(after.role === 'COOK', 'Không tự nâng tài khoản lên ADMIN');

    const resCook = await adminLoginHandler(
      jsonRequest('/api/auth/admin-login', 'POST', null, { email: owner.email, password: 'CorrectHorse123' })
    );
    assert(resCook.status === 403, 'COOK đúng mật khẩu vẫn bị chặn ở cổng quản trị (403)');
  }

  const adminA = await createUser('adminA', 'ADMIN');
  const adminB = await createUser('adminB', 'ADMIN');
  const editor = await createUser('editor', 'EDITOR');
  const editor2 = await createUser('editor2', 'EDITOR');
  const cook = await createUser('cook', 'COOK');

  {
    const res = await adminLoginHandler(
      jsonRequest('/api/auth/admin-login', 'POST', null, { email: adminA.email, password: 'CorrectHorse123' })
    );
    if (res.status !== 200) console.error('    ↳', res.status, await res.clone().text());
    assert(res.status === 200, 'ADMIN đúng mật khẩu đăng nhập được (200)');
  }

  console.log('\n--- 2. Quyền của EDITOR ---');
  const editorToken = await tokenFor(editor);
  {
    const res = await patchUserHandler(jsonRequest(`/api/editor/users/${cook.id}`, 'PATCH', editorToken, { newPassword: 'Hijacked12345' }), ctx(cook.id));
    assert(res.status === 403, 'EDITOR không được đặt lại mật khẩu người khác (403)');
  }
  {
    const res = await patchUserHandler(jsonRequest(`/api/editor/users/${cook.id}`, 'PATCH', editorToken, { email: `evil_${RUN_ID}@example.com` }), ctx(cook.id));
    assert(res.status === 403, 'EDITOR không được đổi email đăng nhập người khác (403)');
  }
  {
    const res = await patchUserHandler(jsonRequest(`/api/editor/users/${cook.id}`, 'PATCH', editorToken, { role: 'EDITOR' }), ctx(cook.id));
    assert(res.status === 403, 'EDITOR không được nâng quyền COOK → EDITOR (403)');
  }
  {
    const res = await patchUserHandler(jsonRequest(`/api/editor/users/${editor2.id}`, 'PATCH', editorToken, { displayName: 'Đổi Tên' }), ctx(editor2.id));
    assert(res.status === 403, 'EDITOR không được sửa tài khoản EDITOR khác (403)');
  }
  {
    // Giao diện gửi kèm email/role hiện tại khi chỉ sửa tên → vẫn hợp lệ
    const res = await patchUserHandler(
      jsonRequest(`/api/editor/users/${cook.id}`, 'PATCH', editorToken, { displayName: 'Mẹ Bếp Mới', email: cook.email, role: 'COOK' }),
      ctx(cook.id)
    );
    assert(res.status === 200, 'EDITOR vẫn sửa được tên hiển thị của COOK (200)');
  }
  {
    const res = await createUserHandler(
      jsonRequest('/api/editor/users', 'POST', editorToken, { displayName: 'BTV Mới', email: `newed_${RUN_ID}@example.com`, password: 'password123', role: 'EDITOR' })
    );
    assert(res.status === 403, 'EDITOR không được tạo tài khoản EDITOR (403)');
  }
  {
    const res = await createUserHandler(
      jsonRequest('/api/editor/users', 'POST', editorToken, { displayName: 'Thành Viên', email: `newcook_${RUN_ID}@example.com`, password: 'password123', role: 'COOK' })
    );
    const data = await res.json();
    if (data.user?.id) createdIds.push(data.user.id);
    assert(res.status === 201, 'EDITOR tạo được tài khoản COOK (201)');
  }

  console.log('\n--- 3. Quyền của ADMIN & kiểm tra dữ liệu ---');
  const adminAToken = await tokenFor(adminA);
  {
    const res = await patchUserHandler(jsonRequest(`/api/editor/users/${cook.id}`, 'PATCH', adminAToken, { email: 'khong-phai-email' }), ctx(cook.id));
    assert(res.status === 400, 'Email sai định dạng → 400');
  }
  {
    const res = await patchUserHandler(jsonRequest(`/api/editor/users/${cook.id}`, 'PATCH', adminAToken, { email: editor.email }), ctx(cook.id));
    assert(res.status === 409, 'Email trùng tài khoản khác → 409');
  }
  {
    const res = await patchUserHandler(jsonRequest(`/api/editor/users/${adminA.id}`, 'PATCH', adminAToken, { role: 'COOK' }), ctx(adminA.id));
    assert(res.status === 400, 'ADMIN không tự hạ quyền chính mình (400)');
  }

  console.log('\n--- 4. Thu hồi phiên ngay khi đổi vai trò / mật khẩu / xóa ---');
  {
    const editor2Token = await tokenFor(editor2);
    assert((await getSessionUser(editor2Token))?.role === 'EDITOR', 'Phiên EDITOR hợp lệ trước khi hạ quyền');
    const res = await patchUserHandler(jsonRequest(`/api/editor/users/${editor2.id}`, 'PATCH', adminAToken, { role: 'COOK' }), ctx(editor2.id));
    assert(res.status === 200, 'ADMIN hạ quyền EDITOR → COOK (200)');
    assert((await getSessionUser(editor2Token)) === null, 'Phiên cũ của người bị hạ quyền mất hiệu lực ngay');
    const listRes = await listUsersHandler(jsonRequest('/api/editor/users', 'GET', editor2Token));
    assert(listRes.status === 401, 'Người bị hạ quyền không còn gọi được API quản trị bằng cookie cũ');
  }
  {
    const cookToken = await tokenFor(cook);
    const res = await patchUserHandler(jsonRequest(`/api/editor/users/${cook.id}`, 'PATCH', adminAToken, { newPassword: 'AdminReset123' }), ctx(cook.id));
    assert(res.status === 200, 'ADMIN đặt lại mật khẩu cho COOK (200)');
    assert((await getSessionUser(cookToken)) === null, 'Đặt lại mật khẩu → phiên cũ mất hiệu lực');
  }
  {
    const editorStillToken = await tokenFor(editor);
    const res = await deleteUserHandler(jsonRequest(`/api/editor/users/${editor.id}`, 'DELETE', adminAToken), ctx(editor.id));
    assert(res.status === 200, 'ADMIN xóa tài khoản (200)');
    assert((await getSessionUser(editorStillToken)) === null, 'Tài khoản đã xóa → cookie cũ vô hiệu');
  }

  console.log('\n--- 5. Bảo vệ tài khoản ADMIN ---');
  {
    const res = await patchUserHandler(jsonRequest(`/api/editor/users/${adminB.id}`, 'PATCH', adminAToken, { role: 'EDITOR' }), ctx(adminB.id));
    assert(res.status === 200, 'Còn ADMIN khác → hạ quyền ADMIN B được (200)');
    const bToken = await tokenFor(adminB);
    const delA = await deleteUserHandler(jsonRequest(`/api/editor/users/${adminA.id}`, 'DELETE', bToken), ctx(adminA.id));
    assert(delA.status === 403, 'Người vừa bị hạ khỏi ADMIN không xóa được ADMIN (403)');
  }
  {
    const selfDelete = await deleteUserHandler(jsonRequest(`/api/editor/users/${adminA.id}`, 'DELETE', adminAToken), ctx(adminA.id));
    assert(selfDelete.status === 400, 'ADMIN không tự xóa chính mình (400)');
    const probe = await createUser('probe', 'EDITOR');
    const probeRes = await patchUserHandler(jsonRequest(`/api/editor/users/${adminA.id}`, 'PATCH', await tokenFor(probe), { displayName: 'Đổi Tên Admin' }), ctx(adminA.id));
    assert(probeRes.status === 403, 'EDITOR không chạm được vào tài khoản ADMIN (403)');
  }

  console.log('\n================================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ QUẢN TRỊ: ${passed} PASS / ${failed} FAIL`);
  console.log('================================================================');
}

runTests()
  .catch((err) => {
    failed++;
    console.error('❌ Lỗi kiểm thử:', err);
  })
  .finally(async () => {
    await db.delete(users).where(like(users.email, `%_${RUN_ID}@example.com`)).catch(() => {});
    if (createdIds.length > 0) await db.delete(users).where(inArray(users.id, createdIds)).catch(() => {});
    await db.delete(rateLimitBuckets).where(like(rateLimitBuckets.key, `%${RUN_ID}%`)).catch(() => {});
    await closeDb();
    process.exit(failed > 0 ? 1 : 0);
  });
