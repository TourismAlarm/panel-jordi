import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { faseVideo } from "@/lib/estados";
import { aISODia, sumarDias } from "@/lib/fechas";
import { fichaDeGuion } from "@/lib/guion";
import { pasosDe } from "@/lib/pasos";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/tipos";
import { calcularPendientes, type Pendiente } from "./vista";

type Db = SupabaseClient<Database>;

const horaMadrid = (d: Date) => Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", hour: "2-digit", hourCycle: "h23" }).format(d));

function sinError<T>(r: { data: T | null; error: { message: string } | null }, que: string): T {
  if (r.error) throw new Error(`${que}: ${r.error.message}`);
  return r.data as T;
}

async function intentar<T>(fallos: string[], que: string, vacio: T, f: () => Promise<T>): Promise<T> {
  try {
    return await f();
  } catch (e) {
    console.error(`Arnés · ${que}:`, e instanceof Error ? e.message : e);
    fallos.push(que);
    return vacio;
  }
}

// Lo que el panel ya sabe, convertido en pendientes. Sirve a /antonio (sesión de Jordi) y a la API (service_role):
// por eso toda tabla con dueño filtra por user_id. Si un módulo no se puede leer, se dice en `fallos` y el resto sigue.
export async function reunirPendientes(db: Db, userId: string): Promise<{ pendientes: Pendiente[]; fallos: string[] }> {
  const ahora = new Date();
  const hoy = aISODia(ahora);
  const hace48h = new Date(ahora.getTime() - 48 * 3_600_000).toISOString();
  const fallos: string[] = [];

  const [elsa, redes, salud, dia, documentos, actividad, finanzas] = await Promise.all([
    intentar(fallos, "ELSA", null, async () => {
      const [v, q, pe, gu, id, en] = await Promise.all([
        db.from("videos").select("id, titulo, estado, por_revisar, fecha_trabajo, sin_guion, origen, actualizado_en, guion_md, montaje_url"),
        db.from("preguntas").select("video_id, respondida_en, recogida_en").is("recogida_en", null),
        db.from("peticiones").select("id, tipo, video_id, estado, creada_en"),
        db.from("guiones_propuestos").select("id, titulo, estado, actualizado").in("estado", ["propuesto", "cambios"]),
        db.from("ideas").select("creado").eq("estado", "nueva"),
        db.from("encargos_edicion").select("id, video_id, version, fase, estado, revisado_en, tomado_en, terminado_en, creado, error").in("estado", ["listo", "bloqueado", "fallido", "en_curso", "pendiente"]),
      ]);
      const videos = sinError(v, "vídeos");
      const preguntas = sinError(q, "preguntas");
      const peticiones = sinError(pe, "peticiones");
      const descartados = new Set(peticiones.filter((x) => x.tipo === "descartar" && x.estado !== "fallida" && x.video_id).map((x) => x.video_id as string));
      const resumen = new Map<string, { total: number; sinContestar: number; enviadas: number }>();
      for (const f of preguntas) {
        const r = resumen.get(f.video_id) ?? { total: 0, sinContestar: 0, enviadas: 0 };
        r.total++;
        if (!f.respondida_en) r.sinContestar++;
        else r.enviadas++;
        resumen.set(f.video_id, r);
      }
      // «Sin material» = el paso «Subir lo grabado» es tuyo, igual que en la ficha del vídeo.
      const sinMaterial = videos
        .filter((x) => !descartados.has(x.id) && faseVideo(x.estado) !== "hecho")
        .filter((x) => {
          const materialListo = peticiones.some((y) => y.video_id === x.id && y.tipo === "material_listo" && y.estado !== "fallida");
          const pasos = pasosDe({ ...x, ficha: fichaDeGuion(x.guion_md), tieneGuion: !!x.guion_md, materialListo }, resumen.get(x.id));
          return pasos.some((p) => p.clave === "subir" && p.estado === "tuyo");
        })
        .map((x) => ({ id: x.id, actualizado_en: x.actualizado_en }));
      // El estado del vídeo y la cola de edición tienen que cuadrar: lo que no cuadra sale como pendiente.
      const encargos = sinError(en, "encargos");
      const conListo = new Set(encargos.filter((x) => x.estado === "listo").map((x) => x.video_id));
      const conAbierto = new Set(encargos.map((x) => x.video_id));
      const porRevisarSinEncargo = videos
        .filter((x) => (x.estado === "corte_listo" || x.estado === "acabado_listo") && !conListo.has(x.id) && !descartados.has(x.id))
        .map((x) => ({ id: x.id, estado: x.estado, montaje_url: x.montaje_url, actualizado_en: x.actualizado_en }));
      const montandoSinEncargo = videos.filter((x) => x.estado === "montando" && !conAbierto.has(x.id) && !descartados.has(x.id)).map((x) => ({ id: x.id, actualizado_en: x.actualizado_en }));
      return {
        porRevisarSinEncargo,
        montandoSinEncargo,
        titulos: Object.fromEntries(videos.map((x) => [x.id, x.titulo])),
        preguntas: preguntas.filter((x) => !descartados.has(x.video_id)),
        sinMaterial,
        peticiones: peticiones.filter((x) => x.estado === "pendiente" || x.estado === "procesando"),
        guiones: sinError(gu, "guiones"),
        ideasNuevas: sinError(id, "ideas"),
        encargos,
      };
    }),

    intentar(fallos, "Redes", null, async () => {
      const [f, i] = await Promise.all([
        db.from("windsor_fotos").select("fecha").order("fecha", { ascending: false }).limit(1).maybeSingle(),
        db.from("informes_redes").select("fecha").order("fecha", { ascending: false }).limit(1).maybeSingle(),
      ]);
      return { redesUltima: sinError(f, "fotos")?.fecha ?? null, informeRedes: sinError(i, "informe")?.fecha ?? null };
    }),

    intentar(fallos, "Salud", null, async () => {
      const r = await db.from("sal_metricas").select("fecha").eq("user_id", userId).order("fecha", { ascending: false }).limit(1).maybeSingle();
      return sinError(r, "métricas")?.fecha ?? null;
    }),

    intentar(fallos, "Hoy", null, async () => {
      const r = await db.from("resumenes_diarios").select("resumen").eq("user_id", userId).eq("fecha", hoy).maybeSingle();
      return !!sinError(r, "resumen")?.resumen;
    }),

    intentar(fallos, "Documentos", null, async () => {
      const [fi, er] = await Promise.all([
        db.from("doc_fichas").select("documento_id, vencimiento").eq("user_id", userId).not("vencimiento", "is", null).lte("vencimiento", sumarDias(hoy, 29)),
        db.from("doc_documentos").select("id, nombre, subido_en").eq("user_id", userId).eq("estado", "error"),
      ]);
      const fichas = sinError(fi, "fichas");
      let nombres = new Map<string, string>();
      if (fichas.length) {
        const n = await db.from("doc_documentos").select("id, nombre").eq("user_id", userId).in("id", fichas.map((x) => x.documento_id));
        nombres = new Map(sinError(n, "documentos").map((x) => [x.id, x.nombre]));
      }
      return {
        vencimientos: fichas.map((x) => ({ id: x.documento_id, nombre: nombres.get(x.documento_id) ?? "Documento", vencimiento: x.vencimiento as string })),
        documentosConError: sinError(er, "documentos con error"),
      };
    }),

    intentar(fallos, "Actividad", [], async () => {
      const r = await db.from("actividad_bots").select("id, bot, tarea, creado, enlace").eq("resultado", "fallo").gte("creado", hace48h).order("creado").limit(50);
      return sinError(r, "actividad");
    }),

    // Las propuestas solo las lee el servidor (service_role), siempre por user_id. fin_* aún no está en los tipos.
    intentar(fallos, "Finanzas", null, async () => {
      const admin = supabaseAdmin() as unknown as SupabaseClient;
      const [tx, pr] = await Promise.all([
        admin.from("fin_transactions").select("id").eq("user_id", userId).is("category_id", null).eq("kind", "regular").limit(2000),
        admin.from("fin_propuestas_categoria").select("transaction_id, estado").eq("user_id", userId).neq("estado", "aceptada"),
      ]);
      const sinCategoria = new Set((sinError(tx, "movimientos") as { id: string }[]).map((x) => x.id));
      const propuestas = (sinError(pr, "propuestas") as { transaction_id: string; estado: string }[]).filter((x) => sinCategoria.has(x.transaction_id));
      const conPropuestaViva = new Set(propuestas.filter((x) => x.estado === "propuesta").map((x) => x.transaction_id));
      return { sinPropuesta: sinCategoria.size - conPropuestaViva.size, porDecidir: conPropuestaViva.size };
    }),
  ]);

  // Un módulo que no se ha podido leer no da pendientes falsos («sin métricas», «sin resumen»…): sale en `fallos`.
  const pendientes = calcularPendientes({
    ahora: ahora.getTime(),
    hoy,
    horaMadrid: horaMadrid(ahora),
    titulos: elsa?.titulos ?? {},
    preguntas: elsa?.preguntas ?? [],
    sinMaterial: elsa?.sinMaterial ?? [],
    guiones: elsa?.guiones ?? [],
    ideasNuevas: elsa?.ideasNuevas ?? [],
    encargos: elsa?.encargos ?? [],
    porRevisarSinEncargo: elsa?.porRevisarSinEncargo ?? [],
    montandoSinEncargo: elsa?.montandoSinEncargo ?? [],
    peticiones: elsa?.peticiones ?? [],
    redesUltima: redes?.redesUltima ?? null,
    informeRedes: redes?.informeRedes ?? null,
    saludUltima: salud,
    resumenHoy: dia ?? false,
    vencimientos: documentos?.vencimientos ?? [],
    documentosConError: documentos?.documentosConError ?? [],
    fallos: actividad,
    finanzas,
  }).filter((p) => !(redes === null && p.agente === "analista") && !(salud === null && fallos.includes("Salud") && p.id === "salud-metricas") && !(dia === null && p.id === "dia-resumen"));

  return { pendientes, fallos };
}
