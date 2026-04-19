import styles from './ProControls.module.css';

export default function ProControls({ ev, wb, iso, onEvChange, onWbChange }) {
  // Derived ISO from EV: brighter EV = lower ISO needed (cosmetic display only)
  const displayISO = Math.round(100 * Math.pow(2, -ev));

  return (
    <div className={styles.panel}>

      {/* EV — Exposure Value */}
      <div className={styles.row}>
        <div className={styles.labelGroup}>
          <span className={styles.paramName}>EV</span>
          <span className={styles.paramValue}>{ev > 0 ? `+${ev.toFixed(1)}` : ev.toFixed(1)}</span>
        </div>
        <div className={styles.sliderTrack}>
          <div
            className={styles.sliderFill}
            style={{ width: `${((ev + 2) / 4) * 100}%` }}
          />
          <input
            type="range"
            className={styles.slider}
            min="-2"
            max="2"
            step="0.1"
            value={ev}
            onChange={(e) => onEvChange(parseFloat(e.target.value))}
            aria-label="Exposição"
          />
        </div>
      </div>

      {/* Divider */}
      <div className={styles.divider} />

      {/* WB — Color Temperature */}
      <div className={styles.row}>
        <div className={styles.labelGroup}>
          <span className={styles.paramName}>WB</span>
          <span className={styles.paramValue}>{wb}K</span>
        </div>
        <div className={styles.sliderTrack}>
          {/* Warm → Cool gradient */}
          <div className={styles.wbGradient} />
          <input
            type="range"
            className={`${styles.slider} ${styles.sliderWb}`}
            min="2000"
            max="8000"
            step="100"
            value={wb}
            onChange={(e) => onWbChange(parseInt(e.target.value, 10))}
            aria-label="Temperatura de cor"
          />
        </div>
      </div>

      {/* Divider */}
      <div className={styles.divider} />

      {/* ISO — display only (derived) */}
      <div className={styles.row}>
        <div className={styles.labelGroup}>
          <span className={styles.paramName}>ISO</span>
          <span className={styles.paramValue}>{Math.min(3200, Math.max(50, displayISO))}</span>
        </div>
        {/* Shutter speed cosmetic display */}
        <div className={styles.labelGroup}>
          <span className={styles.paramName}>1/</span>
          <span className={styles.paramValue}>{Math.max(4, Math.round(500 * Math.pow(2, ev)))}</span>
        </div>
        <div className={styles.labelGroup}>
          <span className={styles.paramName}>f</span>
          <span className={styles.paramValue}>1.8</span>
        </div>
        {/* Histogram bar (cosmetic) */}
        <div className={styles.histoWrap}>
          {[0.15, 0.35, 0.55, 0.8, 0.65, 0.45, 0.3, 0.2, 0.12].map((h, i) => (
            <div
              key={i}
              className={styles.histoBar}
              style={{ height: `${h * 100}%` }}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
