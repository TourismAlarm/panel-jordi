import { NextResponse } from "next/server";
import { conBot, leerCuerpo } from "@/lib/bots/entrada";
import { CerrarEncargoIn } from "@/lib/bots/esquemas";
import { supabaseAdmin } from "@/lib/supabase/admin";

const CERRABLES = ["pendiente", "bloqueado", "fallido", "cambios", "listo"];

// POST /api/bots/edicion/{id}/cerrar — Antonio da por cerrado un encargo que ya no cuenta (obsoleto, hecho por otro camino).
// No toca el vídeo: su estado lo dice la entrega o la decisión de Jordi. Uno en curso no se cierra: lo está montando el PC.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return conBot(request, "edicion:cerrar", async () => {
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "id no válido" }, { status: 400 });
    const cuerpo = await leerCuerpo(request, CerrarEncargoIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;

    const db = supabaseAdmin();
    const { data: e, error } = await db.from("encargos_edicion").select("estado").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!e) return NextResponse.json({ error: "ese encargo no existe" }, { status: 404 });
    if (e.estado === "cerrado") return NextResponse.json({ ok: true, ya_estaba: true });
    if (!CERRABLES.includes(e.estado)) return NextResponse.json({ error: `no se puede cerrar un encargo ${e.estado}` }, { status: 409 });

    const { data, error: eCierre } = await db
      .from("encargos_edicion")
      .update({ estado: "cerrado", error: `Cerrado por Antonio: ${cuerpo.datos.motivo}`, terminado_en: new Date().toISOString() })
      .eq("id", id)
      .in("estado", CERRABLES)
      .select("id");
    if (eCierre) throw new Error(eCierre.message);
    if (!data.length) return NextResponse.json({ error: "el encargo ha cambiado mientras tanto: vuelve a leerlo" }, { status: 409 });
    return NextResponse.json({ ok: true });
  });
}
