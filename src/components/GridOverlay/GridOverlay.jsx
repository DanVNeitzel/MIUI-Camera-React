import styles from './GridOverlay.module.css';

export default function GridOverlay({ type }) {
  if (!type || type === 'none') return null;

  const showThirds = type === 'thirds' || type === 'both';
  const showSquare = type === 'square' || type === 'both';

  return (
    <div className={styles.overlay} aria-hidden="true">
      {showThirds && (
        <>
          {/* Horizontal thirds */}
          <div className={`${styles.line} ${styles.h1}`} />
          <div className={`${styles.line} ${styles.h2}`} />
          {/* Vertical thirds */}
          <div className={`${styles.line} ${styles.v1}`} />
          <div className={`${styles.line} ${styles.v2}`} />
          {/* Intersection dots */}
          <div className={`${styles.dot}`} style={{ top: 'calc(33.33% - 3px)', left: 'calc(33.33% - 3px)' }} />
          <div className={`${styles.dot}`} style={{ top: 'calc(33.33% - 3px)', left: 'calc(66.66% - 3px)' }} />
          <div className={`${styles.dot}`} style={{ top: 'calc(66.66% - 3px)', left: 'calc(33.33% - 3px)' }} />
          <div className={`${styles.dot}`} style={{ top: 'calc(66.66% - 3px)', left: 'calc(66.66% - 3px)' }} />
        </>
      )}
      {showSquare && (
        <div className={styles.squareFrame} />
      )}
    </div>
  );
}
