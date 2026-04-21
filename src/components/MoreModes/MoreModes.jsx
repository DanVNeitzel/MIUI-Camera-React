import styles from './MoreModes.module.css';

export const MORE_MODES = [
  {
    id: 'panorama',
    label: 'Panorama',
    icon: '⟺',
    description: 'Foto panorâmica 180°',
  },
  {
    id: 'lento',
    label: 'Câmera lenta',
    icon: '⏱',
    description: 'Vídeo em câmera lenta',
  },
  {
    id: 'timelapse',
    label: 'Time-lapse',
    icon: '⏩',
    description: 'Vídeo em lapso de tempo',
  },
  {
    id: 'documento',
    label: 'Documento',
    icon: '📄',
    description: 'Digitaliza documentos e textos',
  },
];

export default function MoreModes({ activeMode, onSelect, onClose }) {
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />
        <p className={styles.title}>Mais modos</p>
        <div className={styles.grid}>
          {MORE_MODES.map((m) => {
            const isActive = activeMode === m.id;
            return (
              <button
                key={m.id}
                className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
                onClick={() => { onSelect(m.id); onClose(); }}
                aria-pressed={isActive}
                aria-label={m.label}
              >
                <span className={styles.cardIcon}>{m.icon}</span>
                <span className={styles.cardLabel}>{m.label}</span>
                <span className={styles.cardDesc}>{m.description}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
