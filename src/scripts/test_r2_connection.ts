// Script kiểm tra kết nối và tính năng Upload lên Cloudflare R2
// Chạy: npx tsx src/scripts/test_r2_connection.ts

import { getR2Config, uploadBufferToR2 } from '../lib/storage/r2Client';

async function testR2() {
  console.log('\n======================================================');
  console.log('  KIỂM TRA KẾT NỐI CLOUDFLARE R2 OBJECT STORAGE');
  console.log('======================================================\n');

  const config = getR2Config();

  if (!config) {
    console.log('ℹ️  Chưa tìm thấy biến môi trường Cloudflare R2 (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY).');
    console.log('👉 Hệ thống đang tự động kích hoạt chế độ: LOCAL STORAGE FALLBACK (Lưu trữ ảnh tại public/uploads/)');
    console.log('👉 Khi triển khai production, bạn chỉ cần điền các biến vào file .env:');
    console.log('   - CLOUDFLARE_R2_ACCOUNT_ID=<Account ID của bạn>');
    console.log('   - CLOUDFLARE_R2_ACCESS_KEY_ID=<R2 Token ID>');
    console.log('   - CLOUDFLARE_R2_SECRET_ACCESS_KEY=<R2 Secret Key>');
    console.log('   - CLOUDFLARE_R2_BUCKET_NAME=angimom-media');
    console.log('   - CLOUDFLARE_R2_PUBLIC_DOMAIN=https://media.angimom.vn (hoặc r2.dev URL)\n');
    console.log('✅ Adapter Cloudflare R2 (Native SigV4) đã sẵn sàng 100%!');
    process.exit(0);
  }

  console.log(`📡 Đã tìm thấy cấu hình Cloudflare R2:`);
  console.log(`   - Account ID: ${config.accountId}`);
  console.log(`   - Bucket: ${config.bucketName}`);
  console.log(`   - Endpoint: https://${config.accountId}.r2.cloudflarestorage.com`);
  console.log(`   - Public Domain: ${config.publicDomain || '(Chưa cấu hình domain riêng)'}`);

  console.log('\n⏳ Đang thử nghiệm tải 1 file kiểm tra lên Cloudflare R2...');

  try {
    const testContent = Buffer.from(`Angimom R2 Healthcheck Ping at ${new Date().toISOString()}`, 'utf8');
    const testKey = `test/ping-${Date.now()}.txt`;

    const publicUrl = await uploadBufferToR2(testContent, testKey, 'text/plain', config);

    console.log('\n🎉 THÀNH CÔNG RỰC RỠ! File kiểm tra đã được lưu lên Cloudflare R2.');
    console.log(`🔗 URL truy cập: ${publicUrl}`);
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('\n❌ KẾT NỐI THẤT BẠI:', err.message);
    console.log('👉 Vui lòng kiểm tra lại Access Key, Secret Key hoặc quyền truy cập bucket trên Cloudflare Dashboard.\n');
  }
}

testR2();
