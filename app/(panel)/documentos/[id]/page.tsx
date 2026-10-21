import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { BotonLeer } from "@/components/documentos/BotonLeer";
import { FormFicha } from "@/components/documentos/FormFicha";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { borrarDocumento } from "@/lib/documentos/acciones";
import { obtenerDetalle } from "@/lib/documentos/datos";
import { nivelVencimiento, textoVencimiento } from "@/lib/documentos/vencimiento";
import { aISODia, formatearDia } from "@/lib/fechas";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Documento" };
export const maxDuration = 60;

const NO = <span className="text-muted-foreground">No especificado</span>;

function Dato({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="py-3">
      <p className="text-sm font-semibold text-muted-foreground">{titulo}</p>
      <div className="text-lg leading-snug">{children}</div>
    </div>
  );
}

export default async function Detalle({ params }: PageProps<"/documentos/[id]">) {
  const { id } = await params;
  const d = await obtenerDetalle(id);
  if (!d) notFound();
  const { doc, ficha, paginas, url } = d;
  const v = nivelVencimiento(ficha?.vencimiento, aISODia());
  const importes = (Array.isArray(ficha?.importes) ? ficha.importes : []) as { concepto: string; importe: number }[];
  const esImagen = doc.mime?.startsWith("image/");
  const esPdf = doc.mime === "application/pdf";

  return (
    <main className="mx-auto flex max-w-[var(--ancho)] flex-col gap-5 px-4 py-5">
      <header>
        <Link href="/documentos" className="inline-flex min-h-12 items-center font-semibold underline">← Documentos</Link>
        <h1 className="text-2xl font-bold leading-tight">{doc.nombre}</h1>
        <p className="text-muted-foreground">{doc.categoria}{doc.tipo ? ` · ${doc.tipo}` : ""}</p>
      </header>

      {doc.estado === "pendiente" && <div className="flex flex-col gap-2 rounded-md border border-border bg-card px-4 py-3"><p className="font-semibold">Todavía no se ha leído.</p><BotonLeer id={doc.id} /></div>}
      {doc.estado === "error" && <p role="alert" className="rounded-md border border-destructive/50 px-4 py-3 font-semibold text-destructive">No se pudo leer: {doc.error ?? "motivo desconocido"}. Puedes reintentarlo o rellenar la ficha a mano.</p>}
      {doc.estado === "error" && <BotonLeer id={doc.id} />}

      {v && (
        <p className={cn("rounded-md border px-4 py-3 text-lg font-bold", v.nivel === "vencido" || v.nivel === "urgente" ? "border-destructive/50 text-destructive" : "border-border bg-card")}>
          {textoVencimiento(v.dias)} · {formatearDia(ficha!.vencimiento as string)}
        </p>
      )}

      <Card className="flex flex-col divide-y divide-border py-1">
        <Dato titulo="Partes">{ficha?.partes.length ? ficha.partes.join(" · ") : NO}</Dato>
        <Dato titulo="Nº de referencia">{ficha?.referencia ?? NO}</Dato>
        <Dato titulo="Inicio">{ficha?.inicio ? formatearDia(ficha.inicio) : NO}</Dato>
        <Dato titulo="Vencimiento">{ficha?.vencimiento ? formatearDia(ficha.vencimiento) : NO}</Dato>
        <Dato titulo="Importes">{importes.length ? importes.map((i, k) => <p key={k}>{i.concepto}: {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(i.importe)}</p>) : NO}</Dato>
        <Dato titulo="Condiciones clave">{ficha?.condiciones.length ? <ul className="list-disc pl-5">{ficha.condiciones.map((c, k) => <li key={k}>{c}</li>)}</ul> : NO}</Dato>
        <Dato titulo="Contacto">{ficha?.contacto ?? NO}</Dato>
      </Card>
      {ficha && <p className="text-sm text-muted-foreground">Ficha {ficha.origen === "claude" ? "leída por la IA: revísala" : "escrita por ti"}. El panel explica el contenido pero no da interpretaciones legales.</p>}

      {url && (
        <section className="flex flex-col gap-2" aria-label="Documento">
          <h2 className="text-xl font-bold">Documento</h2>
          {esPdf && <iframe src={url} title={doc.nombre} className="h-[70dvh] w-full rounded-md border border-border" />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {esImagen && <img src={url} alt={doc.nombre} className="w-full rounded-md border border-border" />}
          <Button asChild variant="outline" size="sm"><a href={url} target="_blank" rel="noopener noreferrer">Abrir / descargar</a></Button>
        </section>
      )}

      {paginas.length > 0 && (
        <section className="flex flex-col gap-2" aria-label="Texto">
          <h2 className="text-xl font-bold">Texto</h2>
          {paginas.map((p) => (
            <Card key={p.id} id={`p${p.pagina}`}>
              <p className="mb-1 text-sm font-semibold text-muted-foreground">Página {p.pagina}</p>
              <p className="whitespace-pre-wrap leading-relaxed">{p.texto}</p>
            </Card>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3" aria-label="Editar ficha">
        <h2 className="text-xl font-bold">Editar ficha</h2>
        <Card><FormFicha key={`${ficha?.actualizado_en ?? "n"}`} doc={doc} ficha={ficha} /></Card>
      </section>

      <details className="rounded-md border border-border">
        <summary className="flex min-h-14 cursor-pointer items-center gap-2 px-4 font-semibold text-destructive"><Trash2 size={20} />Borrar documento…</summary>
        <form action={borrarDocumento} className="flex flex-col gap-3 px-4 pb-4">
          <p>Se borra el archivo, su texto y su ficha. No se puede deshacer.</p>
          <input type="hidden" name="id" value={doc.id} />
          <Button type="submit" variant="destructive" size="lg">Sí, borrar</Button>
        </form>
      </details>
    </main>
  );
}
