# Entrada de los bots: `/api/bots/*`

Los bots de Grok Bot (Antonio, Ideas ELSA, Guionista ELSA y los de vida, al final de este documento) no tocan Supabase: escriben y leen aquí. Todo entra con **la clave de Antonio**.
Cada llamada dice para quién trabaja con el campo `bot` (`antonio`, `ideas` o `guionista`); en un `GET`, con `?bot=`. Sin él, firma Antonio, salvo en `ideas` (firma Ideas ELSA), `guiones` (Guionista ELSA) y `revisiones` (Antonio).

`bot` sirve para ver quién hizo cada cosa y para que un bot no haga lo que no le toca (Ideas no puede subir guiones). **No es seguridad:** quien tenga la clave puede firmar como cualquiera.

- **Dirección:** `https://panel-jordi.vercel.app` (las previews de Vercel están protegidas y no responden a los bots).
- **Clave:** cabecera `Authorization: Bearer <clave>`. Variable en Vercel: `BOTS_API_KEY_ANTONIO` (mínimo 16 caracteres). `BOTS_API_KEY_IDEAS` y `BOTS_API_KEY_GUIONISTA` son opcionales: esas claves solo pueden firmar como su bot. `BOTS_API_KEY_EDITOR` es la del PC: solo toma encargos, los entrega y lee reglas.
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

Obligatorios: `idea_id`, `titulo`, `gancho` y `planos`. Para una versión nueva, añade `"reemplaza_id":"<uuid del guion>"`: vale si está `propuesto` (lo mejoras antes de que Jordi lo mire) o en `cambios`. Da `409` si está `aprobado`, `descartado`, `sustituido` o ya tiene `video_id`. La versión anterior pasa a `sustituido`.

Cuando Jordi lo aprueba, el panel crea el proyecto `GE_0xx` al momento y lo apunta en `video_id`. El panel es el único que numera.

Las `preguntas` que llevan `¿` o `?` pasan a la ficha del vídeo para que Jordi las conteste. Lo demás (un aviso de seguridad, por ejemplo) queda en «Notas para grabar».

## `GET /api/bots/guiones?estado=cambios`

`estado`: `propuesto` · `aprobado` · `cambios` · `descartado` · `sustituido`. Con `cambios`, `nota_jordi` dice qué cambiar.

## `POST /api/bots/revisiones`

Solo Antonio. `fase` `guion` lleva `guion_id`; `corte` y `acabado` llevan `video_id`. `no_cumple` necesita `evidencia`, y entonces el `resultado` es `cambios`. Las claves deben existir en `GET /api/bots/reglas`.

```bash
curl -X POST https://panel-jordi.vercel.app/api/bots/revisiones   -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO"   -H "Content-Type: application/json"   -d '{"fase":"corte","video_id":"GE_012","resultado":"cambios","resumen":"El gancho llega tarde","por_regla":[{"clave":"R0001","estado":"no_cumple","evidencia":"segundo 12"},{"clave":"R0002","estado":"cumple"}]}'
```

## `GET /api/bots/reglas?agente=montador`

Reglas activas de Aprende. `agente` es opcional: `guionista` · `archivador` · `observador` · `montador` · `analista` · `coordinador` · `ideas` · `antonio`. Con `historial=1` añade los últimos cambios: quién, cuándo, por qué y el texto de antes. Una regla retirada ya no sale en `items`.

```bash
curl "https://panel-jordi.vercel.app/api/bots/reglas?agente=montador&historial=1"   -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO"
```

## `POST /api/bots/reglas`

Solo Antonio. Crea una regla y entra **activa** al momento; el panel pone el número (`R0030`…). `por_que` y `evidencia` son obligatorios, `medida` no. Si esa regla ya está activa devuelve su clave sin duplicarla, y si estaba retirada la reactiva. Jordi la ve en Aprende con «Deshacer». Con datos de clientes: `422`.

```bash
curl -X POST https://panel-jordi.vercel.app/api/bots/reglas   -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO"   -H "Content-Type: application/json"   -d '{"agente":"montador","regla":"El gancho entra antes del segundo 2","por_que":"Los tres últimos reels con gancho tardío retuvieron menos","evidencia":"GE_038, GE_040, GE_041","medida":"Retención a 3 s de los próximos cinco"}'
```

