import type { Point } from '../types';

function computeHomography(
  srcPoints: [Point, Point, Point, Point],
  dstPoints: [Point, Point, Point, Point]
): number[][] | null {
  const A: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const sx = srcPoints[i].x;
    const sy = srcPoints[i].y;
    const dx = dstPoints[i].x;
    const dy = dstPoints[i].y;

    A.push([sx, sy, 1, 0, 0, 0, -sx * dx, -sy * dx]);
    b.push(dx);
    A.push([0, 0, 0, sx, sy, 1, -sx * dy, -sy * dy]);
    b.push(dy);
  }

  const x = solveLinearSystem(A, b);
  if (!x) return null;

  return [
    [x[0], x[1], x[2]],
    [x[3], x[4], x[5]],
    [x[6], x[7], 1],
  ];
}

function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = A.length;
  const augmented = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[maxRow][col])) {
        maxRow = row;
      }
    }
    [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]];

    if (Math.abs(augmented[col][col]) < 1e-10) continue;

    for (let row = col + 1; row < n; row++) {
      const factor = augmented[row][col] / augmented[col][col];
      for (let j = col; j <= n; j++) {
        augmented[row][j] -= factor * augmented[col][j];
      }
    }
  }

  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    if (Math.abs(augmented[i][i]) < 1e-10) continue;
    x[i] = augmented[i][n];
    for (let j = i + 1; j < n; j++) {
      x[i] -= augmented[i][j] * x[j];
    }
    x[i] /= augmented[i][i];
  }

  return x;
}

function bilinearInterpolate(
  imageData: ImageData,
  x: number,
  y: number
): { r: number; g: number; b: number; a: number } {
  const { width, height, data } = imageData;
  
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, height - 1);
  
  const dx = x - x0;
  const dy = y - y0;
  
  const getPixel = (px: number, py: number) => {
    const idx = (py * width + px) * 4;
    return {
      r: data[idx],
      g: data[idx + 1],
      b: data[idx + 2],
      a: data[idx + 3],
    };
  };
  
  const p00 = getPixel(x0, y0);
  const p10 = getPixel(x1, y0);
  const p01 = getPixel(x0, y1);
  const p11 = getPixel(x1, y1);
  
  return {
    r: p00.r * (1 - dx) * (1 - dy) + p10.r * dx * (1 - dy) + p01.r * (1 - dx) * dy + p11.r * dx * dy,
    g: p00.g * (1 - dx) * (1 - dy) + p10.g * dx * (1 - dy) + p01.g * (1 - dx) * dy + p11.g * dx * dy,
    b: p00.b * (1 - dx) * (1 - dy) + p10.b * dx * (1 - dy) + p01.b * (1 - dx) * dy + p11.b * dx * dy,
    a: p00.a * (1 - dx) * (1 - dy) + p10.a * dx * (1 - dy) + p01.a * (1 - dx) * dy + p11.a * dx * dy,
  };
}

function applyHomographyInverse(point: Point, H: number[][]): Point {
  const w = H[2][0] * point.x + H[2][1] * point.y + H[2][2];
  return {
    x: (H[0][0] * point.x + H[0][1] * point.y + H[0][2]) / w,
    y: (H[1][0] * point.x + H[1][1] * point.y + H[1][2]) / w,
  };
}

interface TransformMessage {
  type: 'transform';
  imageData: ImageData;
  corners: [Point, Point, Point, Point];
  outputWidth: number;
  outputHeight: number;
}

interface ResultMessage {
  type: 'result';
  imageData: ImageData;
}

interface ErrorMessage {
  type: 'error';
  message: string;
}

type WorkerMessage = TransformMessage;
type WorkerResponse = ResultMessage | ErrorMessage;

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, imageData, corners, outputWidth, outputHeight } = e.data;
  
  if (type !== 'transform') {
    self.postMessage({ type: 'error', message: 'Unknown message type' } as WorkerResponse);
    return;
  }

  try {
    const dstPoints: [Point, Point, Point, Point] = [
      { x: 0, y: 0 },
      { x: outputWidth, y: 0 },
      { x: outputWidth, y: outputHeight },
      { x: 0, y: outputHeight },
    ];

    const H = computeHomography(dstPoints, corners);
    if (!H) {
      self.postMessage({ type: 'error', message: 'Failed to compute homography' } as WorkerResponse);
      return;
    }

    const outputData = new Uint8ClampedArray(outputWidth * outputHeight * 4);

    for (let y = 0; y < outputHeight; y++) {
      for (let x = 0; x < outputWidth; x++) {
        const srcPoint = { x, y };
        const dstPoint = applyHomographyInverse(srcPoint, H);
        
        if (
          dstPoint.x >= 0 && dstPoint.x < imageData.width - 1 &&
          dstPoint.y >= 0 && dstPoint.y < imageData.height - 1
        ) {
          const pixel = bilinearInterpolate(imageData, dstPoint.x, dstPoint.y);
          const idx = (y * outputWidth + x) * 4;
          outputData[idx] = pixel.r;
          outputData[idx + 1] = pixel.g;
          outputData[idx + 2] = pixel.b;
          outputData[idx + 3] = pixel.a;
        } else {
          const idx = (y * outputWidth + x) * 4;
          outputData[idx] = 255;
          outputData[idx + 1] = 255;
          outputData[idx + 2] = 255;
          outputData[idx + 3] = 255;
        }
      }
    }

    const resultImageData = new ImageData(outputData, outputWidth, outputHeight);
    self.postMessage({ type: 'result', imageData: resultImageData } as WorkerResponse);
  } catch (err) {
    self.postMessage({ 
      type: 'error', 
      message: err instanceof Error ? err.message : 'Unknown error' 
    } as WorkerResponse);
  }
};

export {};