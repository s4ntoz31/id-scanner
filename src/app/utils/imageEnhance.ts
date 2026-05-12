// Document image enhancement using CPU-based processing for reliability

function enhanceImageCPU(dataUrl: string): Promise<string> {
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

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        r = Math.min(255, Math.max(0, (r - 128) * 1.3 + 128));
        g = Math.min(255, Math.max(0, (g - 128) * 1.3 + 128));
        b = Math.min(255, Math.max(0, (b - 128) * 1.3 + 128));

        r = Math.min(255, r + 15);
        g = Math.min(255, g + 15);
        b = Math.min(255, b + 15);

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => reject('Failed to load image');
    img.src = dataUrl;
  });
}

export async function enhanceImageOpenCV(dataUrl: string): Promise<string> {
  return enhanceImageCPU(dataUrl);
}