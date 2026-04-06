// IA de Conteúdo — Ideas Page
import { renderIdeaCard } from '../components/ideaCard.js';

export function renderIdeasPage(state) {
  const ideas = state.ideas;
  
  if (!ideas || ideas.length === 0) {
    return `
      <main class="container" style="padding: var(--space-3xl) 0;">
        <div class="empty-state">
          <div class="empty-state-icon">💡</div>
          <h2 class="empty-state-title">Nenhuma ideia gerada</h2>
          <p class="empty-state-text">Primeiro faça a análise dos seus conteúdos. As ideias são geradas automaticamente baseadas nos padrões do que funcionou.</p>
          <button class="btn btn-primary" id="go-home-btn" style="margin-top: var(--space-lg);">📋 Ir para Input de Dados</button>
        </div>
      </main>
    `;
  }

  return `
    <main class="container" style="padding-bottom: var(--space-3xl);">
      <div style="padding: var(--space-2xl) 0;" class="animate-fade-in">
        <div class="section-header">
          <div>
            <h1 class="section-title" style="font-size: var(--text-3xl);">💡 5 Novas Ideias de Conteúdo</h1>
            <p class="section-subtitle" style="margin-top: 4px;">
              Geradas pela IA baseadas nos padrões dos seus conteúdos que mais viralizaram
            </p>
          </div>
          <button class="btn btn-secondary" id="btn-regenerate">
            🔄 Gerar Novas Ideias
          </button>
        </div>
      </div>

      ${state.analysis?.ideaRationale ? `
        <div class="ai-analysis animate-fade-in-up" style="margin-bottom: var(--space-2xl);">
          <h3 class="ai-analysis-title">🎯 Lógica por trás das ideias</h3>
          <div class="ai-analysis-text">${formatAIText(state.analysis.ideaRationale)}</div>
        </div>
      ` : ''}

      <div class="grid-2" style="margin-bottom: var(--space-2xl);">
        ${ideas.slice(0, 4).map((idea, i) => renderIdeaCard(idea, i)).join('')}
      </div>
      
      ${ideas.length > 4 ? `
        <div style="max-width: 600px; margin: 0 auto;">
          ${renderIdeaCard(ideas[4], 4)}
        </div>
      ` : ''}

      <div style="text-align: center; padding: var(--space-2xl) 0;" class="animate-fade-in-up delay-5">
        <p style="color: var(--text-muted); font-size: var(--text-sm); margin-bottom: var(--space-md);">
          Gostou das ideias? Quando produzir, volte e adicione os resultados para continuar otimizando!
        </p>
        <button class="btn btn-ghost" id="btn-back-input">
          ← Voltar para Input de Dados
        </button>
      </div>
    </main>
  `;
}

function formatAIText(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n- /g, '<br>• ')
    .replace(/\n(\d+)\. /g, '<br>$1. ')
    .replace(/\n/g, '<br>');
}

export function bindIdeasEvents(state, setState, onNavigate, onRegenerate) {
  document.getElementById('go-home-btn')?.addEventListener('click', () => onNavigate('home'));
  document.getElementById('btn-back-input')?.addEventListener('click', () => onNavigate('home'));
  document.getElementById('btn-regenerate')?.addEventListener('click', () => {
    if (onRegenerate) onRegenerate();
  });
}
