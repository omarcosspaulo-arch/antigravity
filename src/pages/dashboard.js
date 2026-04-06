// IA de Conteúdo — Dashboard Page (Results)
import { renderPostCard } from '../components/postCard.js';
import { renderMetricCard } from '../components/metricBadge.js';
import { renderBarChart } from '../components/chart.js';
import { formatNumber, rankPosts, getTopPosts, getFlopPosts } from '../utils/helpers.js';

export function renderDashboardPage(state) {
  const analysis = state.analysis;
  if (!analysis) {
    return `
      <main class="container" style="padding: var(--space-3xl) 0;">
        <div class="empty-state">
          <div class="empty-state-icon">📊</div>
          <h2 class="empty-state-title">Nenhuma análise ainda</h2>
          <p class="empty-state-text">Adicione seus conteúdos e clique em "Analisar com IA" para ver os resultados aqui.</p>
          <button class="btn btn-primary" id="go-home-btn" style="margin-top: var(--space-lg);">📋 Ir para Input de Dados</button>
        </div>
      </main>
    `;
  }

  const posts = state.posts || [];
  const ranked = rankPosts(posts);
  const topPosts = getTopPosts(posts);
  const flopPosts = getFlopPosts(posts);
  
  const totalLikes = posts.reduce((s, p) => s + (p.likes || 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.comments || 0), 0);
  const totalShares = posts.reduce((s, p) => s + (p.shares || 0), 0);
  const totalViews = posts.reduce((s, p) => s + (p.views || 0), 0);
  const avgEngagement = posts.length > 0 
    ? ((totalLikes + totalComments + totalShares) / posts.length).toFixed(0)
    : 0;
  
  const activeTab = state.dashboardTab || 'overview';

  return `
    <main class="container" style="padding-bottom: var(--space-3xl);">
      <!-- Profile Header -->
      <div style="padding: var(--space-2xl) 0 var(--space-lg);" class="animate-fade-in">
        <div style="display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-md);">
          <div style="width: 56px; height: 56px; border-radius: var(--radius-xl); background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
            ${state.platform === 'tiktok' ? '🎵' : '📸'}
          </div>
          <div>
            <h1 style="font-size: var(--text-2xl); font-weight: 800;">${state.profileName || 'Perfil'}</h1>
            <span class="badge badge-purple">${state.platform === 'tiktok' ? 'TikTok' : 'Instagram'} • ${posts.length} conteúdos analisados</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="dashboard-tabs animate-fade-in-up delay-1">
        <button class="tab-btn ${activeTab === 'overview' ? 'active' : ''}" data-tab="overview">📊 Visão Geral</button>
        <button class="tab-btn ${activeTab === 'top' ? 'active' : ''}" data-tab="top">🏆 Top Conteúdos</button>
        <button class="tab-btn ${activeTab === 'analysis' ? 'active' : ''}" data-tab="analysis">🧠 Análise da IA</button>
        <button class="tab-btn ${activeTab === 'flop' ? 'active' : ''}" data-tab="flop">🗑️ Não Funcionaram</button>
      </div>

      <!-- Tab Content -->
      ${activeTab === 'overview' ? renderOverviewTab(ranked, totalLikes, totalComments, totalShares, totalViews, avgEngagement) : ''}
      ${activeTab === 'top' ? renderTopTab(topPosts, analysis) : ''}
      ${activeTab === 'analysis' ? renderAnalysisTab(analysis) : ''}
      ${activeTab === 'flop' ? renderFlopTab(flopPosts, analysis) : ''}
    </main>
  `;
}

