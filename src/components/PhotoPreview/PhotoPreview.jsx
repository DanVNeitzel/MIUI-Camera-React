import { useCallback } from 'react';
import styles from './PhotoPreview.module.css';

function downloadPhoto(dataUrl) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `foto_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.jpg`;
  link.click();
}

export default function PhotoPreview({ photo, onClose }) {
  const handleDownload = useCallback(() => {
    if (photo) downloadPhoto(photo);
  }, [photo]);

  if (!photo) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Pré-visualização da foto">
      <div className={styles.topActions}>
        <button className={styles.actionBtn} onClick={onClose} aria-label="Fechar">
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>

        <span className={styles.title}>Foto</span>

        <button className={styles.actionBtn} onClick={handleDownload} aria-label="Baixar foto">
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M5 20h14v-2H5v2zm7-18L5.33 9h3.84v4h5.66V9h3.84L12 2z" />
          </svg>
        </button>
      </div>

      <div className={styles.imageWrapper}>
        <img src={photo} alt="Foto capturada" className={styles.image} />
      </div>

      <div className={styles.bottomActions}>
        <button className={styles.closeBtn} onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
}
