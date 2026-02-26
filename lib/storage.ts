import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Abstraksi Storage/Penyimpanan Gambar
// Ubah fungsi ini ke AWS S3, Cloudinary, atau layanan cloud lainnya jika diperlukan
export async function uploadFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const originalName = file.name || 'image.jpg';
  const ext = path.extname(originalName) || '';
  const randomString = Math.random().toString(36).substring(2, 10);
  const uniqueFilename = `${Date.now()}-${randomString}${ext}`;
  
  // Konfigurasi untuk Local System:
  const publicDir = path.join(process.cwd(), 'public', 'uploads');
  
  try {
    await mkdir(publicDir, { recursive: true });
  } catch {
    // Abaikan jika direktori sudah ada
  }

  const filepath = path.join(publicDir, uniqueFilename);
  await writeFile(filepath, buffer);

  // Mengembalikan URL lokal yang dapat diakses dari browser
  return `/uploads/${uniqueFilename}`;
}