## `PATCH /api/bots/reglas/{clave}`

Solo Antonio y solo reglas activas. Cambia el texto y sube `version`; el anterior queda en el historial. `404` si no existe y `409` si no está activa.

```bash
curl -X PATCH https://panel-jordi.vercel.app/api/bots/reglas/R0030   -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO"   -H "Content-Type: application/json"   -d '{"regla":"El gancho entra antes del segundo 1,5","por_que":"Con 2 s sigue perdiendo gente"}'
```

## `POST /api/bots/reglas/{clave}/retirar`

Solo Antonio. La regla no se borra: pasa a quitada, deja de aplicarse y Jordi puede deshacerlo.

```bash
curl -X POST https://panel-jordi.vercel.app/api/bots/reglas/R0030/retirar   -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO"   -H "Content-Type: application/json"   -d '{"por_que":"No ha cambiado la retención en cuatro semanas"}'
```

## `POST /api/bots/edicion`

Solo Antonio. Encarga un montaje al PC y el vídeo pasa a `montando`. Para una versión nueva, `reemplaza_id` y `feedback` con lo que cambia: la anterior queda `sustituido`. Si ya hay uno abierto del vídeo y no dices cuál reemplazas: `409`. `cortes` puede ir vacío: el montador los decide viendo el material y lo explica en sus notas. `subtitulos.idioma` es `ca` o `es`. Las reglas del montador se copian solas. Con datos de clientes: `422`.

```bash
curl -X POST https://panel-jordi.vercel.app/api/bots/edicion   -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO"   -H "Content-Type: application/json"   -d '{"video_id":"GE_044","fase":"acabado","brutos":["Nuevos/GE_044"],"instrucciones":{"duracion_objetivo_s":25,"cortes":[{"archivo":"VID_0012.mp4","desde":"00:03.2","hasta":"00:07.8","velocidad":1,"nota":"pie del estabilizador"}],"subtitulos":{"idioma":"ca"},"textos_pantalla":[{"texto":"4 T","desde_s":0,"hasta_s":2.5,"posicion":"centro"}],"onomatopeyas":[{"texto":"CLONC","segundo":3.1}],"transiciones":[{"segundo":7.8,"tipo":"corte_seco"}],"audio":"solo voz"}}'
```

## `GET /api/bots/edicion?estado=listo`

Solo Antonio. Encargos por estado; con `?video_id=GE_044`, los de ese vídeo. Con `estado=listo` solo salen los que aún no has revisado. `GET /api/bots/edicion/{id}` trae uno entero.

```bash
curl "https://panel-jordi.vercel.app/api/bots/edicion?estado=listo"   -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO"
```

## `POST /api/bots/edicion/{id}/responder`

Solo Antonio. Contesta todas las `preguntas` de un encargo `bloqueado` y vuelve a `pendiente`. `n` es la posición de la pregunta, empezando en 1.

```bash
curl -X POST https://panel-jordi.vercel.app/api/bots/edicion/<id>/responder   -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO"   -H "Content-Type: application/json"   -d '{"respuestas":[{"n":1,"respuesta":"VID_0012 es el del estabilizador"}]}'
```

La revisión sigue por `POST /api/bots/revisiones`. `corte` ok da el corte por bueno; `acabado` ok pasa el vídeo a `acabado_listo` y le toca a Jordi; `cambios` deja el encargo en `cambios` para que crees la versión siguiente. El «Aprobar» o «Pedir cambios» de Jordi se aplica al momento y llega por el webhook como `montaje_revisado`.

## `POST /api/bots/edicion/tomar` (PC)

Solo la clave del editor. Devuelve en `encargo` el `pendiente` más antiguo, ya `en_curso`, o `null`. En `finales` van los aprobados por Jordi que faltan por copiar a `FINAL/`. Un encargo que lleva 4 horas en curso pasa a `fallido`.

```bash
curl -X POST https://panel-jordi.vercel.app/api/bots/edicion/tomar   -H "Authorization: Bearer $BOTS_API_KEY_EDITOR"
```

