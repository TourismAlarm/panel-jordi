import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

// De quién son los datos cuando no hay sesión (crons y bots). El panel es de una sola persona.
export async function duenoId(): Promise<string> {
  const { data, error } = await supabaseAdmin().from("permitidos").select("user_id").limit(1).single();
  if (error) throw new Error(`No hay usuario permitido: ${error.message}`);
  return data.user_id;
}
