import 'server-only';
import { supabaseAdmin } from '@/lib/finanzas/db';

export const NIVELES_CONSEJO = ['problema', 'ojo', 'consejo', 'bien'] as const;
export type NivelConsejo = (typeof NIVELES_CONSEJO)[number];
export type Consejo = { id: string; clave: string; nivel: NivelConsejo; titulo: string; detalle: string; enlace: string | null; bot: string; actualizado: string };

/** Lo que Antonio te dice y aún no has marcado como visto: primero los problemas. Si la tabla no existe todavía, nada. */
export async function consejosActivos(userId: string): Promise<Consejo[]> {
  const { data, error } = await supabaseAdmin
    .from('consejos')
    .select('id, clave, nivel, titulo, detalle, enlace, bot, actualizado')
    .eq('user_id', userId)
    .eq('estado', 'activo')
    .order('actualizado', { ascending: false })
    .limit(50);
  if (error) {
    if (!/does not exist|schema cache/i.test(error.message)) console.error('Finanzas · consejos:', error.message);
    return [];
  }
  const orden = (n: string) => NIVELES_CONSEJO.indexOf(n as NivelConsejo);
  return ((data ?? []) as Consejo[]).sort((a, b) => orden(a.nivel) - orden(b.nivel));
}
