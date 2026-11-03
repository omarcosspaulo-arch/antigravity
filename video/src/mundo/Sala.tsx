import React from "react";
import type { V3 } from "../anim";
import { FONTE } from "../fontes";
import { COR } from "../paleta";
import { Caixa, Cilindro, PlanoTextura, useTexturaCanvas } from "./base";
import { Calendario, Cadeira, Janela, Mesa, PisoMadeira, Planta, Relogio } from "./objetos";
import { Personagem, PropsPersonagem, TANAKA } from "./Personagem";

// A "sala de desenvolvimento de carreira": um diorama com duas paredes.
// Parede do fundo em z = -2.5, parede esquerda em x = -2.6, piso em y = 0.

export const POS_TANAKA: V3 = [0, 0.655, -1.2];
export const ESCALA_TANAKA = 0.82;
export const CABECA_TANAKA: V3 = [0, 0.655 + 0.9 * ESCALA_TANAKA, -1.2];

const Cartaz: React.FC<{ pos: V3; rot: V3 }> = ({ pos, rot }) => {
  const tex = useTexturaCanvas(
    256,
    340,
    (ctx, w, h) => {
      ctx.fillStyle = "#ffd60a";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = COR.tracos;
      ctx.textAlign = "center";
      ctx.font = `900 92px ${FONTE}, sans-serif`;
      ctx.fillText("FOCO", w / 2, 150);
      ctx.font = `800 30px ${FONTE}, sans-serif`;
      ctx.fillText("NO TRABALHO!", w / 2, 210);
      ctx.beginPath();
      ctx.arc(w / 2, 280, 26, 0, Math.PI * 2);
      ctx.fill();
    },
    "cartaz",
    [`900 92px ${FONTE}`],
  );
  return (
    <group position={pos} rotation={rot}>
      <Caixa tam={[0.62, 0.8, 0.03]} cor="#2a2833" raio={0.01} />
      <PlanoTextura textura={tex} w={0.54} h={0.72} pos={[0, 0, 0.017]} />
    </group>
  );
};

export type PropsSala = {
  horas?: number;
  ceu?: string;
  cidade?: string;
  luzesCidade?: number;
  vidaPlanta?: number;
  mes?: string;
  subCalendario?: string;
  children?: React.ReactNode;
};

export const Sala: React.FC<PropsSala> = ({
  horas = 9,
  ceu = COR.ceuDia,
  cidade = "#7d9cc0",
  luzesCidade = 0,
  vidaPlanta = 1,
  mes = "ABR",
  subCalendario = "",
  children,
}) => (
  <group>
    <PisoMadeira largura={5.6} profundidade={5.4} pos={[0, 0, -0.1]} />
    {/* paredes */}
    <Caixa tam={[5.8, 3.6, 0.2]} pos={[0, 1.8, -2.62]} cor={COR.parede} raio={0.02} />
    <Caixa tam={[0.2, 3.6, 5.6]} pos={[-2.72, 1.8, -0.1]} cor={COR.paredeLateral} raio={0.02} />
    <Caixa tam={[5.4, 0.14, 0.05]} pos={[0, 0.07, -2.5]} cor={COR.rodape} sombra={false} />
    <Caixa tam={[0.05, 0.14, 5.4]} pos={[-2.6, 0.07, -0.1]} cor={COR.rodape} sombra={false} />
    {/* faixa decorativa na parede */}
    <Caixa tam={[5.4, 0.05, 0.03]} pos={[0, 1.05, -2.5]} cor="#ead9bd" sombra={false} />

    <Janela pos={[1.35, 1.95, -2.5]} ceu={ceu} cidade={cidade} luzes={luzesCidade} />
    <Relogio pos={[-0.95, 2.55, -2.48]} horas={horas} />
    <Calendario pos={[-1.75, 1.75, -2.5]} texto={mes} sub={subCalendario} />
    <Planta pos={[-2.1, 0, -2.0]} vida={vidaPlanta} escala={1.1} />
    <Cartaz pos={[-2.6, 1.9, -0.6]} rot={[0, Math.PI / 2, 0]} />

    {/* porta na parede lateral */}
    <Caixa tam={[0.08, 2.15, 1.0]} pos={[-2.6, 1.075, 1.0]} cor="#c98d5a" raio={0.02} />
    <Cilindro r={0.045} h={0.06} pos={[-2.54, 1.05, 0.65]} rot={[0, 0, Math.PI / 2]} cor="#f2c14e" />

    {/* luminária de teto */}
    <Caixa tam={[1.4, 0.06, 0.32]} pos={[0, 3.45, -1.1]} cor="#ffffff" emissiva="#fffbe8" intensidadeEmissiva={0.6} sombra={false} />
    {children}
  </group>
);

/** Mesa + cadeira + Tanaka, na posição padrão da sala. */
export const EstacaoTanaka: React.FC<{
  personagem?: Partial<PropsPersonagem>;
  escalaMesa?: number;
  escalaCadeira?: number;
  mostrarTanaka?: boolean;
  sobreMesa?: React.ReactNode;
}> = ({ personagem = {}, escalaMesa = 1, escalaCadeira = 1, mostrarTanaka = true, sobreMesa }) => (
  <group>
    {escalaCadeira > 0.001 ? <Cadeira pos={[0, 0, -1.55]} escala={escalaCadeira} /> : null}
    {mostrarTanaka ? <Personagem {...TANAKA} pos={POS_TANAKA} escala={ESCALA_TANAKA} {...personagem} /> : null}
    {escalaMesa > 0.001 ? (
      <group position={[0, 0, -0.75]} scale={escalaMesa}>
        <Mesa largura={1.6} />
        {sobreMesa}
      </group>
    ) : null}
  </group>
);
