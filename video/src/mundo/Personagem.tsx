import React from "react";
import { useCurrentFrame } from "remotion";
import type { V3 } from "../anim";
import { COR } from "../paleta";
import { Anel, Disco, Ret, Triangulo } from "./base";

// Personagem "recorte de papel": peças 2D chapadas dentro do mundo 3D.
// A origem é o quadril; a cabeça fica em y ≈ 0.9.

export type Expressao = "neutro" | "feliz" | "triste" | "tedio" | "choque" | "bravo" | "serio";
export type Pose =
  | "sentado"
  | "digitando"
  | "queixo"
  | "jornal"
  | "cabecaBaixa"
  | "empe"
  | "apontando"
  | "carta"
  | "comemorando";
export type Cabelo = "lateral" | "careca" | "chanel" | "coque" | "espetado";

type Braco = [number, number]; // [ombro, cotovelo] em radianos
type DefPose = { e: Braco; d: Braco; cabeca?: { y?: number; rot?: number; x?: number }; pernas?: boolean };

const POSES: Record<Pose, DefPose> = {
  sentado: { e: [-0.15, 1.55], d: [0.15, -1.55] },
  digitando: { e: [-0.15, 1.5], d: [0.15, -1.5] },
  queixo: { e: [-0.15, 1.55], d: [-0.45, -2.36], cabeca: { y: -0.07, rot: 0.14, x: 0.03 } },
  jornal: { e: [-0.3, 2.2], d: [0.3, -2.2] },
  cabecaBaixa: { e: [-0.05, 1.8], d: [0.05, -1.8], cabeca: { y: -0.36, rot: 0.55, x: -0.02 } },
  empe: { e: [-0.06, 0.1], d: [0.06, -0.1], pernas: true },
  apontando: { e: [-1.4, 0.12], d: [0.08, -0.12], pernas: true },
  carta: { e: [-0.3, 2.05], d: [0.3, -2.05], cabeca: { y: -0.03, rot: 0 } },
  comemorando: { e: [-2.5, -0.4], d: [2.5, 0.4], cabeca: { y: 0.02 } },
};

export type PropsPersonagem = {
  pos?: V3;
  rot?: V3;
  escala?: number;
  pele?: string;
  cabelo?: string;
  tipoCabelo?: Cabelo;
  terno?: string;
  camisa?: string;
  gravata?: string;
  calca?: string;
  oculos?: boolean;
  bigode?: boolean;
  expressao?: Expressao;
  pose?: Pose;
  /** desloca as pupilas: [-1..1, -1..1] */
  olhar?: [number, number];
  falando?: boolean;
  semente?: number;
  sombra?: boolean;
  /** pernas aparecem automaticamente nas poses em pé */
  pernas?: boolean;
  /** item na mão (jornal/carta) */
  item?: React.ReactNode;
  /** respiração/piscar (desligue para personagens "congelados") */
  vivo?: boolean;
  /** quanto a pose está "acelerada" (digitação) */
  ritmo?: number;
};

const escurecer = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (s: number) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * k)));
  return `#${((c(16) << 16) | (c(8) << 8) | c(0)).toString(16).padStart(6, "0")}`;
};

const BracoPeca: React.FC<{
  lado: -1 | 1;
  angulos: Braco;
  terno: string;
  camisa: string;
  pele: string;
  z: number;
  sombra: boolean;
  apontar?: boolean;
}> = ({ lado, angulos, terno, camisa, pele, z, sombra, apontar }) => {
  const manga = escurecer(terno, 0.88);
  return (
    <group position={[0.27 * lado, 0.55, z]} rotation={[0, 0, angulos[0]]}>
      <Ret w={0.135} h={0.3} r={0.065} pos={[0, -0.12, 0]} cor={manga} sombra={sombra} />
      <group position={[0, -0.25, 0.002]} rotation={[0, 0, angulos[1]]}>
        <Ret w={0.125} h={0.27} r={0.06} pos={[0, -0.11, 0]} cor={manga} sombra={sombra} />
        <Ret w={0.13} h={0.05} r={0.02} pos={[0, -0.215, 0.001]} cor={camisa} sombra={false} />
        <Disco r={0.068} pos={[0, -0.26, 0.002]} cor={pele} sombra={sombra} />
        {apontar ? <Ret w={0.05} h={0.13} r={0.025} pos={[0, -0.34, 0.003]} cor={pele} sombra={sombra} /> : null}
      </group>
    </group>
  );
};

