import { describe, expect, it } from 'vitest';
import { paceAverage, perDay } from './ritmo';
import { nextPayday, type FlowTx } from './flow';
import type { AccountRole } from '../accounts/roles';

const gasto = (date: string, amount: number): FlowTx => ({ date, type: 'expense', amount, kind: 'regular', account_id: 'a1' });
const roleOf = (): AccountRole | null => 'daily';
const linked = new Set<AccountRole>(['daily']);

describe('presupuesto del día', () => {
  it('reparte lo que queda entre los días hasta la nómina', () => {
    expect(perDay(300, 10)).toBe(30);
    expect(perDay(100, 3)).toBe(33.33);
  });
  it('sin saldo negativo: si estás en números rojos, 0 al día', () => {
    expect(perDay(-50, 5)).toBe(0);
  });
  it('sin saldo o sin nómina conocida no hay cifra', () => {
    expect(perDay(null, 5)).toBeNull();
    expect(perDay(200, null)).toBeNull();
  });
});

describe('ritmo de gasto', () => {
  // Mes 2026-10 (día de cobro 1): se compara con septiembre, agosto y julio hasta el mismo día.
  const tx = [
    gasto('2026-09-03', 100), gasto('2026-09-20', 500), // septiembre: hasta el 10 → 100
    gasto('2026-08-05', 300), gasto('2026-08-25', 900), // agosto: hasta el 10 → 300
    // julio sin datos: no cuenta
  ];
  it('media hasta la misma altura del mes, solo con meses con datos', () => {
    expect(paceAverage(tx, '2026-10', 1, 10, roleOf, linked, 0.5)).toBe(200);
  });
  it('sin meses anteriores con datos no hay media', () => {
    expect(paceAverage([], '2026-10', 1, 10, roleOf, linked, 0.5)).toBeNull();
  });
  it('un gasto posterior a la altura del mes no cuenta', () => {
    expect(paceAverage([gasto('2026-09-28', 1000)], '2026-10', 1, 10, roleOf, linked, 0.5)).toBe(0);
  });
});

describe('próxima nómina (día de cobro deducido de los ingresos)', () => {
  it('detecta el día habitual del ingreso grande', () => {
    const ingresos = ['2026-07-26', '2026-08-26', '2026-09-26'].map((date) => ({ date, amount: 1800 }));
    const r = nextPayday(ingresos, new Date('2026-10-20T10:00:00Z'));
    expect(r?.day).toBe(26);
    expect(r?.daysLeft).toBe(6);
  });
});
