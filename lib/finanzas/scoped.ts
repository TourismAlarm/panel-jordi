import { supabaseNavegador } from "@/lib/supabase/client";

// Cliente del navegador con la forma que usan los hooks del módulo. Va directo a Supabase con la sesión del
// usuario: RLS limita cada consulta a sus filas. Traduce transactions → fin_transactions, etc.
let cliente: ReturnType<typeof supabaseNavegador> | null = null;

const scoped = {
  from: (tabla: string) => {
    cliente ??= supabaseNavegador();
    // Sin tipos generados para fin_*: el código original ya trabajaba con tipado laxo.
    return (cliente as unknown as { from: (t: string) => any }).from(`fin_${tabla}`);
  },
};

export function createScopedClient() {
  return scoped;
}
