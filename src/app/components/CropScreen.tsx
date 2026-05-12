import { useRef, useEffect, useState } from 'react';
import type { Point, CropData, CornerId } from '../types';
import styles from './CropScreen.module.css';

interface CropScreenProps {
  data: CropData;
  onCornersChange: (corners: [Point, Point, Point, Point]) => void;
  onApply: () => void;
  isProcessing: boolean;
}

const CORNER_IDS: CornerId[] = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];

function drawOnCanvas(
  canvas: HTMLCanvasElement | null,
  img: HTMLImageElement | null,
  corners: [Point, Point, Point, Point],
  imgWidth: number,
  imgHeight: number,
  activeCorner: CornerId | null
) {
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx || !img) return;

  const container = canvas.parentElement;
  if (!container) return;

  const maxWidth = container.clientWidth - 40;
  const maxHeight = container.clientHeight - 40;
  const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight, 1);

  const displayWidth = imgWidth * scale;
  const displayHeight = imgHeight * scale;

  canvas.width = displayWidth;
  canvas.height = displayHeight;

  ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

  const scaledCorners = corners.map(c => ({
    x: c.x * scale,
    y: c.y * scale,
  }));

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.rect(0, 0, displayWidth, displayHeight);
  ctx.moveTo(scaledCorners[0].x, scaledCorners[0].y);
  scaledCorners.forEach(c => ctx.lineTo(c.x, c.y));
  ctx.closePath();
  ctx.fill('evenodd');
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);
  ctx.shadowColor = 'rgba(255, 179, 71, 0.8)';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(scaledCorners[0].x, scaledCorners[0].y);
  scaledCorners.forEach(c => ctx.lineTo(c.x, c.y));
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  scaledCorners.forEach((corner, i) => {
    const isActive = activeCorner === CORNER_IDS[i];
    const radius = isActive ? 16 : 14;

    ctx.save();
    ctx.shadowColor = 'rgba(255, 179, 71, 0.3)';
    ctx.shadowBlur = isActive ? 10 : 6;

    ctx.beginPath();
    ctx.arc(corner.x, corner.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 179, 71, 0.35)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(corner.x, corner.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();
    ctx.restore();
  });
}

export function CropScreen({ data, onCornersChange, onApply, isProcessing }: CropScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeCorner, setActiveCorner] = useState<CornerId | null>(null);
  const [scale, setScale] = useState(1);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const updateScale = () => {
      const container = canvasRef.current?.parentElement;
      if (!container) return;
      
      const maxWidth = container.clientWidth - 40;
      const maxHeight = container.clientHeight - 40;
      const scaleX = maxWidth / data.imageWidth;
      const scaleY = maxHeight / data.imageHeight;
      setScale(Math.min(scaleX, scaleY, 1));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [data.imageWidth, data.imageHeight]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      requestAnimationFrame(() => {
        drawOnCanvas(canvasRef.current, imageRef.current, data.corners, data.imageWidth, data.imageHeight, activeCorner);
      });
    };
    img.src = data.imageSrc;
  }, [data.imageSrc, data.corners, activeCorner, data.imageWidth, data.imageHeight]);

  const getCornerAtPoint = (x: number, y: number): CornerId | null => {
    const handleRadius = 36;
    for (let i = 0; i < data.corners.length; i++) {
      const corner = data.corners[i];
      const screenX = corner.x * scale;
      const screenY = corner.y * scale;
      const dist = Math.sqrt((x - screenX) ** 2 + (y - screenY) ** 2);
      if (dist <= handleRadius) return CORNER_IDS[i];
    }
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const corner = getCornerAtPoint(x, y);
    if (corner) {
      setActiveCorner(corner);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activeCorner) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const imageX = Math.max(0, Math.min(data.imageWidth, x / scale));
    const imageY = Math.max(0, Math.min(data.imageHeight, y / scale));
    const newCorners = [...data.corners] as [Point, Point, Point, Point];
    const idx = CORNER_IDS.indexOf(activeCorner);
    newCorners[idx] = { x: imageX, y: imageY };
    onCornersChange(newCorners);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setActiveCorner(null);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div className={styles.container}>
      <div className={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ touchAction: 'none' }}
        />
      </div>
      <div className={styles.actions} role="group" aria-label="Crop actions">
        <button className={`${styles.applyBtn} glass-gradient-btn`} onClick={onApply} disabled={isProcessing} aria-label={isProcessing ? 'Processing crop' : 'Apply crop'}>
          {isProcessing ? 'Processing...' : 'Apply Crop'}
        </button>
      </div>
    </div>
  );
}