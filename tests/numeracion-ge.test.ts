import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

// Contra la base real y gasta números GE: solo a mano, con PROBAR_NUMERACION=1.
const activa = process.env.PROBAR_NUMERACION === "1" && !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

describe.skipIf(!activa)("numeración GE con llamadas a la vez", () => {
  it("no da dos veces el mismo número", async () => {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
    const r = await Promise.all(Array.from({ length: 8 }, () => db.rpc("siguiente_ge")));
    const codigos = r.map((x) => x.data as string);
    expect(r.every((x) => !x.error)).toBe(true);
    expect(new Set(codigos).size).toBe(8);
  });
});
