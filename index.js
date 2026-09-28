// ============================================================
// Orquestador del loop de gobernanza:
//   input → (sanitizar) → Claude responde → (verificar) → (loggear) → mostrar
//
// Cada parada del loop vive en su propio archivo en src/, uno por dominio de
// certificación. Correr con: node index.js [id-del-fixture]
// ============================================================

import { readFile } from "node:fs/promises";
import { loadEnv } from "./src/env.js";
import { sanitizarInput } from "./src/01-sanitize.js";
import { armarPrompt, evaluarFormato } from "./src/02-prompt.js";
import { llamarClaude } from "./src/03-client.js";
import { verificarGrounding, verificarFecha, loggearDecision } from "./src/04-verify.js";

loadEnv();

async function main() {
  const idFixture = process.argv[2] ?? "notificacion-01";
  const fixtures = JSON.parse(await readFile("fixtures/textos-fuente.json", "utf8"));
  const caso = fixtures.find((f) => f.id === idFixture);
  if (!caso) {
    console.error(`No existe el fixture "${idFixture}". Opciones: ${fixtures.map((f) => f.id).join(", ")}`);
    process.exit(1);
  }

  console.log(`\n=== Caso: ${caso.id} ===`);

  // PARADA 1 — Architect Foundations: sanitizar
  const { textoSanitizado, riesgo, senalesDetectadas } = sanitizarInput(caso.texto);
  console.log(`[Architect Foundations] riesgo detectado: ${riesgo}`, senalesDetectadas);

  if (riesgo === "alto") {
    // Decisión de gobierno explícita: no se manda a la API un input con señales
    // de prompt injection. Se loggea igual, para que quede registro de qué se
    // rechazó y por qué.
    await loggearDecision({
      caso: caso.id,
      etapa: "rechazado_en_sanitizacion",
      senalesDetectadas,
    });
    console.log("[Architect Professional] Rechazado antes de llamar al modelo. Ver logs/auditoria.jsonl");
    return;
  }

  // PARADA 2 — Associate: prompt estructurado
  const prompt = armarPrompt(textoSanitizado, caso.pregunta);

  // PARADA 3 — Developer: llamada real a la API
  const respuestaCruda = await llamarClaude(prompt);
  console.log("[Developer] Respuesta cruda de la API:", respuestaCruda);

  // PARADA 2 (evaluación) — Associate: ¿el output tiene la forma esperada?
  const evaluacion = evaluarFormato(respuestaCruda);
  console.log("[Associate] Formato válido:", evaluacion.valido, evaluacion.motivo ?? "");

  // PARADA 4 — Architect Professional: verificar + loggear
  let resultado;
  if (!evaluacion.valido) {
    resultado = { confiable: false, motivo: evaluacion.motivo };
  } else {
    const grounding = verificarGrounding(textoSanitizado, evaluacion.parsed.fragmento_citado);
    // fechaReferencia del fixture: el "hoy" que la pregunta le da al modelo
    // (ej. "asumiendo que hoy es 3 de marzo de 2026"), no la fecha real del
    // sistema — si se usa new Date() acá, cualquier fixture con una fecha
    // asumida en el pasado siempre sale "NO CONFIABLE" sin importar qué
    // conteste el modelo.
    const fechaReferencia = caso.fechaReferencia ? new Date(caso.fechaReferencia) : new Date();
    const fecha = verificarFecha(evaluacion.parsed.fecha_limite, fechaReferencia);
    resultado = {
      confiable: grounding.grounded && fecha.fechaValida,
      grounding,
      fecha,
      datosExtraidos: evaluacion.parsed,
    };
  }

  console.log("[Architect Professional] Resultado de verificación:", resultado);

  await loggearDecision({
    caso: caso.id,
    etapa: "verificado",
    inputSanitizado: textoSanitizado,
    respuestaCruda,
    resultado,
  });

  console.log(`\n${resultado.confiable ? "✅ CONFIABLE" : "⚠️  NO CONFIABLE"} — ver logs/auditoria.jsonl para el registro completo.\n`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
