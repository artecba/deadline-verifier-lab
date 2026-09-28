---
name: verificar-cita
description: Verifica si una cita textual que Claude dice haber extraído de un documento existe de verdad en el texto fuente (grounding), y si una fecha resultante es futura respecto a una fecha de referencia dada. Usar cuando alguien pide chequear si una respuesta de Claude sobre un plazo/cita legal es confiable antes de mostrarla como tal.
---

# Verificar cita y fecha límite

Esta skill envuelve la lógica de `src/04-verify.js` de este repo
(`verificarGrounding` y `verificarFecha`) para que se pueda invocar como
chequeo puntual dentro de una sesión de Claude Code, sin tener que correr
`index.js` completo.

## Cuándo usar esta skill

- Alguien pegó un texto fuente + una cita que un LLM dice haber sacado de
  ahí, y quiere saber si esa cita es real (grounding) antes de confiar en
  cualquier conclusión basada en ella.
- Alguien tiene una fecha límite extraída y quiere confirmar que sea
  posterior a una fecha de referencia dada (no un plazo ya vencido).

## Cómo verificar

1. **Grounding de la cita** — el fragmento citado tiene que existir
   TEXTUALMENTE (comparación literal, no parafraseada) dentro del texto
   fuente completo. Si no aparece tal cual, la cita es falsa aunque
   "suene" coherente con el resto — no uses juicio semántico acá, es una
   comprobación de substring exacto (ver `verificarGrounding` en
   `src/04-verify.js` de este repo para la implementación de referencia).
2. **Validez de la fecha** — la fecha resultante tiene que ser una fecha
   real (parseable) y posterior o igual a la fecha de referencia dada
   (no la fecha real del sistema, salvo que se indique lo contrario
   explícitamente — ver el bug real documentado en el historial de commits
   de este repo sobre por qué la fecha de referencia no puede ser
   `new Date()` a ciegas).
3. Si CUALQUIERA de los dos chequeos falla, la conclusión completa es
   "NO CONFIABLE" — no hay términos medios ni "confiable con reservas".

## Output esperado

Reportar en este formato:

```
Grounding: [OK / FALLÓ] — <motivo si falló>
Fecha: [OK / FALLÓ] — <motivo si falló>
Veredicto: [CONFIABLE / NO CONFIABLE]
```

## Por qué existe esta skill (nota para la clase)

Esto es exactamente el punto pedagógico del lab convertido en una Skill
reutilizable: separar "está bien formado" (evaluarFormato, Associate) de
"es verdad" (esta skill, Architect Professional). Una Skill de Claude Code
es, en esencia, instrucciones reutilizables versionadas junto al código —
el mismo criterio de "no confiar a ciegas en el output" se puede aplicar
tanto corriendo `node index.js` como pidiéndole a Claude Code, en una
sesión interactiva, que use esta skill sobre un texto que le pegues en el
chat.