## `POST /api/bots/edicion/{id}/informar` (PC)

Solo la clave del editor. `estado`: `listo` (con `resultado_url` y `duracion_real_s`), `bloqueado` (con `preguntas`), `fallido` (con `error`) o `final` (con `resultado_url`, sobre uno aprobado). Con datos de clientes: `422`. Avisa a Antonio con el evento `edicion_lista`, salvo en `final`.

```bash
curl -X POST https://panel-jordi.vercel.app/api/bots/edicion/<id>/informar   -H "Authorization: Bearer $BOTS_API_KEY_EDITOR"   -H "Content-Type: application/json"   -d '{"estado":"listo","resultado_url":"https://drive.google.com/file/d/xxx/view","notas":"Regla R0023 respetada","duracion_real_s":26.4}'
```

## `GET /api/bots/videos`

Lo que está por revisar; con `?id=GE_012`, ese vídeo. Trae `montaje_url` (Drive en el corte, ChatCut en el acabado) y `guion_md` sin cabecera y con los datos reconocibles tachados.

```bash
curl "https://panel-jordi.vercel.app/api/bots/videos"   -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO"
```

## `GET /api/bots/preguntas`

Lo que Jordi ha contestado y nadie ha recogido, de los vídeos creados en el panel. Con `?video_id=GE_044`, todas las de ese vídeo. Los datos de clientes salen tachados.

```bash
curl https://panel-jordi.vercel.app/api/bots/preguntas   -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO"
```

## `POST /api/bots/videos/{id}/guion`

Mete las respuestas de Jordi en el guion y da esas respuestas por recogidas. Lee el guion con `GET /api/bots/videos?id=GE_044` (sale sin cabecera) y devuelve el cuerpo entero con los huecos rellenos, con su `# Guion completo`. El panel conserva la cabecera, sube la versión y guarda el guion anterior.

```bash
curl -X POST https://panel-jordi.vercel.app/api/bots/videos/GE_044/guion   -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO"   -H "Content-Type: application/json"   -d '{"bot":"guionista","guion_md":"# Guion completo\n\n**Gancho:** ...","recogidas":[{"clave":"P2","respondida_en":"2026-11-04T09:00:00+00:00"}]}'
```

- `recogidas` lleva el `respondida_en` que leíste. Si Jordi cambió la respuesta después, no se recoge y sale en `sin_recoger`: vuelve a leerla. Una respuesta recogida ya no se puede cambiar desde el panel.
- Si una respuesta no cambia el guion, envía solo `recogidas`.
- `409` si el vídeo es del PC o ya tiene el material entregado: a partir de ahí el guion no se toca.

## Avisos a Antonio (webhook)

El panel avisa con un `POST` JSON en cuanto Jordi decide algo. Dispara y olvida: 5 s de espera y sin reintentos. Si falla o faltan las variables, el clic de Jordi funciona igual y el fallo sale en Actividad → Bots. La rutina de cada hora sigue como red de seguridad.

- **Variables en Vercel:** `GROKBOT_WEBHOOK_URL`, `GROKBOT_WEBHOOK_KEY` y, si hace falta, `GROKBOT_WEBHOOK_HEADER` (por defecto `Authorization: Bearer <clave>`; también vale `X-Api-Key`, que manda la clave tal cual).
- **Todos llevan** `"cuando"` (ISO) y `"panel":"https://panel-jordi.vercel.app"`. Lo que escribe Jordi sale con los datos de clientes tachados (`[oculto]`).

