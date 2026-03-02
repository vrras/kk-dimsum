import { NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage';

/**
 * Generic API Route for image upload.
 * Can be used for Menu products, Profile pictures, etc.
 * 
 * Usage: 
 * - endpoint: POST /api/upload
 * - body: FormData (append 'file' as the file object, optionally append 'prefix' as string)
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const prefix = formData.get('prefix') as string | undefined;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    // Call unified storage logic
    const fileUrl = await uploadFile(file, prefix);

    return NextResponse.json({ 
      success: true, 
      url: fileUrl 
    });
  } catch (error) {
    console.error('Error uploading file via generic API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak dikenal';
    
    // Check for Payload Too Large
    if (errorMessage.toLowerCase().includes('too large') || errorMessage.includes('413')) {
      return NextResponse.json({ 
        error: 'File terlalu besar! Maksimal 10MB.',
        details: errorMessage
      }, { status: 413 });
    }

    return NextResponse.json({ 
      error: 'Gagal mengunggah file', 
      details: errorMessage
    }, { status: 500 });
  }
}
