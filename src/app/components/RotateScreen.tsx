import { useState, useEffect } from 'react';
import styles from './RotateScreen.module.css';

interface RotateScreenProps {
  imageSrc: string;
  onRotate?: (rotatedDataUrl: string) => void;
  onFinalize?: (rotatedDataUrl: string) => void;
  onContinue: () => void;
  label: string;
}

export function RotateScreen({ imageSrc, onRotate, onFinalize, onContinue, label }: RotateScreenProps) {
  const [rotation, setRotation] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(imageSrc);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const angle = (rotation * Math.PI) / 180;
      
      if (rotation === 0 || rotation === 180) {
        canvas.width = img.width;
        canvas.height = img.height;
      } else {
        canvas.width = img.height;
        canvas.height = img.width;
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(angle);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      setCurrentSrc(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.src = imageSrc;
  }, [imageSrc, rotation]);

  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    onRotate?.(currentSrc);
  };

  const handleContinue = () => {
    if (onFinalize) {
      onFinalize(currentSrc);
    } else {
      onRotate?.(currentSrc);
    }
    onContinue();
  };

  return (
    <div className={styles.container}>
      <div className={styles.canvasWrapper}>
        <img 
          src={currentSrc} 
          alt={`Rotated ${label}`}
          className={styles.image}
        />
        {rotation > 0 && (
          <div className={styles.badge}>{rotation}°</div>
        )}
      </div>
      <div className={styles.actions} role="group" aria-label="Rotation actions">
        <button className={styles.rotateBtn} onClick={handleRotate} aria-label="Rotate 90 degrees clockwise">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Rotate {rotation > 0 ? `(currently ${rotation}°)` : ''}
        </button>
        <button className={`${styles.continueBtn} glass-gradient-btn`} onClick={handleContinue} aria-label="Continue to next step">
          Continue
        </button>
      </div>
    </div>
  );
}