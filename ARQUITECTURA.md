# Cómo está montado el panel

La app está hecha por capas. Cada capa solo usa las de debajo, así que para añadir algo
nuevo casi nunca hay que tocar lo que ya funciona.

```
  app/            4 · PANTALLAS   qué se ve en cada dirección (/, /videos, …)
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
| `acciones.ts` | Lo que la app escribe: `entrar`, `salir`, `responder`. |

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
| `Segmentos` | Cambiar de vista dentro de una pantalla (Guion · Con indicaciones · Notas). |
| `Esqueleto`, `EsqueletoPantalla` | Lo que se ve mientras cargan los datos. |
| `Icono` | Iconos de trazo. Para uno nuevo, se añade a `TRAZOS`. |
| `BotonActualizar` | Vuelve a pedir los datos (en la app instalada no hay «tirar para refrescar»). |

**Tonos**: `bien` (verde) · `ojo` (ámbar, te toca) · `mal` (rojo) · `info` (azul, en marcha) · `neutro` (gris).
Los colores y medidas están en `app/globals.css` (modo claro y oscuro). Cada pieza tiene su `.module.css` al lado.

### `components/proyectos/`, `videos/`, `preguntas/`, `actividad/` — piezas del panel

Combinan piezas de `ui/` con datos reales: `TarjetaProyecto` (cuándo, dónde, camión, barra de pasos, lo que falta en orden y botón del paso tuyo),
`ListaPasos` (todos los pasos en la ficha), `LoQueFalta`, `MarcaPaso`,
`Guion` (markdown; `lectura` para letra grande y bloques A CÁMARA / VOZ EN OFF marcados), `FormPregunta`,
`Registro`, `ListaAgentes`.

### `components/app/` — el armazón

`MarcoApp` (pantalla + barra de pestañas), `BarraPestanas`, `PantallaError`, `PantallaNoEncontrada`.

## 4 · Pantallas — `app/`

```
app/
  layout.tsx              raíz: <html>, colores del sistema, metadatos
  login/                  entrar (sin barra de pestañas)
  (panel)/                todo lo de dentro, con barra de pestañas
    layout.tsx            MarcoApp
    loading.tsx           esqueleto mientras carga
    error.tsx             «Algo ha fallado» + Reintentar
    page.tsx              Proyectos: todos por fecha, con rótulo por día; filtro «Me toca» (?ver=mios)
    videos/[id]/          ficha del proyecto (/videos/GE_008)
    videos/[id]/guion/    modo lectura del guion (?ver=lectura|indicaciones|notas)
    actividad/            agentes y registro
    mas/                  sincronización, cuenta, salir
    piezas/               catálogo de la base
proxy.ts                  sin sesión → /login
```

Una pantalla solo hace tres cosas: **pide datos** a `lib/datos`, **decide** con `lib/estados` y
**pinta** con piezas. Si una pantalla empieza a tener mucho CSS o lógica propia, eso va a una pieza.

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
2. Si debe salir abajo, añadir una línea en `PESTANAS` de `components/app/BarraPestanas.tsx`.

### Enseñar un dato nuevo que ya sube el PC

1. Si es una columna nueva, regenerar `lib/supabase/tipos.ts`.
2. Añadirla al `select` de la función de `lib/datos/` que toque (o crear una función nueva).
3. Pintarla en la pieza o pantalla.

### Un estado nuevo del vídeo

`lib/estados.ts` (`estadoVideo`, `faseVideo`) y, si cambia qué falta, `lib/pasos.ts`. Todas las pantallas lo recogen solas.

## Comprobar antes de subir

```bash
npm run typecheck   # tipos de rutas + TypeScript
npm run build       # compilación completa (necesita .env.local)
```
