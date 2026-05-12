import { useState } from 'react';
import type { CropData, Point } from '../types';
import { UploadScreen } from './UploadScreen';
import { CropScreen } from './CropScreen';
import styles from './WorkScreen.module.css';

interface WorkScreenProps {
  label: string;
  onComplete: (finalImage: string) => void;
  onSkip?: () => void;
  processPerspective: (imageSrc: string, corners: [Point, Point, Point, Point]) => Promise<string>;
  isSignature?: boolean;
}

type WorkPhase = 'upload' | 'crop' | 'rotate' | 'processing';

const getDefaultCorners = (width: number, height: number): [Point, Point, Point, Point] => [
  { x: width * 0.05, y: height * 0.05 },
  { x: width * 0.95, y: height * 0.05 },
  { x: width * 0.95, y: height * 0.95 },
  { x: width * 0.05, y: height * 0.95 },
];

export function WorkScreen({ 
  label, 
  onComplete,
  onSkip,
  processPerspective,
  isSignature = false 
}: WorkScreenProps) {
  const [phase, setPhase] = useState<WorkPhase>('upload');
  const [imageData, setImageData] = useState<CropData | null>(null);
  const [rotatedImage, setRotatedImage] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      setImageData({
        corners: getDefaultCorners(img.width, img.height),
        imageSrc: dataUrl,
        imageWidth: img.width,
        imageHeight: img.height,
      });
      setPhase('crop');
    };
    img.src = dataUrl;
  };

  const handleCropApply = async () => {
    if (!imageData) return;
    setIsProcessing(true);
    setError(null);
    try {
      const result = await processPerspective(imageData.imageSrc, imageData.corners);
      setRotatedImage(result);
      setPhase('rotate');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const rotateImage = async (direction: 'left' | 'right') => {
    if (!rotatedImage) return;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const newRotation = direction === 'right' ? rotation + 90 : rotation - 90;
      const normalizedRotation = ((newRotation % 360) + 360) % 360;
      const angle = (normalizedRotation * Math.PI) / 180;
      
      const isVertical = normalizedRotation === 90 || normalizedRotation === 270;
      canvas.width = isVertical ? img.height : img.width;
      canvas.height = isVertical ? img.width : img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(angle);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      const newDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setRotatedImage(newDataUrl);
      setRotation(normalizedRotation);
    };
    img.onerror = () => {
      setError('Failed to load image for rotation');
    };
    img.src = rotatedImage;
  };

  const handleDone = async () => {
    if (!rotatedImage) return;
    
    if (isSignature) {
      setPhase('processing');
      setIsProcessing(true);
      setError(null);
      try {
        const { removeBackground } = await import('@imgly/background-removal');
        const blob = await removeBackground(rotatedImage);
        const url = URL.createObjectURL(blob);
        onComplete(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove background');
        setIsProcessing(false);
      }
    } else {
      onComplete(rotatedImage);
    }
  };

  const handleRetake = () => {
    setPhase('upload');
    setImageData(null);
    setRotatedImage(null);
    setRotation(0);
    setError(null);
  };

  // Upload phase
  if (phase === 'upload') {
    return (
      <div className={styles.uploadContainer}>
        <UploadScreen 
          onUpload={handleUpload} 
          label={label}
        />
        {onSkip && (
          <button className={styles.skipBtnTop} onClick={onSkip} aria-label="Skip this step">
            Skip this step
          </button>
        )}
      </div>
    );
  }

  // Crop phase
  if (phase === 'crop' && imageData) {
    return (
      <CropScreen
        data={imageData}
        onCornersChange={(corners) => setImageData({ ...imageData, corners })}
        onApply={handleCropApply}
        isProcessing={isProcessing}
      />
    );
  }

  // Rotate phase
  if (phase === 'rotate' && rotatedImage) {
    return (
      <div className={styles.rotateContainer}>
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.canvasWrapper}>
          <img 
            src={rotatedImage} 
            alt={`Rotated ${label}`}
            className={styles.image}
          />
          {rotation > 0 && (
            <div className={styles.badge}>{rotation}°</div>
          )}
        </div>
        <div className={styles.rotateControls}>
          <button className={styles.rotateBtn} onClick={() => rotateImage('left')} aria-label="Rotate left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            ↺ Left
          </button>
          <span className={styles.rotationLabel}>{rotation}°</span>
          <button className={styles.rotateBtn} onClick={() => rotateImage('right')} aria-label="Rotate right">
            ↻ Right
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>
        </div>
        <div className={styles.actions}>
          {onSkip && (
            <button className={styles.skipBtn} onClick={onSkip} aria-label="Skip this step">
              Skip
            </button>
          )}
          <button className={styles.retakeBtn} onClick={handleRetake} aria-label="Retake photo">
            ↩ Retake
          </button>
          <button className={styles.doneBtn} onClick={handleDone} aria-label="Done">
            ✓ Done
          </button>
        </div>
      </div>
    );
  }

  // Processing phase (signature only)
  if (phase === 'processing') {
    return (
      <div className={styles.processing}>
        <div className={styles.spinner} aria-hidden="true" />
        <p>Removing background...</p>
        {error && <div className={styles.error}>{error}</div>}
      </div>
    );
  }

  return null;
}