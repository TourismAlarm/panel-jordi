import { NextResponse } from "next/server";
import { conBot, leerCuerpo } from "@/lib/bots/entrada";
import { FotoRedesIn } from "@/lib/bots/esquemas";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/tipos";

const TABLA = { instagram: "windsor_fotos", tiktok: "windsor_fotos_tiktok" } as const;

// POST /api/bots/redes/fotos — Antonio deja la foto del día de Instagram o TikTok: todos los reels con sus cifras.
// Repetir el mismo día la sustituye. Es lo que pinta ELSA → Redes.
export async function POST(request: Request) {
  return conBot(request, "redes:escribir", async () => {
    const cuerpo = await leerCuerpo(request, FotoRedesIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const { red, fecha, datos } = cuerpo.datos;
    const { error } = await supabaseAdmin().from(TABLA[red]).upsert({ fecha, datos: datos as Json, tomada_en: new Date().toISOString() }, { onConflict: "fecha" });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, red, fecha, reels: datos.length }, { status: 201 });
  });
}

// GET /api/bots/redes/fotos — qué días hay ya de cada red (los 30 últimos).
export async function GET(request: Request) {
  return conBot(request, "redes:leer", async () => {
    const db = supabaseAdmin();
    const [ig, tt] = await Promise.all([
      db.from("windsor_fotos").select("fecha, tomada_en").order("fecha", { ascending: false }).limit(30),
      db.from("windsor_fotos_tiktok").select("fecha, tomada_en").order("fecha", { ascending: false }).limit(30),
    ]);
    if (ig.error) throw new Error(ig.error.message);
    if (tt.error) throw new Error(tt.error.message);
    return NextResponse.json({ instagram: ig.data, tiktok: tt.data });
  });
}
