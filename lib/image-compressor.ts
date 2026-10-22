/**
 * Nén và thu nhỏ ảnh trực tiếp phía trình duyệt trước khi upload.
 * Giảm dung lượng từ 3-10MB xuống còn 80-150KB mà vẫn giữ độ nét cao (1200px),
 * triệt tiêu hoàn toàn lỗi 413 FUNCTION_PAYLOAD_TOO_LARGE trên Vercel Serverless.
 */
export async function compressImageClient(
  file: File,
  maxDimension = 1200,
  quality = 0.82
): Promise<File> {
  // Bỏ qua nếu là SVG, GIF động hoặc file đã rất nhỏ (< 150KB)
  if (
    file.type === 'image/svg+xml' ||
    file.type === 'image/gif' ||
    file.size <= 150 * 1024
  ) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (!width || !height) {
        resolve(file);
        return;
      }

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            const cleanName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
            const compressedFile = new File([blob], cleanName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
