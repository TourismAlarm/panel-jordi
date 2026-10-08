# Lo que el PC tiene que recoger del panel: `peticiones`

Desde el móvil, Jordi puede **descartar un proyecto** o **pedir un guion para otro trabajo**.
La app solo lo apunta en la tabla `peticiones` de Supabase (proyecto `Panel-jordi`). Es el mismo
patrón que las respuestas a las preguntas: el PC lo recoge, actúa y marca `recogida_en`.

Esto va en `scripts/sync_panel.py` (en `D:\automatizaciones`), con la clave de servicio que ya usa el sync.

## La tabla

| Columna         | Qué es |
| --------------- | ------ |
| `id`            | uuid |
| `tipo`          | `descartar` o `nuevo` |
| `video_id`      | Código del proyecto (p. ej. `GE_010`). Solo en `descartar` |
| `motivo`        | `no_lo_hice` · `no_me_gusta` · `no_sirve` · `otro`. Solo en `descartar` |
| `texto`         | Nota de Jordi (en `nuevo`: qué trabajo es; siempre hay texto) |
| `fecha_trabajo` | Día del trabajo, si lo puso. Solo en `nuevo` |
| `creada_en`     | Cuándo lo pidió |
| `recogida_en`   | **Lo pone el PC** al recogerla. Mientras está vacío, Jordi puede deshacerla (se borra la fila) |

## Qué hacer en cada sync

```python
pendientes = supabase.table("peticiones").select("*").is_("recogida_en", "null").order("creada_en").execute().data

for p in pendientes:
    if p["tipo"] == "descartar":
        # 1. Parar el proyecto: que ningún agente (guionista, montador, observador…) vuelva a trabajar en él.
        # 2. Archivarlo en local (mover su carpeta a archivo/descartados/ o marcar su estado como «archivado»).
        # 3. Guardar el motivo y la nota en su historial: sirven al guionista para aprender
        #    (p. ej. «no_lo_hice» = ese trabajo no lo hizo Jordi; «no_me_gusta» = replantear el enfoque).
        # 4. En el próximo sync, subir el vídeo con estado «archivado» (el panel ya lo entiende como cerrado).
        ...
    elif p["tipo"] == "nuevo":
        # Crear un encargo para el guionista con p["texto"] y p["fecha_trabajo"], como si viniera del calendario.
        # Cuando exista el proyecto, se sube a «videos» como cualquier otro y aparece en el panel.
        ...
    supabase.table("peticiones").update({"recogida_en": ahora_iso}).eq("id", p["id"]).execute()
```

## Importante

- **Recoger antes de subir vídeos.** Si el sync vuelve a subir un proyecto descartado, en el panel
  sigue saliendo como «Descartado» (la app mira `peticiones`), pero los agentes seguirían trabajando en él.
- Una petición borrada antes de recogerla = Jordi la ha deshecho. No hay que hacer nada.
- Si no se puede actuar (p. ej. el proyecto ya no existe), marcar `recogida_en` igualmente para no repetirla.

## Edición sin guion (`sin_guion`)

Urgencia que Jordi ya ha grabado sin guion («Nuevo» → «Ya lo he grabado»): `texto` = qué trabajo es, `fecha_trabajo` = día
que lo grabó. `sync_panel.py` (`edicion_sin_guion`) crea el vídeo con `contenido.crear(...)` en estado `esperando_material`
y `sin_guion: true`, le crea su carpeta de Drive, apunta el código en `peticiones.video_id` y lo sube a `videos` con
`sin_guion = true` (el panel no espera guion y pide subir lo grabado). Desde ahí es un vídeo más: «Ya he subido todo»
→ `LISTO.txt` → archivador → observador → guionista modo 3 → montador.
