// Simple image enhancement for document readability
// Applies contrast, brightness, and sharpening effect

export function enhanceImageSimple(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject('Failed to get canvas context');
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = imageData.width;
      const height = imageData.height;

      // Apply contrast and brightness
      const contrast = 1.5;
      const brightness = 15;

      for (let i = 0; i < data.length; i += 4) {
        // Apply contrast
        data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrast + 128 + brightness));
        data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrast + 128 + brightness));
        data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrast + 128 + brightness));
      }

      // Apply sharpening using unsharp mask
      const tempData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const temp = tempData.data;

      const kernel = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
      ];
      const offset = 1;

      for (let y = offset; y < height - offset; y++) {
        for (let x = offset; x < width - offset; x++) {
          let r = 0, g = 0, b = 0;

          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4;
              const kidx = (ky + 1) * 3 + (kx + 1);
              r += temp[idx] * kernel[kidx];
              g += temp[idx + 1] * kernel[kidx];
              b += temp[idx + 2] * kernel[kidx];
            }
          }

          const idx = (y * width + x) * 4;
          data[idx] = Math.min(255, Math.max(0, r));
          data[idx + 1] = Math.min(255, Math.max(0, g));
          data[idx + 2] = Math.min(255, Math.max(0, b));
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => reject('Failed to load image');
    img.src = dataUrl;
  });
}