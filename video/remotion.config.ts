import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
// three.js precisa de WebGL durante o render
Config.setChromiumOpenGlRenderer("angle");
Config.setCrf(18);
Config.setPixelFormat("yuv420p");

// Opcional: usar um Chrome/Chromium já instalado (ex.: em servidores sem internet)
if (process.env.REMOTION_CHROME) {
  Config.setBrowserExecutable(process.env.REMOTION_CHROME);
}
