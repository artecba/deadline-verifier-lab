// ============================================================
// DOMINIO: Associate (CCAI) — output evaluation
// Pregunta que responde: ¿el output tiene el formato correcto y es evaluable?
//
// Un prompt que devuelve texto libre no se puede verificar en código. Por eso
// el primer paso es pedir SIEMPRE una forma de salida fija (JSON), no prosa.
// ============================================================

export function armarPrompt(textoFuente, pregunta) {
  return `Sos un asistente que responde EXCLUSIVAMENTE en base al texto fuente dado.
No inventes hechos, plazos ni fechas que no estén en el texto o en la
pregunta. SÍ podés (y tenés que) hacer aritmética de calendario básica —
contar días hábiles de lunes a viernes a partir de una fecha dada— cuando
la pregunta te da la fecha de partida explícitamente: eso es cálculo, no
conocimiento externo inventado.
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
  // (```json ... ```), y a veces además agrega prosa DESPUÉS del bloque
  // (ej. una "Justificación:" explicando la respuesta) aunque el prompt
  // pida "SOLO un JSON, sin texto antes ni después" — instrucción
  // probabilística, no garantía. Sacar solo el primer bloque {...} en vez
  // de asumir que el JSON ocupa el string entero es lo que hace que esto
  // sobreviva tanto al caso "envuelto en fences" como al caso "envuelto Y
  // con texto después" — un simple trim de fences al principio/final no
  // alcanza cuando hay contenido después del fence de cierre.
  const inicioJson = jsonCrudo.indexOf("{");
  const finJson = jsonCrudo.lastIndexOf("}");
  const candidato =
    inicioJson !== -1 && finJson !== -1 && finJson > inicioJson
      ? jsonCrudo.slice(inicioJson, finJson + 1)
      : jsonCrudo.trim();

  let parsed;
  try {
    parsed = JSON.parse(candidato);
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
