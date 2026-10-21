import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { aISODia, sumarDias } from "@/lib/fechas";
import { resumenInicio } from "@/lib/finanzas/resumen-inicio";
import { fichaDeGuion } from "@/lib/guion";
import { eventosDeHoy, correosSinLeer } from "@/lib/google/agenda";
import { tokenDeAcceso } from "@/lib/google/cliente";
import { leerSalud } from "@/lib/datos/salud";
import { pasosDe, pasoActual, teToca } from "@/lib/pasos";
import { faseVideo } from "@/lib/estados";
import { construirResumen } from "@/lib/salud/resumen";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/tipos";
import { senalesAgenda, senalesBandeja, senalesDocumentos, senalesElsa, senalesFinanzas, senalesSalud, ordenar, type Correo, type Evento, type Senal } from "./senales";

export type Foto = {
  fecha: string;
  senales: Senal[];
  eventos: Evento[];
  correos: Correo[];
  google: "conectado" | "sin-conectar" | "error";
  fallos: string[]; // módulos que no se han podido leer, para decirlo en vez de callarlo
  salud: string[]; // líneas de resumen de salud (para el resumen escrito)
};

async function intentar<T>(fallos: string[], que: string, f: () => Promise<T>): Promise<T | null> {
  try {
    return await f();
  } catch (e) {
    console.error(`Hoy · ${que}:`, e instanceof Error ? e.message : e);
    fallos.push(que);
    return null;
  }
}

const hora = (iso: string) => new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

