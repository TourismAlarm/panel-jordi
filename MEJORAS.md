# MEJORAS (ideas fuera de alcance, para decidir más adelante)

- Portada de ELSA (`/elsa`): demasiado texto; reducirla a «lo urgente» y esconder el resto (Fase 4).
- Revisar en ELSA los botones que Jordi dice que «no funcionan» (falta saber cuáles).
- Tonos verde/ámbar/azul de ELSA: pasarlos a la paleta neutra cuando se rehaga su portada.
- Renombrar las tablas de ELSA a `elsa_*` cuando se actualice `sync_panel.py`.
- Activar «Leaked password protection» en Supabase Auth (aviso del linter; hoy no se usan contraseñas).
- `es_permitido()` es ejecutable por `authenticated` vía RPC (aviso del linter); es inocuo, se puede revocar si se usa otra comprobación.
- Finanzas: las rutas API usan service_role filtrando por user_id (como la app original). Se podría pasar a la sesión del usuario con RLS; hoy RLS protege al navegador y a la prueba automática.
- Finanzas: «Proyección» (regresión a 3 meses), presupuestos por categoría, metas y recurrentes existían en código pero sin pantalla en la app real; no se han portado.
- Finanzas: el offline (cola de movimientos) no se ha portado; la app del móvil necesita conexión.
- Finanzas: los movimientos nuevos del banco deberían pasar por la IA solo si Jordi lo pide (hoy categorización por reglas).
- Salud: conectar la tarea/proceso de Windows existente a `/api/salud/ingesta` (hay que adaptar su salida a `docs/pc-salud.md`).
- Salud: comentario de IA sobre el resumen (sin diagnóstico) cuando exista la clave de Anthropic; hoy es texto calculado.
- Salud: medicación, tensión arterial, agua u otras métricas si las pides (una línea en `lib/salud/metricas.ts`).
- Hoy: marcar un correo como «ya contestado» o «ignorar remitente» (hoy la IA solo lo lee; el panel no toca el correo).
- Hoy: avisar de vencimientos de Documentos cuando exista la Fase 6.