| `evento` | Cuándo | Campos |
|---|---|---|
| `idea_me_gusta` | Una idea pasa a «Me gusta» | `idea_id`, `titulo`, `nota_jordi` |
| `guion_cambios` | Jordi pide cambios | `guion_id`, `nota_jordi` |
| `guion_aprobado` | Aprobado y ya es GE | `guion_id`, `video_id` |
| `material_listo` | «Ya he subido todo» | `video_id` |
| `montaje_revisado` | Jordi revisa un montaje | `video_id`, `decision` (`aprobar`, `cambios` o `corte_ok`), `texto` |
| `pregunta_respondida` | Jordi contesta o cambia una respuesta de un vídeo del panel | `video_id`, `clave`, `texto`, `respuesta` |
| `documento_nuevo` | Jordi sube un documento: pásaselo a Documentos. Nunca lleva su contenido | `documento_id`, `nombre`, `mime`, `categoria`, `subido_en` |
| `dia` | Cada mañana, tras dejar el resumen sencillo: pásaselo a Día | `fecha` |
| `resumen_pedido` | Jordi pulsa «Pedir el resumen a Antonio»: pásaselo a Día | `fecha` |

## `POST` y `GET /api/bots/memoria`

Lo que todos los bots deben saber. La misma `clave` actualiza. `tipo`: `hecho` · `preferencia` · `decision`. El `GET` admite `?tipo=`. Claude del PC todavía no la lee.

```bash
curl -X POST https://panel-jordi.vercel.app/api/bots/memoria   -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO"   -H "Content-Type: application/json"   -d '{"clave":"tono-videos","contenido":"Directo, sin música épica","tipo":"preferencia"}'
```

# Bots de vida: Día, Finanzas, Salud y Documentos

Entran con la clave de Antonio y firman con `bot` (`dia`, `finanzas`, `salud`, `documentos`). Ideas y Guionista reciben `403` en todo esto.

- **Solo lectura** de dinero, salud y documentos. Solo escriben sus informes, el resumen de Hoy y las fichas. Ninguna ruta escribe en bancos ni en `fin_*`, y ninguna borra.
- **Lecturas con fechas:** `desde` y `hasta` en `AAAA-MM-DD`. Sin ellas, los últimos 30 días. Máximo 400 días.
- **Páginas:** `limite` (hasta 500, por defecto 100) y `cursor`. Pasa como `cursor` el `siguiente` de la respuesta anterior; `null` es que no hay más.
- **Bandeja:** los avisos de estos bots van a su módulo (`hoy`, `finanzas`, `salud`, `documentos`), nunca a ELSA. Su actividad tampoco sale en ELSA → Actividad.
- **Memoria común:** Salud no escribe en ella. Lo privado no se cuenta a los bots de ELSA.
- **Avisos:** todo llega a Antonio por un solo webhook (`evento` dice de qué es), y él lo reparte. Ver «Avisos a Antonio».

## Día a día (`dia`)

| Ruta | Qué hace |
|---|---|
| `GET /api/bots/hoy/datos` | Lo que reúne la pantalla de Hoy: señales de vídeos, finanzas, vencimientos y Bandeja. Sin agenda ni correo, sin texto de documentos y sin valores de salud (solo el aviso de consultar al médico y que el reloj no llega). |
| `POST /api/bots/hoy/resumen` | Escribe el resumen de la mañana. Sustituye al del cron de ese día. No envía nada. |
| `GET /api/bots/finanzas/resumen` | El resumen del mes. Es lo único de dinero que lee. |
| `GET /api/bots/documentos/vencimientos` | Lo único de documentos que lee. |

```bash
curl -X POST https://panel-jordi.vercel.app/api/bots/hoy/resumen   -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO"   -H "Content-Type: application/json"   -d '{"bot":"dia","fecha":"2026-11-05","resumen":"Hoy hay que revisar un corte.","prioridades":[{"nivel":"urgente","texto":"Renovar el seguro","enlace":"/documentos"}]}'
```

`nivel`: `urgente` · `importante` · `futuro`. `enlace` es opcional: una ruta del panel (`/finanzas`) o una web `https`.

## Finanzas (`finanzas`)

