// ============================================================
// DOMINIO: Architect Foundations (CCAR-F) — security by design
// Pregunta que responde: ¿qué entra al modelo, y qué riesgo tiene no filtrarlo?
//
// Patrón adaptado (no copiado) de arteclaw-io/llm-input-guard: normalización +
// detección de señales de riesgo antes de mandar el input a la API. Acá es una
// versión mini, propia, en vanilla JS — no importa el paquete real.
// ============================================================

const LIMITE_CARACTERES = 2000;

// Frases típicas de intento de prompt injection sobre las instrucciones del sistema.
// Los patrones matchean sobre texto SIN tildes (ver quitarTildes) para cubrir
// conjugaciones acentuadas ("ignorá", "actuá") sin listar cada variante a mano.
const SENALES_DE_RIESGO = [
  /ignor[ae].{0,20}instruccion/i,
  /olvid[ae].{0,20}(instruccion|rol|prompt)/i,
  /sos\s+ahora/i,
  /system\s*prompt/i,
  /actua\s+como/i,
];

function quitarTildes(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function sanitizarInput(textoCrudo) {
  if (typeof textoCrudo !== "string" || textoCrudo.trim().length === 0) {
    throw new Error("Input vacío o inválido");
  }

  // 1) Normalización básica: espacios, saltos de línea, caracteres de control.
  let normalizado = textoCrudo
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim();

  // 2) Límite de tamaño — un texto "fuente" de 50.000 caracteres no es un caso de uso
  //    real para este lab, es una señal de abuso o de input mal armado.
  if (normalizado.length > LIMITE_CARACTERES) {
    normalizado = normalizado.slice(0, LIMITE_CARACTERES);
  }

  // 3) Detección de señales de riesgo (prompt injection). No bloquea silenciosamente:
  //    devuelve la señal para que la capa de arriba decida (loggear, rechazar, etc.)
  //    — la decisión de gobierno queda en Architect Professional (04-verify.js), acá
  //    solo se detecta.
  const paraDeteccion = quitarTildes(normalizado);
  const senalesDetectadas = SENALES_DE_RIESGO
    .filter((patron) => patron.test(paraDeteccion))
    .map((patron) => patron.source);

  return {
    textoSanitizado: normalizado,
    riesgo: senalesDetectadas.length > 0 ? "alto" : "bajo",
    senalesDetectadas,
  };
}
