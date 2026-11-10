// Reglas de las propuestas de categoría del bot. Sin base de datos (pruebas en propuestas-puro.test.ts).

export type MovimientoPropuesto = { type: string; kind: string | null; category_id: string | null };
export type CategoriaPropuesta = { id: string; type: string };
export type PropuestaPrevia = { estado: string; category_id: string };

/** Por qué no se guarda una propuesta, o null si vale. */
export function motivoDeRechazo(tx: MovimientoPropuesto | undefined, cat: CategoriaPropuesta | undefined, previa: PropuestaPrevia | undefined): string | null {
  if (!tx) return 'ese movimiento no existe';
  if (!cat) return 'esa categoría no existe';
  if ((tx.kind || 'regular') !== 'regular') return 'los traspasos, inversiones y cuotas de deuda no llevan categoría';
  if (tx.category_id) return 'ese movimiento ya tiene categoría';
  if (cat.type !== tx.type) return tx.type === 'expense' ? 'es un gasto: necesita una categoría de gasto' : 'es un ingreso: necesita una categoría de ingreso';
  if (previa?.estado === 'rechazada' && previa.category_id === cat.id) return 'Jordi ya rechazó esa categoría para este movimiento';
  return null;
}

/** Texto corto del movimiento para enseñarlo: el comercio si lo hay; si no, la descripción sin números de tarjeta. */
export function nombreMovimiento(counterparty: string | null | undefined, description: string | null | undefined): string {
  if (counterparty && !/^[\s*•·xX0-9-]*$/.test(counterparty)) return counterparty;
  return (description || '').replace(/[*•]{2,}[0-9]*/g, ' ').replace(/^[\s·-]+|[\s·-]+$/g, '').trim() || 'Movimiento bancario';
}