| Ruta | Qué devuelve |
|---|---|
| `GET /api/bots/finanzas/movimientos?desde=&hasta=&categoria=&tipo=&kind=` | `id, fecha, tipo, importe, descripcion, counterparty, categoria, kind, cuenta, loan_id, refund_of`. `categoria` admite id o nombre; `tipo`: `income` o `expense`. Los IBAN salen con los 4 últimos. |
| `GET /api/bots/finanzas/cuentas` | `id, nombre, tipo, rol, saldo, moneda, banco, estado_enlace, valido_hasta, ultima_sync`. |
| `GET /api/bots/finanzas/prestamos` | Los activos, con `pagos` y `proxima_cuota`. |
| `GET /api/bots/finanzas/resumen?mes=YYYY-MM` | El mes financiero, de cobro a cobro: `queda`, `por_dia`, `proximo_cobro`, `ingresos`, `gastado`, `gasto`, `cobros_previstos` y `cobros_deducidos`. |
| `POST /api/bots/finanzas/informe` | Deja un informe. Sale en Finanzas, en «Último informe». |

- **Sin categoría:** muchos movimientos no la tienen. En `gasto` van aparte, en `sin_categoria_por_contraparte`.
- **Cuándo cobro:** `cobros_previstos` sale de las reglas, hoy vacías. Usa `cobros_deducidos`: lo que entra de la misma contraparte en al menos dos meses, desde 300 €, en los últimos 120 días.
- **Importes de `gasto`:** son los del banco. La cuenta conjunta no va a la mitad; `gastado` sí descuenta esa mitad.

```bash
curl -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO" "https://panel-jordi.vercel.app/api/bots/finanzas/movimientos?bot=finanzas&desde=2026-10-01&hasta=2026-10-31&tipo=expense"
```

## Salud (`salud`)

Privado: nunca se mezcla con ELSA.

| Ruta | Qué devuelve |
|---|---|
| `GET /api/bots/salud/metricas?desde=&hasta=&metrica=` | `fecha, metrica, valor, unidad, fuente`. |
| `GET /api/bots/salud/entrenos?desde=&hasta=` | `fecha, tipo, duracion_min, distancia_km, calorias, fc_media, fuente`. |
| `GET /api/bots/salud/registros?desde=&hasta=` | `fecha, creado_en, tipo, etiqueta, texto, intensidad, aviso_medico`. |
| `POST /api/bots/salud/informe` | Deja un informe. Solo sale en Salud. |

**Métricas que llegan:** `animo`, `body_battery`, `calorias_activas`, `energia`, `estres_medio`, `fc_reposo`, `hora_acostarse`, `hrv`, `minutos_activos`, `pasos`, `peso_kg`, `recuperacion`, `sueno_horas`, `sueno_puntuacion`.

```bash
curl -X POST https://panel-jordi.vercel.app/api/bots/salud/informe   -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO"   -H "Content-Type: application/json"   -d '{"bot":"salud","tipo":"semanal","periodo_desde":"2026-10-26","periodo_hasta":"2026-11-01","titulo":"Semana del 26 de octubre","cuerpo_md":"Has dormido mejor que la semana anterior."}'
```

`POST .../informe` admite `tipo`, `titulo`, `cuerpo_md` (markdown) y, opcionales, `periodo_desde`, `periodo_hasta` y `datos`.

## Documentos (`documentos`)

| Ruta | Qué hace |
|---|---|
| `GET /api/bots/documentos?estado=&categoria=&desde=` | La lista, sin texto: `id, nombre, categoria, tipo, mime, estado, subido_en, vencimiento`. |
| `GET /api/bots/documentos/{id}` | El documento, su `ficha`, su `texto` y `url_firmada`, que caduca a los 10 minutos. |
| `GET /api/bots/documentos/vencimientos?dias=60` | Lo que vence en ese plazo o ya venció, con `dias_restantes`. |
| `POST /api/bots/documentos/{id}/ficha` | Guarda lo que ha sacado. De la referencia solo se guardan los 4 últimos. |

- `409` si Jordi escribió la ficha a mano, o si el documento es una nota.
- Las notas de texto no avisan. Hoy los documentos solo entran subiéndolos en el panel.

```bash
curl -X POST https://panel-jordi.vercel.app/api/bots/documentos/ID/ficha   -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO"   -H "Content-Type: application/json"   -d '{"bot":"documentos","categoria":"Seguros","tipo":"Póliza","titular":"Jordi","partes":["Aseguradora"],"referencia":"1234","vencimiento":"2027-01-01","importes":[{"concepto":"Prima","importe":100}],"condiciones":[],"resumen":"Seguro del camión."}'
```
