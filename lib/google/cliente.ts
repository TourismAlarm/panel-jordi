import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { cifrar, descifrar } from "./cifrado";

// Gmail y Calendar, SOLO LECTURA. Estos permisos (scopes) no dejan enviar, borrar ni modificar nada,
// ni aunque el código lo intentara: Google lo rechazaría.
export const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

const limpio = (v: string | undefined) => v?.trim().replace(/^["']|["']$/g, "").trim();

export function googleConfigurado(): boolean {
  return !!(limpio(process.env.GOOGLE_CLIENT_ID) && limpio(process.env.GOOGLE_CLIENT_SECRET) && limpio(process.env.GOOGLE_TOKEN_KEY));
}

function credenciales() {
  const id = limpio(process.env.GOOGLE_CLIENT_ID);
  const secreto = limpio(process.env.GOOGLE_CLIENT_SECRET);
  if (!id || !secreto) throw new Error("Faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET.");
  return { id, secreto };
}

export function urlRedireccion(origen: string): string {
  const base = limpio(process.env.APP_URL) || origen;
  return `${base.replace(/\/$/, "")}/api/google/callback`;
}

export function urlAutorizacion(estado: string, redireccion: string): string {
  const q = new URLSearchParams({
    client_id: credenciales().id,
    redirect_uri: redireccion,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline", // para que dé refresh token
    prompt: "consent", // y lo dé siempre, aunque ya se hubiera autorizado
    include_granted_scopes: "true",
    state: estado,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

type RespuestaToken = { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string; error?: string; error_description?: string };

async function pedirToken(cuerpo: Record<string, string>): Promise<RespuestaToken> {
  const { id, secreto } = credenciales();
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: id, client_secret: secreto, ...cuerpo }),
    signal: AbortSignal.timeout(10_000),
  });
  const j = (await r.json().catch(() => ({}))) as RespuestaToken;
  if (!r.ok) throw new Error(`Google: ${j.error ?? r.status}${j.error_description ? ` (${j.error_description})` : ""}`);
  return j;
}

export async function conectarConCodigo(userId: string, codigo: string, redireccion: string) {
  const t = await pedirToken({ grant_type: "authorization_code", code: codigo, redirect_uri: redireccion });
  if (!t.refresh_token || !t.access_token) throw new Error("Google no devolvió permiso permanente. Vuelve a conectar.");
  const scopes = t.scope ?? "";
  // Si el usuario desmarcó algún permiso, no se guarda a medias.
  for (const s of SCOPES.slice(0, 2)) if (!scopes.includes(s)) throw new Error("Faltan permisos: acepta Gmail y Calendar (solo lectura).");
  const u = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { authorization: `Bearer ${t.access_token}` }, signal: AbortSignal.timeout(10_000) });
  const correo = u.ok ? ((await u.json()) as { email?: string }).email ?? null : null;
  const { error } = await supabaseAdmin()
    .from("google_tokens")
    .upsert({ user_id: userId, refresh_cifrado: cifrar(t.refresh_token), scopes, correo, creado_en: new Date().toISOString() });
  if (error) throw new Error(`No se pudo guardar la conexión: ${error.message}`);
  return correo;
}

export async function estadoGoogle(userId: string): Promise<{ conectado: boolean; correo: string | null }> {
  const { data } = await supabaseAdmin().from("google_tokens").select("correo").eq("user_id", userId).maybeSingle();
  return { conectado: !!data, correo: data?.correo ?? null };
}

export async function desconectarGoogle(userId: string) {
  const admin = supabaseAdmin();
  const { data } = await admin.from("google_tokens").select("refresh_cifrado").eq("user_id", userId).maybeSingle();
  if (data) {
    // Se revoca en Google (si falla, igualmente se olvida aquí).
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(descifrar(data.refresh_cifrado))}`, { method: "POST", signal: AbortSignal.timeout(10_000) }).catch(() => {});
    await admin.from("google_tokens").delete().eq("user_id", userId);
  }
}

// Access token de corta vida (1 h) a partir del refresh token guardado. null = no hay conexión.
export async function tokenDeAcceso(userId: string): Promise<string | null> {
  if (!googleConfigurado()) return null;
  const { data } = await supabaseAdmin().from("google_tokens").select("refresh_cifrado").eq("user_id", userId).maybeSingle();
  if (!data) return null;
  const t = await pedirToken({ grant_type: "refresh_token", refresh_token: descifrar(data.refresh_cifrado) });
  return t.access_token ?? null;
}

export async function getGoogle<T>(token: string, url: string): Promise<T> {
  const r = await fetch(url, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000), cache: "no-store" });
  if (!r.ok) throw new Error(`Google ${r.status}`);
  return (await r.json()) as T;
}
