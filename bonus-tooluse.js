// ============================================================
// BONUS — tool use / function calling real (Developer, "tool schema")
//
// El lab principal (index.js) le pide a Claude que calcule una fecha
// límite dentro de su respuesta de texto — y vimos en vivo que eso le
// puede fallar (ver el bug real documentado en el historial de commits:
// el modelo se negaba a contar días hábiles hasta que se lo autorizamos
// explícitamente en el prompt). Este script muestra la alternativa más
// robusta: en vez de pedirle al modelo que HAGA el cálculo, le das una
// HERRAMIENTA que lo hace de forma determinística en código, y el modelo
// solo decide CUÁNDO llamarla y CON QUÉ argumentos.
//
// Esto es tool use real de la Messages API (parámetro `tools`), no el
// truco de "pedile JSON en el prompt" que usa el lab principal — acá el
// modelo devuelve un content block de tipo "tool_use" con argumentos
// estructurados y validados contra un schema, no texto libre que hay que
// parsear a mano.
//
// Correr con: node bonus-tooluse.js
// ============================================================

import { loadEnv } from "./src/env.js";

loadEnv();

const API_URL = "https://api.anthropic.com/v1/messages";
const MODELO = "claude-haiku-4-5";

// --- La "herramienta" real: cálculo determinístico, cero IA -----------------
// Esto es exactamente el cálculo que en index.js quedaba a criterio del
// modelo. Acá es código común y corriente — sin ambigüedad, sin necesidad
// de "convencer" al modelo de que puede hacer aritmética de calendario.
function sumarDiasHabiles(fechaInicioISO, cantidadDias) {
  const fecha = new Date(`${fechaInicioISO}T00:00:00`);
  let sumados = 0;
  while (sumados < cantidadDias) {
    fecha.setDate(fecha.getDate() + 1);
    const diaSemana = fecha.getDay(); // 0 = domingo, 6 = sábado
    if (diaSemana !== 0 && diaSemana !== 6) sumados++;
  }
  return fecha.toISOString().slice(0, 10);
}

// --- El schema que la API valida — esto es "tool schema" (Developer) -------
const HERRAMIENTA_DIAS_HABILES = {
  name: "sumar_dias_habiles",
  description:
    "Suma una cantidad de días hábiles (lunes a viernes) a una fecha de inicio y devuelve la fecha resultante en formato YYYY-MM-DD. Usar esto en vez de calcular a mano cualquier plazo en días hábiles.",
  input_schema: {
    type: "object",
    properties: {
      fecha_inicio: { type: "string", description: "Fecha de inicio en formato YYYY-MM-DD" },
      cantidad_dias: { type: "integer", description: "Cantidad de días hábiles a sumar" },
    },
    required: ["fecha_inicio", "cantidad_dias"],
  },
};

async function llamarClaudeConHerramientas(messages) {
  const credencial = process.env.ANTHROPIC_API_KEY;
  if (!credencial) {
    throw new Error("Falta ANTHROPIC_API_KEY (copiá .env.example a .env y completá tu clave real ahí)");
  }
  const respuesta = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": credencial,
    },
    body: JSON.stringify({
      model: MODELO,
      max_tokens: 500,
      tools: [HERRAMIENTA_DIAS_HABILES],
      messages,
    }),
  });
  if (!respuesta.ok) {
    throw new Error(`API respondió ${respuesta.status}: ${await respuesta.text()}`);
  }
  return respuesta.json();
}

async function main() {
  const pregunta =
    "El plazo empieza el 2026-03-03 y son 10 días hábiles. ¿Qué fecha límite resulta? Usá la herramienta disponible para calcularlo, no lo calcules vos mismo.";

  const messages = [{ role: "user", content: pregunta }];
  console.log("=== Turno 1: pedido inicial ===");
  const primeraRespuesta = await llamarClaudeConHerramientas(messages);

  const bloqueToolUse = primeraRespuesta.content.find((b) => b.type === "tool_use");
  if (!bloqueToolUse) {
    console.log("El modelo no llamó a la herramienta, respondió directo:", primeraRespuesta.content);
    return;
  }

  console.log(
    `[Developer] Claude pidió llamar a "${bloqueToolUse.name}" con argumentos:`,
    bloqueToolUse.input
  );

  // Acá el CÓDIGO ejecuta la herramienta — Claude nunca corre JS, solo pide
  // que se la llamen y con qué argumentos.
  const resultadoReal = sumarDiasHabiles(bloqueToolUse.input.fecha_inicio, bloqueToolUse.input.cantidad_dias);
  console.log(`[Tool] sumar_dias_habiles ejecutado en código: ${resultadoReal}`);

  // Segundo turno: le devolvemos el resultado de la herramienta para que
  // arme la respuesta final en base a un cálculo real, no inventado.
  messages.push({ role: "assistant", content: primeraRespuesta.content });
  messages.push({
    role: "user",
    content: [
      {
        type: "tool_result",
        tool_use_id: bloqueToolUse.id,
        content: resultadoReal,
      },
    ],
  });

  console.log("\n=== Turno 2: con el resultado de la herramienta ===");
  const segundaRespuesta = await llamarClaudeConHerramientas(messages);
  const textoFinal = segundaRespuesta.content.find((b) => b.type === "text")?.text;
  console.log("[Developer] Respuesta final de Claude:", textoFinal);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
