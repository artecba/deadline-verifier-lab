// ============================================================
// DOMINIO: Associate (CCAI) — output evaluation
// Pregunta que responde: ¿el output tiene el formato correcto y es evaluable?
//
// Un prompt que devuelve texto libre no se puede verificar en código. Por eso
// el primer paso es pedir SIEMPRE una forma de salida fija (JSON), no prosa.
// ============================================================

export function armarPrompt(textoFuente, pregunta) {
  return `Sos un asistente que responde EXCLUSIVAMENTE en base al texto fuente dado.
No uses conocimiento externo ni supongas fechas que no estén en el texto.
Si el texto fuente no permite responder la pregunta, decilo explícitamente.

TEXTO FUENTE:
"""
${textoFuente}
"""

PREGUNTA:
${pregunta}

Devolvé SOLO un JSON con esta forma exacta, sin texto antes ni después:
{
  "fecha_limite": "YYYY-MM-DD o null si no se puede determinar",
  "fragmento_citado": "fragmento EXACTO copiado del texto fuente que sustenta la fecha",
  "confianza": "alta" | "media" | "baja"
}`;
}

// Evaluación mínima del output ANTES de confiar en él — esto es lo que hace que el
// paso anterior sea "evaluable" y no un prompt suelto: ¿tiene la forma que pedimos?
export function evaluarFormato(jsonCrudo) {
  // El modelo a veces envuelve el JSON en un bloque de código Markdown
  // (```json ... ```) aunque el prompt pida "SOLO un JSON, sin texto antes
  // ni después" — instrucción probabilística, no garantía. Sacar el
  // envoltorio acá es parte de "evaluar el formato", no un intento de
  // forzar que algo mal formado pase igual.
  const limpio = jsonCrudo.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(limpio);
  } catch {
    return { valido: false, motivo: "No es JSON parseable", parsed: null };
  }

  const tieneCampos =
    "fecha_limite" in parsed && "fragmento_citado" in parsed && "confianza" in parsed;
  if (!tieneCampos) {
    return { valido: false, motivo: "Faltan campos requeridos", parsed };
  }

  const confianzasValidas = ["alta", "media", "baja"];
  if (!confianzasValidas.includes(parsed.confianza)) {
    return { valido: false, motivo: "Campo confianza fuera del enum esperado", parsed };
  }

  return { valido: true, motivo: null, parsed };
}
