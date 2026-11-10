import 'server-only';
import { supabaseAdmin } from '@/lib/finanzas/db';
import { merchantKey } from '@/lib/finanzas/debts/detect';
import { isRefundCategory, isTransferCategory } from '@/lib/finanzas/categorization/special';

export type Aplicada = { ok: true; alsoUpdated: number; kind: string; learned: boolean; refund_of: string | null } | { ok: false; error: string; status: number };

/**
 * Pone categoría a un movimiento y, si learn, aprende la regla: los próximos movimientos del mismo
 * comercio (y los que ya están sin categoría) se categorizan solos.
 * La usan el botón de Finanzas (/api/finanzas/categorize) y las propuestas del bot al aceptarlas.
 */
export async function aplicarCategoria(userId: string, id: string, category_id: string, opciones: { learn?: boolean; refund_of?: string | null } = {}): Promise<Aplicada> {
  const fallo = (error: string, status: number): Aplicada => ({ ok: false, error, status });

  // La categoría tiene que ser tuya
  const { data: cat } = await supabaseAdmin.from('categories').select('id, name').eq('id', category_id).eq('user_id', userId).maybeSingle();
  if (!cat) return fallo('Categoría no encontrada', 404);

  // "Entre cuentas" convierte el movimiento en traspaso; otra categoría lo devuelve a normal.
  // "Devoluciones" no se aprende por comercio: un Bizum de alguien no siempre es devolución.
  const toTransfer = isTransferCategory(cat.name);
  const toRefund = isRefundCategory(cat.name);
  const learn = (opciones.learn ?? true) && !toRefund;

  // El gasto que te devuelven tiene que ser un gasto tuyo
  const refundOf = toRefund ? opciones.refund_of ?? null : null;
  if (refundOf) {
    if (refundOf === id) return fallo('Un movimiento no se devuelve a sí mismo', 400);
    const { data: original } = await supabaseAdmin.from('transactions').select('id, type').eq('id', refundOf).eq('user_id', userId).maybeSingle();
    if (!original || (original as { type: string }).type !== 'expense') return fallo('No encuentro ese gasto', 404);
  }

  const { data: current } = await supabaseAdmin.from('transactions').select('kind').eq('id', id).eq('user_id', userId).maybeSingle();
  if (!current) return fallo('Movimiento no encontrado', 404);
  const currentKind = (current as { kind?: string | null }).kind || 'regular';
  if (currentKind === 'investment' || currentKind === 'debt_payment') return fallo('Las inversiones y cuotas de deuda no llevan categoría', 400);
  const kind = toTransfer ? 'internal_transfer' : 'regular';

  const save = (fields: Record<string, unknown>) =>
    supabaseAdmin.from('transactions').update(fields).eq('id', id).eq('user_id', userId).select('id, description, counterparty, type').maybeSingle();

  let { data: tx, error } = await save({ category_id, kind, refund_of: refundOf });
  if (error && /refund_of/.test(error.message)) {
    // Falta la migración 015: sin ella no se puede decir qué gasto te devuelven
    if (refundOf) return fallo('Para elegir el gasto que te devuelven falta aplicar la migración 015 en Supabase', 409);
    ({ data: tx, error } = await save({ category_id, kind }));
  }
  if (error || !tx) return fallo(error?.message || 'Movimiento no encontrado', 404);

  let alsoUpdated = 0;
  if (learn) {
    const pattern = merchantKey(tx.counterparty, tx.description || '');
    if (pattern.length >= 3) {
      const { error: ruleError } = await supabaseAdmin.from('category_rules').upsert({ user_id: userId, pattern, category_id }, { onConflict: 'user_id,pattern' });
      if (!ruleError) {
        // Aplica la regla a los demás movimientos del mismo comercio que siguen sin categoría
        const { data: pending } = await supabaseAdmin.from('transactions').select('id, description, counterparty').eq('user_id', userId).eq('type', tx.type).eq('kind', 'regular').is('category_id', null);
        const sameMerchant = (pending || []).filter((p: any) => merchantKey(p.counterparty, p.description || '') === pattern).map((p: any) => p.id);
        if (sameMerchant.length) {
          await supabaseAdmin.from('transactions').update({ category_id, kind }).in('id', sameMerchant).eq('user_id', userId);
          alsoUpdated = sameMerchant.length;
        }
      }
    }
  }
  return { ok: true, alsoUpdated, kind, learned: learn, refund_of: refundOf };
}
