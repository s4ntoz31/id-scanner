import styles from './LandingScreen.module.css';

interface LandingScreenProps {
  onStart: () => void;
}

export function LandingScreen({ onStart }: LandingScreenProps) {
  return (
    <div className={styles.landing}>
      <div className={styles.content}>
        <h1 className={styles.title}>
          <span className={styles.highlight}>made easy</span>
          <br />
          ID scan copy
        </h1>
        <button className={styles.button} onClick={onStart}>
          Start
        </button>
      </div>
    </div>
  );
}