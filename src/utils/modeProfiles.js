/**
 * Characteristics for each camera mode.
 *
 * previewFilter  — CSS filter applied live to the video element
 * captureQuality — override photo quality ('low'|'medium'|'high'|'max'|null=use settings)
 * multiFrame     — number of frames to stack (>1 = noise reduction, e.g. night mode)
 * vignette       — show dark-edge bokeh vignette overlay (portrait mode)
 * proControls    — show manual EV/WB/ISO panel (pro mode)
 * badge          — short label shown as HUD badge above shutter (null = none)
 * badgeIcon      — emoji or SVG string shown alongside badge label
 */
export const MODE_PROFILES = {
  foto: {
    previewFilter:  '',
    captureQuality: null,
    multiFrame:     1,
    vignette:       false,
    proControls:    false,
    badge:          null,
    badgeIcon:      null,
  },
  noturno: {
    previewFilter:  'brightness(1.42) contrast(0.85) saturate(0.72)',
    captureQuality: 'max',
    multiFrame:     4,       // 4-frame pixel-averaging reduces sensor noise
    vignette:       false,
    proControls:    false,
    badge:          'Modo Noturno',
    badgeIcon:      '☾',
  },
  retrato: {
    previewFilter:  'contrast(1.07) saturate(1.22) brightness(1.03)',
    captureQuality: 'high',
    multiFrame:     1,
    vignette:       true,    // simulated shallow depth-of-field via dark-edge overlay
    proControls:    false,
    badge:          'Retrato',
    badgeIcon:      '◉',
  },
  pro: {
    previewFilter:  '',      // computed dynamically from EV + WB sliders
    captureQuality: null,
    multiFrame:     1,
    vignette:       false,
    proControls:    true,    // show manual controls panel
    badge:          'PRO',
    badgeIcon:      null,
  },
  video: {
    previewFilter:  '',
    captureQuality: null,
    multiFrame:     1,
    vignette:       false,
    proControls:    false,
    isVideo:        true,
    badge:          null,
    badgeIcon:      null,
  },
  mais: {
    previewFilter:  '',
    captureQuality: null,
    multiFrame:     1,
    vignette:       false,
    proControls:    false,
    badge:          null,
    badgeIcon:      null,
  },
  panorama: {
    previewFilter:  '',
    captureQuality: 'max',
    multiFrame:     1,
    vignette:       false,
    proControls:    false,
    badge:          'Panorama',
    badgeIcon:      '⟺',
  },
  lento: {
    previewFilter:  '',
    captureQuality: null,
    multiFrame:     1,
    vignette:       false,
    proControls:    false,
    isVideo:        true,
    slowMotion:     true,   // request high framerate from camera stream
    badge:          'Câmera lenta',
    badgeIcon:      '⏱',
  },
  timelapse: {
    previewFilter:  'saturate(1.15) contrast(1.05)',
    captureQuality: 'high',
    multiFrame:     1,
    vignette:       false,
    proControls:    false,
    isVideo:        true,
    timelapse:      true,        // canvas interval-based recording
    timelapseMs:    1000,        // ms between captured frames (30x speedup at 30fps output)
    badge:          'Time-lapse',
    badgeIcon:      '⏩',
  },
  documento: {
    previewFilter:  'contrast(1.35) saturate(0.15) brightness(1.1)',
    captureQuality: 'max',
    multiFrame:     1,
    vignette:       false,
    proControls:    false,
    badge:          'Documento',
    badgeIcon:      '📄',
  },
};

/**
 * Compute a CSS filter string for PRO mode from EV and color temperature.
 * @param {number} ev   — exposure value [-2, +2]
 * @param {number} wb   — color temperature in Kelvin [2000, 8000]
 */
export function computeProFilter(ev, wb) {
  const brightness = (1 + ev * 0.25).toFixed(2);
  let wbPart = '';

  if (wb < 5500) {
    // warm (low K) → sepia tint
    const t = (5500 - wb) / 3500;
    wbPart = `sepia(${(t * 0.45).toFixed(2)}) saturate(${(1 + t * 0.15).toFixed(2)})`;
  } else if (wb > 5600) {
    // cool (high K) → blue tint via negative hue-rotate
    const t = (wb - 5600) / 2400;
    wbPart = `hue-rotate(${(-t * 20).toFixed(1)}deg) saturate(${(1 - t * 0.1).toFixed(2)})`;
  }

  return `brightness(${brightness})${wbPart ? ' ' + wbPart : ''}`;
}
