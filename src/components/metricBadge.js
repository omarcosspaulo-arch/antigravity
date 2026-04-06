// IA de Conteúdo — Metric Badge Component
import { formatNumber } from '../utils/helpers.js';

export function renderMetricCard(label, value, icon, color = 'purple') {
  return `
    <div class="metric-card">
      <span class="metric-label">${icon} ${label}</span>
      <span class="metric-value" style="background: var(--gradient-${color === 'success' ? 'success' : color === 'warm' ? 'warm' : 'primary'}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
        ${typeof value === 'number' ? formatNumber(value) : value}
      </span>
    </div>
  `;
}
