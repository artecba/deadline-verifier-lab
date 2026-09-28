// ============================================================
// DOMINIO: Architect Professional (CCAR-P) — governance, HITL, auditoría
// Pregunta que responde: ¿cómo sé si puedo confiar en esto, y quién lo audita después?
//
// Dos responsabilidades separadas a propósito:
//   1) verificar (grounding): patrón adaptado de arteclaw-io/rag-citation-guard —
//      comprobar que lo que el modelo dice haber citado exista de verdad en el
//      texto fuente, en vez de confiar ciegamente en el output.
//   2) loggear: registrar la decisión completa para que un humano pueda auditar
//      después qué se pidió, qué contestó el modelo, y si pasó la verificación.
// ============================================================

import { appendFile, mkdir } from "node:fs/promises";

const ARCHIVO_LOG = "logs/auditoria.jsonl";

// --- 1) Verificación de grounding -----------------------------------------

// GROUNDEDNESS (Architect Professional — término exacto del glosario de la
// certificación): esta función, sola, es el corazón de todo el lab. Un
// modelo puede devolver un JSON perfecto, con una fecha con buena pinta y
// "confianza": "alta" — y aun así estar inventando la cita. La única forma
// de saberlo es comprobar el texto real, en código, sin confiar en lo que
// el modelo DICE que citó.
export function verificarGrounding(textoFuente, fragmentoCitado) {
  if (!fragmentoCitado || typeof fragmentoCitado !== "string") {
    return { grounded: false, motivo: "No hay fragmento citado" };
  }
  // Comparación literal, no difusa: el fragmento citado tiene que existir tal
  // cual en el texto fuente. Si no está, no se confía en la fecha aunque el
  // JSON esté "bien formado" — bien formado no es lo mismo que verdadero.
  const existe = textoFuente.includes(fragmentoCitado.trim());
  return {
    grounded: existe,
    motivo: existe ? null : "El fragmento citado no aparece textualmente en el texto fuente",
  };
}

// VALIDACIÓN DE REGLA DE NEGOCIO, no solo de formato: acá se aplica lógica
// de dominio (¿la fecha ya pasó respecto a una referencia?) sobre un dato
// que YA se confirmó bien formado en 02-prompt.js. Es la capa siguiente,
// deliberadamente separada.
export function verificarFecha(fechaLimiteStr, fechaReferencia = new Date()) {
  if (fechaLimiteStr === null || fechaLimiteStr === "null") {
    return { fechaValida: false, motivo: "El modelo no pudo determinar una fecha" };
  }
  const fecha = new Date(fechaLimiteStr);
  if (Number.isNaN(fecha.getTime())) {
    return { fechaValida: false, motivo: "Formato de fecha inválido" };
  }
  if (fecha < fechaReferencia) {
    return { fechaValida: false, motivo: "La fecha límite ya pasó respecto a la fecha de referencia" };
  }
  return { fechaValida: true, motivo: null };
}

// --- 2) Log de auditoría ----------------------------------------------------

// HITL / AUDITABILIDAD (Architect Professional — governance, safety & risk
// management): esta función es lo que convierte "el sistema decidió algo"
// en "un humano puede revisar por qué después". Guarda SIEMPRE — tanto
// cuando se rechaza en sanitización como cuando se verifica — con qué se
// pidió, qué contestó el modelo, y el resultado de la verificación. En un
// sistema real esto sería una tabla auditada, no un archivo de texto
// plano (ver "Qué le falta a esto para ser producción real" en el README);
// acá alcanza para mostrar el concepto: nunca actuar sobre una decisión de
// IA sin dejar rastro de cómo se llegó a ella.
export async function loggearDecision(registro) {
  await mkdir("logs", { recursive: true });
  const linea = JSON.stringify({ timestamp: new Date().toISOString(), ...registro }) + "\n";
  await appendFile(ARCHIVO_LOG, linea, "utf8");
}
