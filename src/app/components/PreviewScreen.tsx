import { useRef, useEffect, useState, useCallback } from 'react';
import styles from './PreviewScreen.module.css';

interface PreviewScreenProps {
  frontImage: string | null;
  backImage: string | null;
  signature: string | null;
  onReset: () => void;
}

const A4_WIDTH = 2480;
const A4_HEIGHT = 3508;
const DISPLAY_WIDTH = 280;
const SCALE = DISPLAY_WIDTH / A4_WIDTH;

export function PreviewScreen({ frontImage, backImage, signature, onReset }: PreviewScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [loaded, setLoaded] = useState(false);
  
  const [sigPos, setSigPos] = useState({ x: 0, y: 0 });
  const [sigSize, setSigSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [sigLoaded, setSigLoaded] = useState(false);

  const calculateSignatureSize = useCallback((imgWidth: number, imgHeight: number) => {
    const aspectRatio = imgWidth / imgHeight;
    const maxW = A4_WIDTH * 0.25;
    const maxH = 180;
    let width = maxW;
    let height = width / aspectRatio;
    
    if (height > maxH) {
      height = maxH;
      width = height * aspectRatio;
    }
    
    return { width, height };
  }, []);

  useEffect(() => {
    if (!frontImage || !backImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    canvas.width = A4_WIDTH;
    canvas.height = A4_HEIGHT;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

    const marginX = A4_WIDTH * 0.25;
    const contentWidth = A4_WIDTH * 0.5;
    const topMargin = 200;
    const gap = 120;

    const frontImg = new Image();
    frontImg.onload = () => {
      const frontHeight = contentWidth * (frontImg.height / frontImg.width);
      const frontY = topMargin;
      ctx.drawImage(frontImg, marginX, frontY, contentWidth, frontHeight);

      const backImg = new Image();
      backImg.onload = () => {
        const backHeight = contentWidth * (backImg.height / backImg.width);
        const backY = frontY + frontHeight + gap;
        ctx.drawImage(backImg, marginX, backY, contentWidth, backHeight);

        if (signature) {
          const sigImg = new Image();
          sigImg.onload = () => {
            const size = calculateSignatureSize(sigImg.width, sigImg.height);
            setSigSize(size);
            setSigPos({ x: marginX, y: backY + backHeight + 150 });
            setSigLoaded(true);
            setLoaded(true);
          };
          sigImg.onerror = () => setLoaded(true);
          sigImg.src = signature;
        } else {
          setLoaded(true);
        }
      };
      backImg.onerror = () => console.error('Back image failed to load');
      backImg.src = backImage;
    };
    frontImg.onerror = () => console.error('Front image failed to load');
    frontImg.src = frontImage;
  }, [frontImage, backImage, signature, calculateSignatureSize]);

  const drawCanvasAsync = useCallback(async (ctx: CanvasRenderingContext2D): Promise<void> => {
    if (!frontImage || !backImage) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

    const marginX = A4_WIDTH * 0.25;
    const contentWidth = A4_WIDTH * 0.5;
    const topMargin = 200;
    const gap = 120;

    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    const frontImg = await loadImage(frontImage);
    const frontHeight = contentWidth * (frontImg.height / frontImg.width);
    const frontY = topMargin;
    ctx.drawImage(frontImg, marginX, frontY, contentWidth, frontHeight);

    const backImg = await loadImage(backImage);
    const backHeight = contentWidth * (backImg.height / backImg.width);
    const backY = frontY + frontHeight + gap;
    ctx.drawImage(backImg, marginX, backY, contentWidth, backHeight);

    if (signature && sigLoaded) {
      const sigImg = await loadImage(signature);
      ctx.drawImage(sigImg, sigPos.x, sigPos.y, sigSize.width, sigSize.height);
    }
  }, [frontImage, backImage, signature, sigLoaded, sigPos, sigSize]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!sigLoaded || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const sigLeft = sigPos.x * SCALE;
    const sigTop = sigPos.y * SCALE;
    const sigW = sigSize.width * SCALE;
    const sigH = sigSize.height * SCALE;
    
    if (clickX >= sigLeft && clickX <= sigLeft + sigW &&
        clickY >= sigTop && clickY <= sigTop + sigH) {
      setIsDragging(true);
      setDragStart({ x: clickX - sigLeft, y: clickY - sigTop });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const newLeft = clickX - dragStart.x;
    const newTop = clickY - dragStart.y;
    
    const newX = Math.max(0, Math.min((A4_WIDTH - sigSize.width), newLeft / SCALE));
    const newY = Math.max(0, Math.min((A4_HEIGHT - sigSize.height), newTop / SCALE));
    
    setSigPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  const handleExportPNG = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    
    try {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, A4_WIDTH, A4_HEIGHT);
        await drawCanvasAsync(ctx);
      }
      
      const link = document.createElement('a');
      link.download = 'id-scans-a4.jpg';
      link.href = canvasRef.current.toDataURL('image/jpeg', 0.75);
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    
    try {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, A4_WIDTH, A4_HEIGHT);
        await drawCanvasAsync(ctx);
      }
      
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgData = canvasRef.current.toDataURL('image/jpeg', 0.75);
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      pdf.save('id-scans-a4.pdf');
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div 
        ref={containerRef}
        className={styles.canvasWrapper}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ cursor: sigLoaded ? (isDragging ? 'grabbing' : 'grab') : 'default', touchAction: 'none' }}
      >
        <canvas 
          ref={canvasRef} 
          className={styles.canvas}
          style={{ display: loaded ? 'block' : 'none' }}
        />
        {sigLoaded && signature && (
          <div
            className={styles.signatureDraggable}
            style={{
              left: sigPos.x * SCALE,
              top: sigPos.y * SCALE,
              width: sigSize.width * SCALE,
              height: sigSize.height * SCALE,
            }}
          >
            <img
              src={signature}
              alt="Signature"
              className={styles.signatureImg}
              draggable={false}
            />
          </div>
        )}
        {!loaded && (
          <div className={styles.loading}>
            Generating A4 preview...
          </div>
        )}
      </div>
      {sigLoaded && (
        <p className={styles.hint}>Drag signature to reposition</p>
      )}
      <div className={styles.actions} role="group" aria-label="Export options">
        <button className={`${styles.resetBtn} glass-btn`} onClick={onReset} aria-label="Start over">
          Start Over
        </button>
        <button className={`${styles.exportBtn} glass-btn`} onClick={handleExportPNG} disabled={isExporting || !loaded} aria-label={isExporting ? 'Exporting PNG' : 'Download as PNG'}>
          {isExporting ? 'Exporting...' : 'Download JPG'}
        </button>
        <button className={`${styles.exportBtnPrimary} glass-gradient-btn`} onClick={handleExportPDF} disabled={isExporting || !loaded} aria-label={isExporting ? 'Exporting PDF' : 'Download as PDF'}>
          Download PDF
        </button>
      </div>
    </div>
  );
}