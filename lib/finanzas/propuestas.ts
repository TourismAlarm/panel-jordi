import 'server-only';
import { supabaseAdmin } from '@/lib/finanzas/db';
import { nombreMovimiento } from './propuestas-puro';

export type PropuestaPendiente = {
  id: string;
  movimiento_id: string;
  descripcion: string;
  importe: number;
  tipo: 'income' | 'expense';
  fecha: string;
  categoria_id: string;
  categoria: string;
  motivo: string | null;
  bot: string;
};

/**
 * Propuestas del bot que esperan a Jordi. Solo cuentan las de movimientos que siguen sin categoría:
 * si ya la tienen (la puso él, o una regla al aceptar otra del mismo comercio), la propuesta sobra y se da por aceptada.
 * Si la tabla aún no existe (migración sin aplicar), no hay propuestas.
 */
export async function propuestasPendientes(userId: string): Promise<PropuestaPendiente[]> {
  const { data, error } = await supabaseAdmin
    .from('propuestas_categoria')
    .select('id, transaction_id, category_id, motivo, bot, creada')
    .eq('user_id', userId)
    .eq('estado', 'propuesta')
    .order('creada', { ascending: false })
    .limit(300);
  if (error) {
    if (!/does not exist|schema cache/i.test(error.message)) console.error('Finanzas · propuestas:', error.message);
    return [];
  }
  const filas = (data ?? []) as { id: string; transaction_id: string; category_id: string; motivo: string | null; bot: string }[];
  if (!filas.length) return [];

  const [txs, cats] = await Promise.all([
    supabaseAdmin.from('transactions').select('id, date, type, amount, description, counterparty, category_id, kind').eq('user_id', userId).in('id', filas.map((f) => f.transaction_id)),
    supabaseAdmin.from('categories').select('id, name').eq('user_id', userId),
  ]);
  if (txs.error || cats.error) {
    console.error('Finanzas · propuestas:', txs.error?.message ?? cats.error?.message);
    return [];
  }
  const tx = new Map(((txs.data ?? []) as any[]).map((t) => [t.id as string, t]));
  const nombre = new Map(((cats.data ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name]));

  const vivas: PropuestaPendiente[] = [];
  const sobran: string[] = [];
  for (const f of filas) {
    const t = tx.get(f.transaction_id);
    if (!t || t.category_id || (t.kind || 'regular') !== 'regular' || !nombre.has(f.category_id)) {
      sobran.push(f.id);
      continue;
    }
    vivas.push({ id: f.id, movimiento_id: t.id, descripcion: nombreMovimiento(t.counterparty, t.description), importe: Number(t.amount), tipo: t.type, fecha: t.date, categoria_id: f.category_id, categoria: nombre.get(f.category_id)!, motivo: f.motivo, bot: f.bot });
  }
  if (sobran.length) {
    const { error: e } = await supabaseAdmin.from('propuestas_categoria').update({ estado: 'aceptada', decidida_en: new Date().toISOString() }).in('id', sobran).eq('user_id', userId);
    if (e) console.error('Finanzas · propuestas que sobran:', e.message);
  }
  return vivas.sort((a, b) => b.fecha.localeCompare(a.fecha));
}
