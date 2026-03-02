import { writeFile, mkdir, stat, unlink } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

/**
 * Abstraksi Storage/Penyimpanan Gambar
 * Fitur:
 * - Kompresi otomatis jika > 2MB
 * - Konversi otomatis HEIC/HEIF (iPhone) ke JPEG
 * - Resize otomatis ke lebar maks 1920px untuk efisiensi
 */
export async function uploadFile(file: File, prefix?: string): Promise<string> {
  // Validasi Dasar: Tipe File
  if (!file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.heic') && !file.name.toLowerCase().endsWith('.heif')) {
    throw new Error('Format file tidak didukung. Harap unggah gambar (JPG, PNG, atau HEIC).');
  }

  // Validasi Dasar: Ukuran (Maks 10MB dari config)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('Ukuran file terlalu besar. Maksimal adalah 10 MB.');
  }

  const bytes = await file.arrayBuffer();
  let buffer = Buffer.from(bytes);

  const originalName = file.name || 'image.jpg';
  let ext = path.extname(originalName).toLowerCase() || '.jpg';
  const isHeic = ext === '.heic' || ext === '.heif';
  
  // Ganti ekstensi jika HEIC ke JPEG agar bisa dibaca browser
  if (isHeic) {
    ext = '.jpg';
  }

  const filenamePrefix = prefix ? `${prefix}-` : '';
  const randomString = Math.random().toString(36).substring(2, 10);
  const uniqueFilename = `${filenamePrefix}${Date.now()}-${randomString}${ext}`;
  
  // Konfigurasi untuk Local System:
  const publicDir = path.join(process.cwd(), 'public', 'uploads');
  
  try {
    await mkdir(publicDir, { recursive: true });
  } catch (err) {
    const error = err as { code?: string; message?: string };
    if (error.code !== 'EEXIST') {
      console.error('Gagal membuat direktori upload:', error);
      throw new Error(`Gagal membuat direktori penyimpanan: ${error.message || 'Unknown error'}`);
    }
  }

  // Logika Kompresi dan Konversi
  const sizeInMb = buffer.length / (1024 * 1024);
  
  if (sizeInMb > 2 || isHeic) {
    try {
      let sharpInstance = sharp(buffer);
      
      // Auto-orient berdasarkan EXIF (penting untuk foto HP agar tidak terbalik)
      sharpInstance = sharpInstance.rotate();

      // Resize jika terlalu lebar (Maks 1920px)
      const metadata = await sharpInstance.metadata();
      if (metadata.width && metadata.width > 1920) {
        sharpInstance = sharpInstance.resize(1920);
      }

      const processedBuffer = await sharpInstance
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();
      buffer = Buffer.from(processedBuffer);
    } catch (err) {
      console.error('Gagal mengompres gambar, menyimpan file asli:', err);
      // Jika gagal kompres (misal format tidak didukung sharp), biarkan buffer asli
    }
  }

  const filepath = path.join(publicDir, uniqueFilename);
  await writeFile(filepath, buffer);

  // Mengembalikan URL lokal yang dapat diakses dari browser
  return `/uploads/${uniqueFilename}`;
}

/**
 * Menghapus file gambar lokal berdasarkan URL publiknya
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  if (!fileUrl || !fileUrl.startsWith('/uploads/')) return;
  
  try {
    const cleanPath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
    const filepath = path.join(process.cwd(), 'public', cleanPath);
    
    // Gunakan stat untuk mengecek keberadaan file 
    try {
      await stat(filepath);
      await unlink(filepath);
    } catch (e: unknown) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw e;
      }
    }
  } catch (err) {
    console.error(`Gagal menghapus file ${fileUrl}:`, err);
  }
}
