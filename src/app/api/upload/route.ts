import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { saveUploadedFile, deleteUploadedFile } from '@/lib/storage';

// POST /api/upload
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
      return NextResponse.json(
        { error: 'Yêu cầu quyền Biên tập viên (EDITOR) hoặc Quản trị viên (ADMIN) để tải tệp lên.' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const subfolder = (formData.get('subfolder') as string) || 'recipes';

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Không tìm thấy tệp tải lên hợp lệ trong yêu cầu.' },
        { status: 400 }
      );
    }

    const result = await saveUploadedFile(file, subfolder);

    return NextResponse.json(
      {
        success: true,
        url: result.url,
        filename: result.filename,
        size: result.size,
        mimeType: result.mimeType,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Lỗi khi tải tệp lên:', error);
    return NextResponse.json(
      { error: error.message || 'Không thể xử lý tệp tải lên.' },
      { status: 400 }
    );
  }
}

// DELETE /api/upload
export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
      return NextResponse.json(
        { error: 'Yêu cầu quyền Biên tập viên (EDITOR) hoặc Quản trị viên (ADMIN).' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Đường dẫn tệp không hợp lệ.' }, { status: 400 });
    }

    const deleted = await deleteUploadedFile(url);

    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    console.error('Lỗi khi xóa tệp:', error);
    return NextResponse.json({ error: 'Không thể xóa tệp.' }, { status: 500 });
  }
}
