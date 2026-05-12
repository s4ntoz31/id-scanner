// Type declarations for OpenCV.js global
export {};

declare global {
  interface Window {
    cv: typeof cv;
  }
}

declare const cv: {
  imread(mat: HTMLCanvasElement | HTMLImageElement | string): cv.Mat;
  imshow(canvas: HTMLCanvasElement, mat: cv.Mat): void;
  Mat: new () => cv.Mat;
  matFromArray(rows: number, cols: number, type: number, data: number[]): cv.Mat;
  cvtColor(src: cv.Mat, dst: cv.Mat, code: number, dstCn?: number): void;
  adaptiveThreshold(src: cv.Mat, dst: cv.Mat, maxValue: number, adaptiveMethod: number, thresholdType: number, blockSize: number, C: number): void;
  fastNlMeansDenoising(src: cv.Mat, dst: cv.Mat, h?: number, hForColorComponents?: number, templateWindowSize?: number, searchWindowSize?: number): void;
  convertTo(src: cv.Mat, dst: cv.Mat, rtype: number, alpha?: number, beta?: number): void;
  filter2D(src: cv.Mat, dst: cv.Mat, ddepth: number, kernel: cv.Mat, anchor?: cv.Point, delta?: number, borderType?: number): void;
  equalizeHist(src: cv.Mat, dst: cv.Mat): void;
  Point: new (x: number, y: number) => cv.Point;
  Size: new (width: number, height: number) => cv.Size;
  COLOR_RGBA2GRAY: number;
  COLOR_GRAY2RGBA: number;
  ADAPTIVE_THRESH_GAUSSIAN_C: number;
  ADAPTIVE_THRESH_MEAN_C: number;
  THRESH_BINARY: number;
  THRESH_BINARY_INV: number;
  CV_8U: number;
  CV_32F: number;
  CV_8UC4: number;
};

export interface cv {
  imread(mat: HTMLCanvasElement | HTMLImageElement | string): cv.Mat;
  imshow(canvas: HTMLCanvasElement, mat: cv.Mat): void;
  Mat: new () => cv.Mat;
  matFromArray(rows: number, cols: number, type: number, data: number[]): cv.Mat;
  cvtColor(src: cv.Mat, dst: cv.Mat, code: number, dstCn?: number): void;
  adaptiveThreshold(src: cv.Mat, dst: cv.Mat, maxValue: number, adaptiveMethod: number, thresholdType: number, blockSize: number, C: number): void;
  fastNlMeansDenoising(src: cv.Mat, dst: cv.Mat, h?: number, hForColorComponents?: number, templateWindowSize?: number, searchWindowSize?: number): void;
  convertTo(src: cv.Mat, dst: cv.Mat, rtype: number, alpha?: number, beta?: number): void;
  filter2D(src: cv.Mat, dst: cv.Mat, ddepth: number, kernel: cv.Mat, anchor?: cv.Point, delta?: number, borderType?: number): void;
  equalizeHist(src: cv.Mat, dst: cv.Mat): void;
  Point: new (x: number, y: number) => cv.Point;
  Size: new (width: number, height: number) => cv.Size;
  COLOR_RGBA2GRAY: number;
  COLOR_GRAY2RGBA: number;
  ADAPTIVE_THRESH_GAUSSIAN_C: number;
  ADAPTIVE_THRESH_MEAN_C: number;
  THRESH_BINARY: number;
  THRESH_BINARY_INV: number;
  CV_8U: number;
  CV_32F: number;
  CV_8UC4: number;
}

export interface Mat {
  delete(): void;
  rows: number;
  cols: number;
  type(): number;
  data: Uint8Array;
  size(): { width: number; height: number };
}

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}