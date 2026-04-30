import { useState } from 'react';
import styles from './ZoomControl.module.css';

const PRESETS = [
  { label: '1×', value: 1 },
  { label: '2×', value: 2 },
  { label: '5×', value: 5 },
];

function formatZoom(zoom) {
  if (zoom < 1) return `${zoom.toFixed(1)}×`;
  if (Number.isInteger(zoom)) return `${zoom}×`;
  return `${zoom.toFixed(1)}×`;
}

export default function ZoomControl({ zoom, onZoomChange }) {
  const [showSlider, setShowSlider] = useState(false);

  const handlePreset = (value) => {
    onZoomChange(value);
    setShowSlider(false);
  };

  const handleZoomBadgeClick = () => {
    setShowSlider((prev) => !prev);
  };

  // Logarithmic scale: slider 0-100 ↔ zoom 1-8
  // Gives finer control in the 1×-3× range, like real camera optics
  const LOG_MIN = Math.log(1);
  const LOG_MAX = Math.log(8);
  const sliderValue = ((Math.log(zoom) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100;

  const handleSlider = (e) => {
    const pct = Number(e.target.value);
    const newZoom = Math.exp(LOG_MIN + (pct / 100) * (LOG_MAX - LOG_MIN));
    onZoomChange(newZoom);
  };

  return (
    <div className={styles.wrapper}>
      {showSlider && (
        <div className={styles.sliderContainer}>
          <span className={styles.sliderMin}>1×</span>
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={sliderValue}
            onChange={handleSlider}
            className={styles.slider}
            aria-label="Controle de zoom"
          />
          <span className={styles.sliderMax}>8×</span>
        </div>
      )}

      <div className={styles.presets}>
        {PRESETS.map((p) => {
          const isActive = Math.abs(zoom - p.value) < 0.15;
          return (
            <button
              key={p.value}
              className={`${styles.presetBtn} ${isActive ? styles.presetActive : ''}`}
              onClick={() => handlePreset(p.value)}
              aria-label={`Zoom ${p.label}`}
            >
              {isActive ? formatZoom(zoom) : p.label}
            </button>
          );
        })}
        <button
          className={`${styles.presetBtn} ${styles.sliderToggle}`}
          onClick={handleZoomBadgeClick}
          aria-label="Mostrar slider de zoom"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
