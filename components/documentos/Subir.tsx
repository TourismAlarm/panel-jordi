"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { supabaseNavegador } from "@/lib/supabase/client";
import { CATEGORIAS } from "@/lib/documentos/categorias";
import { registrarSubidos } from "@/lib/documentos/acciones";

const MAX = 25 * 1024 * 1024;
const limpiar = (n: string) => n.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-80);

// Varios archivos a la vez, directos del navegador a tu carpeta del bucket privado (sin pasar por el servidor).
export function Subir() {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [categoria, setCategoria] = useState("");
  const [estado, setEstado] = useState<{ texto: string; error?: boolean } | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  async function enviar() {
    const archivos = Array.from(entrada.current?.files ?? []);
    if (!archivos.length) return setEstado({ texto: "Elige al menos un archivo.", error: true });
    const grande = archivos.find((a) => a.size > MAX);
    if (grande) return setEstado({ texto: `«${grande.name}» pesa más de 25 MB.`, error: true });
    setSubiendo(true);
    try {
      const supabase = supabaseNavegador();
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("Sesión caducada. Vuelve a entrar.");
      const subidos: { nombre: string; ruta: string; mime: string | null; tamano: number }[] = [];
      for (const [i, a] of archivos.entries()) {
        setEstado({ texto: `Subiendo ${i + 1} de ${archivos.length}…` });
        const ruta = `${data.user.id}/${crypto.randomUUID()}-${limpiar(a.name)}`;
        const { error } = await supabase.storage.from("documentos").upload(ruta, a, { contentType: a.type || undefined });
        if (error) throw new Error(`No se pudo subir «${a.name}».`);
        subidos.push({ nombre: a.name, ruta, mime: a.type || null, tamano: a.size });
      }
      const r = await registrarSubidos(subidos, categoria);
      if (r?.error) throw new Error(r.error);
      router.push("/documentos");
      router.refresh();
    } catch (e) {
      setEstado({ texto: e instanceof Error ? e.message : "No se pudo subir.", error: true });
      setSubiendo(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-lg font-semibold">Archivos (PDF, fotos o texto)</span>
        <input ref={entrada} type="file" multiple accept="application/pdf,image/*,text/plain,.md" className="min-h-14 w-full rounded-md border border-border bg-card p-3" />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-lg font-semibold">Categoría (opcional)</span>
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="min-h-14 w-full rounded-md border border-border bg-card px-4 text-base">
          <option value="">Que lo decida Claude</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>
      <Button type="button" size="lg" onClick={enviar} disabled={subiendo} aria-busy={subiendo}>
        <Upload size={20} />
        {subiendo ? "Subiendo…" : "Subir"}
      </Button>
      {estado && (
        <p role={estado.error ? "alert" : "status"} className={estado.error ? "font-semibold text-destructive" : "font-semibold"}>
          {estado.texto}
        </p>
      )}
    </div>
  );
}
