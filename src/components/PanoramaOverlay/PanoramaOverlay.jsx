import styles from './PanoramaOverlay.module.css';

const MAX_FRAMES = 8;

/**
 * PanoramaOverlay — guide and progress for panorama capture.
 *
 * Props:
 *   isCapturing  — true while sweep capture is active
 *   frameCount   — number of frames captured so far
 */
export default function PanoramaOverlay({ isCapturing, frameCount }) {
  const progress = Math.min(frameCount / MAX_FRAMES, 1);

  return (
    <div className={styles.overlay} aria-hidden="true">
      {/* Horizontal center guide line */}
      <div className={styles.guideLine} />

      {/* Direction arrow */}
      <div className={`${styles.arrow} ${isCapturing ? styles.arrowActive : ''}`}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
          <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
        </svg>
      </div>

      {/* Progress bar */}
      <div className={styles.progressTrack}>
        <div
          className={`${styles.progressFill} ${isCapturing ? styles.progressFillActive : ''}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Status text */}
      <p className={styles.hint}>
        {isCapturing
          ? `Capturando… ${frameCount}/${MAX_FRAMES}`
          : 'Pressione e mova lentamente para a direita →'}
      </p>
    </div>
  );
}
