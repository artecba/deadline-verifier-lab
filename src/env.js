// Loader manual de .env — sin dependencia de "dotenv" (cero deps runtime, mismo criterio que
// llm-input-guard / rag-citation-guard).
//
// SUPPLY CHAIN / SECURITY BY DEPENDENCY MINIMIZATION (Architect Foundations,
// tangencial pero real): cero dependencias de npm en todo el lab significa
// cero paquetes de terceros que auditar, cero riesgo de que una dependencia
// transitiva comprometida termine leyendo `ANTHROPIC_API_KEY`. Para un
// proyecto de 150 líneas el trade-off (escribir 12 líneas de parser propio
// en vez de `npm install dotenv`) tiene sentido; para un proyecto grande no
// siempre — es una decisión de arquitectura, no una regla absoluta.
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
