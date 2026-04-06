// IA de Conteúdo — Header Component
export function renderHeader(currentPage, onNavigate) {
  return `
    <header class="header" id="main-header">
      <div class="container header-inner">
        <div class="header-logo" id="logo-home">
          <span>🧠</span>
          <span>IA de Conteúdo</span>
        </div>
        <nav class="header-nav">
          <button class="nav-btn ${currentPage === 'home' ? 'active' : ''}" data-page="home" id="nav-home">
            📊 Novo Análise
          </button>
          <button class="nav-btn ${currentPage === 'dashboard' ? 'active' : ''}" data-page="dashboard" id="nav-dashboard">
            🏆 Resultados
          </button>
          <button class="nav-btn ${currentPage === 'ideas' ? 'active' : ''}" data-page="ideas" id="nav-ideas">
            💡 Ideias
          </button>
        </nav>
      </div>
    </header>
  `;
}

export function bindHeaderEvents(onNavigate) {
  document.getElementById('logo-home')?.addEventListener('click', () => onNavigate('home'));
  document.querySelectorAll('.nav-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => onNavigate(btn.dataset.page));
  });
}
