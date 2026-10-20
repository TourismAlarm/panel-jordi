/**
 * Presupuesto del día y ritmo de gasto de la pantalla de Inicio. Lógica pura, extraída de /api/finanzas/summary.
 *
 *   Por día  → lo que te queda en la(s) cuenta(s) del día a día, repartido hasta la próxima nómina.
 *   Ritmo    → lo gastado en cada uno de los 3 meses anteriores hasta la misma altura del mes
 *              (solo meses con datos); su media es con lo que se compara el gasto de este mes.
 */
import type { AccountRole } from '@/lib/finanzas/accounts/roles';
import { periodOf, sameHeight, shiftMonth } from '@/lib/finanzas/period';
import { computeFlow, type FlowTx } from '@/lib/finanzas/summary/flow';

const round = (n: number) => Math.round(n * 100) / 100;

/** Euros al día que puedes gastar hasta la nómina (null si no hay saldo o nómina). */
export function perDay(remaining: number | null, daysLeft: number | null): number | null {
  if (remaining === null || daysLeft === null) return null;
  return round(Math.max(0, remaining) / daysLeft);
}

/** Media del gasto de los meses anteriores hasta la misma altura del mes (null si ninguno tiene datos). */
export function paceAverage(
  all: FlowTx[],
  month: string,
  startDay: number,
  dayIndex: number,
  roleOf: (accountId: string | null) => AccountRole | null,
  linkedRoles: Set<AccountRole>,
  homeShare: number,
  monthsBack = 3,
): number | null {
  const previous: number[] = [];
  for (let i = 1; i <= monthsBack; i++) {
    const pp = periodOf(shiftMonth(month, -i), startDay);
    const cutoff = sameHeight(pp, dayIndex);
    const monthTx = all.filter((t) => t.date >= pp.start && t.date <= pp.end);
    if (monthTx.length === 0) continue;
    previous.push(computeFlow(monthTx.filter((t) => t.date <= cutoff), roleOf, linkedRoles, homeShare).spent);
  }
  return previous.length ? round(previous.reduce((a, b) => a + b, 0) / previous.length) : null;
}
