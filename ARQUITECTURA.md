# Cómo está montado el panel

> Puesto al día el 10-11-2026. El panel tiene cinco módulos (Hoy, Finanzas, Salud, ELSA, Documentos) más Antonio, Bandeja y Ajustes.
> Quién hace qué: **Antonio y los bots de Grok Bot llevan el día a día** (leen y escriben por `/api/bots/*`, contrato en `docs/bots-api.md`);
> **Claude Code mantiene el código**. Ningún bot toca Supabase directamente.

La app está hecha por capas. Cada capa solo usa las de debajo, así que para añadir algo
nuevo casi nunca hay que tocar lo que ya funciona.

```
  app/            4 · PANTALLAS   qué se ve en cada dirección (/, /elsa, /finanzas, …) y las puertas /api/*
  components/     3 · PIEZAS      cómo se ve cada cosa
  lib/            2 · REGLAS      qué significa cada estado, fechas, acciones
  lib/datos/      1 · DATOS       lo único que habla con Supabase
  lib/supabase/   0 · CONEXIÓN    cliente y tipos de la base de datos
```

## 0 · Conexión — `lib/supabase/`

| Archivo     | Qué hace |
| ----------- | -------- |
| `config.ts` | Lee `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Avisa claro si faltan. |
| `server.ts` | Cliente con la sesión de Jordi (clave pública + RLS). Nunca la service_role. |
| `admin.ts`  | Cliente con la service_role, **solo servidor**: crons, `/api/bots/*` y Finanzas. Salta RLS: toda consulta filtra por `user_id`. |
| `tipos.ts`  | Tipos generados de las tablas. `Fila<"videos">` es una fila de `videos`. |

Si cambia una tabla en Supabase, se regeneran los tipos (`supabase gen types typescript` o
pidiéndoselo a Claude) y TypeScript señala todo lo que haya que ajustar.

## 1 · Datos — `lib/datos/`

Un archivo por tabla. Las pantallas nunca llaman a Supabase directamente: piden aquí.

| Archivo        | Funciones |
| -------------- | --------- |
| `videos.ts`    | `listarProyectos()` (vídeo + ficha sacada del guion), `listarVideos()`, `obtenerVideo(id)`, `ultimaSincronizacion(videos)` |
| `preguntas.ts` | `resumenPreguntas()` (por proyecto: total, sin contestar, enviadas), `resumir(filas)`, `preguntasDeVideo(id)`, `contarEnviadas()`, `guardarRespuesta(id, texto)` |
| `actividad.ts` | `actividadReciente()`, `actividadDeVideo(id)`, `estadoAgentes()` |
| `peticiones.ts` | `listarPeticiones()`, `descartesPorVideo()`, `descartarProyecto()`, `pedirGuionNuevo()`, `pedirEdicionSinGuion()` (urgencia ya grabada: el PC crea el proyecto con `videos.sin_guion` y su carpeta de Drive, sin guionista), `confirmarMaterial()` / `materialDeVideo()` («Ya he subido todo»: hasta que se pulsa, el PC no procesa ni monta el material), `borrarPeticion()` (deshacer). Lo que pides al PC; él lo recoge (ver `docs/pc-peticiones.md`). |
| `reglas.ts`    | `listarReglas()`, `contarPorDecidir()`, `agruparReglas()`, `guardarDecision(id, si/no/quitar/null)`. Lo que aprenden los agentes: ellos proponen, tú decides en **Aprende** y el PC lo escribe en `sistema/aprendido/` (ver `sistema/aprendizaje.md` en `D:\automatizaciones`). |
| `redes.ts`     | `fotosRecientes()` (fotos diarias de Instagram, tabla `windsor_fotos`), `infoReels()` (GE, tema y duración de cada reel, `redes_reels`), `ultimoInforme()` (informe del analista, `informes_redes`). Las dos últimas las sube el PC (`subir_redes` en `sync_panel.py`). |
| `sesion.ts`    | `usuarioActual()` |

- Si Supabase falla, se lanza un error y sale la pantalla «Algo ha fallado» con **Reintentar**
  (antes se enseñaba una lista vacía y no se sabía si era un fallo).
- Van envueltas en `cache()`: si dos partes de la misma pantalla piden lo mismo, se consulta una vez.

## 2 · Reglas — `lib/`

| Archivo       | Qué hace |
| ------------- | -------- |
| `estados.ts`  | Traduce estados técnicos a palabras y a un **tono** de color: `estadoVideo`, `estadoPregunta`, `estadoResultado`, `videoCerrado`, y la **fase** del proyecto (`faseVideo`: grabar · guion · montaje · hecho), que decide en qué bloque de la portada sale. Es el único sitio donde se decide qué significa cada estado. |
| `pasos.ts`    | **Los pasos de cada proyecto en orden** (guion → preguntas → grabar/subir → montaje → revisar → publicar), calculados con los datos reales. Cada paso dice de quién es (`tuyo` · `sistema` · `pendiente` · `hecho`) y, si es tuyo, qué tocar (`accion`). No usa el texto «siguiente paso» del PC porque a veces se queda viejo. |
| `guion.ts`    | Lee el guion: la cabecera YAML (`fichaDeGuion`: hora, lugar, camión, trabajo, datos por confirmar) y las secciones `# …` (`seccionesDeGuion`, `buscarSeccion`). |
| `formato.ts`  | Fechas en hora de Madrid (`dia`, `diaCercano` «Hoy/Mañana», `fecha`, `hora`, `haceCuanto`, `diaRelativo`, `hoy`, `hoyLargo`), `plural` y `agruparPor`. |
| `redes.ts`    | Cálculos de la pestaña Redes, sin Supabase (tests en `redes.test.ts`): `construirReels` (cifras de la última foto + vistas de la semana con la foto de hace ~7 días), `senales` (diagnóstico de cada reel: gancho, retención, guardados/compartidos), `conclusiones` (qué cambiar o enfocar) y `resumen` (cifras de cabecera). |
| `acciones.ts` | Lo que la app escribe: `entrar`, `salir`, `responder`, `descartar`, `pedirGuion`, `pedirEdicion`, `deshacer`. |

## 3 · Piezas — `components/`

### `components/ui/` — la base visual (no sabe nada de ELSA)

Se ven todas, con ejemplos, en la app: **Más → Piezas de la app** (`/piezas`).

| Pieza | Para qué |
| ----- | -------- |
| `Pantalla` | Armazón de cada pantalla: título, subtítulo, «volver», botón de actualizar. |
| `Seccion` | Bloque con título (y cuenta o enlace «Ver todo»). |
| `Tarjeta` | Caja para una cosa. Con `href` se pulsa entera; con `tono` lleva borde de color; `destacada` para lo urgente. |
| `Lista` + `Fila` | Varias cosas cortas seguidas, como los ajustes del móvil. |
| `Cifra` + `Cifras` | Números grandes de un vistazo. |
| `Etiqueta`, `Punto` | Estado en dos palabras / solo el punto de color. |
| `Aviso` | Franja para avisar sin cortar el paso. |
| `Vacio` | Mensaje cuando no hay nada. |
| `Desplegable` | Contenido que se abre al tocar. |
| `Boton`, `BotonEnlace`, `BotonEnviar`, `Campo`, `Entrada`, `AreaTexto`, `ErrorCampo` | Botones (`compacto` para dentro de tarjetas) y formularios. |
| `Progreso` | Barra partida en trozos, uno por paso, cada uno con su color. |
| `Rotulo` | Rótulo pequeño en mayúsculas para separar bloques (días). |
| `Opciones` | Elegir una cosa de una lista corta tocando (radio con forma de pastilla). |
| `Segmentos` | Cambiar de vista dentro de una pantalla (Guion · Con indicaciones · Notas). |
| `Esqueleto`, `EsqueletoPantalla` | Lo que se ve mientras cargan los datos. |
| `Icono` | Iconos de trazo. Para uno nuevo, se añade a `TRAZOS`. |
| `BotonActualizar` | Vuelve a pedir los datos (en la app instalada no hay «tirar para refrescar»). |

**Tonos**: `bien` (verde) · `ojo` (ámbar, te toca) · `mal` (rojo) · `info` (azul, en marcha) · `neutro` (gris).
Los colores y medidas están en `app/globals.css` (modo claro y oscuro). Cada pieza tiene su `.module.css` al lado.

### `components/proyectos/`, `videos/`, `preguntas/`, `actividad/` — piezas del panel

Combinan piezas de `ui/` con datos reales: `TarjetaProyecto` (cuándo, dónde, camión, barra de pasos, lo que falta en orden y botón del paso tuyo),
`ListaPasos` (todos los pasos en la ficha), `LoQueFalta`, `MarcaPaso`, `FormDescartar`, `AvisoDescartado`,
`FormPedirGuion`, `BotonDeshacer`,
`Guion` (markdown; `lectura` para letra grande y bloques A CÁMARA / VOZ EN OFF marcados), `FormPregunta`,
`Registro`, `ListaAgentes`.

### `components/app/` — el armazón

`MarcoApp` (lateral en escritorio; cabecera y barra inferior en móvil), `NavLateral`, `NavInferior`, `Buscador`, `SubNavElsa`, `PantallaError`, `PantallaNoEncontrada`.
Los módulos se registran en **`config/modulos.ts`** (único sitio): de ahí salen el menú, la barra inferior y el buscador.

### Piezas por módulo

| Carpeta | Qué hay |
| ------- | ------- |
| `components/hoy/` | `CosasDeHoy` (lo que Antonio pone para hoy; se tacha a mano o solo), `Azulejos` (un número por módulo), `ListaSenales`, `BotonResumen`. |
| `components/salud/` | `Visuales` (anillo, barras de la semana y línea de cada medida, en SVG), `GraficaMetrica` (histórico), `FormRegistro`, `AvisoMedico`. |
| `components/finanzas/` | La app de Finanzas (React Query). En `v2/`: `HomeScreen`, `Consejos` («Lo que ve Antonio»), `Propuestas` (categorías que propone el bot), `MovementsScreen`, `DebtsScreen`. |
| `components/proyectos/` | ELSA: `Embudo` (vídeos por etapa), `TarjetaProyecto`, `ListaPasos`, `LoQueFalta`, formularios de pedir y descartar. |
| `components/redes/` | `Graficas` (vistas y gancho vídeo a vídeo, comparación de redes) y `Redes` (indicadores, fichas de vídeo, conclusiones). |
| `components/bots/`, `actividad/`, `aprendizaje/`, `documentos/` | Lo que dejan los bots (ideas, guiones, encargos, informes), su registro, las reglas y el archivo de documentos. |

**Un color por módulo** (`--mod-salud`, `--mod-finanzas`, `--mod-elsa`, `--mod-documentos` en `app/globals.css`): solo dice de dónde viene cada cosa. Los estados siguen usando los tonos (`bien`, `ojo`, `mal`, `info`).

## 4 · Pantallas — `app/`

```
app/
  layout.tsx              raíz: <html>, colores del sistema, metadatos
  login/                  entrar (sin menú)
  (panel)/                todo lo de dentro, con el menú
    layout.tsx            MarcoApp
    page.tsx              Hoy: cosas de hoy, un azulejo por módulo, agenda, Antonio, señales y correo
    antonio/              el arnés: lo que Antonio tiene a medias, rutinas y memoria
    finanzas/             inicio (lo que queda, consejos, propuestas), movimientos, deudas · ajustes/
    salud/                hoy · historico/ · registrar/
    elsa/                 proyectos (embudo + te toca) · ideas/ · redes/ · aprendizaje/ · actividad/ · videos/[id]/ · nuevo/ · piezas/
    documentos/           archivo con vencimientos · nuevo/ · [id]/
    bandeja/, ajustes/
  api/
    bots/                 la única puerta de los bots (clave + permiso + límite + registro): ver docs/bots-api.md
    cron/                 lo que lanza Vercel cada mañana (bancos y resumen sencillo), con CRON_SECRET
    finanzas/, google/    lo que llama el navegador con la sesión de Jordi
proxy.ts                  sin sesión → /login · otro correo → /acceso-denegado · /api/bots y /api/cron validan su propia clave
```

Una pantalla solo hace tres cosas: **pide datos** a `lib/datos` (o a la `lib/<módulo>` que toque), **decide** con las reglas de `lib/` y
**pinta** con piezas. Si una pantalla empieza a tener mucho CSS o lógica propia, eso va a una pieza.

### Las conexiones entre pantallas

El estado no se apunta dos veces: se calcula de donde vive.

- **Hoy lee de todos**: `lib/hoy/reunir.ts` junta ELSA, Finanzas, Salud, Documentos, Bandeja y la fila del día (resumen, agenda y correo que publica Antonio). `lib/hoy/senales.ts` lo convierte en «Urgente / Para hoy / Para saber».
- **Una cosa de hoy se tacha sola** si su enlace lleva a algo concreto que ya está resuelto (`resueltaSola` en `lib/hoy/prioridades.ts`): un vídeo, la bandeja, un documento, las propuestas de categoría.
- **Los pasos de un vídeo** se calculan en `lib/pasos.ts` con sus datos reales; de ahí salen el embudo de ELSA, «Te toca» y lo que Hoy enseña.
- **Lo que decides llega a Antonio al momento** por el webhook (`lib/bots/aviso.ts`); su rutina de cada hora es la red de seguridad.

## Recetas

### Añadir una pantalla nueva

1. Crear `app/(panel)/nueva/page.tsx`:
   ```tsx
   import { Pantalla, Seccion, Lista, Fila } from "@/components/ui";
   import { listarVideos } from "@/lib/datos/videos";

   export default async function Nueva() {
     const videos = await listarVideos();
     return (
       <Pantalla titulo="Nueva">
         <Seccion titulo="Algo">
           <Lista>{videos.map((v) => <Fila key={v.id} titulo={v.titulo} />)}</Lista>
         </Seccion>
       </Pantalla>
     );
   }
   ```
2. Si es un módulo nuevo o debe salir en el menú, añadir una línea en `config/modulos.ts`.

### Enseñar un dato nuevo que ya sube el PC

1. Si es una columna nueva, regenerar `lib/supabase/tipos.ts`.
2. Añadirla al `select` de la función de `lib/datos/` que toque (o crear una función nueva).
3. Pintarla en la pieza o pantalla.

### Un estado nuevo del vídeo

`lib/estados.ts` (`estadoVideo`, `faseVideo`) y, si cambia qué falta, `lib/pasos.ts`. Todas las pantallas lo recogen solas.

### Dar a un bot algo nuevo que hacer

1. La ruta va en `app/api/bots/…`, siempre dentro de `conBot(request, "permiso", …)` (`lib/bots/entrada.ts`).
2. El permiso se añade en `lib/bots/catalogo.ts` y se da solo al bot que lo necesita.
3. El cuerpo se valida con un esquema de zod y el contrato se escribe en `docs/bots-api.md`: es lo que lee Antonio.
4. Los bots proponen; lo que cambia dinero, salud o documentos lo decide Jordi en el panel. `lib/bots/vida.test.ts` lo vigila.

## Comprobar antes de subir

```bash
npm run typecheck   # tipos de rutas + TypeScript
npm test            # pruebas (las de RLS se saltan sin SUPABASE_SERVICE_ROLE_KEY)
npm run build       # compilación completa (necesita .env.local)
```
