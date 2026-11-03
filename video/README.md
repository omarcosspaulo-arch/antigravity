# Curta viral animado — Remotion + three.js

Projeto que gera **curtas verticais de ~60 s** no formato que está viralizando:
**fato estranho e verdadeiro → reviravolta → pergunta final**, com mundo 3D colorido,
personagens 2D "recortados", narrador rápido e **legendas de uma palavra por vez**.

O exemplo pronto é **"A sala onde te pagam pra não fazer nada"** (o *oidashi-beya* japonês):
um funcionário é transferido para o "Departamento de Desenvolvimento de Carreira", uma sala vazia
onde não há nada pra fazer. A reviravolta: a empresa não pode demiti-lo, então espera que ele
peça demissão sozinho.

```
roteiro.json ──► npm run voz ──► public/voz/*.wav + src/timeline.json ──► Remotion ──► out/curta.mp4
                 (TTS + tempo         (cada palavra tem início/fim:          (cenas 3D,
                  de cada palavra)     sincroniza cortes e legendas)          legendas, trilha)
```

## Rodando

```bash
cd video
npm install
npm run studio      # abre o editor do Remotion no navegador (pré-visualização ao vivo)
npm run render      # gera out/curta.mp4 (1080x1920, 30 fps)
```

A narração, a trilha e os efeitos já estão gerados em `public/`, então o `render` funciona direto.

- `npm run render:rapido` — versão em meia resolução, para conferir ritmo.
- `npm run previa` — renderiza frames-chave e monta `out/previa/folha.jpg` (folha de contato).

> **Servidor sem GPU (Linux/CI):** use `--gl=swangle` e, se precisar, aponte para um Chrome já
> instalado: `REMOTION_CHROME=/caminho/do/chrome npx remotion render CurtaViral out/curta.mp4 --gl=swangle`.
> Para o `npm run previa`, use `REMOTION_GL=swangle`.

## Estrutura

| Caminho | O que é |
|---|---|
| `roteiro.json` | **O roteiro.** Cada fala tem `id`, `cena` e `texto`. `*palavra*` vira legenda amarela (destaque). `tts` opcional = como o narrador deve pronunciar. `pausaAntes` = respiro extra. |
| `scripts/voz.mjs` | Gera um `.wav` por fala (Piper TTS), limpa/comprime/normaliza o áudio e calcula o tempo de **cada palavra** → `src/timeline.json`. |
| `scripts/sons.mjs` | Sintetiza trilha (curiosa + tensa) e efeitos (whoosh, pop, tique-taque, boom, carimbo, sino, vento). Sem samples, sem direitos autorais. |
| `src/CurtaViral.tsx` | Composição principal: liga cada `cena` do roteiro a um componente, legendas, título-gancho, trilha. |
| `src/cenas/` | Uma cena por arquivo (`Gancho`, `Escritorio`, `Chefe`, `Porta`, `Inventario`, `Tempo`, `Predio`, `Carta`, `Revelacao`, `Final`). Os acontecimentos são presos às palavras com `quando(cena, "palavra")`. |
| `src/mundo/` | O mundo 3D: `Personagem` (2D recortado com expressões e poses), `Sala`, `Escritorio`, `Corredor`, `Predio`, objetos (mesa, cadeira, relógio, janela, planta, calendário...). |
| `src/camadas/` | Camadas 2D por cima do 3D: `Legendas` (uma palavra por vez), título-gancho, cartões, ícones, confete, contador, vinheta. |
| `public/fontes/` | Montserrat e Noto Sans JP (subconjunto), ambas SIL Open Font License — o render não depende de internet. |

## Trocando o narrador

O pipeline aceita qualquer voz. Duas opções:

**1. Piper (grátis, roda no seu computador)** — a narração incluída foi feita com a voz `pt-br-edresson-low`
(qualidade "low", 16 kHz). Para uma voz bem melhor, use a `pt_BR-faber-medium`:

```bash
pip install piper-tts
mkdir -p vozes && cd vozes
curl -LO https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx
curl -LO https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx.json
cd ..
PIPER_CMD="python3 -m piper" npm run voz      # usa vozes/pt_BR-faber-medium.onnx por padrão
```

`"velocidade"` no `roteiro.json` controla o ritmo (menor = mais rápido; 0.78 ≈ narrador de Shorts).

**2. Sua voz, ElevenLabs ou outra IA** — grave/exporte **um arquivo por fala** com o nome do `id`
(`public/voz/f01.wav`, `f02.wav`, … em WAV PCM 16-bit) e rode:

```bash
npm run voz -- --manter
```

Ele não sintetiza nada: só mede os arquivos, detecta as pausas e recalcula o tempo de cada palavra,
cada corte de cena e cada legenda.

## Fazendo um curta novo

1. **Roteiro** — cole o prompt de [`PROMPT-ROTEIRO.md`](./PROMPT-ROTEIRO.md) no Claude com o fato que você quer contar.
   Ele devolve um `roteiro.json` no formato certo (gancho, virada, pergunta final).
2. **Cenas** — peça ao Claude para criar os componentes em `src/cenas/` para cada `cena` nova,
   reaproveitando o que já existe em `src/mundo/` (personagem, sala, escritório, prédio...),
   e registrá-los no objeto `CENAS` de `src/CurtaViral.tsx`.
3. **Voz** — `npm run voz` (ou `--manter` com sua própria gravação).
4. **Conferir** — `npm run previa` e/ou `npm run studio`.
5. **Render** — `npm run render`.

### O que faz o formato funcionar

- **Gancho nos 2 primeiros segundos**: a frase mais absurda vem primeiro, com um título no topo.
- **Legenda de uma palavra**: prende o olho; palavras-chave em amarelo.
- **Corte a cada 3–5 s**: cada fala nova pode trocar de cena (o corte acontece um pouco antes da voz).
- **Reviravolta por volta de 55% do vídeo**: o "é de propósito" muda o sentido de tudo que veio antes.
- **Final em pergunta** ("E você... aguentaria?"): puxa comentários.
- **Último quadro parecido com o primeiro**: o vídeo "dá a volta" e muita gente assiste de novo.

## Sobre os fatos do exemplo

"Oidashi-beya" (追い出し部屋, "sala de expulsão") é o apelido de salas para onde algumas empresas
japonesas transferiam funcionários efetivos sem tarefas reais, esperando que eles pedissem demissão —
porque a lei trabalhista japonesa (Lei de Contratos de Trabalho, art. 16, que consolidou a doutrina do
"abuso do direito de demitir") torna a demissão de efetivos muito difícil. O tema foi reportado pelo
Asahi Shimbun (2012–2013) e pelo New York Times ("Layoffs Taboo, Japan Workers Are Sent to the Boredom Room",
2013), e o Ministério do Trabalho japonês chegou a investigar a prática. O personagem Tanaka é ilustrativo.

## Licenças dos recursos

- Fontes: Montserrat e Noto Sans JP — SIL Open Font License 1.1.
- Voz incluída: Piper `pt-br-edresson-low`, treinada no TTS-Portuguese-Corpus (CC BY 4.0).
- Trilha e efeitos: sintetizados por `scripts/sons.mjs` neste projeto.
