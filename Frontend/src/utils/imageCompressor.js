/**
 * Fast client-side image compression utility using HTML5 Canvas.
 * Compresses multi-megabyte camera photos down to ~150KB in milliseconds.
 */
export const compressImage = async (file, maxWidth = 1600, maxHeight = 1600, quality = 0.8) => {
  if (!file || !file.type.startsWith('image/')) {
    return file; // Skip non-images (PDF, videos, etc.)
  }

  // If file is already small (< 250 KB), skip compression
  if (file.size < 250 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Determine target mime type (prefer webp, fallback to jpeg)
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              resolve(file); // Keep original if compression didn't reduce size
            } else {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + (mimeType === 'image/jpeg' ? '.jpg' : '.png'), {
                type: mimeType,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            }
          },
          mimeType,
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};
