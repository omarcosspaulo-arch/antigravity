# Prompt para gerar um roteiro novo com o Claude

Copie o bloco abaixo, troque o `[FATO]` e cole no Claude. A resposta é um `roteiro.json`
pronto para este projeto.

---

```
Você é roteirista de Shorts/Reels/TikTok que viralizam. Transforme o fato abaixo em um
roteiro de narração de 55 a 62 segundos, em português do Brasil, falado rápido.

FATO: [FATO — algo estranho e VERDADEIRO, ex.: "no Japão existem salas onde funcionários
são colocados sem nada pra fazer até pedirem demissão"]

Estrutura obrigatória:
1. Gancho (1 fala, até 12 palavras): a parte mais absurda, sem explicar nada.
   Ex.: "Esse homem vai trabalhar todo dia... pra não fazer absolutamente nada."
2. Contexto rápido com um personagem (3–4 falas): quem é, o que aconteceu.
3. Escalada (3–5 falas): detalhes concretos e visuais, ritmo acelerando.
4. Reviravolta por volta dos 55% do vídeo (1–2 falas): a informação que muda o sentido
   de tudo. Termine essa fala em uma frase curta e forte.
5. Explicação da reviravolta (2–3 falas), com o NOME real do fenômeno se existir.
6. Fechamento (1–2 falas) que termina em PERGUNTA direta ao espectador.

Regras:
- 150 a 170 palavras no total; frases curtas; nada de "olá", "neste vídeo" ou "se inscreva".
- Cada fala deve render uma imagem diferente (troca de cena a cada 3–5 segundos).
- Marque com *asteriscos* 1–3 palavras-chave por fala (viram legenda amarela).
- Só afirme o que for verdade; se um detalhe for ilustrativo, deixe isso claro.
- Se alguma palavra for estrangeira, inclua o campo "tts" com a grafia de como se pronuncia.

Responda SOMENTE com JSON válido neste formato:
{
  "titulo": "título curto do vídeo",
  "gancho": "TÍTULO EM CAIXA ALTA PARA O TOPO DA TELA (até 7 palavras)",
  "voz": { "velocidade": 0.78, "pausaEntreFalas": 0.14, "pausaEntreCenas": 0.32 },
  "falas": [
    { "id": "f01", "cena": "nome-da-cena", "texto": "..." },
    { "id": "f02", "cena": "nome-da-cena", "texto": "...", "tts": "opcional", "pausaAntes": 0.2 }
  ]
}

Depois do JSON, liste em 1 linha por cena o que deve aparecer na tela (cenário 3D,
personagens, objetos que surgem em quais palavras) e as fontes do fato.
```

---

Depois, para as cenas novas, peça ao Claude algo como:

> "Crie os componentes de cena para este roteiro em `video/src/cenas/`, reaproveitando
> `src/mundo/` (Personagem, Sala, Escritorio, Predio, objetos) e prendendo cada evento visual
> às palavras com `quando(cena, "palavra")`. Registre as cenas em `CENAS` no `CurtaViral.tsx`."
