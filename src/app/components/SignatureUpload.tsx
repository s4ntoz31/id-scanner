import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pen, SkipForward } from 'lucide-react';
import styles from './SignatureUpload.module.css';

interface SignatureUploadProps {
  onSignature: (imageSrc: string, width: number, height: number) => void;
  onSkip: () => void;
}

export function SignatureUpload({ onSignature, onSkip }: SignatureUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    setIsProcessing(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      
      const img = new Image();
      img.onload = () => {
        onSignature(dataUrl, img.width, img.height);
        setIsProcessing(false);
      };
      img.onerror = () => {
        onSignature(dataUrl, 0, 0);
        setIsProcessing(false);
      };
      img.src = dataUrl;
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

  const inputId = `sig-input-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className={styles.container}>
      <motion.div 
        className={styles.content}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.iconWrapper}>
          <Pen size={28} strokeWidth={1.5} />
        </div>
        
        <h2 className={styles.title}>Add Your Signature</h2>
        <p className={styles.subtitle}>
          Upload a signature image. We'll automatically remove the background.
        </p>

        <div
          className={styles.dropZone}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => document.getElementById(inputId)?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload signature image"
          onKeyDown={(e) => e.key === 'Enter' && document.getElementById(inputId)?.click()}
        >
          {isProcessing ? (
            <div className={styles.processing} role="status" aria-live="polite">
              <div className={styles.spinner} aria-hidden="true" />
              <span>Processing image...</span>
            </div>
          ) : (
            <>
              <Pen size={32} strokeWidth={1} aria-hidden="true" />
              <span>Drop signature or click to upload</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleChange}
            className={styles.input}
            id={inputId}
            aria-label="Select signature image file"
          />
        </div>

        <button className={styles.skipBtn} onClick={onSkip} aria-label="Skip adding signature">
          <SkipForward size={18} aria-hidden="true" />
          Skip this step
        </button>
      </motion.div>
    </div>
  );
}