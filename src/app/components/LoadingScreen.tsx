import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

const words = ['Design', 'Create', 'Inspire'];

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [count, setCount] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 2700;
    const maxCount = 100;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const newCount = Math.floor(progress * maxCount);
      
      setCount(newCount);

      if (elapsed < duration) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(onComplete, 400);
      }
    };

    const wordInterval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 900);

    requestAnimationFrame(animate);

    return () => {
      clearInterval(wordInterval);
    };
  }, [onComplete]);

  const displayCount = Math.min(count, 100);

  return (
    <div className="loading-overlay">
      <div className="loading-label">ID Scanner</div>
      
      <div className="loading-word" key={wordIndex}>
        {words[wordIndex]}
      </div>
      
      <div className="loading-counter">
        {String(displayCount).padStart(3, '0')}
      </div>
      
      <div className="loading-progress">
        <div 
          className="loading-progress-bar"
          style={{ transform: `scaleX(${displayCount / 100})` }}
        />
      </div>
    </div>
  );
}