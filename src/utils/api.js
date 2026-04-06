// IA de Conteúdo — API Client
const API_BASE = '/api';

export async function analyzeContent(profileData) {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro na comunicação com o servidor' }));
    throw new Error(error.error || 'Erro ao analisar conteúdo');
  }
  
  return response.json();
}

export async function generateIdeas(analysisData) {
  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(analysisData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro na comunicação com o servidor' }));
    throw new Error(error.error || 'Erro ao gerar ideias');
  }
  
  return response.json();
}

export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export async function scrapeProfile(platform, username) {
  try {
    const response = await fetch(`${API_BASE}/scrape/${platform}/${username.replace('@', '')}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao conectar ao servidor de extração');
    }

    return await response.json();
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Erro ao conectar com o servidor. Verifique sua conexão.');
    }
    throw error;
  }
}
