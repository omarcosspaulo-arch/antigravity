// IA de Conteúdo — Analyze Route
import { Router } from 'express';
import { analyzeProfile } from '../services/ai.js';
import { calculateMetrics } from '../services/analyzer.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { profileName, platform, posts, topPosts, flopPosts, ranked } = req.body;

    if (!posts || posts.length < 2) {
      return res.status(400).json({ error: 'Envie pelo menos 2 posts para analisar.' });
    }

    console.log(`\n📊 Analisando perfil "${profileName}" (${platform}) — ${posts.length} posts`);
    
    // Calculate metrics
    const metrics = calculateMetrics(posts);
    
    // Send to AI for analysis
    const analysis = await analyzeProfile({
      profileName,
      platform,
      posts,
      topPosts: topPosts || metrics.topPosts,
      flopPosts: flopPosts || metrics.flopPosts,
    });

    console.log('✅ Análise completa!');

    res.json({
      analysis,
      metrics: metrics.stats,
    });
  } catch (error) {
    console.error('❌ Erro na análise:', error.message);
    next(error);
  }
});

export { router as analyzeRoute };
