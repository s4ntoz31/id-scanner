import { useRef } from 'react';
import styles from './UploadScreen.module.css';

interface UploadScreenProps {
  onUpload: (dataUrl: string) => void;
  label: string;
}

export function UploadScreen({ onUpload, label }: UploadScreenProps) {
  const inputId = `file-input-${Math.random().toString(36).slice(2, 9)}`;
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        onUpload(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onUpload(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className={styles.dropZone}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      role="region"
      aria-label={`Upload ${label}`}
    >
      <div className={`${styles.card} liquid-glass`} role="group" aria-label={`${label} upload area`}>
        <div className={styles.gradientOrb} />
        <svg className={styles.icon} viewBox="0 0 48 48" fill="none" strokeWidth="1.5" aria-hidden="true">
          <rect x="8" y="6" width="32" height="36" rx="4" stroke="currentColor" strokeOpacity="0.6" />
          <line x1="8" y1="22" x2="40" y2="22" stroke="currentColor" strokeOpacity="0.3" strokeDasharray="4 4" />
          <circle cx="15" cy="14" r="3" fill="currentColor" stroke="none" opacity="0.6" />
        </svg>
        <h3 className={styles.dropTitle}>Upload {label}</h3>
        <p className={styles.dropText}>Drag & drop, click to browse, or take photo</p>
<input
            type="file"
            accept="image/*"
            onChange={handleChange}
            className={styles.input}
            id={inputId}
            aria-label={`Select ${label} image file`}
          />
        <label htmlFor={inputId} className={`${styles.browseBtn} liquid-glass`}>
          Browse Files
        </label>
        <button 
          type="button"
          className={styles.cameraBtn}
          onClick={handleCameraCapture}
          aria-label="Take photo with camera"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          Take Photo
        </button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraChange}
          className={styles.hiddenInput}
          aria-label="Camera capture"
        />
      </div>
    </div>
  );
}