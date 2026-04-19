import styles from './FlashOverlay.module.css';

export default function FlashOverlay({ isFlashing }) {
  if (!isFlashing) return null;
  return <div className={styles.flash} aria-hidden="true" />;
}
