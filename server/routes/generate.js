// IA de Conteúdo — Generate Ideas Route
import { Router } from 'express';
import { generateContentIdeas } from '../services/ai.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { profileName, platform, topPosts, analysis } = req.body;

    if (!topPosts || topPosts.length === 0) {
      return res.status(400).json({ error: 'Envie os top posts para gerar ideias.' });
    }

    console.log(`\n💡 Gerando ideias para "${profileName}" (${platform})`);

    const result = await generateContentIdeas({
      profileName,
      platform,
      topPosts,
      analysis,
    });

    console.log(`✅ ${result.ideas?.length || 0} ideias geradas!`);

    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao gerar ideias:', error.message);
    next(error);
  }
});

export { router as generateRoute };
