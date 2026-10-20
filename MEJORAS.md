# MEJORAS (ideas fuera de alcance, para decidir más adelante)

- Portada de ELSA (`/elsa`): demasiado texto; reducirla a «lo urgente» y esconder el resto (Fase 4).
- Revisar en ELSA los botones que Jordi dice que «no funcionan» (falta saber cuáles).
- Tonos verde/ámbar/azul de ELSA: pasarlos a la paleta neutra cuando se rehaga su portada.
- Renombrar las tablas de ELSA a `elsa_*` cuando se actualice `sync_panel.py`.
- Activar «Leaked password protection» en Supabase Auth (aviso del linter; hoy no se usan contraseñas).
- `es_permitido()` es ejecutable por `authenticated` vía RPC (aviso del linter); es inocuo, se puede revocar si se usa otra comprobación.
