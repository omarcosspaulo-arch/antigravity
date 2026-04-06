// IA de Conteúdo — Analyzer Service (Metrics Calculator)
export function calculateMetrics(posts) {
  if (!posts || posts.length === 0) return {};

  const weights = { likes: 1, comments: 3, shares: 5, saves: 4, views: 0.1 };
  
  const scored = posts.map(post => {
    const score = Object.keys(weights).reduce((s, key) => {
      return s + (post[key] || 0) * weights[key];
    }, 0);
    
    const interactions = (post.likes || 0) + (post.comments || 0) + (post.shares || 0) + (post.saves || 0);
    const reach = post.views || post.likes * 10 || 1;
    const engagementRate = (interactions / reach) * 100;
    
    return { ...post, score, engagementRate };
  });

  scored.sort((a, b) => b.score - a.score);

  const totalPosts = scored.length;
  const topCutoff = Math.max(1, Math.ceil(totalPosts * 0.3));
  
  return {
    ranked: scored,
    topPosts: scored.slice(0, topCutoff),
    flopPosts: scored.slice(-topCutoff),
    stats: {
      totalPosts,
      totalLikes: scored.reduce((s, p) => s + (p.likes || 0), 0),
      totalComments: scored.reduce((s, p) => s + (p.comments || 0), 0),
      totalShares: scored.reduce((s, p) => s + (p.shares || 0), 0),
      totalSaves: scored.reduce((s, p) => s + (p.saves || 0), 0),
      totalViews: scored.reduce((s, p) => s + (p.views || 0), 0),
      avgScore: scored.reduce((s, p) => s + p.score, 0) / totalPosts,
      avgEngagement: scored.reduce((s, p) => s + p.engagementRate, 0) / totalPosts,
      bestPost: scored[0],
      worstPost: scored[scored.length - 1],
    }
  };
}
