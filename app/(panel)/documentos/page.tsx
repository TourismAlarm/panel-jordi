import type { Metadata } from "next";
import Link from "next/link";
import { FilePlus2, Search } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { buscarEnDocumentos, listarDocumentos } from "@/lib/documentos/datos";
import { TODAS_CATEGORIAS } from "@/lib/documentos/categorias";
import { queFalta } from "@/lib/documentos/falta";
import { nivelVencimiento, ordenarPorVencimiento, textoVencimiento } from "@/lib/documentos/vencimiento";
import { aISODia, formatearDia } from "@/lib/fechas";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Documentos" };

const chip = (activo: boolean) => cn("flex min-h-12 shrink-0 items-center rounded-full border px-5 font-semibold", activo ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground");

// ««texto»» marca la coincidencia; se pinta como <mark> sin tocar HTML.
function Extracto({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(/(«[^»]*»)/).map((t, i) => (t.startsWith("«") ? <mark key={i} className="rounded bg-muted px-0.5 font-semibold text-foreground">{t.slice(1, -1)}</mark> : <span key={i}>{t}</span>))}
    </>
  );
}

export default async function Documentos({ searchParams }: PageProps<"/documentos">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const cat = typeof sp.cat === "string" ? sp.cat : "";
  const falta = sp.falta === "1";
  const hoy = aISODia();

  const [docs, coincidencias] = await Promise.all([listarDocumentos(), q ? buscarEnDocumentos(q) : Promise.resolve([])]);
  const porId = new Map(docs.map((d) => [d.id, d]));
  const pendientes = docs.filter((d) => d.estado === "pendiente").length;
  const conError = docs.filter((d) => d.estado === "error");
  const sugerencias = falta ? queFalta(docs) : [];

  const lista = ordenarPorVencimiento(docs.filter((d) => !cat || d.categoria === cat));
  const en60 = docs.filter((d) => { const n = nivelVencimiento(d.vencimiento, hoy); return n && n.dias >= 0 && n.dias <= 60; });

  return (
    <main className="mx-auto flex max-w-[var(--ancho)] flex-col gap-4 px-4 py-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Documentos</h1>
          <p className="text-muted-foreground">{docs.length} guardados{pendientes ? ` · ${pendientes} esperando a Claude` : ""}</p>
        </div>
        <Button asChild size="sm">
          <Link href="/documentos/nuevo"><FilePlus2 size={20} />Añadir</Link>
        </Button>
      </header>

      <form action="/documentos" className="flex gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Buscar dentro de los documentos" aria-label="Buscar" className="min-h-14 min-w-0 flex-1 rounded-md border border-border bg-card px-4 text-base" />
        <Button type="submit" size="icon" aria-label="Buscar"><Search size={22} /></Button>
      </form>

      {conError.length > 0 && (
        <p role="alert" className="rounded-md border border-destructive/50 px-4 py-3 font-semibold text-destructive">
          {conError.length === 1 ? "Un documento no se ha podido leer" : `${conError.length} documentos no se han podido leer`}: {conError.map((d) => d.nombre).join(", ")}.
        </p>
      )}

      {q ? (
        <section className="flex flex-col gap-2" aria-label="Resultados">
          <h2 className="text-xl font-bold">Resultados para «{q}»</h2>
          {coincidencias.length === 0 ? (
            <Card><p className="font-semibold">No aparece en ningún documento.</p><p className="text-muted-foreground">Si debería estar, sube el documento o revisa que Claude ya lo haya leído.</p></Card>
          ) : (
            <Card className="flex flex-col divide-y divide-border py-1">
              {coincidencias.map((c, i) => {
                const d = porId.get(c.documento_id);
                return (
                  <Link key={i} href={`/documentos/${c.documento_id}#p${c.pagina}`} className="block min-h-14 py-3">
                    <p className="text-lg font-semibold leading-snug">{d?.nombre ?? "Documento"} <span className="text-muted-foreground">· pág. {c.pagina}</span></p>
                    <p className="text-muted-foreground"><Extracto texto={c.extracto} /></p>
                  </Link>
                );
              })}
            </Card>
          )}
        </section>
      ) : (
        <>
          <nav aria-label="Filtros" className="flex gap-2 overflow-x-auto pb-1">
            <Link href="/documentos" className={chip(!cat && !falta)}>Todos</Link>
            {TODAS_CATEGORIAS.filter((c) => docs.some((d) => d.categoria === c)).map((c) => (
              <Link key={c} href={`/documentos?cat=${encodeURIComponent(c)}`} className={chip(cat === c)}>{c}</Link>
            ))}
            <Link href="/documentos?falta=1" className={chip(falta)}>¿Qué me falta?</Link>
          </nav>

          {falta && (
            <Card className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">Suele ir junto y no lo tienes archivado</h2>
              {sugerencias.length ? (
                <ul className="flex list-disc flex-col gap-1 pl-5 text-lg">{sugerencias.map((s) => <li key={s}>{s}</li>)}</ul>
              ) : (
                <p className="text-muted-foreground">Con lo que tienes no echo nada en falta.</p>
              )}
              <p className="text-sm text-muted-foreground">Es solo una sugerencia según lo archivado; no es una obligación legal.</p>
            </Card>
          )}

          {!cat && !falta && en60.length > 0 && (
            <p className="rounded-md border border-border bg-card px-4 py-3 font-semibold">{en60.length === 1 ? "1 documento vence" : `${en60.length} documentos vencen`} en los próximos 60 días.</p>
          )}

          {docs.length === 0 ? (
            <Card className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-xl font-semibold">Todavía no hay documentos</p>
              <p className="text-muted-foreground">Sube un PDF o una foto, o apunta una nota.</p>
            </Card>
          ) : (
            <Card className="flex flex-col divide-y divide-border py-1">
              {lista.map((d) => {
                const v = nivelVencimiento(d.vencimiento, hoy);
                return (
                  <Link key={d.id} href={`/documentos/${d.id}`} className="flex min-h-16 items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-semibold leading-snug">{d.nombre}</p>
                      <p className="truncate text-muted-foreground">{d.tipo ?? d.categoria}{d.estado === "pendiente" ? " · pendiente de leer" : ""}{d.estado === "error" ? " · no se pudo leer" : ""}</p>
                    </div>
                    {v && (
                      <div className="shrink-0 text-right">
                        <p className={cn("font-bold", (v.nivel === "vencido" || v.nivel === "urgente") && "text-destructive", v.nivel === "pronto" && "underline decoration-2")}>{textoVencimiento(v.dias)}</p>
                        <p className="text-sm text-muted-foreground">{formatearDia(d.vencimiento as string)}</p>
                      </div>
                    )}
                  </Link>
                );
              })}
            </Card>
          )}
        </>
      )}
    </main>
  );
}
