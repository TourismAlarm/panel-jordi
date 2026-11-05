import { NextResponse } from "next/server";
import { conBot } from "@/lib/bots/entrada";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/bots/edicion/{id} — un encargo entero: instrucciones, reglas, resultado y preguntas.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return conBot(request, "edicion:leer", async () => {
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "id no válido" }, { status: 400 });
    const { data, error } = await supabaseAdmin().from("encargos_edicion").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return NextResponse.json({ error: "ese encargo no existe" }, { status: 404 });
    return NextResponse.json(data);
  });
}
