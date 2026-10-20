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
  });

  afterAll(async () => {
    await admin.from("bandeja").delete().in("user_id", ids);
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
