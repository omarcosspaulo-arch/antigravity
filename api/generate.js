// IA de Conteúdo — Generate Ideas (Vercel Serverless Function)
import { generateContentIdeas } from '../server/services/ai.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { profileName, platform, topPosts, analysis } = req.body;

    if (!topPosts || topPosts.length === 0) {
      return res.status(400).json({ error: 'Envie os top posts para gerar ideias.' });
    }

    const result = await generateContentIdeas({
      profileName,
      platform,
      topPosts,
      analysis,
    });

    res.json(result);
  } catch (error) {
    console.error('Erro ao gerar ideias:', error.message);
    res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
}
