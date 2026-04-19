import { useState, useCallback } from 'react';
import styles from './Gallery.module.css';

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M5 20h14v-2H5v2zm7-18L5.33 9h3.84v4h5.66V9h3.84L12 2z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </svg>
  );
}

function SelectIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M3 5h2V3c-1.1 0-2 .9-2 2zm0 8h2v-2H3v2zm4 8h2v-2H7v2zM3 9h2V7H3v2zm10-6h-2v2h2V3zm6 0v2h2c0-1.1-.9-2-2-2zM5 21v-2H3c0 1.1.9 2 2 2zm-2-4h2v-2H3v2zM9 3H7v2h2V3zm2 18h2v-2h-2v2zm8-8h2v-2h-2v2zm0 8c1.1 0 2-.9 2-2h-2v2zm0-12h2V7h-2v2zm0 8h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-16h2V3h-2v2zM7 17h10V7H7v10zm2-8h6v6H9V9z" />
    </svg>
  );
}

function downloadPhoto(url, index) {
  const a = document.createElement('a');
  a.href = url;
  a.download = `foto_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}_${index}.jpg`;
  a.click();
}

async function downloadMultiple(photos) {
  for (let i = 0; i < photos.length; i++) {
    downloadPhoto(photos[i].url, i + 1);
    // Small delay to avoid browser blocking multiple downloads
    await new Promise((r) => setTimeout(r, 300));
  }
}

export default function Gallery({ photos, onClose, onDelete }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

  const handleDelete = useCallback(
    async (id) => {
      await onDelete(id);
      if (selectedPhoto && selectedPhoto.id === id) {
        setSelectedIndex(null);
      }
    },
    [onDelete, selectedPhoto]
  );

  const toggleSelectMode = () => {
    setSelectMode((v) => !v);
    setSelectedIds(new Set());
  };

  const toggleSelectId = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === photos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(photos.map((p) => p.id)));
    }
  };

  const handleGridItemClick = (photo, index) => {
    if (selectMode) {
      toggleSelectId(photo.id);
    } else {
      setSelectedIndex(index);
    }
  };

  const handleBatchDownload = () => {
    const toDownload = photos.filter((p) => selectedIds.has(p.id));
    downloadMultiple(toDownload);
  };

  const navigatePrev = () => {
    if (selectedIndex > 0) setSelectedIndex((i) => i - 1);
  };

  const navigateNext = () => {
    if (selectedIndex < photos.length - 1) setSelectedIndex((i) => i + 1);
  };

  const allSelected = photos.length > 0 && selectedIds.size === photos.length;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Galeria">
      {/* Full-screen viewer */}
      {selectedPhoto ? (
        <div className={styles.viewer}>
          <div className={styles.viewerTop}>
            <button className={styles.iconBtn} onClick={() => setSelectedIndex(null)} aria-label="Voltar">
              <BackIcon />
            </button>
            <span className={styles.viewerCounter}>
              {selectedIndex + 1} / {photos.length}
            </span>
            <div className={styles.viewerActions}>
              <button
                className={styles.iconBtn}
                onClick={() => downloadPhoto(selectedPhoto.url, selectedIndex + 1)}
                aria-label="Baixar foto"
              >
                <DownloadIcon />
              </button>
              <button
                className={`${styles.iconBtn} ${styles.deleteBtn}`}
                onClick={() => handleDelete(selectedPhoto.id)}
                aria-label="Excluir foto"
              >
                <DeleteIcon />
              </button>
            </div>
          </div>

          <div className={styles.imageWrapper}>
            {selectedIndex > 0 && (
              <button className={`${styles.navBtn} ${styles.navPrev}`} onClick={navigatePrev} aria-label="Foto anterior">
                ‹
              </button>
            )}
            <img src={selectedPhoto.url} alt="Foto" className={styles.fullImage} />
            {selectedIndex < photos.length - 1 && (
              <button className={`${styles.navBtn} ${styles.navNext}`} onClick={navigateNext} aria-label="Próxima foto">
                ›
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Grid view */
        <>
          <div className={styles.header}>
            {selectMode ? (
              <>
                <button className={styles.iconBtn} onClick={toggleSelectMode} aria-label="Cancelar seleção">
                  <CloseIcon />
                </button>
                <button className={styles.selectAllBtn} onClick={selectAll}>
                  {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                </button>
                <span className={styles.selectionCount}>{selectedIds.size} selecionada{selectedIds.size !== 1 ? 's' : ''}</span>
              </>
            ) : (
              <>
                <button className={styles.iconBtn} onClick={onClose} aria-label="Fechar galeria">
                  <CloseIcon />
                </button>
                <span className={styles.title}>Galeria ({photos.length})</span>
                {photos.length > 0 ? (
                  <button className={styles.iconBtn} onClick={toggleSelectMode} aria-label="Selecionar fotos">
                    <SelectIcon />
                  </button>
                ) : (
                  <div style={{ width: 44 }} />
                )}
              </>
            )}
          </div>

          {photos.length === 0 ? (
            <div className={styles.empty}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="56" height="56" style={{ color: 'rgba(255,255,255,0.2)' }}>
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
              </svg>
              <p className={styles.emptyText}>Nenhuma foto ainda</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {photos.map((photo, index) => {
                const isSelected = selectedIds.has(photo.id);
                return (
                  <button
                    key={photo.id}
                    className={`${styles.gridItem} ${isSelected ? styles.gridItemSelected : ''}`}
                    onClick={() => handleGridItemClick(photo, index)}
                    aria-label={`Foto ${index + 1}${isSelected ? ' (selecionada)' : ''}`}
                    aria-pressed={selectMode ? isSelected : undefined}
                  >
                    <img src={photo.url} alt={`Foto ${index + 1}`} className={styles.gridThumb} />
                    {selectMode && (
                      <div className={`${styles.checkCircle} ${isSelected ? styles.checkCircleActive : ''}`}>
                        {isSelected && <CheckIcon />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Batch action bar */}
          {selectMode && selectedIds.size > 0 && (
            <div className={styles.batchBar}>
              <button className={styles.batchBtn} onClick={handleBatchDownload}>
                <DownloadIcon />
                <span>Baixar {selectedIds.size} foto{selectedIds.size !== 1 ? 's' : ''}</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
