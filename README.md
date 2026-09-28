# Deadline Verifier Lab

Mini-lab de **Arteclaw Builders** (Grupo de Estudio Open) para la Clase 4 —
Architect Professional (CCAR-P). Muestra, en un proyecto de ~150 líneas de
JavaScript vanilla, dónde aparece cada una de las 4 certificaciones oficiales
de Claude (Associate, Developer, Architect Foundations, Architect
Professional) en código real que corre.

No es un curso de RAG ni de arquitecturas agénticas — es deliberadamente
chico. Es la versión de 30 minutos de la charla completa de 60 minutos
"Claude Code en la práctica" (tentativa 7/10), con un caso distinto para no
repetir esa demo.

**El caso:** dado un texto fuente (un fragmento de notificación judicial) y
una pregunta, Claude extrae una fecha límite citando textualmente de dónde la
sacó. El sistema verifica esa cita antes de confiar en ella — no alcanza con
que el JSON tenga buena forma, tiene que ser verdad.

**Qué verifica exactamente, y qué no (punto para mencionar en la clase):** el
verificador comprueba que el `fragmento_citado` exista tal cual dentro del
texto fuente — eso es grounding real, no un chequeo cosmético. Lo que NO
verifica es que la fecha extraída sea el cálculo correcto del plazo (10 días
hábiles desde la notificación): eso queda a criterio del modelo, sin
recalcularse en código. Es un ejemplo útil de "bien formado ≠ verdadero" —
el JSON puede tener una cita real y una fecha igual mal calculada.

## El loop de gobernanza

```
input → (sanitizar) → Claude responde → (evaluar formato) → (verificar) → (loggear) → mostrar
```

| Parada del loop | Archivo | Dominio de certificación | Pregunta que responde |
|---|---|---|---|
| Sanitizar el input | `src/01-sanitize.js` | **Architect Foundations** (security by design) | ¿Qué entra al modelo, y qué riesgo tiene no filtrarlo? |
| Prompt estructurado + evaluación de formato | `src/02-prompt.js` | **Associate** (output evaluation) | ¿El output tiene el formato correcto y es evaluable? |
| Llamada a la API | `src/03-client.js` | **Developer** (integración de API) | ¿Cómo llamo a Claude desde código, no desde el chat? |
| Verificar grounding + fecha, loggear | `src/04-verify.js` | **Architect Professional** (governance, HITL) | ¿Cómo sé si puedo confiar en esto, y quién lo audita después? |

`index.js` orquesta las 4 paradas en orden sobre un fixture de
`fixtures/textos-fuente.json`.

## Origen de los patrones (referencia, no dependencia)

Los patrones de sanitización y de verificación de grounding están adaptados
—no copiados ni importados como paquete— de dos repos abiertos del
ecosistema Arteclaw, sin IP propietaria de Arteclaw (Apache-2.0,
domain-agnostic, cero dependencias runtime):

