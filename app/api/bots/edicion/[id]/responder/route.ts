import { NextResponse } from "next/server";
import { conRespuestas, type PreguntaEncargo } from "@/lib/bots/edicion";
import { conBot, conDatosDeCliente, leerCuerpo } from "@/lib/bots/entrada";
import { ResponderEncargoIn } from "@/lib/bots/esquemas";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/bots/edicion/{id}/responder — Antonio contesta lo que preguntó el PC y el encargo vuelve a la cola.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return conBot(request, "edicion:escribir", async () => {
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "id no válido" }, { status: 400 });
    const cuerpo = await leerCuerpo(request, ResponderEncargoIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const conDatos = conDatosDeCliente(cuerpo.datos);
    if (conDatos) return conDatos;

    const db = supabaseAdmin();
    const { data: encargo, error } = await db.from("encargos_edicion").select("estado, preguntas").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!encargo) return NextResponse.json({ error: "ese encargo no existe" }, { status: 404 });
    if (encargo.estado !== "bloqueado") return NextResponse.json({ error: `ese encargo está ${encargo.estado}` }, { status: 409 });
    const preguntas = conRespuestas(encargo.preguntas as PreguntaEncargo[], cuerpo.datos.respuestas);
    if (!preguntas) return NextResponse.json({ error: "hay que contestar todas las preguntas" }, { status: 400 });

    const { data, error: eCambio } = await db.from("encargos_edicion").update({ estado: "pendiente", preguntas, tomado_en: null }).eq("id", id).eq("estado", "bloqueado").select("id");
    if (eCambio) throw new Error(eCambio.message);
    if (!data.length) return NextResponse.json({ error: "ese encargo ha cambiado mientras tanto" }, { status: 409 });
    return NextResponse.json({ ok: true });
  });
}
