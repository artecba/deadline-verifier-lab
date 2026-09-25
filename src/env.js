// Loader manual de .env — sin dependencia de "dotenv" (cero deps runtime, mismo criterio que
// llm-input-guard / rag-citation-guard).
import { readFileSync, existsSync } from "node:fs";

export function loadEnv(path = ".env") {
  if (!existsSync(path)) return;
  const contenido = readFileSync(path, "utf8");
  for (const linea of contenido.split("\n")) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith("#")) continue;
    const idx = limpia.indexOf("=");
    if (idx === -1) continue;
    const clave = limpia.slice(0, idx).trim();
    const valor = limpia.slice(idx + 1).trim();
    if (!(clave in process.env)) process.env[clave] = valor;
  }
}
