import styles from './ProControls.module.css';

const ISO_PRESETS = [
  { label: 'A', value: 0 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
  { label: '200', value: 200 },
  { label: '400', value: 400 },
  { label: '800', value: 800 },
  { label: '1600', value: 1600 },
  { label: '3200', value: 3200 },
];

// exposureTime in 100µs units (per MediaCapture spec)
const SS_PRESETS = [
  { label: 'A',      value: 0     },
  { label: '1/4000', value: 3     },
  { label: '1/2000', value: 5     },
  { label: '1/1000', value: 10    },
  { label: '1/500',  value: 20    },
  { label: '1/250',  value: 40    },
  { label: '1/125',  value: 80    },
  { label: '1/60',   value: 167   },
  { label: '1/30',   value: 333   },
  { label: '1/15',   value: 667   },
  { label: '1/8',    value: 1250  },
  { label: '1/4',    value: 2500  },
  { label: '1"',     value: 10000 },
  { label: '2"',     value: 20000 },
  { label: '4"',     value: 40000 },
  { label: '8"',     value: 80000 },
];

export default function ProControls({ ev, wb, iso, shutter, onEvChange, onWbChange, onIsoChange, onShutterChange }) {
  return (
    <div className={styles.panel}>

      {/* EV — Exposure Value */}
      <div className={styles.sliderRow}>
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

      <div className={styles.rowDivider} />

      {/* WB — Color Temperature */}
      <div className={styles.sliderRow}>
        <div className={styles.labelGroup}>
          <span className={styles.paramName}>WB</span>
          <span className={styles.paramValue}>{wb}K</span>
        </div>
        <div className={styles.sliderTrack}>
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

      <div className={styles.rowDivider} />

      {/* ISO — interactive chip picker */}
      <div className={styles.chipRow}>
        <span className={styles.chipLabel}>ISO</span>
        <div className={styles.chipList}>
          {ISO_PRESETS.map((p) => (
            <button
              key={p.value}
              className={`${styles.chip} ${iso === p.value ? styles.chipActive : ''}`}
              onClick={() => onIsoChange(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.rowDivider} />

      {/* Shutter speed — interactive chip picker */}
      <div className={styles.chipRow}>
        <span className={styles.chipLabel}>SS</span>
        <div className={styles.chipList}>
          {SS_PRESETS.map((p) => (
            <button
              key={p.value}
              className={`${styles.chip} ${shutter === p.value ? styles.chipActive : ''}`}
              onClick={() => onShutterChange(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
