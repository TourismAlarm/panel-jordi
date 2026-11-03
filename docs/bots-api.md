# Entrada de los bots: `/api/bots/*`

Los bots de Grok Bot (Antonio, Ideas ELSA, Guionista ELSA) no tocan Supabase: escriben y leen aquí. Todo entra con **la clave de Antonio**.
Cada llamada dice para quién trabaja con el campo `bot` (`antonio`, `ideas` o `guionista`); en un `GET`, con `?bot=`. Sin él, firma Antonio, salvo en `ideas` (firma Ideas ELSA), `guiones` (Guionista ELSA) y `revisiones` (Antonio).

`bot` sirve para ver quién hizo cada cosa y para que un bot no haga lo que no le toca (Ideas no puede subir guiones). **No es seguridad:** quien tenga la clave puede firmar como cualquiera.

- **Dirección:** `https://panel-jordi.vercel.app` (las previews de Vercel están protegidas y no responden a los bots).
- **Clave:** cabecera `Authorization: Bearer <clave>`. Variable en Vercel: `BOTS_API_KEY_ANTONIO` (mínimo 16 caracteres). `BOTS_API_KEY_IDEAS` y `BOTS_API_KEY_GUIONISTA` son opcionales: esas claves solo pueden firmar como su bot.
- **Límite:** 60 llamadas por minuto y bot. Cada llamada con clave válida queda en `bots_llamadas`.
- **Respuestas:** `201`/`200` bien · `400` datos no válidos (`detalle` dice qué) · `401` clave mala · `403` ese bot no hace eso · `404` no existe · `409` conflicto (`error` dice cuál) · `422` lleva datos de clientes (`detalle` dice dónde) · `429` espera 60 s · `500`/`503` reintenta más tarde.
- **Nada de borrar:** ninguna ruta borra.

## `POST /api/bots/actividad`

Registra cada ejecución. Sale en ELSA → Actividad → Bots.

```bash
curl -X POST https://panel-jordi.vercel.app/api/bots/actividad \
  -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO" \
  -H "Content-Type: application/json" \
  -d '{"tarea":"Prueba de conexión","inicio":"2026-11-03T18:00:00+01:00","fin":"2026-11-03T18:00:05+01:00","resultado":"ok","nota":"Primera llamada","enlace":"https://example.com"}'
```

`resultado`: `ok` · `fallo` · `nada`. `fin`, `nota` y `enlace` son opcionales.

## `POST /api/bots/bandeja`

Deja un aviso, pregunta o borrador. Siempre en el módulo ELSA, firmado con el nombre del bot.

```bash
curl -X POST https://panel-jordi.vercel.app/api/bots/bandeja \
  -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO" \
  -H "Content-Type: application/json" \
  -d '{"tipo":"pregunta","titulo":"Prueba de conexión","cuerpo":"Jordi, ¿me lees?"}'
```

`tipo`: `aviso` · `pregunta` · `borrador`. `cuerpo` es opcional.

## `GET /api/bots/bandeja?estado=respondido`

Lo que dejó ese bot (`&bot=ideas`; sin él, Antonio), con la respuesta de Jordi. No ve lo de otros módulos.

```bash
curl "https://panel-jordi.vercel.app/api/bots/bandeja?estado=respondido" \
  -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO"
```

`estado` es opcional: `nuevo` · `leido` · `respondido`.

## Datos de clientes

Ideas, guiones y memoria se rechazan con `422` si llevan teléfono, correo, IBAN, DNI/CIF, precio, nº de presupuesto o dirección. Los nombres de persona no se detectan: no los escribas.

## `POST /api/bots/ideas`

Sale en ELSA → Ideas para que Jordi la marque. Un título repetido responde `409`: reintentar una subida no duplica.