- **Sanitización de input** (`01-sanitize.js`) — patrón de
  [`arteclaw-io/llm-input-guard`](https://github.com/arteclaw-io/llm-input-guard):
  normalización + detección de señales de riesgo antes de mandar texto no
  confiable a un LLM.
- **Verificación de grounding** (`04-verify.js`) — patrón de
  [`arteclaw-io/rag-citation-guard`](https://github.com/arteclaw-io/rag-citation-guard):
  comprobar que una cita generada por el modelo esté respaldada por el texto
  fuente real, en vez de confiar en que "suena bien".

Este lab es la versión mini, vanilla JS, propia, del programa Builders — los
repos de arriba son la referencia conceptual, no una dependencia del código.

## Ruta sin instalar nada (recomendada para no-técnicos)

No hace falta instalar Node, Git, ni usar una terminal. Se puede correr todo
desde **Claude Code en la web** ([claude.ai/code](https://claude.ai/code)),
disponible también desde la pestaña Code de la app de Claude (celular o
escritorio). Necesitás además una **cuenta de GitHub propia** (gratis — no
hace falta que sea el mismo email que usás para Claude; si no tenés una,
creála antes en [github.com/signup](https://github.com/signup), es gratis
y toma un par de minutos):

1. **Hacé un fork de este repo a tu propia cuenta primero** — botón "Fork"
   arriba a la derecha en GitHub, o directo en
   [github.com/arteclaw-io/deadline-verifier-lab/fork](https://github.com/arteclaw-io/deadline-verifier-lab/fork).
   Es necesario: probado en vivo, claude.ai/code exige elegir un repositorio
   antes de poder mandar cualquier mensaje, y el selector de repos solo
   muestra repos propios (o donde ya tenés la Claude GitHub App instalada)
   — el repo original de `arteclaw-io` NO va a aparecer ahí aunque sea
   público, porque no sos colaborador. El fork es gratis, tuyo, y toma
   10 segundos.
2. Entrá a claude.ai/code y conectá tu cuenta de GitHub (la primera vez pide
   instalar la Claude GitHub App — instalala sobre tu cuenta/todos tus
   repos, no hace falta acceso a `arteclaw-io`).
3. En "Seleccionar repositorio...", elegí **tu propio fork**
   (`<tu-usuario>/deadline-verifier-lab`), no el original.
4. Escribí en español algo como: *"corré `node index.js
   notificacion-02-riesgosa` y explicame qué pasó"*. Claude Code lo ejecuta
   en su propio entorno en la nube y te muestra el resultado.

Ese caso (el riesgoso) **no necesita API key** — es el que conviene que
todos puedan completar sin fricción. El caso normal (`notificacion-01`) sí
necesita una `ANTHROPIC_API_KEY` propia con crédito cargado (ver abajo),
así que es opcional o para que lo muestre el instructor en vivo.

Requiere un plan pago de Claude (Pro, Max o Team) — con la cuenta gratuita
Claude Code no está disponible.

## Requisitos (para correrlo localmente, con Node/terminal)

- Node.js 18 o superior (usa `fetch` nativo — no hay SDK ni dependencias de
  npm que instalar).
- Para el caso `notificacion-01`: una API key de Anthropic
  (`ANTHROPIC_API_KEY`), con facturación propia aparte de cualquier
  suscripción Pro/Max. Cómo conseguirla:
  1. Entrá a [console.anthropic.com](https://console.anthropic.com) y creá
     una cuenta (o iniciá sesión si ya tenés una — es una cuenta distinta a
     la de claude.ai/tu suscripción Pro).
  2. Cargá una forma de pago y agregá crédito (unos USD 5 alcanzan de sobra
     para este lab) en
     [console.anthropic.com/settings/billing](https://console.anthropic.com/settings/billing).
  3. Creá la key en
     [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
     → **Create Key**, ponele un nombre (ej. "deadline-verifier-lab") y
     copiala — Anthropic la muestra una sola vez.
  4. Pegala en tu `.env` como `ANTHROPIC_API_KEY=sk-ant-...` (nunca en el
     código ni en un mensaje/chat).

  **No la definas como variable de entorno global de tu sistema** si además
  usás Claude Code con tu suscripción — Anthropic recomienda no tenerla
  seteada así, para evitar que Claude Code la use y te cobre de más por
  afuera del plan. Este lab la lee únicamente de `.env` (no del entorno del
  sistema), así que alcanza con no exportarla en tu shell.
- `notificacion-02-riesgosa` no necesita API key — se rechaza antes de
  llamar a la API.

## Cómo correrlo

```bash
cp .env.example .env
# Editá .env y pegá tu ANTHROPIC_API_KEY ahí (nunca en el código) — solo
# hace falta para notificacion-01, no para el caso riesgoso.

node index.js notificacion-02-riesgosa   # no usa la API
node index.js notificacion-01            # sí usa la API
```

Fixtures disponibles en `fixtures/textos-fuente.json`:

- `notificacion-01` — caso normal: el modelo tiene que extraer la fecha
  límite y citar el fragmento correcto. Debería salir `✅ CONFIABLE`.
- `notificacion-02-riesgosa` — el texto fuente en sí mismo intenta un prompt
  injection ("ignorá las instrucciones anteriores..."). El sistema lo detecta
  y **rechaza antes de llamar a la API** — no gasta ni una llamada en un
  input riesgoso.

Cada corrida deja un registro en `logs/auditoria.jsonl` (no se sube a git):
qué se pidió, qué contestó el modelo, y si pasó la verificación. Es el
archivo que un humano revisaría en un proceso real de auditoría/HITL.

## Qué le falta a esto para ser producción real

Este lab no maneja reintentos, rate limiting, ni un almacenamiento de logs
real (acá es un archivo local en texto plano). Tampoco resuelve cómputo real
de días hábiles/feriados para el caso legal — usa una comparación de fechas
simplificada a propósito. Esa distancia entre este prototipo y una
herramienta real es, justamente, el contenido de las 5 clases del Programa
Starter Individual.

## Nota sobre red en Claude Code web

El nivel de red por defecto de claude.ai/code ("Trusted") deja pasar
registros de paquetes (npm, etc.) pero bloquea el resto de internet, con
excepción de la propia API de Anthropic para los pedidos que hace Claude
Code — no necesariamente para un `fetch` que el script mismo haga a
`api.anthropic.com`. Si `notificacion-01` falla ahí con un error de red (no
de fecha ni de JSON), cambiá a nivel "Custom" y agregá `api.anthropic.com` a
los dominios permitidos.

## Estado

Repo público. Material de la Clase 4 (Architect Professional) del Grupo de
Estudio Open Builders, originalmente viernes 25/9/2026.
