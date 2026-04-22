import styles from './DocumentOverlay.module.css';

/**
 * DocumentOverlay — guide frame for document scanning mode.
 * Shows a rounded-rectangle with corner brackets and alignment hint.
 */
export default function DocumentOverlay() {
  return (
    <div className={styles.overlay} aria-hidden="true">
      <div className={styles.frame}>
        {/* Corner brackets */}
        <span className={`${styles.corner} ${styles.tl}`} />
        <span className={`${styles.corner} ${styles.tr}`} />
        <span className={`${styles.corner} ${styles.bl}`} />
        <span className={`${styles.corner} ${styles.br}`} />
      </div>
      <p className={styles.hint}>Alinhe o documento dentro do quadro</p>
    </div>
  );
}
