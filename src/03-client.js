// ============================================================
// DOMINIO: Developer (CCDV) — integración de API
// Pregunta que responde: ¿cómo llamo a Claude desde código, no desde el chat?
//
// Vanilla JS, fetch nativo de Node (18+), sin SDK — para que se vea la llamada
// HTTP real, sin magia de librería.
// ============================================================

// Endpoint "Messages API" — el mismo endpoint que usa cualquier SDK oficial
// por debajo; acá se ve sin la capa de abstracción.
const API_URL = "https://api.anthropic.com/v1/messages";
// MODEL SELECTION (Architect Professional / Claude Models): Haiku, no Opus
// ni Sonnet — decisión de arquitectura, no default por accidente. Esta es
// una tarea de extracción/clasificación de baja complejidad y alto volumen
// potencial (podría correr sobre miles de notificaciones), el perfil
// exacto donde el trade-off costo/latencia de Haiku gana frente a modelos
// más caros pensados para razonamiento multi-paso más profundo.
const MODELO = "claude-haiku-4-5";
const NOMBRE_VAR_ENV = "ANTHROPIC_API_KEY";
const NOMBRE_HEADER_AUTH = "x-api-key";

// DEVELOPER — integración de API (no SDK): esta función entera es la
// respuesta a "¿cómo llamo a Claude desde código real?" — auth por header,
// versión de API explícita, manejo de error HTTP, y extracción del texto
// de la respuesta (`data.content[0].text`, la forma real del response body
// de la Messages API, no una abstracción inventada).
export async function llamarClaude(prompt) {
  // SECRETS MANAGEMENT (security by design, transversal a las 4 certs): la
  // credencial sale de una variable de entorno cargada desde `.env` (ver
  // src/env.js) — nunca hardcodeada en el código ni pasada como parámetro
  // que termine en un log. Fail fast y explícito si falta, en vez de un
  // error críptico de la API más adelante.
  const credencial = process.env[NOMBRE_VAR_ENV];
  if (!credencial) {
    throw new Error(
      `Falta ${NOMBRE_VAR_ENV} (copiá .env.example a .env y completá tu clave real ahí, nunca en el código)`
    );
  }

  const headers = {
    "content-type": "application/json",
    "anthropic-version": "2023-06-01",
  };
  headers[NOMBRE_HEADER_AUTH] = credencial;

  const respuesta = await fetch(API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: MODELO,
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  // RELIABILITY (Architect Professional): un error de la API se propaga
  // como excepción explícita con el status y el detalle — no se traga el
  // error ni se devuelve un string vacío que después rompa algo río abajo
  // de forma confusa. En un sistema real acá iría un retry con backoff
  // (ver "Qué le falta a esto para ser producción real" en el README).
  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    throw new Error(`API respondió ${respuesta.status}: ${detalle}`);
  }

  const data = await respuesta.json();
  return data.content[0].text;
}