```bash
curl -X POST https://panel-jordi.vercel.app/api/bots/ideas   -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO"   -H "Content-Type: application/json"   -d '{"bot":"ideas","titulo":"Jacuzzi al ático","gancho":"¿Cómo sube esto a un ático?","formato":"Vertical 30 s","por_que_funciona":"Curiosidad y tensión","referencias":["https://example.com/video"],"trabajo_sugerido":"Izado con grúa de 40 t"}'
```

Obligatorios: `titulo` y `gancho`.

## `GET /api/bots/ideas?estado=me_gusta`

`estado`: `nueva` · `me_gusta` · `descartada` · `usada`. Con `me_gusta`, las que el Guionista puede usar, con `nota_jordi`.

## `POST /api/bots/guiones`

Solo desde una idea con «Me gusta» (`409` si no). Al crearlo, la idea pasa a `usada`. Por ahora no se escribe desde el calendario: eso sigue siendo del guionista del PC.

```bash
curl -X POST https://panel-jordi.vercel.app/api/bots/guiones   -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO"   -H "Content-Type: application/json"   -d '{"bot":"guionista","idea_id":"<uuid de la idea>","titulo":"Jacuzzi al ático","gancho":"¿Cómo sube esto a un ático?","planos":["Plano 1: grúa desde abajo","Plano 2: jacuzzi en el aire"],"textos_pantalla":[{"texto":"40 toneladas","segundo":3}],"duracion_s":30,"tema":"Izados","tipo_gancho":"Pregunta","prueba":"Si la pregunta retiene","reglas_cumplidas":["R0001"],"preguntas":["¿Tienes plano desde el ático?"]}'
```

Obligatorios: `idea_id`, `titulo`, `gancho` y `planos`. Si Jordi pide cambios, envía la versión nueva con `"reemplaza_id":"<uuid del guion>"`.

Al aprobarlo, Jordi lo deja como `aprobado`. Hasta que se añada al PC el paso que lo recoja, no se crea el vídeo GE: se queda esperando.

## `GET /api/bots/guiones?estado=cambios`

`estado`: `propuesto` · `aprobado` · `cambios` · `descartado` · `sustituido`. Con `cambios`, `nota_jordi` dice qué cambiar.

## `POST /api/bots/revisiones`

Solo Antonio. `fase` `guion` lleva `guion_id`; `corte` y `acabado` llevan `video_id`. `no_cumple` necesita `evidencia`, y entonces el `resultado` es `cambios`. Las claves deben existir en `GET /api/bots/reglas`.

```bash
curl -X POST https://panel-jordi.vercel.app/api/bots/revisiones   -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO"   -H "Content-Type: application/json"   -d '{"fase":"corte","video_id":"GE_012","resultado":"cambios","resumen":"El gancho llega tarde","por_regla":[{"clave":"R0001","estado":"no_cumple","evidencia":"segundo 12"},{"clave":"R0002","estado":"cumple"}]}'
```

## `GET /api/bots/reglas?agente=montador`

Reglas activas de Aprende. `agente` es opcional: `guionista` · `archivador` · `observador` · `montador` · `analista` · `coordinador`.

```bash
curl "https://panel-jordi.vercel.app/api/bots/reglas?agente=montador"   -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO"
```

## `GET /api/bots/videos`

Lo que está por revisar; con `?id=GE_012`, ese vídeo. Trae `montaje_url` (Drive en el corte, ChatCut en el acabado) y `guion_md` sin cabecera y con los datos reconocibles tachados.

```bash
curl "https://panel-jordi.vercel.app/api/bots/videos"   -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO"
```

## `POST` y `GET /api/bots/memoria`

Lo que todos los bots deben saber. La misma `clave` actualiza. `tipo`: `hecho` · `preferencia` · `decision`. El `GET` admite `?tipo=`. Claude del PC todavía no la lee.

```bash
curl -X POST https://panel-jordi.vercel.app/api/bots/memoria   -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO"   -H "Content-Type: application/json"   -d '{"clave":"tono-videos","contenido":"Directo, sin música épica","tipo":"preferencia"}'
```
