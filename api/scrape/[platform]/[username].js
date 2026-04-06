// IA de Conteúdo — Scrape (Vercel Serverless Function — Dynamic Route)
import { ApifyClient } from 'apify-client';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { platform, username } = req.query;

    if (!process.env.APIFY_API_TOKEN) {
      return res.status(401).json({ error: 'APIFY_API_TOKEN não configurada no servidor.' });
    }

    if (platform !== 'instagram') {
      return res.status(400).json({ error: 'Apenas a extração do Instagram está disponível no momento.' });
    }

    const client = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });

    const input = { usernames: [username] };

    const run = await client.actor('apify/instagram-profile-scraper').call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0 || !items[0].latestPosts) {
      return res.status(404).json({ error: 'Nenhum perfil ou posts encontrados' });
    }

    const { latestPosts } = items[0];

    const validPosts = latestPosts.filter(p =>
      p.ownerUsername && p.ownerUsername.toLowerCase() === username.toLowerCase()
    );

    const posts = validPosts.map((item) => {
      let type = 'post';
      if (item.type === 'Video' || item.productType === 'clips') type = 'reel';
      else if (item.type === 'Sidecar') type = 'carousel';

      return {
        id: item.shortCode || Math.random().toString(36).substr(2, 9),
        type,
        description: item.caption || '',
        likes: item.likesCount || 0,
        comments: item.commentsCount || 0,
        shares: 0,
        saves: 0,
        views: item.videoViewCount || 0,
        date: item.timestamp
          ? new Date(item.timestamp).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      };
    });

    res.json({ posts });
  } catch (error) {
    console.error('Erro no scraper:', error.message);
    res.status(500).json({ error: `Erro ao conectar com a API de extração: ${error.message}` });
  }
}
