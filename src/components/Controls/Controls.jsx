import styles from './Controls.module.css';

function SwitchCameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
      <path d="M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-5.09 10.37A4.99 4.99 0 0 1 7.02 13H5l2.77-2.77.04-.04.03.03L10.5 13H8.55a3.496 3.496 0 0 0 6.27 1.63l1.31 1.31c-.57.58-1.26 1.04-2.04 1.34-.49.19-1.01.3-1.55.32-.18.01-.36.01-.54.01-.45 0-.89-.05-1.31-.15zm5.32-3.6L17.46 14l-.03-.03L14.77 11h1.95a3.496 3.496 0 0 0-6.27-1.63L9.14 8.06A5.005 5.005 0 0 1 12 7.01a5 5 0 0 1 4.98 4.62c0 .04.01.08.01.13H19l-2.77 2.61z" />
    </svg>
  );
}

function formatTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function Controls({
  onCapture,
  onSwitchCamera,
  hasMultipleCameras,
  capturedPhoto,
  photosCount,
  onThumbnailClick,
  isCapturing,
  isRecording,
  recordingTime,
  timerCount,
  isVideoMode,
}) {
  // isVideoMode is passed directly from the parent (modeProfile.isVideo)

  // Determine capture button visual state
  let btnVariant = 'photo';
  if (isVideoMode && isRecording) btnVariant = 'recording';
  else if (isVideoMode) btnVariant = 'video';
  else if (timerCount !== null) btnVariant = 'timer';

  return (
    <div className={styles.controls}>
      {/* Gallery thumbnail */}
      <button
        className={styles.thumbnail}
        onClick={onThumbnailClick}
        aria-label={`Ver galeria (${photosCount} fotos)`}
        disabled={photosCount === 0}
      >
        {capturedPhoto ? (
          <img src={capturedPhoto} alt="Última foto" className={styles.thumbnailImg} />
        ) : (
          <div className={styles.thumbnailEmpty}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
          </div>
        )}
        {photosCount > 0 && (
          <span className={styles.photoBadge}>{photosCount > 99 ? '99+' : photosCount}</span>
        )}
      </button>

      {/* Capture / Record button */}
      <div className={styles.captureWrapper}>
        {isVideoMode && isRecording && (
          <span className={styles.recordingTime}>{formatTime(recordingTime)}</span>
        )}
        <button
          className={`${styles.captureBtn} ${styles[btnVariant]}`}
          onClick={onCapture}
          aria-label={
            isVideoMode
              ? isRecording ? 'Parar gravação' : 'Iniciar gravação'
              : timerCount !== null ? 'Cancelar timer' : 'Tirar foto'
          }
          disabled={isCapturing}
        >
          {btnVariant === 'recording' ? (
            <span className={styles.stopInner} />
          ) : btnVariant === 'video' ? (
            <span className={styles.recordInner} />
          ) : btnVariant === 'timer' ? (
            <span className={styles.timerInner}>✕</span>
          ) : (
            <span className={styles.captureInner} />
          )}
        </button>
      </div>

      {/* Switch camera */}
      {hasMultipleCameras ? (
        <button
          className={styles.switchBtn}
          onClick={onSwitchCamera}
          aria-label="Trocar câmera"
          disabled={isRecording}
        >
          <SwitchCameraIcon />
        </button>
      ) : (
        <div className={styles.placeholder} />
      )}
    </div>
  );
}
