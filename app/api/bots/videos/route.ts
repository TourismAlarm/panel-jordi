import { NextResponse } from "next/server";
import { conBot } from "@/lib/bots/entrada";
import { guionParaBot, tacharDatos } from "@/lib/bots/limpieza";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/bots/videos — lo que Antonio tiene que revisar (por_revisar). Con ?id=GE_012, ese vídeo.
// El guion sale sin cabecera y con los datos reconocibles tachados: esto se va a un servicio de fuera.
export async function GET(request: Request) {
  return conBot(request, "videos:leer", async () => {
    const id = new URL(request.url).searchParams.get("id");
    if (id !== null && !/^GE_\d{3,}$/.test(id)) return NextResponse.json({ error: "id no válido" }, { status: 400 });

    let consulta = supabaseAdmin().from("videos").select("id, titulo, estado, por_revisar, montaje_url, guion_md, actualizado_en").order("actualizado_en", { ascending: false }).limit(50);
    consulta = id ? consulta.eq("id", id) : consulta.eq("por_revisar", true);
    const { data, error } = await consulta;
    if (error) throw new Error(error.message);
    const items = data.map(({ guion_md, titulo, ...v }) => ({ ...v, titulo: titulo === null ? null : tacharDatos(titulo), guion_md: guionParaBot(guion_md) }));
    return NextResponse.json({ items });
  });
}
