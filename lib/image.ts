// Solo navegador. Achica la foto antes de subirla: una foto de celular
// de 4 MB queda en ~150 KB, carga rápido con datos móviles.

const MAX_SIZE = 1200;
const QUALITY = 0.82;

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function compressImage(file: File): Promise<{ blob: Blob; ext: 'webp' | 'jpg' }> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo no es una imagen.');
  }

  // imageOrientation respeta la rotación EXIF de las fotos de celular
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_SIZE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la foto.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Algunos Safari no codifican WebP y devuelven PNG: en ese caso usamos JPEG.
  const webp = await canvasToBlob(canvas, 'image/webp', QUALITY);
  if (webp && webp.type === 'image/webp') return { blob: webp, ext: 'webp' };

  const jpeg = await canvasToBlob(canvas, 'image/jpeg', QUALITY);
  if (!jpeg) throw new Error('No se pudo procesar la foto.');
  return { blob: jpeg, ext: 'jpg' };
}