// Reúne lo que pasa en cada módulo. Sirve a la pantalla (con la sesión de Jordi) y al cron (service_role + userId):
// por eso TODA consulta a tablas con dueño filtra por user_id.
export async function reunirHoy(supabase: SupabaseClient<Database>, userId: string, opciones: { conGoogle?: boolean } = {}): Promise<Foto> {
  const hoy = aISODia();
  const fallos: string[] = [];
  const ahora = Date.now();
  // fin_* aún no está en los tipos generados. Los enlaces bancarios solo los lee el servidor (service_role), siempre filtrando por user_id.
  const sinTipos = supabaseAdmin() as unknown as SupabaseClient;

  const [elsa, finanzas, salud, nuevos, documentos, google] = await Promise.all([
    intentar(fallos, "ELSA", async () => {
      const [v, p, q, pe, rg, sy] = await Promise.all([
        supabase.from("videos").select("id, titulo, estado, siguiente_paso, por_revisar, montaje_url, fecha_trabajo, sin_guion, actualizado_en, guion_md").order("fecha_trabajo", { ascending: true, nullsFirst: false }),
        Promise.resolve(null),
        supabase.from("preguntas").select("video_id, respondida_en, recogida_en"),
        supabase.from("peticiones").select("*").order("creada_en", { ascending: false }),
        supabase.from("reglas").select("id", { count: "exact", head: true }).eq("estado", "propuesta").is("decision", null),
        supabase.from("sync_estado").select("ultimo_ok").eq("id", 1).maybeSingle(),
      ]);
      void p;
      for (const x of [v, q, pe, rg, sy]) if (x.error) throw new Error(x.error.message);
      const peticiones = pe.data ?? [];
      const descartados = new Set(peticiones.filter((x) => x.tipo === "descartar" && x.estado !== "fallida" && x.video_id).map((x) => x.video_id as string));
      const resumenP = new Map<string, { total: number; sinContestar: number; enviadas: number }>();
      for (const f of q.data ?? []) {
        const r = resumenP.get(f.video_id) ?? { total: 0, sinContestar: 0, enviadas: 0 };
        r.total++;
        if (!f.respondida_en) r.sinContestar++;
        else if (!f.recogida_en) r.enviadas++;
        resumenP.set(f.video_id, r);
      }
      const proyectos = (v.data ?? [])
        .filter((x) => !descartados.has(x.id) && faseVideo(x.estado) !== "hecho")
        .map(({ guion_md, ...x }) => {
          const proy = { ...x, ficha: fichaDeGuion(guion_md), tieneGuion: !!guion_md };
          const materialListo = peticiones.some((y) => y.video_id === x.id && y.tipo === "material_listo" && y.estado !== "fallida");
          const pasos = pasosDe({ ...proy, materialListo }, resumenP.get(x.id));
          return { id: x.id, titulo: x.titulo, fecha_trabajo: x.fecha_trabajo, pasos };
        })
        .filter((x) => teToca(x.pasos))
        .map((x) => ({ id: x.id, titulo: x.titulo, fecha_trabajo: x.fecha_trabajo, pasoTuyo: pasoActual(x.pasos)?.titulo ?? "Te toca" }));
      return senalesElsa({ hoy, ahora, proyectos, reglasPorDecidir: rg.count ?? 0, pcUltimoOk: sy.data?.ultimo_ok ?? null });
    }),

    intentar(fallos, "Finanzas", async () => {
      const [r, links, loans] = await Promise.all([
        resumenInicio(userId),
        sinTipos.from("fin_bank_links").select("aspsp_name, status, valid_until, last_error").eq("user_id", userId),
        sinTipos.from("fin_loans").select("contact_name, monthly_payment, payment_day").eq("user_id", userId).eq("status", "active"),
      ]);
      if (links.error) throw new Error(links.error.message);
      if (loans.error) throw new Error(loans.error.message);
      return senalesFinanzas({
        hoy,
        enlaces: ((links.data ?? []) as { aspsp_name: string; status: string; valid_until: string | null; last_error: string | null }[]).map((x) => ({ banco: x.aspsp_name, estado: x.status, valido_hasta: x.valid_until, error: x.last_error })),
        prestamos: ((loans.data ?? []) as { contact_name: string; monthly_payment: number | string | null; payment_day: number | null }[]).filter((l) => l.payment_day && Number(l.monthly_payment) > 0).map((l) => ({ nombre: l.contact_name, importe: Number(l.monthly_payment), dia: Number(l.payment_day) })),
        sinCategoria: r.uncategorized.count,
        restante: r.remaining,
        porDia: r.perDay,
        diasNomina: r.payday?.daysLeft ?? null,
      });
    }),

    intentar(fallos, "Salud", async () => {
      const d = await leerSalud(supabase, 30, userId);
      const r = construirResumen({ hoy: d.hoy, series: d.series, registros: d.registros, entrenos: d.entrenos });
      return { senales: senalesSalud({ hoy, ultimoDato: r.datosDe, lineas: r.lineas, avisoMedico: r.avisoMedico }), lineas: r.lineas };
    }),

    intentar(fallos, "Bandeja", async () => {
      const { count, error } = await supabase.from("bandeja").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("estado", "nuevo");
      if (error) throw new Error(error.message);
      return senalesBandeja(count ?? 0);
    }),

    intentar(fallos, "Documentos", async () => {
      const { data, error } = await supabase.from("doc_fichas").select("documento_id, vencimiento").eq("user_id", userId).not("vencimiento", "is", null).lte("vencimiento", sumarDias(hoy, 29));
      if (error) throw new Error(error.message);
      const ids = (data ?? []).map((x) => x.documento_id);
      if (!ids.length) return [];
      const n = await supabase.from("doc_documentos").select("id, nombre").eq("user_id", userId).in("id", ids);
      if (n.error) throw new Error(n.error.message);
      const nombre = new Map((n.data ?? []).map((x) => [x.id, x.nombre]));
      return senalesDocumentos({ hoy, docs: (data ?? []).map((x) => ({ id: x.documento_id, nombre: nombre.get(x.documento_id) ?? "Documento", vencimiento: x.vencimiento as string })) });
    }),

    (async () => {
      if (opciones.conGoogle === false) return { estado: "sin-conectar" as const, eventos: [] as Evento[], correos: [] as Correo[] };
      try {
        const token = await tokenDeAcceso(userId);
        if (!token) return { estado: "sin-conectar" as const, eventos: [], correos: [] };
        const [eventos, correos] = await Promise.all([eventosDeHoy(token, hoy), correosSinLeer(token)]);
        return { estado: "conectado" as const, eventos, correos };
      } catch (e) {
        console.error("Hoy · Google:", e instanceof Error ? e.message : e);
        fallos.push("Google");
        return { estado: "error" as const, eventos: [], correos: [] };
      }
    })(),
  ]);

  const senales = ordenar([
    ...(elsa ?? []),
    ...(finanzas ?? []),
    ...(salud?.senales ?? []),
    ...(nuevos ?? []),
    ...(documentos ?? []),
    ...senalesAgenda(google.eventos, hora),
  ]);
  return { fecha: hoy, senales, eventos: google.eventos, correos: google.correos, google: google.estado, fallos, salud: salud?.lineas ?? [] };
}

