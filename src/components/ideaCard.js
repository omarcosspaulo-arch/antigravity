// IA de Conteúdo — Idea Card Component
export function renderIdeaCard(idea, index) {
  return `
    <div class="idea-card animate-scale-in delay-${Math.min(index + 1, 5)}" id="idea-${index}">
      <div class="idea-number">${index + 1}</div>
      <h3 class="idea-title">${idea.title || `Ideia ${index + 1}`}</h3>
      <div class="idea-format">
        <span class="badge badge-cyan">${idea.format || 'Reel'}</span>
        ${idea.platform ? `<span class="badge badge-purple" style="margin-left: 4px;">${idea.platform}</span>` : ''}
      </div>
      <p class="idea-description">${idea.description || ''}</p>
      ${idea.hook ? `
        <div style="background: var(--bg-glass); padding: 12px 16px; border-radius: var(--radius-md); border-left: 3px solid var(--accent-cyan); margin-bottom: var(--space-md);">
          <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">🎣 Hook sugerido</div>
          <p style="font-size: 0.85rem; color: var(--text-primary); font-style: italic;">"${idea.hook}"</p>
        </div>
      ` : ''}
      ${idea.hashtags && idea.hashtags.length > 0 ? `
        <div class="idea-hashtags">
          ${idea.hashtags.map(tag => `<span class="hashtag">${tag.startsWith('#') ? tag : '#' + tag}</span>`).join('')}
        </div>
      ` : ''}
    </div>
  `;
}
