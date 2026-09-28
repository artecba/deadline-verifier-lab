# deadline-verifier-lab

Mini-lab de Arteclaw Builders (Clase 4, Open Builders) — 4 archivos, uno por
certificación Claude (Associate, Developer, Architect Foundations, Architect
Professional). Ver README.md para el contexto completo.

## Reglas del proyecto

- JavaScript vanilla, cero dependencias runtime (`package.json` no debe
  ganar dependencias — usa `fetch` nativo de Node 18+, nada de SDKs).
- No agregar frameworks, bundlers, ni TypeScript — el punto del lab es que
  se lea de punta a punta en minutos.
- El input del usuario/texto fuente SIEMPRE pasa por `01-sanitize.js` antes
  de llegar al prompt — nunca lo mandes directo a la API.
- El output del modelo nunca se usa como confiable "porque el JSON parseó
  bien" — siempre pasa por `04-verify.js` (grounding real contra el texto
  fuente) antes de mostrarse como `✅ CONFIABLE`.
- La `ANTHROPIC_API_KEY` se lee únicamente de `.env` (ver `src/env.js`),
  nunca hardcodeada ni tomada de una variable de entorno global del sistema.
- Modelo fijo: `claude-haiku-4-5` (ver `src/03-client.js`) — no cambiarlo
  sin decirlo explícitamente, es parte de lo que se muestra en la clase.

## Al correr o modificar código acá

- `node index.js [id-del-fixture]` — sin build, sin `npm install`.
- Si tocás `evaluarFormato` (`src/02-prompt.js`): el modelo a veces envuelve
  el JSON en ` ```json ... ``` ` — ya se limpia ese envoltorio antes de
  `JSON.parse`, no asumas que la respuesta cruda siempre es JSON puro.
- Si tocás `verificarFecha` (`src/04-verify.js`): la fecha de referencia
  ("hoy", a los efectos del cálculo del plazo) viene de
  `caso.fechaReferencia` en el fixture, NO de `new Date()` — cada fixture
  asume una fecha distinta en su `pregunta`, y compararla contra la fecha
  real del sistema rompe el resultado esperado.
