import { useState } from 'react';
import styles from './WhatsNew.module.css';

export const LATEST_VERSION = 'v1.0.5';
const STORAGE_KEY = 'whatsNew_seen_' + LATEST_VERSION;

export function shouldShowWhatsNew() {
  try { return !localStorage.getItem(STORAGE_KEY); }
  catch { return true; }
}

export function markWhatsNewSeen() {
  try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
}

const CHANGES = [
  'Modal "O que há de novo" exibido na primeira abertura com opção de não mostrar novamente',
  'Modo MAIS: sheet com modos extras — Panorama, Câmera lenta, Time-lapse e Documento',
  'Modos extras: perfis de filtro e qualidade dedicados para cada modo',
  'Indicador amarelo em "MAIS" quando um modo extra está ativo',
  'Botão Voltar do Android fecha o sheet de modos extras',
];

export default function WhatsNew({ onClose }) {
  const [dontShow, setDontShow] = useState(false);

  const handleClose = () => {
    if (dontShow) markWhatsNewSeen();
    onClose();
  };

  return (
    <div className={styles.backdrop} onClick={handleClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.badge}>Novidades</span>
          <span className={styles.version}>{LATEST_VERSION}</span>
        </div>

        <h2 className={styles.title}>O que há de novo?</h2>

        <ul className={styles.list}>
          {CHANGES.map((c) => (
            <li key={c} className={styles.item}>
              <span className={styles.dot} aria-hidden="true">•</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>

        <label className={styles.checkRow}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
          />
          <span>Não mostrar novamente</span>
        </label>

        <button className={styles.btn} onClick={handleClose}>
          Entendido
        </button>
      </div>
    </div>
  );
}
