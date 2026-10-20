import "server-only";
import { supabaseServidor } from "@/lib/supabase/server";
import { correoPermitido } from "@/lib/acceso";
import { supabaseAdmin } from "./db";

// Sustituye a NextAuth del original: la sesión es la de Supabase Auth, con la misma forma que usaba el código.
export interface Sesion {
  user: { id: string; email: string | null; name: string | null; image: string | null };
}

export const authOptions = {};

export async function getServerSession(_opciones?: unknown): Promise<Sesion | null> {
  const supabase = await supabaseServidor();
  const { data } = await supabase.auth.getClaims();
  const c = data?.claims;
  if (!c?.sub || !correoPermitido(c.email as string | undefined)) return null;
  const meta = (c.user_metadata ?? {}) as { full_name?: string; avatar_url?: string };
  return { user: { id: c.sub, email: (c.email as string) ?? null, name: meta.full_name ?? null, image: meta.avatar_url ?? null } };
}

/** Usuarios cuyo perfil ya se ha comprobado en esta instancia del servidor. */
const comprobados = new Set<string>();

// Garantiza la fila de fin_profiles (un trigger de la BD crea las categorías por defecto al insertarla).
export async function ensureProfile(session: Sesion | null): Promise<void> {
  const user = session?.user;
  if (!user?.id || comprobados.has(user.id)) return;
  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert(
      { id: user.id, email: user.email || `${user.id}@sin-email.local`, full_name: user.name, avatar_url: user.image },
      { onConflict: "id", ignoreDuplicates: true },
    );
  if (error) {
    console.error("ensureProfile:", error.message);
    return;
  }
  comprobados.add(user.id);
}
