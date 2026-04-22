import styles from './TopBar.module.css';

function FlashIcon({ mode }) {
  if (mode === 'off') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M3.27 3L2 4.27l5 5V13h3v9l7-12h-4l4-7.18L20.73 6 17 2 8.73 8.73 3.27 3z" />
      </svg>
    );
  }
  if (mode === 'on') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M7 2v11h3v9l7-12h-4l4-8z" />
      </svg>
    );
  }
  // auto
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M7 2v11h3v9l7-12h-4l4-8z" />
      <circle cx="18.5" cy="5" r="5" fill="#000" />
      <text x="18.5" y="7.5" fontSize="7" fontWeight="bold" fill="currentColor" fontFamily="sans-serif" textAnchor="middle">A</text>
    </svg>
  );
}

function TimerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A7.896 7.896 0 0 0 12 4c-4.42 0-8 3.58-8 8s3.57 8 8 8 8-3.58 8-8c0-1.57-.46-3.03-1.24-4.26zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M3 3v18h18V3H3zm8 16H5v-6h6v6zm0-8H5V5h6v6zm8 8h-6v-6h6v6zm0-8h-6V5h6v6z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  );
}

function formatTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function TopBar({ flashMode, onFlashToggle, timerDelay, onTimerToggle, gridType, onGridToggle, isRecording, recordingTime, onSettingsOpen }) {
  const flashLabel = { off: 'OFF', on: 'ON', auto: 'AUTO' };
  const flashActive = flashMode !== 'off';

  return (
    <div className={styles.topBar}>
      <div className={styles.left}>
        <button
          className={styles.iconBtn}
          onClick={onTimerToggle}
          style={{ color: timerDelay > 0 ? '#FFD600' : 'rgba(255,255,255,0.85)' }}
          aria-label={`Timer: ${timerDelay === 0 ? 'desligado' : `${timerDelay}s`}`}
        >
          <TimerIcon />
          {timerDelay > 0 && <span className={styles.timerLabel}>{timerDelay}s</span>}
        </button>

        <button
          className={styles.iconBtn}
          onClick={onFlashToggle}
          style={{ color: flashActive ? '#FFD600' : 'rgba(255,255,255,0.85)' }}
          aria-label={`Flash ${flashLabel[flashMode]}`}
        >
          <FlashIcon mode={flashMode} />
          <span className={styles.flashLabel}>{flashLabel[flashMode]}</span>
        </button>
      </div>

      <div className={styles.center}>
        {isRecording ? (
          <div className={styles.recordingIndicator} aria-live="polite">
            <span className={styles.recDot} />
            <span className={styles.recTime}>{formatTime(recordingTime)}</span>
          </div>
        ) : (
          <span className={styles.logo}></span>
        )}
      </div>

      <div className={styles.right}>
        <button
          className={styles.iconBtn}
          onClick={onGridToggle}
          style={{ color: gridType && gridType !== 'none' ? '#FFD600' : 'rgba(255,255,255,0.85)' }}
          aria-label={`Grade: ${gridType || 'none'}`}
        >
          <GridIcon />
        </button>
        <button className={styles.iconBtn} onClick={onSettingsOpen} aria-label="Configurações">
          <SettingsIcon />
        </button>
      </div>
    </div>
  );
}
