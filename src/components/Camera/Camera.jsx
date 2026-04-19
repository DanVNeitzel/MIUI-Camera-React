import styles from './Camera.module.css';
import GridOverlay from '../GridOverlay/GridOverlay';

export default function Camera({
  videoRef,
  facingMode,
  zoom,
  focusPoint,
  onFocusTap,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  error,
  isLoading,
  isSwitching,
  timerCount,
  filterCSS,
  gridType,
  vignette,
  modeBadge,
  modeBadgeIcon,
}) {
  const videoStyle = {
    transform: `${facingMode === 'user' ? 'scaleX(-1) ' : ''}scale(${zoom})`,
    transition: zoom === 1 ? 'transform 0.25s ease' : 'none',
    filter: filterCSS || undefined,
  };

  return (
    <div
      className={styles.container}
      onClick={onFocusTap}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {isLoading && !error && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      )}

      {error ? (
        <div className={styles.error}>
          <svg className={styles.errorIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 5h-2.17L16 3H8L6.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
          </svg>
          <p className={styles.errorTitle}>Câmera indisponível</p>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      ) : (
        <video
          ref={videoRef}
          className={styles.video}
          style={videoStyle}
          autoPlay
          playsInline
          muted
        />
      )}

      {/* Composition grid overlay */}
      {!error && <GridOverlay type={gridType} />}

      {/* Portrait vignette — simulates shallow depth-of-field edge blur */}
      {!error && vignette && <div className={styles.vignette} aria-hidden="true" />}

      {/* Mode badge — shows active mode label (Noturno, Retrato, PRO) */}
      {!error && modeBadge && (
        <div className={styles.modeBadge} aria-hidden="true">
          {modeBadgeIcon && <span className={styles.modeBadgeIcon}>{modeBadgeIcon}</span>}
          {modeBadge}
        </div>
      )}

      {focusPoint && (
        <div
          key={focusPoint.id}
          className={styles.focusRing}
          style={{ left: `${focusPoint.x}%`, top: `${focusPoint.y}%` }}
        />
      )}

      {/* Camera switch fade overlay */}
      {isSwitching && <div className={styles.switchOverlay} aria-hidden="true" />}

      {/* Timer countdown */}
      {timerCount !== null && timerCount > 0 && (
        <div className={styles.timerWrapper} aria-live="assertive">
          <span key={timerCount} className={styles.timerNumber}>{timerCount}</span>
        </div>
      )}
    </div>
  );
}
