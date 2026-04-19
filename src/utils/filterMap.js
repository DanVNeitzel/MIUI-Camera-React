/** CSS filter string for each filter preset */
export const FILTER_CSS = {
  none:   '',
  vivid:  'saturate(1.65) contrast(1.1)',
  soft:   'contrast(0.88) brightness(1.07) saturate(0.88)',
  bw:     'grayscale(1)',
  warm:   'sepia(0.28) saturate(1.35) brightness(1.04)',
  cool:   'hue-rotate(18deg) saturate(0.88) brightness(1.03)',
  fade:   'contrast(0.8) brightness(1.14) saturate(0.75)',
};

/** Filter metadata for UI rendering */
export const FILTERS = [
  {
    id: 'none',
    label: 'Nenhum',
    // gradient shown in swatch (colors chosen to make the filter effect obvious)
    gradient: 'linear-gradient(135deg, #e83e8c 0%, #f97316 50%, #06b6d4 100%)',
  },
  {
    id: 'vivid',
    label: 'Vívido',
    gradient: 'linear-gradient(135deg, #e83e8c 0%, #f97316 50%, #06b6d4 100%)',
  },
  {
    id: 'soft',
    label: 'Suave',
    gradient: 'linear-gradient(135deg, #e83e8c 0%, #f97316 50%, #06b6d4 100%)',
  },
  {
    id: 'bw',
    label: 'P&B',
    gradient: 'linear-gradient(135deg, #e83e8c 0%, #f97316 50%, #06b6d4 100%)',
  },
  {
    id: 'warm',
    label: 'Quente',
    gradient: 'linear-gradient(135deg, #e83e8c 0%, #f97316 50%, #06b6d4 100%)',
  },
  {
    id: 'cool',
    label: 'Frio',
    gradient: 'linear-gradient(135deg, #e83e8c 0%, #f97316 50%, #06b6d4 100%)',
  },
  {
    id: 'fade',
    label: 'Desbotado',
    gradient: 'linear-gradient(135deg, #e83e8c 0%, #f97316 50%, #06b6d4 100%)',
  },
];
