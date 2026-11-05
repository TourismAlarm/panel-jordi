import { NextResponse } from "next/server";
import { leerPagina, leerRango, pagina } from "@/lib/bots/consultas";
import { conBot, firmanteDeUrl, leerFiltro } from "@/lib/bots/entrada";
import { FiltroTipoMovimiento } from "@/lib/bots/esquemas";
import { ocultarIban } from "@/lib/bots/vida";
import { duenoId } from "@/lib/datos/dueno";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/bots/finanzas/movimientos?desde=&hasta=&categoria=&tipo=&kind=&limite=&cursor= — solo lectura.
export async function GET(request: Request) {
  return conBot(request, "finanzas:leer", async (clave) => {
    const firma = firmanteDeUrl(request, clave, "finanzas:leer");
    if ("fallo" in firma) return firma.fallo;
    const rango = leerRango(request);
    if ("fallo" in rango) return rango.fallo;
    const pag = leerPagina(request);
    if ("fallo" in pag) return pag.fallo;
    const tipo = leerFiltro(request, "tipo", FiltroTipoMovimiento);
    if ("fallo" in tipo) return tipo.fallo;
    const q = new URL(request.url).searchParams;
    const db = supabaseAdmin();
    const userId = await duenoId();

    const [categorias, cuentas] = await Promise.all([db.from("fin_categories").select("id, name").eq("user_id", userId), db.from("fin_accounts").select("id, name").eq("user_id", userId)]);
    if (categorias.error) throw new Error(categorias.error.message);
    if (cuentas.error) throw new Error(cuentas.error.message);
    const nombreCategoria = new Map(categorias.data.map((c) => [c.id, c.name]));
    const nombreCuenta = new Map(cuentas.data.map((c) => [c.id, c.name]));

    let consulta = db
      .from("fin_transactions")
      .select("id, date, type, amount, description, counterparty, category_id, kind, account_id, loan_id, refund_of")
      .eq("user_id", userId)
      .gte("date", rango.desde)
      .lte("date", rango.hasta)
      .order("date", { ascending: false })
      .order("id")
      .range(pag.inicio, pag.inicio + pag.limite);
    if (tipo.valor) consulta = consulta.eq("type", tipo.valor);
    const kind = q.get("kind");
    if (kind) consulta = consulta.eq("kind", kind);
    const categoria = q.get("categoria");
    if (categoria) {
      const id = categorias.data.find((c) => c.id === categoria || c.name.toLowerCase() === categoria.toLowerCase())?.id;
      if (!id) return NextResponse.json({ error: "categoria no existe" }, { status: 400 });
      consulta = consulta.eq("category_id", id);
    }
    const { data, error } = await consulta;
    if (error) throw new Error(error.message);
    const filas = data.map((t) => ({
      id: t.id,
      fecha: t.date,
      tipo: t.type,
      importe: Number(t.amount),
      descripcion: ocultarIban(t.description),
      counterparty: ocultarIban(t.counterparty),
      categoria: t.category_id ? (nombreCategoria.get(t.category_id) ?? null) : null,
      kind: t.kind,
      cuenta: t.account_id ? (nombreCuenta.get(t.account_id) ?? null) : null,
      loan_id: t.loan_id,
      refund_of: t.refund_of,
    }));
    return NextResponse.json(pagina(filas, pag));
  });
}
