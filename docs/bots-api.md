# Entrada de los bots: `/api/bots/*`

Los bots de Grok Bot (Antonio, Ideas ELSA, Guionista ELSA) no tocan Supabase: escriben y leen aquí, con una clave por bot.
Quién es el bot sale de su clave, nunca de lo que diga el cuerpo.

- **Dirección:** `https://panel-jordi.vercel.app` (las previews de Vercel están protegidas y no responden a los bots).
- **Clave:** cabecera `Authorization: Bearer <clave>`. Variables en Vercel: `BOTS_API_KEY_ANTONIO`, `BOTS_API_KEY_IDEAS`, `BOTS_API_KEY_GUIONISTA` (mínimo 16 caracteres; sin la variable, ese bot queda fuera).
- **Límite:** 60 llamadas por minuto y bot. Cada llamada con clave válida queda en `bots_llamadas`.
- **Respuestas:** `201`/`200` bien · `400` datos no válidos (`detalle` dice qué) · `401` clave mala · `403` sin permiso · `429` espera 60 s · `500`/`503` reintenta más tarde.
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

Lo que dejó **este** bot, con la respuesta de Jordi. No ve lo de otros bots ni lo de otros módulos.

```bash
curl "https://panel-jordi.vercel.app/api/bots/bandeja?estado=respondido" \
  -H "Authorization: Bearer $BOTS_API_KEY_ANTONIO"
```

`estado` es opcional: `nuevo` · `leido` · `respondido`.