export const Personagem: React.FC<PropsPersonagem> = ({
  pos = [0, 0, 0],
  rot,
  escala = 1,
  pele = COR.pele,
  cabelo = COR.cabeloPreto,
  tipoCabelo = "lateral",
  terno = COR.ternoAzul,
  camisa = COR.camisa,
  gravata = COR.gravataVermelha,
  calca = COR.calca,
  oculos = false,
  bigode = false,
  expressao = "neutro",
  pose = "sentado",
  olhar = [0, 0],
  falando = false,
  semente = 0,
  sombra = true,
  pernas,
  item,
  vivo = true,
  ritmo = 1,
}) => {
  const frame = useCurrentFrame();
  const def = POSES[pose];
  const t = frame / 30 + semente * 1.7;

  // respiração e balanço sutil
  const respira = vivo ? 1 + Math.sin(t * 2.4) * 0.012 : 1;
  const balanco = vivo ? Math.sin(t * 1.3) * 0.018 : 0;

  // piscar a cada ~3,4 s
  const fase = (frame + Math.round(semente * 37)) % 102;
  const piscando = vivo && fase < 4;

  // digitação: antebraços alternando
  let e = def.e;
  let d = def.d;
  if (pose === "digitando") {
    const k = Math.sin(frame * 1.6 * ritmo + semente * 3) * 0.1;
    e = [e[0], e[1] + k];
    d = [d[0], d[1] + k];
  }
  if (pose === "comemorando") {
    const k = Math.sin(frame * 0.9) * 0.15;
    e = [e[0] + k, e[1]];
    d = [d[0] - k, d[1]];
  }

  const cab = def.cabeca ?? {};
  const mostrarPernas = pernas ?? def.pernas ?? false;
  const boca = falando && Math.floor(frame / 3) % 2 === 0 ? "aberta" : expressao;

  // sobrancelhas: [y, rotação esquerda]
  const sobr: Record<Expressao, [number, number]> = {
    neutro: [0.065, 0],
    feliz: [0.08, -0.12],
    triste: [0.06, 0.32],
    tedio: [0.045, 0.05],
    choque: [0.1, 0.12],
    bravo: [0.055, -0.38],
    serio: [0.058, -0.12],
  };
  const [ySobr, rSobr] = sobr[expressao];
  const olhoEscala = piscando ? 0.12 : expressao === "choque" ? 1.25 : 1;
  const pupila: [number, number] = [olhar[0] * 0.018, olhar[1] * 0.014];

  const corCabelo = cabelo;

  return (
    <group position={pos} rotation={rot} scale={escala}>
      {/* pernas */}
      {mostrarPernas ? (
        <group>
          <Ret w={0.2} h={0.82} r={0.08} pos={[-0.12, -0.38, -0.006]} cor={calca} sombra={sombra} />
          <Ret w={0.2} h={0.82} r={0.08} pos={[0.12, -0.38, -0.006]} cor={calca} sombra={sombra} />
          <Ret w={0.27} h={0.1} r={0.05} pos={[-0.15, -0.8, -0.004]} cor={COR.sapato} sombra={sombra} />
          <Ret w={0.27} h={0.1} r={0.05} pos={[0.15, -0.8, -0.004]} cor={COR.sapato} sombra={sombra} />
        </group>
      ) : null}

      <group scale={[1, respira, 1]} rotation={[0, 0, balanco * 0.3]}>
        {/* tronco */}
        <Ret w={0.6} h={0.68} r={0.17} pos={[0, 0.29, 0]} cor={terno} sombra={sombra} />
        <Triangulo
          pontos={[
            [-0.12, 0.62],
            [0.12, 0.62],
            [0, 0.33],
          ]}
          pos={[0, 0, 0.003]}
          cor={camisa}
        />
        <Triangulo
          pontos={[
            [-0.12, 0.62],
            [-0.03, 0.4],
            [-0.17, 0.5],
          ]}
          pos={[0, 0, 0.004]}
          cor={escurecer(terno, 0.8)}
        />
        <Triangulo
          pontos={[
            [0.12, 0.62],
            [0.03, 0.4],
            [0.17, 0.5],
          ]}
          pos={[0, 0, 0.004]}
          cor={escurecer(terno, 0.8)}
        />
        <Ret w={0.07} h={0.24} r={0.03} pos={[0, 0.45, 0.005]} cor={gravata} sombra={false} />
        <Ret w={0.085} h={0.06} r={0.02} pos={[0, 0.585, 0.006]} cor={escurecer(gravata, 0.85)} sombra={false} />
        <Ret w={0.15} h={0.14} r={0.04} pos={[0, 0.66, -0.002]} cor={COR.peleSombra} sombra={false} />

        {/* braços */}
        <BracoPeca lado={-1} angulos={e} terno={terno} camisa={camisa} pele={pele} z={0.012} sombra={sombra} apontar={pose === "apontando"} />
        <BracoPeca lado={1} angulos={d} terno={terno} camisa={camisa} pele={pele} z={0.016} sombra={sombra} />

        {item ? <group position={[0, 0, 0.011]}>{item}</group> : null}

        {/* cabeça */}
        <group position={[cab.x ?? 0, 0.9 + (cab.y ?? 0), 0.02]} rotation={[0, 0, (cab.rot ?? 0) + balanco]}>
          {/* cabelo de trás */}
          {tipoCabelo === "chanel" ? <Ret w={0.52} h={0.5} r={0.2} pos={[0, -0.04, -0.004]} cor={corCabelo} sombra={sombra} /> : null}
          {tipoCabelo === "coque" ? <Disco r={0.1} pos={[0, 0.25, -0.004]} cor={corCabelo} sombra={sombra} /> : null}
          {tipoCabelo !== "careca" ? <Disco r={0.235} pos={[0, 0.02, -0.003]} escala={[1, 0.95]} cor={corCabelo} sombra={sombra} /> : null}

          {/* orelhas e rosto */}
          <Disco r={0.05} pos={[-0.207, -0.01, -0.002]} cor={COR.peleSombra} sombra={sombra} />
          <Disco r={0.05} pos={[0.207, -0.01, -0.002]} cor={COR.peleSombra} sombra={sombra} />
          <Disco r={0.215} escala={[1, 1.04]} cor={pele} sombra={sombra} />

          {/* cabelo da frente */}
          {tipoCabelo === "careca" ? (
            <>
              <Disco r={0.075} pos={[-0.19, 0.05, 0.002]} escala={[0.8, 1.2]} cor={corCabelo} sombra={false} />
              <Disco r={0.075} pos={[0.19, 0.05, 0.002]} escala={[0.8, 1.2]} cor={corCabelo} sombra={false} />
            </>
          ) : tipoCabelo === "espetado" ? (
            <>
              <Disco r={0.235} inicio={0} arco={Math.PI} pos={[0, 0.09, 0.002]} escala={[1, 0.62]} cor={corCabelo} sombra={false} />
              {[-0.14, -0.05, 0.05, 0.14].map((x, i) => (
                <Triangulo
                  key={i}
                  pontos={[
                    [x - 0.06, 0.18],
                    [x + 0.06, 0.18],
                    [x + 0.02 * (i % 2 ? 1 : -1), 0.3],
                  ]}
                  pos={[0, 0, 0.0015]}
                  cor={corCabelo}
                />
              ))}
            </>
          ) : (
            <>
              <Disco r={0.235} inicio={0} arco={Math.PI} pos={[0, 0.09, 0.002]} escala={[1, 0.62]} cor={corCabelo} sombra={false} />
              <Disco r={0.07} pos={[-0.07, 0.1, 0.0025]} escala={[1.6, 0.6]} rot={-0.35} cor={corCabelo} sombra={false} />
              <Ret w={0.05} h={0.11} r={0.02} pos={[-0.2, 0.04, 0.0025]} cor={corCabelo} sombra={false} />
              <Ret w={0.05} h={0.11} r={0.02} pos={[0.2, 0.04, 0.0025]} cor={corCabelo} sombra={false} />
            </>
          )}

          {/* olhos */}
          {[-1, 1].map((lado) => (
            <group key={lado} position={[0.08 * lado, -0.01, 0.004]}>
              <Disco r={0.03} pos={[pupila[0], pupila[1], 0]} escala={[1 * (olhoEscala > 1 ? 1.2 : 1), olhoEscala]} cor={COR.tracos} sombra={false} />
              {!piscando ? <Disco r={0.009} pos={[pupila[0] + 0.01, pupila[1] + 0.012, 0.001]} cor="#ffffff" sombra={false} /> : null}
              {expressao === "tedio" && !piscando ? (
                <Ret w={0.08} h={0.035} pos={[0, 0.016, 0.0015]} cor={pele} sombra={false} />
              ) : null}
              <Ret
                w={0.085}
                h={0.022}
                r={0.011}
                pos={[0, ySobr + 0.01, 0.002]}
                rot={rSobr * -lado}
                cor={tipoCabelo === "careca" ? COR.tracos : corCabelo === COR.grisalho ? "#8d8a94" : COR.tracos}
                sombra={false}
              />
            </group>
          ))}

          {oculos ? (
            <group position={[0, -0.01, 0.006]}>
              <Anel r={0.062} espessura={0.014} pos={[-0.08, 0]} cor="#2a2833" />
              <Anel r={0.062} espessura={0.014} pos={[0.08, 0]} cor="#2a2833" />
              <Ret w={0.04} h={0.013} pos={[0, 0.012]} cor="#2a2833" sombra={false} />
            </group>
          ) : null}

          {/* nariz e bochechas */}
          <Disco r={0.022} pos={[0, -0.065, 0.003]} escala={[1, 0.8]} cor={COR.peleSombra} sombra={false} />
          <Disco r={0.035} pos={[-0.13, -0.08, 0.003]} cor={COR.bochecha} opacidade={0.45} sombra={false} />
          <Disco r={0.035} pos={[0.13, -0.08, 0.003]} cor={COR.bochecha} opacidade={0.45} sombra={false} />

          {bigode ? <Disco r={0.07} inicio={0} arco={Math.PI} pos={[0, -0.115, 0.0045]} escala={[1.15, 0.45]} cor={corCabelo === COR.grisalho ? "#9a97a1" : COR.tracos} sombra={false} /> : null}

          {/* boca */}
          <group position={[0, -0.125, 0.004]}>
            {boca === "feliz" ? (
              <Disco r={0.055} inicio={Math.PI} arco={Math.PI} pos={[0, 0.012]} cor={COR.boca} sombra={false} />
            ) : boca === "triste" ? (
              <Anel r={0.04} espessura={0.016} inicio={0.25} arco={Math.PI - 0.5} pos={[0, -0.04]} cor={COR.tracos} />
            ) : boca === "choque" || boca === "aberta" ? (
              <Disco r={boca === "aberta" ? 0.026 : 0.034} escala={[1, 1.3]} cor={COR.boca} sombra={false} />
            ) : boca === "tedio" ? (
              <Ret w={0.06} h={0.015} r={0.007} pos={[0.02, -0.005]} rot={0.12} cor={COR.tracos} sombra={false} />
            ) : boca === "bravo" ? (
              <Anel r={0.035} espessura={0.016} inicio={0.3} arco={Math.PI - 0.6} pos={[0, -0.035]} cor={COR.tracos} />
            ) : (
              <Ret w={boca === "serio" ? 0.085 : 0.07} h={0.016} r={0.008} cor={COR.tracos} sombra={false} />
            )}
          </group>
        </group>
      </group>
    </group>
  );
};

