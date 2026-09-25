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

export async function loggearDecision(registro) {
  await mkdir("logs", { recursive: true });
  const linea = JSON.stringify({ timestamp: new Date().toISOString(), ...registro }) + "\n";
  await appendFile(ARCHIVO_LOG, linea, "utf8");
}
