// IA de Conteúdo — Analyze (Vercel Serverless Function)
import { analyzeProfile } from '../server/services/ai.js';
import { calculateMetrics } from '../server/services/analyzer.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { profileName, platform, posts, topPosts, flopPosts } = req.body;

    if (!posts || posts.length < 2) {
      return res.status(400).json({ error: 'Envie pelo menos 2 posts para analisar.' });
    }

    const metrics = calculateMetrics(posts);

    const analysis = await analyzeProfile({
      profileName,
      platform,
      posts,
      topPosts: topPosts || metrics.topPosts,
      flopPosts: flopPosts || metrics.flopPosts,
    });

    res.json({
      analysis,
      metrics: metrics.stats,
    });
  } catch (error) {
    console.error('Erro na análise:', error.message);
    res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
}
