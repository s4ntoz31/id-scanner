// OpenCV.js image enhancement for document scanning
// Loads OpenCV.js dynamically when needed

interface OpenCV {
  imread(mat: HTMLCanvasElement | HTMLImageElement | string): OpenCVMat;
  imshow(canvas: HTMLCanvasElement, mat: OpenCVMat): void;
  Mat: new () => OpenCVMat;
  matFromArray(rows: number, cols: number, type: number, data: number[]): OpenCVMat;
  cvtColor(src: OpenCVMat, dst: OpenCVMat, code: number, dstCn?: number): void;
  adaptiveThreshold(src: OpenCVMat, dst: OpenCVMat, maxValue: number, adaptiveMethod: number, thresholdType: number, blockSize: number, C: number): void;
  fastNlMeansDenoising(src: OpenCVMat, dst: OpenCVMat, h?: number, hForColorComponents?: number, templateWindowSize?: number, searchWindowSize?: number): void;
  convertTo(src: OpenCVMat, dst: OpenCVMat, rtype: number, alpha?: number, beta?: number): void;
  filter2D(src: OpenCVMat, dst: OpenCVMat, ddepth: number, kernel: OpenCVMat, anchor?: { x: number; y: number }, delta?: number, borderType?: number): void;
  equalizeHist(src: OpenCVMat, dst: OpenCVMat): void;
  COLOR_RGBA2GRAY: number;
  COLOR_GRAY2RGBA: number;
  ADAPTIVE_THRESH_GAUSSIAN_C: number;
  ADAPTIVE_THRESH_MEAN_C: number;
  THRESH_BINARY: number;
  CV_8U: number;
  CV_32F: number;
  CV_8UC4: number;
}

interface OpenCVMat {
  delete(): void;
  rows: number;
  cols: number;
  convertTo(dst: OpenCVMat, rtype: number, alpha?: number, beta?: number): void;
}

let opencvPromise: Promise<OpenCV> | null = null;

async function loadOpenCV(): Promise<OpenCV> {
  if (opencvPromise) return opencvPromise;

  opencvPromise = new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as unknown as { cv?: OpenCV }).cv) {
      resolve((window as unknown as { cv: OpenCV }).cv);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
    script.async = true;
    script.onload = () => {
      const waitForCv = () => {
        if ((window as unknown as { cv?: OpenCV }).cv) {
          resolve((window as unknown as { cv: OpenCV }).cv);
        } else {
          setTimeout(waitForCv, 50);
        }
      };
      waitForCv();
    };
    script.onerror = () => reject(new Error('Failed to load OpenCV.js'));
    document.head.appendChild(script);
  });

  return opencvPromise;
}

export async function enhanceImageOpenCV(dataUrl: string): Promise<string> {
  const cv = await loadOpenCV();

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

      const src = cv.imread(canvas);
      const dst = new cv.Mat();
      const gray = new cv.Mat();

      try {
        // Convert to grayscale
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

        // Apply adaptive threshold for document enhancement
        cv.adaptiveThreshold(
          gray,
          gray,
          255,
          cv.ADAPTIVE_THRESH_GAUSSIAN_C,
          cv.THRESH_BINARY,
          11,
          2
        );

        // Denoise
        cv.fastNlMeansDenoising(gray, gray, 10, 7, 21);

        // Increase contrast
        gray.convertTo(gray, cv.CV_8U, 1.3, 0);

        // Sharpen
        const kernel = cv.matFromArray(3, 3, cv.CV_32F, [
          0, -1, 0,
          -1, 5, -1,
          0, -1, 0
        ]);
        cv.filter2D(gray, gray, cv.CV_8U, kernel);
        kernel.delete();

        // Convert back to RGBA
        cv.cvtColor(gray, dst, cv.COLOR_GRAY2RGBA, 4);

        // Draw result
        cv.imshow(canvas, dst);

        // Cleanup
        src.delete();
        dst.delete();
        gray.delete();

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } catch (err) {
        src.delete();
        dst.delete();
        gray.delete();
        reject(err);
      }
    };
    img.onerror = () => reject('Failed to load image');
    img.src = dataUrl;
  });
}