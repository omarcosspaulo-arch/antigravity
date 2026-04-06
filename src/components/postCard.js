// IA de Conteúdo — Post Card Component
import { formatNumber, getPostTypeEmoji, calculateEngagementRate } from '../utils/helpers.js';

export function renderPostCard(post, index, type = 'top') {
  const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'normal';
  const cardClass = type === 'top' ? 'top' : 'flop';
  const emoji = getPostTypeEmoji(post.type);
  const engagement = calculateEngagementRate(post);
  
  return `
    <div class="post-card ${cardClass} animate-slide-in delay-${Math.min(index + 1, 5)}" id="post-${post.id}">
      <div class="post-rank ${type === 'top' ? rankClass : 'normal'}">
        ${type === 'top' ? `#${index + 1}` : '💀'}
      </div>
      <div class="post-content">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span class="badge ${type === 'top' ? 'badge-green' : 'badge-red'}">
            ${emoji} ${post.type || 'Post'}
          </span>
          <span class="badge badge-purple">
            ${engagement}% engajamento
          </span>
          ${post.date ? `<span style="font-size: 0.7rem; color: var(--text-muted);">📅 ${post.date}</span>` : ''}
        </div>
        <p class="post-description">${post.description || 'Sem descrição'}</p>
        <div class="post-metrics">
          <div class="post-metric">
            ❤️ <span class="post-metric-value">${formatNumber(post.likes || 0)}</span>
          </div>
          <div class="post-metric">
            💬 <span class="post-metric-value">${formatNumber(post.comments || 0)}</span>
          </div>
          <div class="post-metric">
            🔄 <span class="post-metric-value">${formatNumber(post.shares || 0)}</span>
          </div>
          <div class="post-metric">
            🔖 <span class="post-metric-value">${formatNumber(post.saves || 0)}</span>
          </div>
          ${post.views ? `
            <div class="post-metric">
              👁️ <span class="post-metric-value">${formatNumber(post.views)}</span>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}
