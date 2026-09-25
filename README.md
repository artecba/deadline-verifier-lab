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

## Requisitos

- Node.js 18 o superior (usa `fetch` nativo — no hay SDK ni dependencias de
  npm que instalar).
- Una API key de Anthropic (`ANTHROPIC_API_KEY`). Conseguila en
  [console.anthropic.com](https://console.anthropic.com).

## Cómo correrlo

```bash
cp .env.example .env
# Editá .env y pegá tu ANTHROPIC_API_KEY ahí (nunca en el código).

node index.js notificacion-01
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

## Estado

Repo privado por ahora. Material de la Clase 4 (Architect Professional) del
Grupo de Estudio Open Builders, viernes 25/9/2026.
