// IA de Conteúdo — Express Server
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { analyzeRoute } from './routes/analyze.js';
import { generateRoute } from './routes/generate.js';
import { scrapeRoute } from './routes/scrape.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

app.use('/api/analyze', analyzeRoute);
app.use('/api/generate', generateRoute);
app.use('/api/scrape', scrapeRoute);

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: err.message || 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`\n🧠 IA de Conteúdo — Backend rodando na porta ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  if (!process.env.GEMINI_API_KEY) {
    console.log('\n⚠️  AVISO: GEMINI_API_KEY não configurada!');
    console.log('   Crie um arquivo .env com: GEMINI_API_KEY=sua_chave_aqui');
    console.log('   Pegue sua chave em: https://aistudio.google.com/apikey\n');
  }
});
