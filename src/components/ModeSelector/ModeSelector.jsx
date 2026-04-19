import { useRef, useEffect } from 'react';
import styles from './ModeSelector.module.css';

export const CAMERA_MODES = [
  { id: 'noturno', label: 'NOTURNO' },
  { id: 'foto',    label: 'FOTO' },
  { id: 'video',   label: 'VÍDEO' },
  { id: 'retrato', label: 'RETRATO' },
  { id: 'pro',     label: 'PRO' },
  { id: 'mais',    label: 'MAIS' },
];

export default function ModeSelector({ activeMode, onModeChange }) {
  const scrollRef = useRef(null);
  const activeRef = useRef(null);

  // Scroll active mode to center using scrollIntoView (more reliable than manual calc)
  useEffect(() => {
    activeRef.current?.scrollIntoView({
      inline: 'center',
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [activeMode]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.scroll} ref={scrollRef}>
        {CAMERA_MODES.map((mode) => {
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              ref={isActive ? activeRef : null}
              className={`${styles.modeBtn} ${isActive ? styles.modeActive : ''}`}
              onClick={() => onModeChange(mode.id)}
              aria-label={mode.label}
              aria-pressed={isActive}
            >
              <span className={styles.modeLabel}>{mode.label}</span>
              {isActive && <span className={styles.activeDot} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
