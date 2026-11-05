import { NextResponse } from "next/server";
import { z } from "zod";
import { conBot, firmanteDeUrl } from "@/lib/bots/entrada";
import { duenoId } from "@/lib/datos/dueno";
import { supabaseAdmin } from "@/lib/supabase/admin";

const ENLACE_S = 600;

// GET /api/bots/documentos/{id} — el documento, su ficha, su texto y un enlace al archivo que dura 10 minutos.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return conBot(request, "documentos:leer", async (clave) => {
    const firma = firmanteDeUrl(request, clave, "documentos:leer");
    if ("fallo" in firma) return firma.fallo;
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "id no válido" }, { status: 400 });
    const db = supabaseAdmin();
    const userId = await duenoId();
    const { data: doc, error } = await db.from("doc_documentos").select("id, nombre, categoria, tipo, mime, tamano, ruta, estado, subido_en, procesado_en").eq("id", id).eq("user_id", userId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!doc) return NextResponse.json({ error: "no existe" }, { status: 404 });
    const [ficha, paginas] = await Promise.all([
      db.from("doc_fichas").select("partes, referencia, inicio, vencimiento, importes, condiciones, contacto, titular, resumen, origen, actualizado_en").eq("documento_id", id).eq("user_id", userId).maybeSingle(),
      db.from("doc_paginas").select("pagina, texto").eq("documento_id", id).eq("user_id", userId).order("pagina"),
    ]);
    if (ficha.error) throw new Error(ficha.error.message);
    if (paginas.error) throw new Error(paginas.error.message);
    let url: string | null = null;
    if (doc.ruta) {
      const firmada = await db.storage.from("documentos").createSignedUrl(doc.ruta, ENLACE_S);
      if (firmada.error) throw new Error(firmada.error.message);
      url = firmada.data.signedUrl;
    }
    const { ruta: _, ...resto } = doc;
    return NextResponse.json({ ...resto, ficha: ficha.data, texto: paginas.data.map((p) => p.texto).join("\n\n"), url_firmada: url });
  });
}
