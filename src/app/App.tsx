import { useState, useCallback, useRef, useEffect } from 'react';
import type { Step, Point } from './types';
import { STEP_ORDER, STEP_LABELS } from './types';
import { WorkScreen } from './components/WorkScreen';
import { PreviewScreen } from './components/PreviewScreen';
import { ProgressBar } from './components/ProgressBar';
import { LoadingScreen } from './components/LoadingScreen';
import './styles/app.css';

export default function App() {
  const [step, setStep] = useState<Step>('front-work');
  const [frontFinal, setFrontFinal] = useState<string | null>(null);
  const [backFinal, setBackFinal] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('./workers/perspective.worker.ts', import.meta.url),
      { type: 'module' }
    );
    
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const processPerspective = useCallback((imageSrc: string, corners: [Point, Point, Point, Point]): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No canvas context');
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        
        const minX = Math.min(corners[0].x, corners[1].x, corners[2].x, corners[3].x);
        const maxX = Math.max(corners[0].x, corners[1].x, corners[2].x, corners[3].x);
        const minY = Math.min(corners[0].y, corners[1].y, corners[2].y, corners[3].y);
        const maxY = Math.max(corners[0].y, corners[1].y, corners[2].y, corners[3].y);
        
        const cropWidth = Math.max(1, maxX - minX);
        const cropHeight = Math.max(1, maxY - minY);
        const aspectRatio = cropWidth / cropHeight;
        
        let outputWidth: number;
        let outputHeight: number;
        
        if (aspectRatio > 1) {
          outputWidth = 800;
          outputHeight = Math.round(800 / aspectRatio);
        } else {
          outputHeight = 600;
          outputWidth = Math.round(600 * aspectRatio);
        }
        
        outputWidth = Math.max(100, Math.min(1200, outputWidth));
        outputHeight = Math.max(50, Math.min(800, outputHeight));

        const handler = (e: MessageEvent) => {
          if (e.data.type === 'result') {
            const outCanvas = document.createElement('canvas');
            outCanvas.width = outputWidth;
            outCanvas.height = outputHeight;
            const outCtx = outCanvas.getContext('2d');
            if (outCtx) {
              outCtx.putImageData(e.data.imageData, 0, 0);
              resolve(outCanvas.toDataURL('image/jpeg', 0.92));
            } else {
              reject('Failed to create output canvas context');
            }
            workerRef.current?.removeEventListener('message', handler);
          } else if (e.data.type === 'error') {
            console.error('Worker error:', e.data.message);
            reject(e.data.message);
            workerRef.current?.removeEventListener('message', handler);
          }
        };
        
        if (!workerRef.current) {
          reject('Worker not initialized');
          return;
        }
        
        workerRef.current.addEventListener('message', handler);
        workerRef.current.postMessage({
          type: 'transform',
          imageData,
          corners,
          outputWidth,
          outputHeight,
        });
      };
      img.onerror = () => reject('Image load failed');
      img.src = imageSrc;
    });
  }, []);

  const handleFrontComplete = (final: string) => {
    setFrontFinal(final);
    setStep('back-work');
  };

  const handleBackComplete = (final: string) => {
    setBackFinal(final);
    setStep('signature-work');
  };

  const handleSignatureComplete = (final: string) => {
    if (signature) {
      URL.revokeObjectURL(signature);
    }
    setSignature(final);
    setStep('preview');
  };

  const handleReset = () => {
    if (signature) {
      URL.revokeObjectURL(signature);
    }
    setStep('front-work');
    setFrontFinal(null);
    setBackFinal(null);
    setSignature(null);
    setError(null);
  };

  const handleBack = () => {
    setError(null);
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex > 0) {
      setStep(STEP_ORDER[currentIndex - 1]);
    }
  };

  const currentStepIndex = STEP_ORDER.indexOf(step);
  const canGoBack = currentStepIndex > 0;
  const labels = STEP_LABELS[step];

  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  return (
    <div className="app-container">
      <div className="app-content" role="main">
        <div className="brand-header">
          <span>Made Easy ID scan copy</span>
        </div>
        <ProgressBar currentStep={currentStepIndex} totalSteps={STEP_ORDER.length} />
        
        <header className="app-header">
          {canGoBack && (
            <button className="app-back-btn" onClick={handleBack}>
              ← Back
            </button>
          )}
          <div className="step-indicator">
            <span className="app-badge">Step {currentStepIndex + 1} of {STEP_ORDER.length}</span>
          </div>
          <h1 className="app-title">{labels.title}</h1>
          <p className="app-subtitle">{labels.subtitle}</p>
          {error && <div className="app-error">{error}</div>}
        </header>

        <main className="app-main">
          {step === 'front-work' && (
            <WorkScreen
              label="Front of ID"
              onComplete={handleFrontComplete}
              processPerspective={processPerspective}
              isSignature={false}
            />
          )}
          {step === 'back-work' && (
            <WorkScreen
              label="Back of ID"
              onComplete={handleBackComplete}
              processPerspective={processPerspective}
              isSignature={false}
            />
          )}
          {step === 'signature-work' && (
            <WorkScreen
              label="Signature"
              onComplete={handleSignatureComplete}
              onSkip={() => setStep('preview')}
              processPerspective={processPerspective}
              isSignature={true}
            />
          )}
          {step === 'preview' && (
            <PreviewScreen
              frontImage={frontFinal}
              backImage={backFinal}
              signature={signature}
              onReset={handleReset}
            />
          )}
        </main>
      </div>
    </div>
  );
}