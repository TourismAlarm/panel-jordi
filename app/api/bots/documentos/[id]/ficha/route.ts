import { NextResponse } from "next/server";
import { z } from "zod";
import { conBot, firmante, leerCuerpo } from "@/lib/bots/entrada";
import { FichaBotIn } from "@/lib/bots/esquemas";
import { duenoId } from "@/lib/datos/dueno";
import { guardarResultado } from "@/lib/documentos/guardar";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/bots/documentos/{id}/ficha — lo que el bot ha sacado del documento. Nunca pisa una ficha que Jordi escribió a mano (409).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return conBot(request, "documentos:ficha", async (clave) => {
    const cuerpo = await leerCuerpo(request, FichaBotIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const { bot, categoria, tipo, titular, resumen, ...ficha } = cuerpo.datos;
    const firma = firmante(clave, bot, "documentos:ficha");
    if ("fallo" in firma) return firma.fallo;
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "id no válido" }, { status: 400 });

    const db = supabaseAdmin();
    const userId = await duenoId();
    const { data: doc, error } = await db.from("doc_documentos").select("estado").eq("id", id).eq("user_id", userId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!doc) return NextResponse.json({ error: "no existe" }, { status: 404 });
    if (doc.estado === "nota") return NextResponse.json({ error: "es una nota: no lleva ficha" }, { status: 409 });
    const previa = await db.from("doc_fichas").select("origen").eq("documento_id", id).eq("user_id", userId).maybeSingle();
    if (previa.error) throw new Error(previa.error.message);
    if (previa.data?.origen === "manual") return NextResponse.json({ error: "Jordi escribió esta ficha a mano: no se pisa" }, { status: 409 });

    const fallo = await guardarResultado(db, userId, { id, categoria, tipo, paginas: [], ficha }, { origen: "bot", titular: titular ?? null, resumen: resumen ?? null });
    if (fallo) throw new Error(fallo);
    return NextResponse.json({ ok: true }, { status: 201 });
  });
}
