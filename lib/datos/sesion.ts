import "server-only";
import { cache } from "react";
import { supabaseServidor } from "@/lib/supabase/server";

// Email de quien ha entrado (lo lee del token, sin ir a la red).
export const usuarioActual = cache(async () => {
  const supabase = await supabaseServidor();
  const { data } = await supabase.auth.getClaims();
  return { email: (data?.claims?.email as string | undefined) ?? null };
});
