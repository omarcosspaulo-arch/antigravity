import { Router } from 'express';
import { ApifyClient } from 'apify-client';

const router = Router();

router.get('/:platform/:username', async (req, res, next) => {
  try {
    const { platform, username } = req.params;

    if (!process.env.APIFY_API_TOKEN) {
      return res.status(401).json({ error: 'APIFY_API_TOKEN não configurada no servidor (.env).' });
    }

    if (platform !== 'instagram') {
      return res.status(400).json({ error: 'Apenas a extração do Instagram está disponível no momento.' });
    }

    console.log(`\n🔍 Extraindo dados de @${username} via Apify...`);

    const client = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });

    // Usando o ator "apify/instagram-profile-scraper" que garante os posts do usuário exato
    const input = {
      usernames: [username],
    };

    console.log(`⏳ Iniciando job no Instagram Scraper... (pode demorar 15-30s)`);
    // Run the actor
    const run = await client.actor('apify/instagram-profile-scraper').call(input);

    console.log(`⏳ Coletando resultados (Dataset ID: ${run.defaultDatasetId})...`);
    // Fetch the results
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0 || !items[0].latestPosts) {
      return res.status(404).json({ error: 'Nenhum perfil ou posts encontrados' });
    }

    const { latestPosts } = items[0];
    
    // Filtro rápido de segurança pra garantir só posts daquele usuário (prevenção extra)
    const validPosts = latestPosts.filter(p => 
      p.ownerUsername && p.ownerUsername.toLowerCase() === username.toLowerCase()
    );

    console.log(`✅ ${validPosts.length} posts coletados com sucesso!`);

    // Mapear para o dashboard
    const posts = validPosts.map((item) => {
      // Definir tipo baseado no type da api
      let type = 'post';
      if (item.type === 'Video' || item.productType === 'clips') type = 'reel';
      else if (item.type === 'Sidecar') type = 'carousel';

      return {
        id: item.shortCode || Math.random().toString(36).substr(2, 9),
        type,
        description: item.caption || '',
        likes: item.likesCount || 0,
        comments: item.commentsCount || 0,
        shares: 0, // Profile scraper não retorna shares publicamente
        saves: 0, 
        views: item.videoViewCount || 0,
        date: item.timestamp ? new Date(item.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      };
    });

    res.json({ posts });
  } catch (error) {
    console.error('❌ Erro no Web Scraper:', error.message);
    next(new Error(`Erro ao conectar com a API de extração: ${error.message}`));
  }
});

export { router as scrapeRoute };
