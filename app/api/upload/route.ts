import { NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    // Menggunakan fungsi abstraksi sehingga ke depannya mudah dipindah ke Cloud.
    const fileUrl = await uploadFile(file);

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak dikenal';
    return NextResponse.json({ 
      error: 'Gagal mengunggah file', 
      details: errorMessage
    }, { status: 500 });
  }
}
