// Shared design tokens — match Streamlit palette exactly
export const P = {
  bg:      '#0D1117',
  card:    '#161B22',
  border:  '#30363D',
  accent:  '#58A6FF',
  green:   '#3FB950',
  orange:  '#F78166',
  yellow:  '#E3B341',
  purple:  '#BC8CFF',
  teal:    '#39D0D8',
  red:     '#FF6B6B',
  text:    '#E6EDF3',
  muted:   '#8B949E',
  moringa: '#2EA043',
  tannin:  '#C06A2D',
  genetic: '#1B7FC4',
  solar:   '#D4A017',
};

export const MODEL_COLORS = {
  'Random Forest':             '#3FB950',
  'Gradient Boosting':         '#58A6FF',
  'Logistic/Ridge Regression': '#E3B341',
  'Deep Learning (MLP/DNN)':   '#BC8CFF',
  'CNN-Equivalent':            '#39D0D8',
  'RNN-Equivalent':            '#F78166',
};

export const MODEL_ICONS = {
  'Random Forest':             '🌲',
  'Gradient Boosting':         '⚡',
  'Logistic/Ridge Regression': '📈',
  'Deep Learning (MLP/DNN)':   '🧠',
  'CNN-Equivalent':            '🔬',
  'RNN-Equivalent':            '🔄',
};

export const INT_COLORS = {
  Moringa: '#2EA043',
  Tannin:  '#C06A2D',
  Genetic: '#1B7FC4',
  Solar:   '#D4A017',
};

export const INT_ICONS = {
  Moringa: '🌿',
  Tannin:  '🍂',
  Genetic: '🧬',
  Solar:   '☀️',
};

// Base Plotly layout (dark theme)
export const plotLayout = {
  paper_bgcolor: P.card,
  plot_bgcolor:  P.bg,
  font: { family: "'JetBrains Mono','Fira Code',monospace", color: P.text, size: 11 },
  margin: { l: 48, r: 20, t: 44, b: 40 },
  xaxis: { gridcolor: P.border, showgrid: true, zeroline: false },
  yaxis: { gridcolor: P.border, showgrid: true, zeroline: false },
  legend: { bgcolor: 'rgba(0,0,0,0)', bordercolor: P.border },
  hoverlabel: { bgcolor: P.card, bordercolor: P.accent, font: { color: P.text } },
};

export function pl(overrides = {}) {
  return { ...plotLayout, ...overrides };
}

export function hexToRgba(hex, alpha = 1) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