// Elenco fixo
export const TANAKA: Partial<PropsPersonagem> = {
  oculos: true,
  tipoCabelo: "lateral",
  terno: COR.ternoAzul,
  gravata: COR.gravataVermelha,
};

export const CHEFE: Partial<PropsPersonagem> = {
  tipoCabelo: "careca",
  cabelo: COR.grisalho,
  bigode: true,
  terno: "#3b3446",
  gravata: "#f2b134",
  pele: "#efbf98",
};

export const COLEGAS: Partial<PropsPersonagem>[] = [
  { tipoCabelo: "chanel", cabelo: "#3a2a24", terno: "#e86a5c", gravata: "#fbfaf6" },
  { tipoCabelo: "espetado", cabelo: "#2b2730", terno: "#4c9a7a", gravata: "#ffd166" },
  { tipoCabelo: "coque", cabelo: "#5a3b2e", terno: "#8a6bd1", gravata: "#fbfaf6", oculos: true },
  { tipoCabelo: "lateral", cabelo: "#1f1d24", terno: "#f08a4b", gravata: "#2f3f73" },
  { tipoCabelo: "chanel", cabelo: "#21202a", terno: "#3f8fd2", gravata: "#fbfaf6" },
  { tipoCabelo: "espetado", cabelo: "#6b4a35", terno: "#5a5f6e", gravata: "#e0393e", oculos: true },
  { tipoCabelo: "careca", cabelo: "#2b2730", terno: "#c2507a", gravata: "#fbfaf6", bigode: true },
  { tipoCabelo: "coque", cabelo: "#2b2730", terno: "#2aa39b", gravata: "#ffd166" },
];
