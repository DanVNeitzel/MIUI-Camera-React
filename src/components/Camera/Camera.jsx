import { useRef } from 'react';
import styles from './Camera.module.css';
import GridOverlay from '../GridOverlay/GridOverlay';

export default function Camera({
  videoRef,
  facingMode,
  zoom,
  focusPoint,
  focusLocked,
  onFocusTap,
  exposureCompensation,
  exposureRange,
  onExposureChange,
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
  extraOverlay,
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
          className={focusLocked ? styles.focusRingLocked : styles.focusRing}
          style={{ left: `${focusPoint.x}%`, top: `${focusPoint.y}%` }}
        >
          {focusLocked && (
            <span className={styles.focusLockBadge} aria-label="Foco travado">
              <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
            </span>
          )}
        </div>
      )}

      {focusPoint && exposureRange && (
        <div
          className={styles.exposureControl}
          style={{ left: `${Math.min(focusPoint.x + 10, 85)}%`, top: `${focusPoint.y}%` }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <span className={styles.exposureSun}>☀</span>
          <input
            type="range"
            className={styles.exposureSlider}
            min={exposureRange.min}
            max={exposureRange.max}
            step={exposureRange.step || 0.1}
            value={exposureCompensation}
            onChange={(e) => onExposureChange(parseFloat(e.target.value))}
            aria-label="Brilho"
          />
          <span className={styles.exposureSunSmall}>☀</span>
        </div>
      )}

      {/* Camera switch fade overlay */}
      {isSwitching && <div className={styles.switchOverlay} aria-hidden="true" />}

      {/* Mode-specific overlay (panorama guide, document frame, etc.) */}
      {!error && extraOverlay}

      {/* Timer countdown */}
      {timerCount !== null && timerCount > 0 && (
        <div className={styles.timerWrapper} aria-live="assertive">
          <span key={timerCount} className={styles.timerNumber}>{timerCount}</span>
        </div>
      )}
    </div>
  );
}
