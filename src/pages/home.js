// IA de Conteúdo — Home Page (Data Input)
import { generateId, parseCSV, showToast, getPlatformEmoji } from '../utils/helpers.js';

export function renderHomePage(state) {
  const posts = state.posts || [];
  
  return `
    <main class="container" style="padding-bottom: var(--space-3xl);">
      <!-- Hero -->
      <section class="hero">
        <div class="hero-badge animate-fade-in">
          🧠 Alimentado por IA • Google Gemini
        </div>
        <h1 class="hero-title animate-fade-in-up">
          Descubra o que <span class="gradient-text">viraliza</span> no seu perfil
        </h1>
        <p class="hero-subtitle animate-fade-in-up delay-1">
          Analise seus conteúdos de Instagram e TikTok, entenda o que funciona,
          descarte o que não deu certo e receba 5 novas ideias baseadas nos seus hits.
        </p>
      </section>

      <!-- Config -->
      <div class="glass-card-static animate-fade-in-up delay-2" style="margin-bottom: var(--space-xl);">
        <h2 style="font-size: var(--text-lg); margin-bottom: var(--space-lg); display: flex; align-items: center; gap: 8px;">
          ⚙️ Configuração do Perfil
        </h2>
        <div class="config-panel">
          <div class="input-group">
            <label class="input-label">Nome do perfil</label>
            <input type="text" class="input" id="profile-name" placeholder="@seuperfil" value="${state.profileName || ''}">
          </div>
          <div class="input-group">
            <label class="input-label">Plataforma</label>
            <div class="platform-selector" id="platform-selector">
              <button class="platform-btn ${state.platform === 'instagram' ? 'selected' : ''}" data-platform="instagram">
                📸 Instagram
              </button>
              <button class="platform-btn ${state.platform === 'tiktok' ? 'selected' : ''}" data-platform="tiktok">
                🎵 TikTok
              </button>
            </div>
          </div>
        </div>
        <div style="margin-top: 16px;">
          <button class="btn btn-secondary" id="btn-scrape" style="width: 100%;">
            🔍 Buscar Posts Automaticamente (Leva ~15s)
          </button>
        </div>
      </div>

      <!-- Data Input Methods -->
      <div class="glass-card-static animate-fade-in-up delay-3" style="margin-bottom: var(--space-xl);">
        <div class="section-header">
          <div>
            <h2 class="section-title">📋 Dados dos Conteúdos</h2>
            <p class="section-subtitle">Adicione seus posts manualmente ou importe um CSV</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-ghost" id="btn-import-csv">
              📁 Importar CSV
            </button>
            <button class="btn btn-ghost" id="btn-load-example">
              ✨ Carregar Exemplo
            </button>
            <button class="btn btn-secondary" id="btn-add-row">
              + Adicionar Post
            </button>
          </div>
        </div>

        <input type="file" id="csv-input" accept=".csv,.json" style="display: none;">

        <!-- Upload Area (shown when no posts) -->
        ${posts.length === 0 ? `
          <div class="upload-area" id="upload-area">
            <div class="upload-icon">📤</div>
            <p class="upload-text">
              Arraste um arquivo <strong>CSV</strong> aqui ou clique para importar
            </p>
            <p style="font-size: 0.7rem; color: var(--text-muted); margin-top: 8px;">
              Colunas: tipo, descricao, curtidas, comentarios, compartilhamentos, salvos, visualizacoes, data
            </p>
          </div>
        ` : ''}

        <!-- Data Table -->
        ${posts.length > 0 ? `
          <div class="data-table-wrapper">
            <table class="data-table" id="posts-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Descrição / Legenda</th>
                  <th>❤️ Curtidas</th>
                  <th>💬 Comentários</th>
                  <th>🔄 Compartilh.</th>
                  <th>🔖 Salvos</th>
                  <th>👁️ Views</th>
                  <th>📅 Data</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${posts.map((post, i) => `
                  <tr data-id="${post.id}">
                    <td>
                      <select class="input" data-field="type" data-index="${i}" style="min-width: 100px;">
                        <option value="reel" ${post.type === 'reel' ? 'selected' : ''}>🎬 Reel</option>
                        <option value="post" ${post.type === 'post' ? 'selected' : ''}>📸 Post</option>
                        <option value="carousel" ${post.type === 'carousel' ? 'selected' : ''}>🎠 Carrossel</option>
                        <option value="story" ${post.type === 'story' ? 'selected' : ''}>📱 Story</option>
                        <option value="video" ${post.type === 'video' ? 'selected' : ''}>🎥 Vídeo</option>
                        <option value="live" ${post.type === 'live' ? 'selected' : ''}>🔴 Live</option>
                      </select>
                    </td>
                    <td>
                      <input type="text" class="input" data-field="description" data-index="${i}" 
                        placeholder="Legenda do post..." value="${(post.description || '').replace(/"/g, '&quot;')}" style="min-width: 200px;">
                    </td>
                    <td><input type="number" class="input input-number" data-field="likes" data-index="${i}" value="${post.likes || 0}" min="0"></td>
                    <td><input type="number" class="input input-number" data-field="comments" data-index="${i}" value="${post.comments || 0}" min="0"></td>
                    <td><input type="number" class="input input-number" data-field="shares" data-index="${i}" value="${post.shares || 0}" min="0"></td>
                    <td><input type="number" class="input input-number" data-field="saves" data-index="${i}" value="${post.saves || 0}" min="0"></td>
                    <td><input type="number" class="input input-number" data-field="views" data-index="${i}" value="${post.views || 0}" min="0"></td>
                    <td><input type="date" class="input" data-field="date" data-index="${i}" value="${post.date || ''}" style="min-width: 130px;"></td>
                    <td>
                      <div class="row-actions">
                        <button class="btn-delete-row" data-delete="${i}" title="Remover">✕</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        ${posts.length > 0 ? `
          <div style="margin-top: var(--space-lg); display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: var(--text-sm); color: var(--text-muted);">
              ${posts.length} conteúdo${posts.length > 1 ? 's' : ''} adicionado${posts.length > 1 ? 's' : ''}
            </span>
            <button class="btn btn-ghost" id="btn-clear-all" style="color: var(--accent-red);">
              🗑️ Limpar Tudo
            </button>
          </div>
        ` : ''}
      </div>

      <!-- Analyze Button -->
      ${posts.length > 0 ? `
        <div style="text-align: center; padding: var(--space-xl) 0;" class="animate-fade-in-up">
          <button class="btn btn-primary btn-lg" id="btn-analyze" style="min-width: 300px;">
            🧠 Analisar com IA
          </button>
          <p style="font-size: var(--text-xs); color: var(--text-muted); margin-top: var(--space-sm);">
            A IA vai analisar todos os conteúdos, identificar padrões e gerar ideias
          </p>
        </div>
      ` : ''}
    </main>
  `;
}

export function bindHomeEvents(state, setState, onAnalyze, onScrape) {
  // Profile name — update state without re-rendering to avoid losing focus
  const profileInput = document.getElementById('profile-name');
  profileInput?.addEventListener('input', (e) => {
    setState({ ...state, profileName: e.target.value }, false);
  });

  // Platform selector
  document.querySelectorAll('.platform-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const platform = btn.dataset.platform;
      setState({ ...state, platform });
      document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  // Add row
  document.getElementById('btn-add-row')?.addEventListener('click', () => {
    const posts = [...(state.posts || [])];
    posts.push({
      id: generateId(),
      type: 'reel',
      description: '',
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      views: 0,
      date: ''
    });
    setState({ ...state, posts }, true);
  });

  // Load example data
  document.getElementById('btn-load-example')?.addEventListener('click', () => {
    const examplePosts = [
      { id: generateId(), type: 'reel', description: '5 dicas para crescer no Instagram em 2025 - O método que ninguém conta', likes: 15420, comments: 892, shares: 3200, saves: 5100, views: 245000, date: '2025-03-15' },
      { id: generateId(), type: 'carousel', description: 'Antes vs Depois usando IA no meu negócio - Resultados reais', likes: 8930, comments: 456, shares: 1800, saves: 3400, views: 120000, date: '2025-03-10' },
      { id: generateId(), type: 'reel', description: 'POV: Você descobre que pode automatizar tudo com IA', likes: 22100, comments: 1340, shares: 5600, saves: 8200, views: 580000, date: '2025-03-08' },
      { id: generateId(), type: 'post', description: 'Frase motivacional sobre empreendedorismo digital 🚀', likes: 1200, comments: 89, shares: 120, saves: 340, views: 15000, date: '2025-03-05' },
      { id: generateId(), type: 'reel', description: 'Minha rotina matinal de CEO - Acordando às 5h', likes: 5600, comments: 320, shares: 890, saves: 2100, views: 95000, date: '2025-03-01' },
      { id: generateId(), type: 'story', description: 'Respondendo perguntas dos seguidores sobre monetização', likes: 800, comments: 200, shares: 50, saves: 100, views: 8000, date: '2025-02-28' },
      { id: generateId(), type: 'carousel', description: '10 ferramentas de IA que uso todo dia no meu negócio', likes: 12300, comments: 670, shares: 2900, saves: 6800, views: 180000, date: '2025-02-25' },
      { id: generateId(), type: 'reel', description: 'Reagindo a dicas financeiras aleatórias do TikTok', likes: 3200, comments: 450, shares: 600, saves: 800, views: 52000, date: '2025-02-20' },
      { id: generateId(), type: 'post', description: 'Foto no escritório com legenda longa sobre jornada', likes: 2100, comments: 120, shares: 80, saves: 200, views: 18000, date: '2025-02-15' },
      { id: generateId(), type: 'reel', description: 'O segredo que mudou meu fluxo de conteúdo - Tutorial completo de IA', likes: 18500, comments: 1100, shares: 4200, saves: 7500, views: 420000, date: '2025-02-10' },
      { id: generateId(), type: 'post', description: 'Textão sobre saúde mental do empreendedor', likes: 950, comments: 65, shares: 40, saves: 150, views: 9500, date: '2025-02-05' },
      { id: generateId(), type: 'reel', description: 'Como eu fiz R$10K no primeiro mês - Passo a passo real', likes: 25000, comments: 1800, shares: 6100, saves: 9200, views: 650000, date: '2025-02-01' },
    ];
    setState({ ...state, posts: examplePosts }, true);
    showToast('12 posts de exemplo carregados!', 'success');
  });

  // CSV Import
  document.getElementById('btn-import-csv')?.addEventListener('click', () => {
    document.getElementById('csv-input')?.click();
  });

  document.getElementById('csv-input')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let posts;
        if (file.name.endsWith('.json')) {
          posts = JSON.parse(event.target.result);
          if (!Array.isArray(posts)) posts = [posts];
          posts = posts.map(p => ({ ...p, id: generateId() }));
        } else {
          posts = parseCSV(event.target.result);
        }
        if (posts.length > 0) {
          setState({ ...state, posts: [...(state.posts || []), ...posts] }, true);
          showToast(`${posts.length} posts importados!`, 'success');
        } else {
          showToast('Nenhum post encontrado no arquivo', 'error');
        }
      } catch (err) {
        showToast('Erro ao ler arquivo: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  });

  // Upload area drag and drop
  const uploadArea = document.getElementById('upload-area');
  if (uploadArea) {
    uploadArea.addEventListener('click', () => document.getElementById('csv-input')?.click());
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const posts = file.name.endsWith('.json') 
              ? JSON.parse(event.target.result).map(p => ({ ...p, id: generateId() }))
              : parseCSV(event.target.result);
            if (posts.length > 0) {
              setState({ ...state, posts }, true);
              showToast(`${posts.length} posts importados!`, 'success');
            }
          } catch (err) {
            showToast('Erro ao ler arquivo', 'error');
          }
        };
        reader.readAsText(file);
      }
    });
  }

  // Table input changes
  document.querySelectorAll('#posts-table .input').forEach(input => {
    input.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.index);
      const field = e.target.dataset.field;
      const posts = [...state.posts];
      if (posts[index]) {
        const val = e.target.value;
        posts[index][field] = ['likes', 'comments', 'shares', 'saves', 'views'].includes(field) 
          ? parseInt(val) || 0 
          : val;
        setState({ ...state, posts }, false);
      }
    });
  });

  // Delete row
  document.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.delete);
      const posts = state.posts.filter((_, i) => i !== index);
      setState({ ...state, posts }, true);
    });
  });

  // Clear all
  document.getElementById('btn-clear-all')?.addEventListener('click', () => {
    setState({ ...state, posts: [] }, true);
  });

  // Analyze button
  document.getElementById('btn-analyze')?.addEventListener('click', () => {
    if (!state.posts || state.posts.length < 2) {
      showToast('Adicione pelo menos 2 posts para analisar', 'error');
      return;
    }
    onAnalyze();
  });

  // Scrape button
  document.getElementById('btn-scrape')?.addEventListener('click', () => {
    const profileInput = document.getElementById('profile-name');
    if (!profileInput.value.trim()) {
      showToast('Digite o @ do perfil primeiro', 'error');
      return;
    }
    if (state.platform === 'tiktok') {
      showToast('O scraper de TikTok ainda não está disponível, tente um Instagram.', 'warning');
      return;
    }
    const btn = document.getElementById('btn-scrape');
    btn.disabled = true;
    btn.innerHTML = '<span class="analyzing-spinner" style="width:16px;height:16px;margin:0 8px;border-width:2px"></span> Buscando...';
    
    // Call the handler
    onScrape().finally(() => {
      btn.disabled = false;
      btn.innerHTML = '🔍 Buscar Posts Automaticamente (Leva ~15s)';
    });
  });
}
