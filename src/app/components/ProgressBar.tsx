import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  return (
    <nav className={styles.container} aria-label="Progress">
      <div className={styles.steps} role="list">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`${styles.step} ${i <= currentStep ? styles.active : ''} ${i < currentStep ? styles.completed : ''}`}
            role="listitem"
            aria-current={i === currentStep ? 'step' : undefined}
          >
            <div className={styles.dot} aria-hidden="true">
              {i < currentStep ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span>{i + 1}</span>
              )}
            </div>
            {i < totalSteps - 1 && <div className={styles.line} aria-hidden="true" />}
          </div>
        ))}
      </div>
    </nav>
  );
}