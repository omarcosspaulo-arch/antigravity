// IA de Conteúdo — Main Entry Point (Router + State)
import './style.css';
import { renderHeader, bindHeaderEvents } from './components/header.js';
import { renderHomePage, bindHomeEvents } from './pages/home.js';
import { renderDashboardPage, bindDashboardEvents } from './pages/dashboard.js';
import { renderIdeasPage, bindIdeasEvents } from './pages/ideas.js';
import { analyzeContent, generateIdeas, checkHealth, scrapeProfile } from './utils/api.js';
import { showToast, rankPosts, getTopPosts, getFlopPosts } from './utils/helpers.js';

// ============ APP STATE ============
let state = {
  currentPage: 'home',
  profileName: '',
  platform: 'instagram',
  posts: [],
  analysis: null,
  ideas: null,
  isAnalyzing: false,
  dashboardTab: 'overview',
};

// Load saved state
const saved = localStorage.getItem('ia-conteudo-state');
if (saved) {
  try {
    const parsed = JSON.parse(saved);
    state = { ...state, ...parsed, isAnalyzing: false };
  } catch {}
}

// ============ STATE MANAGEMENT ============
function setState(newState, rerender = true) {
  state = { ...state, ...newState };
  // Save to localStorage (exclude transient state)
  const toSave = { ...state };
  delete toSave.isAnalyzing;
  localStorage.setItem('ia-conteudo-state', JSON.stringify(toSave));
  if (rerender) render();
}

function navigate(page) {
  // Don't navigate to dashboard/ideas without data
  if (page === 'dashboard' && !state.analysis) {
    showToast('Faça uma análise primeiro!', 'error');
    return;
  }
  if (page === 'ideas' && (!state.ideas || state.ideas.length === 0)) {
    showToast('Faça uma análise primeiro para gerar ideias!', 'error');
    return;
  }
  setState({ currentPage: page });
}

// ============ ANALYZE FLOW ============
async function handleAnalyze() {
  if (state.posts.length < 2) {
    showToast('Adicione pelo menos 2 posts para analisar', 'error');
    return;
  }

  setState({ isAnalyzing: true }, false);
  showAnalyzingOverlay();

  try {
    // Check server health first
    const isHealthy = await checkHealth();
    if (!isHealthy) {
      throw new Error('O servidor backend não está rodando. Inicie com: node server/index.js');
    }

    updateAnalyzingStep('Ranqueando posts por performance...');
    await sleep(500);

    const ranked = rankPosts(state.posts);
    const topPosts = getTopPosts(state.posts);
    const flopPosts = getFlopPosts(state.posts);

    updateAnalyzingStep('Enviando dados para a IA analisar...');
    
    const profileData = {
      profileName: state.profileName,
      platform: state.platform,
      posts: state.posts,
      topPosts,
      flopPosts,
      ranked,
    };

    const result = await analyzeContent(profileData);
    
    updateAnalyzingStep('Gerando ideias de conteúdo...');
    updateProgress(70);
    
    const ideasResult = await generateIdeas({
      profileName: state.profileName,
      platform: state.platform,
      topPosts,
      analysis: result.analysis,
    });

    updateProgress(100);
    await sleep(400);

    setState({
      analysis: result.analysis,
      ideas: ideasResult.ideas,
      isAnalyzing: false,
      currentPage: 'dashboard',
      dashboardTab: 'overview',
    });

    hideAnalyzingOverlay();
    showToast('Análise completa! 🎉', 'success');
  } catch (error) {
    console.error('Analysis error:', error);
    setState({ isAnalyzing: false }, false);
    hideAnalyzingOverlay();
    showToast(error.message || 'Erro ao analisar. Verifique se o servidor está rodando.', 'error');
  }
}

async function handleRegenerate() {
  setState({ isAnalyzing: true }, false);
  showAnalyzingOverlay();
  updateAnalyzingStep('Gerando novas ideias de conteúdo...');

  try {
    const topPosts = getTopPosts(state.posts);
    const ideasResult = await generateIdeas({
      profileName: state.profileName,
      platform: state.platform,
      topPosts,
      analysis: state.analysis,
    });

    updateProgress(100);
    await sleep(400);

    setState({
      ideas: ideasResult.ideas,
      isAnalyzing: false,
      currentPage: 'ideas',
    });

    hideAnalyzingOverlay();
    showToast('Novas ideias geradas! 💡', 'success');
  } catch (error) {
    setState({ isAnalyzing: false }, false);
    hideAnalyzingOverlay();
    showToast(error.message || 'Erro ao gerar ideias', 'error');
  }
}

// ============ ANALYZING OVERLAY ============
function showAnalyzingOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'analyzing-overlay';
  overlay.id = 'analyzing-overlay';
  overlay.innerHTML = `
    <div class="analyzing-spinner"></div>
    <div class="analyzing-text">Analisando conteúdos...</div>
    <div class="analyzing-step" id="analyzing-step">Preparando dados...</div>
    <div class="progress-bar">
      <div class="progress-fill" id="progress-fill" style="width: 10%;"></div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function updateAnalyzingStep(text) {
  const step = document.getElementById('analyzing-step');
  if (step) step.textContent = text;
}

function updateProgress(percent) {
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = `${percent}%`;
}

function hideAnalyzingOverlay() {
  document.getElementById('analyzing-overlay')?.remove();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============ SCRAPE FLOW ============
async function handleScrape() {
  if (!state.profileName) return;
  
  try {
    const isHealthy = await checkHealth();
    if (!isHealthy) {
      throw new Error('O servidor backend não está rodando. Inicie com: node server/index.js');
    }

    const { posts } = await scrapeProfile(state.platform, state.profileName);
    
    if (posts && posts.length > 0) {
      setState({ posts: [...(state.posts || []), ...posts] }, true);
      showToast(`${posts.length} posts coletados com sucesso!`, 'success');
    } else {
      showToast('Nenhum post encontrado pela API de extração.', 'warning');
    }
  } catch (error) {
    console.error('Scrape error:', error);
    showToast(error.message, 'error');
  }
}

// ============ RENDER ============
function render() {
  const app = document.getElementById('app');
  
  let pageContent = '';
  switch (state.currentPage) {
    case 'home':
      pageContent = renderHomePage(state);
      break;
    case 'dashboard':
      pageContent = renderDashboardPage(state);
      break;
    case 'ideas':
      pageContent = renderIdeasPage(state);
      break;
    default:
      pageContent = renderHomePage(state);
  }

  app.innerHTML = renderHeader(state.currentPage, navigate) + pageContent;

  // Bind events
  bindHeaderEvents(navigate);
  
  switch (state.currentPage) {
    case 'home':
      bindHomeEvents(state, setState, handleAnalyze, handleScrape);
      break;
    case 'dashboard':
      bindDashboardEvents(state, setState, navigate);
      break;
    case 'ideas':
      bindIdeasEvents(state, setState, navigate, handleRegenerate);
      break;
  }
}

// ============ INIT ============
render();
