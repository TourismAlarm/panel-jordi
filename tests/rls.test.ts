import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Prueba de RLS contra el Supabase real. Necesita NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
// y SUPABASE_SERVICE_ROLE_KEY (crea y borra dos usuarios temporales). Sin ellas se salta.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publica = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const servicio = process.env.SUPABASE_SERVICE_ROLE_KEY;
const listo = !!(url && publica && servicio);

describe.skipIf(!listo)("RLS", () => {
  let admin: SupabaseClient;
  const sufijo = Date.now();
  const A = { email: `rls-a-${sufijo}@prueba.invalid`, password: `Pw-${sufijo}-aA1!` };
  const B = { email: `rls-b-${sufijo}@prueba.invalid`, password: `Pw-${sufijo}-bB2!` };
  const ids: string[] = [];

  async function sesion(c: { email: string; password: string }) {
    const cli = createClient(url!, publica!, { auth: { persistSession: false } });
    const { error } = await cli.auth.signInWithPassword(c);
    if (error) throw error;
    return cli;
  }

  beforeAll(async () => {
    admin = createClient(url!, servicio!, { auth: { persistSession: false } });
    for (const c of [A, B]) {
      const { data, error } = await admin.auth.admin.createUser({ ...c, email_confirm: true });
      if (error) throw error;
      ids.push(data.user.id);
    }
    // A está permitido y tiene una fila; B no está en «permitidos».
    await admin.from("permitidos").insert({ user_id: ids[0] });
    await admin.from("bandeja").insert({ user_id: ids[0], modulo: "sistema", tipo: "aviso", titulo: "solo de A" });
    // Finanzas: A tiene perfil (el trigger crea sus categorías), una cuenta y un enlace bancario.
    await admin.from("fin_profiles").insert({ id: ids[0], email: A.email });
    await admin.from("fin_accounts").insert({ user_id: ids[0], name: "cuenta de A", type: "bank" });
    await admin.from("sal_metricas").insert({ user_id: ids[0], fecha: "2026-10-20", metrica: "pasos", valor: 8000, fuente: "garmin" });
    await admin.from("sal_registros").insert({ user_id: ids[0], fecha: "2026-10-20", tipo: "nota", texto: "solo de A" });
    await admin.from("fin_bank_links").insert({ user_id: ids[0], aspsp_name: "X", aspsp_country: "ES", session_id: "s", account_uid: "u" });
  });

  afterAll(async () => {
    await admin.from("bandeja").delete().in("user_id", ids);
    await admin.from("sal_metricas").delete().in("user_id", ids);
    await admin.from("sal_registros").delete().in("user_id", ids);
    await admin.from("fin_bank_links").delete().in("user_id", ids);
    await admin.from("fin_accounts").delete().in("user_id", ids);
    await admin.from("fin_profiles").delete().in("id", ids);
    await admin.from("permitidos").delete().in("user_id", ids);
    for (const id of ids) await admin.auth.admin.deleteUser(id);
  });

  it("el dueño lee su fila", async () => {
    const { data } = await (await sesion(A)).from("bandeja").select("titulo");
    expect(data).toEqual([{ titulo: "solo de A" }]);
  });

  it("otro usuario no puede leer filas ajenas", async () => {
    const { data } = await (await sesion(B)).from("bandeja").select("*");
    expect(data).toEqual([]);
  });

  it("otro usuario no puede modificar filas ajenas", async () => {
    const b = await sesion(B);
    await b.from("bandeja").update({ estado: "leido" }).eq("user_id", ids[0]);
    const { data } = await admin.from("bandeja").select("estado").eq("user_id", ids[0]);
    expect(data).toEqual([{ estado: "nuevo" }]);
  });

  it("Finanzas: el dueño ve lo suyo y otro usuario no ve nada de A", async () => {
    const a = await sesion(A);
    expect((await a.from("fin_accounts").select("name")).data).toEqual([{ name: "cuenta de A" }]);
    expect(((await a.from("fin_categories").select("id")).data ?? []).length).toBeGreaterThan(0);
    const b = await sesion(B);
    for (const t of ["fin_accounts", "fin_categories", "fin_profiles", "fin_transactions"]) {
      expect((await b.from(t).select("*")).data, t).toEqual([]);
    }
  });

  it("Finanzas: ni el dueño puede leer los enlaces bancarios desde el navegador (solo el servidor)", async () => {
    const { data } = await (await sesion(A)).from("fin_bank_links").select("*");
    expect(data ?? []).toEqual([]);
  });

  it("Finanzas: otro usuario no puede escribir en cuentas ajenas", async () => {
    const b = await sesion(B);
    await b.from("fin_accounts").update({ name: "hackeada" }).eq("user_id", ids[0]);
    await b.from("fin_accounts").insert({ user_id: ids[0], name: "intrusa", type: "bank" });
    const { data } = await admin.from("fin_accounts").select("name").eq("user_id", ids[0]);
    expect(data).toEqual([{ name: "cuenta de A" }]);
  });

  it("Salud: el dueño ve sus datos; otro usuario no ve ni escribe nada", async () => {
    const a = await sesion(A);
    expect((await a.from("sal_metricas").select("valor")).data).toEqual([{ valor: 8000 }]);
    const b = await sesion(B);
    for (const t of ["sal_metricas", "sal_registros", "sal_entrenos"]) expect((await b.from(t).select("*")).data, t).toEqual([]);
    await b.from("sal_metricas").insert({ user_id: ids[0], fecha: "2026-10-21", metrica: "pasos", valor: 1, fuente: "manual" });
    await b.from("sal_registros").update({ texto: "hackeado" }).eq("user_id", ids[0]);
    expect((await admin.from("sal_metricas").select("valor").eq("user_id", ids[0])).data).toEqual([{ valor: 8000 }]);
    expect((await admin.from("sal_registros").select("texto").eq("user_id", ids[0])).data).toEqual([{ texto: "solo de A" }]);
  });

  it("Salud: ni el dueño puede falsear datos del reloj desde el navegador (solo «manual»)", async () => {
    const a = await sesion(A);
    const { error } = await a.from("sal_metricas").insert({ user_id: ids[0], fecha: "2026-10-22", metrica: "pasos", valor: 99999, fuente: "garmin" });
    expect(error).not.toBeNull();
  });

  it("sin sesión no se lee nada", async () => {
    const anon = createClient(url!, publica!, { auth: { persistSession: false } });
    const { data } = await anon.from("bandeja").select("*");
    expect(data ?? []).toEqual([]);
  });

  it("todas las tablas de public tienen RLS activado", async () => {
    const { data, error } = await admin.rpc("rls_auditoria");
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});
