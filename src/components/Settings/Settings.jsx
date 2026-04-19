import { useEffect, useRef } from 'react';
import { FILTERS, FILTER_CSS } from '../../utils/filterMap';
import styles from './Settings.module.css';

/* ─── Sub-components ─────────────────────────────────────── */

function SectionTitle({ children }) {
  return <p className={styles.sectionTitle}>{children}</p>;
}

function ChipGroup({ options, value, onChange }) {
  return (
    <div className={styles.chipGroup}>
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`${styles.chip} ${value === opt.value ? styles.chipActive : ''}`}
          onClick={() => onChange(opt.value)}
          type="button"
          aria-pressed={value === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SettingRow({ label, children }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      {children}
    </div>
  );
}

/* ─── Filter swatch strip ─────────────────────────────────── */

function FilterStrip({ value, onChange }) {
  return (
    <div className={styles.filterStrip}>
      {FILTERS.map((f) => {
        const isActive = value === f.id;
        return (
          <button
            key={f.id}
            className={`${styles.filterItem} ${isActive ? styles.filterItemActive : ''}`}
            onClick={() => onChange(f.id)}
            type="button"
            aria-pressed={isActive}
          >
            <div
              className={styles.filterSwatch}
              style={{
                background: f.gradient,
                filter: FILTER_CSS[f.id] || 'none',
              }}
            />
            <span className={styles.filterLabel}>{f.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Main Settings component ─────────────────────────────── */

export default function Settings({ settings, onUpdate, onClose }) {
  const sheetRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Trap focus inside sheet
  useEffect(() => {
    sheetRef.current?.focus();
  }, []);

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="presentation"
    >
      <div
        ref={sheetRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label="Configurações"
        tabIndex={-1}
      >
        {/* Handle bar */}
        <div className={styles.handle} aria-hidden="true" />

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.title}>Configurações</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className={styles.content}>

          {/* ── FOTO ────────────────────────── */}
          <SectionTitle>FOTO</SectionTitle>

          <SettingRow label="Qualidade">
            <ChipGroup
              options={[
                { value: 'low',    label: 'Baixa' },
                { value: 'medium', label: 'Média' },
                { value: 'high',   label: 'Alta' },
                { value: 'max',    label: 'Máx' },
              ]}
              value={settings.photoQuality}
              onChange={(v) => onUpdate('photoQuality', v)}
            />
          </SettingRow>

          <SettingRow label="Formato">
            <ChipGroup
              options={[
                { value: 'jpeg', label: 'JPEG' },
                { value: 'png',  label: 'PNG'  },
                { value: 'webp', label: 'WebP' },
              ]}
              value={settings.saveFormat}
              onChange={(v) => onUpdate('saveFormat', v)}
            />
          </SettingRow>

          {/* ── VÍDEO ───────────────────────── */}
          <SectionTitle>VÍDEO</SectionTitle>

          <SettingRow label="Resolução">
            <ChipGroup
              options={[
                { value: '720p',  label: '720p'  },
                { value: '1080p', label: '1080p' },
                { value: '4k',    label: '4K'    },
              ]}
              value={settings.videoResolution}
              onChange={(v) => onUpdate('videoResolution', v)}
            />
          </SettingRow>

          {/* ── COMPOSIÇÃO ──────────────────── */}
          <SectionTitle>COMPOSIÇÃO</SectionTitle>

          <SettingRow label="Grade">
            <ChipGroup
              options={[
                { value: 'none',    label: 'Nenhuma'  },
                { value: 'thirds',  label: 'Terços'   },
                { value: 'square',  label: 'Quadrado' },
                { value: 'both',    label: 'Ambas'    },
              ]}
              value={settings.gridType}
              onChange={(v) => onUpdate('gridType', v)}
            />
          </SettingRow>

          {/* ── FILTROS ─────────────────────── */}
          <SectionTitle>FILTROS</SectionTitle>

          <FilterStrip
            value={settings.filter}
            onChange={(v) => onUpdate('filter', v)}
          />

        </div>
      </div>
    </div>
  );
}
