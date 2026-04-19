import styles from './LensSelector.module.css';

/**
 * Shows a row of focal-length pills for selecting among multiple rear cameras.
 * Only rendered when there are 2+ rear cameras and the user is on the back camera.
 */
export default function LensSelector({
  cameraList,
  selectedDeviceId,
  facingMode,
  onSelect,
}) {
  // Filter to rear cameras only
  const rearCameras = cameraList.filter((c) => !c.isFront);

  if (rearCameras.length < 2 || facingMode !== 'environment') return null;

  // Sort by a natural focal order: ultrawide → main → tele2 → tele
  const ORDER = { ultrawide: 0, main: 1, wide: 1, unknown: 1, tele2: 2, tele: 3 };
  const sorted = [...rearCameras].sort(
    (a, b) => (ORDER[a.type] ?? 1) - (ORDER[b.type] ?? 1)
  );

  // Deduplicate shortLabels so two 'main' cameras show as "1× (1)" / "1× (2)"
  const seen = {};
  const withLabels = sorted.map((cam) => {
    seen[cam.shortLabel] = (seen[cam.shortLabel] || 0) + 1;
    return { ...cam, _count: seen[cam.shortLabel] };
  });
  // Second pass: append index suffix if duplicated
  const counts = {};
  const labeled = withLabels.map((cam) => {
    counts[cam.shortLabel] = (counts[cam.shortLabel] || 0) + 1;
    const label =
      seen[cam.shortLabel] > 1
        ? `${cam.shortLabel} (${counts[cam.shortLabel]})`
        : cam.shortLabel;
    return { ...cam, displayLabel: label };
  });

  return (
    <div className={styles.strip} role="group" aria-label="Selecionar lente">
      {labeled.map((cam) => {
        const isActive = cam.deviceId === selectedDeviceId ||
          // When nothing is selected yet, highlight the 'main' camera
          (!selectedDeviceId && (cam.type === 'main' || cam.type === 'wide'));

        return (
          <button
            key={cam.deviceId}
            className={`${styles.pill} ${isActive ? styles.pillActive : ''}`}
            onClick={() => onSelect(cam.deviceId)}
            aria-pressed={isActive}
            title={cam.label || cam.displayLabel}
            type="button"
          >
            {cam.displayLabel}
          </button>
        );
      })}
    </div>
  );
}
