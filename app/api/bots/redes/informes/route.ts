import { NextResponse } from "next/server";
import { conBot, conDatosDeCliente, leerCuerpo } from "@/lib/bots/entrada";
import { InformeRedesIn } from "@/lib/bots/esquemas";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/bots/redes/informes — el informe semanal del analista (semana «2026-45») o la lista de apuestas (semana «apuestas»).
// La misma semana lo sustituye. Sin datos de clientes.
export async function POST(request: Request) {
  return conBot(request, "redes:escribir", async () => {
    const cuerpo = await leerCuerpo(request, InformeRedesIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const conDatos = conDatosDeCliente(cuerpo.datos);
    if (conDatos) return conDatos;
    const { error } = await supabaseAdmin().from("informes_redes").upsert({ ...cuerpo.datos, subido_en: new Date().toISOString() }, { onConflict: "semana" });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, semana: cuerpo.datos.semana }, { status: 201 });
  });
}

// GET /api/bots/redes/informes?semana=apuestas — uno entero. Sin semana, la lista (sin el texto).
export async function GET(request: Request) {
  return conBot(request, "redes:leer", async () => {
    const semana = new URL(request.url).searchParams.get("semana");
    if (semana !== null && !/^[\w-]{1,60}$/.test(semana)) return NextResponse.json({ error: "semana no válida" }, { status: 400 });
    const db = supabaseAdmin();
    if (semana) {
      const { data, error } = await db.from("informes_redes").select("semana, titulo, fecha, markdown, subido_en").eq("semana", semana).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? NextResponse.json(data) : NextResponse.json({ error: "no existe" }, { status: 404 });
    }
    const { data, error } = await db.from("informes_redes").select("semana, titulo, fecha, subido_en").order("fecha", { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    return NextResponse.json({ items: data });
  });
}
