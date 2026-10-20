import { saveUploadedFile, deleteUploadedFile, MAX_FILE_SIZE } from '../lib/storage';
import fs from 'fs';
import path from 'path';

async function runUploadTests() {
  console.log('--- BẮT ĐẦU KIỂM THỬ AG-14: MEDIA PIPELINE & IMAGE STORAGE ---');

  // Test 1: Upload ảnh hợp lệ
  console.log('\n--- Kiểm tra 1: Lưu trữ ảnh hợp lệ (WebP / JPEG / PNG) ---');
  const dummyImageBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG signature
  const validFile = new File([dummyImageBytes], 'thit_kho.png', { type: 'image/png' });

  const result = await saveUploadedFile(validFile, 'recipes');
  console.log(`✓ Đã lưu file: ${result.filename} (${result.size} bytes)`);
  console.log(`✓ Đường dẫn URL công khai: ${result.url}`);

  const physicalPath = path.join(process.cwd(), 'public', result.url);
  if (!fs.existsSync(physicalPath)) {
    throw new Error(`File không tồn tại trên đĩa cứng tại: ${physicalPath}`);
  }
  console.log('✓ Xác minh file vật lý tồn tại trên đĩa');

  // Test 2: Xóa file ảnh an toàn
  console.log('\n--- Kiểm tra 2: Xóa file ảnh an toàn ---');
  const deleted = await deleteUploadedFile(result.url);
  if (!deleted || fs.existsSync(physicalPath)) {
    throw new Error('Lỗi khi xóa file ảnh');
  }
  console.log('✓ Xóa file ảnh thành công và dọn dẹp sạch sẽ');

  // Test 3: Chặn file dung lượng vượt quá 5MB
  console.log('\n--- Kiểm tra 3: Chặn tệp vượt quá dung lượng tối đa 5MB ---');
  const oversizedFile = {
    size: MAX_FILE_SIZE + 1024,
    type: 'image/jpeg',
  } as unknown as File;

  let sizeErrorCaught = false;
  try {
    await saveUploadedFile(oversizedFile, 'recipes');
  } catch (err: any) {
    sizeErrorCaught = true;
    console.log(`✓ Bắt lỗi dung lượng thành công: "${err.message}"`);
  }
  if (!sizeErrorCaught) {
    throw new Error('Hệ thống không chặn file vượt quá 5MB');
  }

  // Test 4: Chặn tệp sai định dạng MIME (ví dụ .exe, .sh, .html)
  console.log('\n--- Kiểm tra 4: Chặn tệp độc hại / không đúng định dạng MIME ---');
  const maliciousFile = new File(['<script>alert(1)</script>'], 'hack.html', {
    type: 'text/html',
  });

  let mimeErrorCaught = false;
  try {
    await saveUploadedFile(maliciousFile, 'recipes');
  } catch (err: any) {
    mimeErrorCaught = true;
    console.log(`✓ Bắt lỗi định dạng thành công: "${err.message}"`);
  }
  if (!mimeErrorCaught) {
    throw new Error('Hệ thống không chặn định dạng MIME không được phép');
  }

  // Test 5: Phòng chống Directory Traversal
  console.log('\n--- Kiểm tra 5: Chống tấn công Directory Traversal trên subfolder ---');
  const validFile2 = new File([dummyImageBytes], 'test_traversal.jpg', { type: 'image/jpeg' });
  const traversalResult = await saveUploadedFile(validFile2, '../../etc');
  console.log(`✓ Subfolder đã được làm sạch an toàn: ${traversalResult.url}`);
  if (traversalResult.url.includes('..')) {
    throw new Error('Phát hiện Directory Traversal không được lọc');
  }

  // Dọn dẹp test 5
  await deleteUploadedFile(traversalResult.url);

  console.log('\n=============================================');
  console.log('100% KIỂM THỬ AG-14 MEDIA PIPELINE THÀNH CÔNG!');
  console.log('=============================================');
  process.exit(0);
}

runUploadTests().catch((err) => {
  console.error('LỖI KIỂM THỬ AG-14:', err);
  process.exit(1);
});
