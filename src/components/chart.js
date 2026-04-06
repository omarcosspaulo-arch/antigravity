// IA de Conteúdo — Chart Component (CSS-based bar chart)
import { formatNumber, getPostTypeEmoji } from '../utils/helpers.js';

export function renderBarChart(posts, metric = 'score') {
  if (!posts || posts.length === 0) return '';
  
  const maxVal = Math.max(...posts.map(p => p[metric] || 0));
  
  return `
    <div class="bar-chart">
      ${posts.slice(0, 10).map((post, i) => {
        const val = post[metric] || 0;
        const height = maxVal > 0 ? (val / maxVal) * 100 : 0;
        const color = i < 3 ? 'green' : i < 7 ? 'purple' : 'red';
        const emoji = getPostTypeEmoji(post.type);
        return `
          <div class="bar-item">
            <div class="bar-value">${formatNumber(val)}</div>
            <div class="bar ${color}" style="height: ${Math.max(height, 5)}%;" title="${post.description || 'Post ' + (i+1)}"></div>
            <div class="bar-label">${emoji} #${i + 1}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
