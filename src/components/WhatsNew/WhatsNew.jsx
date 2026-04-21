import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './WhatsNew.module.css';
import { useBackButton } from '../../hooks/useBackButton';
import { LATEST_VERSION, CHANGELOG } from '../../utils/changelog';

// ─── Persistence helpers ──────────────────────────────────────────────────────
const STORAGE_KEY = 'whatsNew_seen_' + LATEST_VERSION;

export function shouldShowWhatsNew() {
  try { return !localStorage.getItem(STORAGE_KEY); }
  catch { return true; }
}

function persistSeen() {
  try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
}

// Re-export so App.jsx import doesn't break
export { LATEST_VERSION };

// ─── Component ────────────────────────────────────────────────────────────────
const CURRENT = CHANGELOG[0]; // always the latest entry

export default function WhatsNew({ onClose }) {
  const [dontShow, setDontShow]   = useState(false);
  const [closing,  setClosing]    = useState(false);
  const btnRef                    = useRef(null);
  const titleId                   = 'whats-new-title';

  // #2 — Auto-persist on first display; user checkbox only controls future suppression
  useEffect(() => {
    persistSeen();
  }, []);

  // #5 — Move focus to the confirm button when the sheet opens
  useEffect(() => {
    const frame = requestAnimationFrame(() => btnRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

  // Animated close: play exit animation then call onClose
  const handleClose = useCallback(() => {
    setClosing(true);
  }, []);

  const handleAnimationEnd = useCallback((e) => {
    // Only react to the sheet's own slideDown animation
    if (e.animationName === 'whatsNewSlideDown' && closing) {
      onClose();
    }
  }, [closing, onClose]);

  // #1 — Persist "don't show" whenever checkbox changes, not only on button click
  const handleCheckbox = useCallback((e) => {
    const checked = e.target.checked;
    setDontShow(checked);
    if (checked) {
      persistSeen();
    } else {
      // Un-checking = allow it to show next time (clear the flag)
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
    }
  }, []);

  // #6 — Back button handled inside the component
  useBackButton(true, handleClose);

  return (
    // #4 — Proper dialog semantics
    <div
      className={`${styles.backdrop} ${closing ? styles.backdropOut : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={handleClose}
    >
      <div
        className={`${styles.sheet} ${closing ? styles.sheetOut : ''}`}
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={handleAnimationEnd}
      >
        <div className={styles.header}>
          <span className={styles.badge}>Novidades</span>
          <span className={styles.version}>{LATEST_VERSION}</span>
        </div>

        {/* #4 — id for aria-labelledby */}
        <h2 id={titleId} className={styles.title}>O que há de novo?</h2>

        {/* #8 — scrollable list */}
        <ul className={styles.list}>
          {CURRENT.changes.map((c) => (
            <li key={c} className={styles.item}>
              <span className={styles.dot} aria-hidden="true">•</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>

        {/* #1 — checkbox persists immediately on change */}
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={dontShow}
            onChange={handleCheckbox}
          />
          <span>Não mostrar novamente</span>
        </label>

        {/* #5 — ref for initial focus */}
        <button ref={btnRef} className={styles.btn} onClick={handleClose}>
          Entendido
        </button>
      </div>
    </div>
  );
}
