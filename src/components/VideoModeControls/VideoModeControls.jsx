import styles from './VideoModeControls.module.css';

// Slow-motion framerates offered (browser requests "ideal", device picks closest supported)
const SLOWMO_FPS_PRESETS = [
  { label: 'Auto', value: 0   },
  { label: '60',   value: 60  },
  { label: '120',  value: 120 },
  { label: '240',  value: 240 },
  { label: '480',  value: 480 },
];

// Time-lapse intervals between captured frames
const TIMELAPSE_INTERVAL_PRESETS = [
  { label: '0.5s',  value: 500   },
  { label: '1s',    value: 1000  },
  { label: '2s',    value: 2000  },
  { label: '5s',    value: 5000  },
  { label: '10s',   value: 10000 },
  { label: '30s',   value: 30000 },
  { label: '1min',  value: 60000 },
];

/**
 * VideoModeControls — shown below the viewfinder when in "lento" or "timelapse" mode.
 *
 * Props:
 *   mode             — 'lento' | 'timelapse'
 *   slowMotionFps    — current fps value (0 = auto)
 *   timelapseMs      — current interval in ms
 *   onFpsChange      — (value: number) => void
 *   onIntervalChange — (value: number) => void
 *   isRecording      — disable changes while recording
 */
export default function VideoModeControls({
  mode,
  slowMotionFps,
  timelapseMs,
  onFpsChange,
  onIntervalChange,
  isRecording,
}) {
  if (mode !== 'lento' && mode !== 'timelapse') return null;

  return (
    <div className={styles.panel}>
      {mode === 'lento' && (
        <div className={styles.chipRow}>
          <span className={styles.chipLabel}>FPS</span>
          <div className={styles.chipList}>
            {SLOWMO_FPS_PRESETS.map((p) => (
              <button
                key={p.value}
                className={`${styles.chip} ${slowMotionFps === p.value ? styles.chipActive : ''}`}
                onClick={() => !isRecording && onFpsChange(p.value)}
                disabled={isRecording}
                aria-label={`${p.label} fps`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'timelapse' && (
        <div className={styles.chipRow}>
          <span className={styles.chipLabel}>INT</span>
          <div className={styles.chipList}>
            {TIMELAPSE_INTERVAL_PRESETS.map((p) => (
              <button
                key={p.value}
                className={`${styles.chip} ${timelapseMs === p.value ? styles.chipActive : ''}`}
                onClick={() => !isRecording && onIntervalChange(p.value)}
                disabled={isRecording}
                aria-label={`Intervalo ${p.label}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
