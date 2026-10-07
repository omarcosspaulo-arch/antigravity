# Linha do tempo de fotos

Gera o trecho "14 anos" do vídeo da Bárbara: uma foto por ano, cada uma
fica cerca de 3 frames na tela, entra pela direita e sai pela esquerda.

- `--mode behind` (padrão): as fotos passam **por trás dela**, como cópias
  impressas com efeito de foto antiga (sépia, grão, vinheta, poeira, borda de
  papel). Ela é recortada automaticamente, frame a frame.
- `--mode fullscreen`: as fotos ocupam a tela inteira.

O ritmo de cada foto é 2 frames parados (com um leve deslize) e 1 frame de
"whip" com desfoque de movimento até a próxima. Com 14 fotos a 30 fps, o
efeito dura cerca de 1,4 s.

## Instalação

Precisa de Python 3.10+ e do `ffmpeg` no PATH.

```sh
pip install -r requirements.txt
```

O modelo de recorte (`u2net_human_seg`, ~170 MB) é baixado na primeira vez.

## Uso

Coloque as fotos numa pasta, nomeadas na ordem da linha do tempo
(ex.: `2011.jpg`, `2012.jpg` ... `2024.jpg`).

```sh
# vídeo completo com o efeito começando em 0:12.4 (o áudio é mantido)
python render.py fotos/ --video bruto.mp4 --start 0:12.4 -o final.mp4

# o mesmo, em tela cheia
python render.py fotos/ --video bruto.mp4 --start 0:12.4 --mode fullscreen -o final.mp4

# também exporta só a camada das fotos com transparência, para montar no editor
python render.py fotos/ --video bruto.mp4 --start 0:12.4 -o final.mp4 --layer-out camada.mov

# prévia sem o vídeo, sobre uma imagem parada
python render.py fotos/ --background foto.jpg -o previa.mp4
```

No modo `behind`, a camada exportada por `--layer-out` (ProRes 4444 com
alfa) já vem com a pessoa recortada: basta colocá-la sobre o vídeo original,
no mesmo ponto de `--start`.

## Ajustes

| Opção | Padrão | O que faz |
| --- | --- | --- |
| `--frames-per-photo` | `3` | frames de cada foto, contando o frame de transição |
| `--shutter` | `0.5` | intensidade do desfoque de movimento (0 desliga) |
| `--vintage` / `--no-vintage` | ligado só no `behind` | efeito de foto antiga |
| `--card-size` | `0.62` | `behind`: tamanho das fotos, fração do menor lado do vídeo |
| `--card-y` | automático | `behind`: altura do centro das fotos (0 = topo, 1 = base); o automático põe as fotos atrás da cabeça |
| `--focus 03.jpg=0.3,0.4` | centro | `fullscreen`: ponto da foto que não pode ser cortado |

Os frames são contados no fps do vídeo de entrada.
