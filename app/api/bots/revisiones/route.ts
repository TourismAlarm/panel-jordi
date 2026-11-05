import { NextResponse } from "next/server";
import { conBot, firmante, leerCuerpo } from "@/lib/bots/entrada";
import { RevisionIn } from "@/lib/bots/esquemas";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/bots/revisiones — Antonio revisa un guion, un corte o un acabado, regla por regla.
export async function POST(request: Request) {
  return conBot(request, "revisiones:escribir", async (clave) => {
    const cuerpo = await leerCuerpo(request, RevisionIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const { bot, ...revision } = cuerpo.datos;
    const firma = firmante(clave, bot ?? "antonio", "revisiones:escribir");
    if ("fallo" in firma) return firma.fallo;

    const db = supabaseAdmin();
    const objetivo = revision.video_id
      ? await db.from("videos").select("id").eq("id", revision.video_id).maybeSingle()
      : await db.from("guiones_propuestos").select("id").eq("id", revision.guion_id!).maybeSingle();
    if (objetivo.error) throw new Error(objetivo.error.message);
    if (!objetivo.data) return NextResponse.json({ error: "no existe lo que se revisa" }, { status: 404 });

    // Cada regla debe existir en Aprende: una clave inventada no se guarda.
    const claves = [...new Set(revision.por_regla.map((r) => r.clave))];
    const { data: reglas, error: eReglas } = await db.from("reglas").select("clave").in("clave", claves);
    if (eReglas) throw new Error(eReglas.message);
    const conocidas = new Set((reglas ?? []).map((r) => r.clave));
    const raras = claves.filter((c) => !conocidas.has(c));
    if (raras.length) return NextResponse.json({ error: "reglas que no existen", detalle: raras }, { status: 400 });

    const { data, error } = await db.from("revisiones").insert({ ...revision, bot: firma.autor }).select("id").single();
    if (error) throw new Error(error.message);
    // Si hay un encargo entregado de esta fase, cambia con la revisión (acabado ok → le toca a Jordi).
    if (revision.video_id) {
      const { error: eEncargo } = await db.rpc("encargo_revisado", { p_video: revision.video_id, p_fase: revision.fase, p_resultado: revision.resultado });
      if (eEncargo) throw new Error(eEncargo.message);
    }
    return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
  });
}
