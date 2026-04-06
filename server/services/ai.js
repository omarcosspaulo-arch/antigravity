// IA de Conteúdo — AI Service (Google Gemini)
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

let genAI = null;
let model = null;

function getModel(forceJson = false) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY não configurada. Crie um arquivo .env com sua chave.');
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: forceJson ? { responseMimeType: "application/json" } : {}
  });
}

export async function analyzeProfile(profileData) {
  const ai = getModel(true);
  
  const { profileName, platform, posts, topPosts, flopPosts } = profileData;
  
  const prompt = `Você é um especialista em marketing digital e análise de conteúdo para redes sociais, especializado em ${platform === 'tiktok' ? 'TikTok' : 'Instagram'}.

Analise os dados de conteúdo do perfil "${profileName || 'perfil analisado'}" na plataforma ${platform === 'tiktok' ? 'TikTok' : 'Instagram'}.

## TODOS OS POSTS (${posts.length} no total):
${posts.map((p, i) => `${i+1}. [${p.type}] "${p.description}" — ❤️${p.likes} 💬${p.comments} 🔄${p.shares} 🔖${p.saves} 👁️${p.views} 📅${p.date || 'sem data'}`).join('\n')}

## TOP POSTS (os que mais performaram):
${topPosts.map((p, i) => `${i+1}. [${p.type}] "${p.description}" — Score: ${p.score} | ❤️${p.likes} 💬${p.comments} 🔄${p.shares} 🔖${p.saves} 👁️${p.views}`).join('\n')}

## PIORES POSTS (os que menos performaram):
${flopPosts.map((p, i) => `${i+1}. [${p.type}] "${p.description}" — Score: ${p.score} | ❤️${p.likes} 💬${p.comments} 🔄${p.shares} 🔖${p.saves} 👁️${p.views}`).join('\n')}

Responda EXATAMENTE no formato JSON abaixo. NÃO inclua markdown ou code blocks, apenas o JSON puro:

{
  "overallAnalysis": "Análise geral detalhada do perfil em 3-4 parágrafos. Identifique o nicho, tom de voz, público-alvo aparente e padrões gerais.",
  "patterns": "Padrões detalhados identificados em 3-4 parágrafos: que tipo de conteúdo funciona melhor (reels, carrosseis, etc), que temas geram mais engajamento, horários/frequência ideal, estilo de legendas que funciona.",
  "topAnalysis": "Análise detalhada de 3-4 parágrafos explicando POR QUE cada um dos top posts viralizou. O que eles têm em comum? Qual gancho, formato, tema que conectou com a audiência?",
  "flopAnalysis": "Análise de 2-3 parágrafos explicando POR QUE os piores posts não funcionaram. O que faltou? O que foi diferente dos que deram certo?"
}`;

  const result = await ai.generateContent(prompt);
  const text = result.response.text().trim();
  
  // Parse JSON (handle potential markdown wrapping)
  let cleaned = text;
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse AI response:', text);
    // Fallback: return raw text as overall analysis
    return {
      overallAnalysis: text,
      patterns: '',
      topAnalysis: '',
      flopAnalysis: '',
    };
  }
}

export async function generateContentIdeas(data) {
  const ai = getModel(true);
  
  const { profileName, platform, topPosts, analysis } = data;

  const prompt = `Você é um especialista em criação de conteúdo viral para ${platform === 'tiktok' ? 'TikTok' : 'Instagram'}.

Com base na análise do perfil "${profileName || 'perfil'}", crie 5 novas ideias de conteúdo que seguem EXATAMENTE o padrão dos posts que mais viralizaram.

## TOP POSTS QUE VIRALIZARAM:
${topPosts.map((p, i) => `${i+1}. [${p.type}] "${p.description}" — ❤️${p.likes} 💬${p.comments} 🔄${p.shares} 👁️${p.views}`).join('\n')}

## ANÁLISE DO QUE FUNCIONA:
${analysis?.topAnalysis || analysis?.patterns || analysis?.overallAnalysis || 'Posts com conteúdo útil e prático tendem a viralizar mais.'}

## REGRAS PARA AS IDEIAS:
1. Cada ideia deve seguir o MESMO ESTILO dos posts que viralizaram
2. Mantenha o mesmo tom de voz e abordagem
3. Use formatos similares (se Reels viralizaram, sugira Reels)
4. Inclua hooks chamativos (primeira frase que prende atenção)
5. Sugira hashtags relevantes para ${platform === 'tiktok' ? 'TikTok' : 'Instagram'}

Responda EXATAMENTE no formato JSON abaixo. NÃO inclua markdown ou code blocks, apenas o JSON puro:

{
  "ideaRationale": "Explicação de 2-3 parágrafos sobre a lógica por trás das ideias: quais padrões dos top posts foram usados como base e por que essas ideias têm potencial de viralizar.",
  "ideas": [
    {
      "title": "Título chamativo da ideia",
      "format": "Reel/Carrossel/Post/Story",
      "platform": "${platform === 'tiktok' ? 'TikTok' : 'Instagram'}",
      "description": "Descrição detalhada de 3-4 frases sobre o que o conteúdo deve abordar, como estruturar e o tom ideal.",
      "hook": "Primeira frase gancho que prende a atenção nos primeiros 3 segundos",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
    }
  ]
}

Gere exatamente 5 ideias no array "ideas".`;

  const result = await ai.generateContent(prompt);
  const text = result.response.text().trim();
  
  let cleaned = text;
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  
  try {
    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (e) {
    console.error('Failed to parse ideas response:', text);
    return {
      ideaRationale: '',
      ideas: [{ title: 'Erro ao gerar ideias', format: '', description: 'Tente novamente.', hook: '', hashtags: [] }]
    };
  }
}
