import React from "react";
import { Composition } from "remotion";
import { CurtaViral } from "./CurtaViral";
import "./fontes";
import { DURACAO, FPS } from "./timeline";

export const Root: React.FC = () => (
  <Composition id="CurtaViral" component={CurtaViral} durationInFrames={DURACAO} fps={FPS} width={1080} height={1920} />
);
