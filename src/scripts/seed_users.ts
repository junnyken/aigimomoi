import { hashPassword, verifyPassword } from '../lib/auth/password';
import { signToken, verifyToken } from '../lib/auth/session';

// Cung cấp secret test chuyên biệt cho script kiểm thử cục bộ nếu chưa có
process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'angimom_test_auth_secret_for_seed_users_script_32c';

async function testAuth() {
  console.log('=== Testing Password Hashing & Verification ===');
  const password = 'Admin@123456';
  const hash = await hashPassword(password);
  console.log('Generated hash:', hash);

  const isMatch = await verifyPassword(password, hash);
  console.log('Verify correct password:', isMatch ? 'PASS ✓' : 'FAIL ✗');

  const isWrongMatch = await verifyPassword('WrongPassword', hash);
  console.log('Reject wrong password:', !isWrongMatch ? 'PASS ✓' : 'FAIL ✗');

  console.log('\n=== Testing Session Token Signing & Verification ===');
  const user = {
    id: 1,
    email: 'admin@angimom.vn',
    displayName: 'Quản trị viên ĂN GÌ MOM',
    role: 'ADMIN' as const,
  };

  const token = await signToken(user);
  console.log('Signed token:', token);

  const verified = await verifyToken(token);
  console.log('Verified payload:', verified);
  const tokenValid = verified !== null && verified.email === user.email && verified.role === 'ADMIN';
  console.log('Session verification:', tokenValid ? 'PASS ✓' : 'FAIL ✗');

  if (isMatch && !isWrongMatch && tokenValid) {
    console.log('\n>>> ALL AUTH UNIT TESTS PASSED! <<<');
    process.exit(0);
  } else {
    console.error('\n>>> SOME TESTS FAILED <<<');
    process.exit(1);
  }
}

testAuth().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
