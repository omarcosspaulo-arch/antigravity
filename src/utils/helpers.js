// IA de Conteúdo — Helpers
export function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function calculateEngagementRate(post) {
  const interactions = (post.likes || 0) + (post.comments || 0) + (post.shares || 0) + (post.saves || 0);
  const reach = post.views || post.likes * 10 || 1;
  return ((interactions / reach) * 100).toFixed(2);
}

export function getPostScore(post) {
  const weights = { likes: 1, comments: 3, shares: 5, saves: 4, views: 0.1 };
  return Object.keys(weights).reduce((score, key) => {
    return score + (post[key] || 0) * weights[key];
  }, 0);
}

export function rankPosts(posts) {
  return [...posts]
    .map(p => ({ ...p, score: getPostScore(p) }))
    .sort((a, b) => b.score - a.score);
}

export function getTopPosts(posts, percentage = 0.3) {
  const ranked = rankPosts(posts);
  const cutoff = Math.max(1, Math.ceil(ranked.length * percentage));
  return ranked.slice(0, cutoff);
}

export function getFlopPosts(posts, percentage = 0.3) {
  const ranked = rankPosts(posts);
  const cutoff = Math.max(1, Math.ceil(ranked.length * percentage));
  return ranked.slice(-cutoff);
}

export function getPostTypeEmoji(type) {
  const types = {
    'reel': '🎬',
    'reels': '🎬',
    'post': '📸',
    'foto': '📸',
    'photo': '📸',
    'carousel': '🎠',
    'carrossel': '🎠',
    'story': '📱',
    'stories': '📱',
    'video': '🎥',
    'tiktok': '🎵',
    'live': '🔴',
  };
  return types[type?.toLowerCase()] || '📄';
}

export function getPlatformEmoji(platform) {
  const platforms = {
    'instagram': '📸',
    'tiktok': '🎵',
  };
  return platforms[platform?.toLowerCase()] || '📱';
}

export function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function debounce(fn, delay = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const posts = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const post = { id: generateId() };
    
    headers.forEach((header, idx) => {
      const val = values[idx] || '';
      if (['likes', 'comments', 'shares', 'saves', 'views'].includes(header)) {
        post[header] = parseInt(val) || 0;
      } else {
        post[header] = val;
      }
    });
    
    // Map common header names
    if (post.tipo) { post.type = post.tipo; delete post.tipo; }
    if (post.descricao || post.legenda || post.caption) {
      post.description = post.descricao || post.legenda || post.caption;
      delete post.descricao; delete post.legenda; delete post.caption;
    }
    if (post.curtidas) { post.likes = parseInt(post.curtidas) || 0; delete post.curtidas; }
    if (post.comentarios || post.comentários) { 
      post.comments = parseInt(post.comentarios || post.comentários) || 0; 
      delete post.comentarios; delete post.comentários;
    }
    if (post.compartilhamentos) { post.shares = parseInt(post.compartilhamentos) || 0; delete post.compartilhamentos; }
    if (post.salvamentos || post.salvos) { 
      post.saves = parseInt(post.salvamentos || post.salvos) || 0;
      delete post.salvamentos; delete post.salvos;
    }
    if (post.visualizacoes || post.visualizações) { 
      post.views = parseInt(post.visualizacoes || post.visualizações) || 0;
      delete post.visualizacoes; delete post.visualizações;
    }
    if (post.data || post.date) {
      post.date = post.data || post.date;
      delete post.data;
    }
    
    posts.push(post);
  }
  
  return posts;
}