function renderOverviewTab(ranked, totalLikes, totalComments, totalShares, totalViews, avgEngagement) {
  return `
    <div class="animate-fade-in-up">
      <!-- Metrics Grid -->
      <div class="grid-4" style="margin-bottom: var(--space-2xl);">
        ${renderMetricCard('Total de Curtidas', totalLikes, '❤️', 'warm')}
        ${renderMetricCard('Total de Comentários', totalComments, '💬', 'primary')}
        ${renderMetricCard('Total de Compartilh.', totalShares, '🔄', 'success')}
        ${renderMetricCard('Média de Engajamento', avgEngagement, '📈', 'primary')}
      </div>

      <!-- Performance Chart -->
      <div class="glass-card-static" style="margin-bottom: var(--space-2xl);">
        <h3 style="font-size: var(--text-lg); margin-bottom: var(--space-md); display: flex; align-items: center; gap: 8px;">
          📊 Score de Performance (Top 10)
        </h3>
        <p style="font-size: var(--text-xs); color: var(--text-muted); margin-bottom: var(--space-md);">
          Score calculado por: curtidas × 1 + comentários × 3 + compartilhamentos × 5 + salvos × 4 + views × 0.1
        </p>
        ${renderBarChart(ranked, 'score')}
      </div>

      <!-- Quick Ranking -->
      <div class="glass-card-static">
        <h3 style="font-size: var(--text-lg); margin-bottom: var(--space-lg); display: flex; align-items: center; gap: 8px;">
          🏅 Ranking Completo
        </h3>
        <div style="display: flex; flex-direction: column; gap: var(--space-md);">
          ${ranked.map((post, i) => renderPostCard(post, i, i < Math.ceil(ranked.length * 0.3) ? 'top' : 'flop')).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderTopTab(topPosts, analysis) {
  return `
    <div class="animate-fade-in-up">
      <div class="section-header">
        <div>
          <h2 class="section-title">🏆 Conteúdos que Viralizaram</h2>
          <p class="section-subtitle">Os posts com melhor performance do seu perfil</p>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: var(--space-md); margin-bottom: var(--space-2xl);">
        ${topPosts.map((post, i) => renderPostCard(post, i, 'top')).join('')}
      </div>

      ${analysis.topAnalysis ? `
        <div class="ai-analysis">
          <h3 class="ai-analysis-title">Por que esses conteúdos funcionaram?</h3>
          <div class="ai-analysis-text">${formatAIText(analysis.topAnalysis)}</div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderAnalysisTab(analysis) {
  return `
    <div class="animate-fade-in-up">
      <div class="section-header">
        <div>
          <h2 class="section-title">🧠 Análise Completa da IA</h2>
          <p class="section-subtitle">Insights detalhados sobre seu conteúdo</p>
        </div>
      </div>

      ${analysis.overallAnalysis ? `
        <div class="ai-analysis" style="margin-bottom: var(--space-xl);">
          <h3 class="ai-analysis-title">Visão Geral do Perfil</h3>
          <div class="ai-analysis-text">${formatAIText(analysis.overallAnalysis)}</div>
        </div>
      ` : ''}

      ${analysis.patterns ? `
        <div class="ai-analysis" style="margin-bottom: var(--space-xl);">
          <h3 class="ai-analysis-title">Padrões Identificados</h3>
          <div class="ai-analysis-text">${formatAIText(analysis.patterns)}</div>
        </div>
      ` : ''}

      ${analysis.topAnalysis ? `
        <div class="ai-analysis" style="margin-bottom: var(--space-xl);">
          <h3 class="ai-analysis-title">Por Que os Top Posts Viralizaram</h3>
          <div class="ai-analysis-text">${formatAIText(analysis.topAnalysis)}</div>
        </div>
      ` : ''}

      ${analysis.flopAnalysis ? `
        <div class="ai-analysis">
          <h3 class="ai-analysis-title">Por Que os Piores Não Funcionaram</h3>
          <div class="ai-analysis-text">${formatAIText(analysis.flopAnalysis)}</div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderFlopTab(flopPosts, analysis) {
  return `
    <div class="animate-fade-in-up">
      <div class="section-header">
        <div>
          <h2 class="section-title">🗑️ Conteúdos que Não Funcionaram</h2>
          <p class="section-subtitle">Estes tiveram os piores resultados — a IA explica o porquê</p>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: var(--space-md); margin-bottom: var(--space-2xl);">
        ${flopPosts.map((post, i) => `
          <div class="flop-card">${renderPostCard(post, i, 'flop')}</div>
        `).join('')}
      </div>

      ${analysis.flopAnalysis ? `
        <div class="ai-analysis" style="border-color: rgba(239, 68, 68, 0.3);">
          <h3 class="ai-analysis-title" style="color: var(--accent-red);">❌ O que deu errado?</h3>
          <div class="ai-analysis-text">${formatAIText(analysis.flopAnalysis)}</div>
        </div>
      ` : ''}
    </div>
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

export function bindDashboardEvents(state, setState, onNavigate) {
  // Tab navigation
  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      setState({ ...state, dashboardTab: btn.dataset.tab }, true);
    });
  });
  
  // Go home button (empty state)
  document.getElementById('go-home-btn')?.addEventListener('click', () => onNavigate('home'));
}
