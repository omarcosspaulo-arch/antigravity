// IA de Conteúdo — Health Check (Vercel Serverless Function)
export default function handler(req, res) {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
}
