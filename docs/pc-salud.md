# Cómo envía el PC los datos de salud al panel

Igual que con ELSA: el PC (tarea de salud + proceso de Windows) recoge los datos y **los deja en el panel**. El panel solo los lee
y enseña. No hace falta ninguna clave de Supabase en el PC: se usa una puerta de entrada con su propia contraseña.

## Puerta de entrada

`POST https://<tu-dominio>/api/salud/ingesta`
Cabecera: `Authorization: Bearer <SALUD_INGESTA_SECRET>` (la variable que pones en Vercel; 16+ caracteres) y `Content-Type: application/json`.

```json
{
  "metricas": [
    { "fecha": "2026-10-20", "metrica": "sueno_horas", "valor": 7.2 },
    { "fecha": "2026-10-20", "metrica": "pasos", "valor": 8450 },
    { "fecha": "2026-10-20", "metrica": "fc_reposo", "valor": 54 }
  ],
  "entrenos": [
    { "fecha": "2026-10-20", "tipo": "correr", "duracion_min": 42, "distancia_km": 7.1, "calorias": 520, "fc_media": 148, "id_externo": "garmin-123456" }
  ]
}
```

- **Repetir un envío no duplica**: una métrica se sobrescribe por `fecha + metrica + fuente`, y un entreno por `fuente + id_externo`.
  Se puede mandar todo el histórico de golpe (hasta 5.000 métricas y 2.000 entrenos por envío) o solo lo de ayer.
- `fuente` es opcional (por defecto `garmin`). **«manual» está reservada** a lo que apuntas en el panel.
- Respuesta: `{"ok":true,"metricas":N,"entrenos":{"nuevos":X,"actualizados":Y}}`. Si algo no es válido, 400 con el motivo.

## Métricas que entiende el panel

| `metrica` | Qué es | Unidad |
|---|---|---|
| `sueno_horas` | Horas dormidas (la noche que termina en `fecha`) | h |
| `sueno_puntuacion` | Calidad del sueño | /100 |
| `hora_acostarse` | Hora de acostarse en horas decimales; pasada la medianoche suma 24 (22:32 → 22.53, 00:30 → 24.5) | h |
| `pasos` | Pasos del día | — |
| `minutos_activos` | Minutos de actividad | min |
| `calorias_activas` | Calorías activas | kcal |
| `fc_reposo` | Pulso en reposo | lpm |
| `hrv` | Variabilidad cardíaca | ms |
| `recuperacion` | Índice de recuperación (el +1.0 de tu correo) | índice |
| `peso_kg` | Peso | kg |
| `estres_medio` | Estrés medio del día | /100 |
| `body_battery` | «Energía» del reloj | /100 |

(`animo` y `energia`, de 1 a 5, las apuntas tú en «Registrar».) Si tu proceso produce otra cosa, dímelo y se añade: es una línea en `lib/salud/metricas.ts`.

## Ejemplo mínimo (PowerShell)

```powershell
$cuerpo = @{ metricas = @(@{ fecha = "2026-10-20"; metrica = "pasos"; valor = 8450 }) } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method Post -Uri "https://<tu-dominio>/api/salud/ingesta" `
  -Headers @{ Authorization = "Bearer $env:SALUD_INGESTA_SECRET" } -ContentType "application/json; charset=utf-8" -Body $cuerpo
```

## Seguridad

- La contraseña `SALUD_INGESTA_SECRET` solo abre esta puerta, y solo para **escribir** datos de salud. No lee nada.
- Los datos solo los lee tu usuario (RLS) y nunca se envían a nadie. La IA no interviene en esta fase.
