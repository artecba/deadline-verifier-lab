// ============================================================
// DOMINIO: Developer (CCDV) — integración de API
// Pregunta que responde: ¿cómo llamo a Claude desde código, no desde el chat?
//
// Vanilla JS, fetch nativo de Node (18+), sin SDK — para que se vea la llamada
// HTTP real, sin magia de librería.
// ============================================================

const API_URL = "https://api.anthropic.com/v1/messages";
const MODELO = "claude-haiku-4-5";
const NOMBRE_VAR_ENV = "ANTHROPIC_API_KEY";
const NOMBRE_HEADER_AUTH = "x-api-key";

export async function llamarClaude(prompt) {
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

  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    throw new Error(`API respondió ${respuesta.status}: ${detalle}`);
  }

  const data = await respuesta.json();
  return data.content[0].text;
}
