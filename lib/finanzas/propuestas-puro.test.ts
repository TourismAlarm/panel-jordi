import { describe, expect, it } from 'vitest';
import { motivoDeRechazo, nombreMovimiento } from './propuestas-puro';

const gasto = { type: 'expense', kind: 'regular', category_id: null };
const comida = { id: 'c1', type: 'expense' };

describe('propuestas de categoría del bot', () => {
  it('vale un gasto sin categoría con una categoría de gasto', () => {
    expect(motivoDeRechazo(gasto, comida, undefined)).toBeNull();
    expect(motivoDeRechazo({ ...gasto, kind: null }, comida, { estado: 'propuesta', category_id: 'c2' })).toBeNull();
  });
  it('no vale si falta algo, ya tiene categoría o no es un movimiento normal', () => {
    expect(motivoDeRechazo(undefined, comida, undefined)).toMatch(/no existe/);
    expect(motivoDeRechazo(gasto, undefined, undefined)).toMatch(/categoría no existe/);
    expect(motivoDeRechazo({ ...gasto, category_id: 'x' }, comida, undefined)).toMatch(/ya tiene/);
    expect(motivoDeRechazo({ ...gasto, kind: 'debt_payment' }, comida, undefined)).toMatch(/no llevan/);
  });
  it('el tipo de la categoría tiene que ser el del movimiento', () => {
    expect(motivoDeRechazo(gasto, { id: 'n', type: 'income' }, undefined)).toMatch(/gasto/);
    expect(motivoDeRechazo({ ...gasto, type: 'income' }, comida, undefined)).toMatch(/ingreso/);
  });
  it('no insiste con la misma categoría que Jordi rechazó, pero sí puede proponer otra', () => {
    expect(motivoDeRechazo(gasto, comida, { estado: 'rechazada', category_id: 'c1' })).toMatch(/rechazó/);
    expect(motivoDeRechazo(gasto, comida, { estado: 'rechazada', category_id: 'c2' })).toBeNull();
  });
  it('nombre del movimiento: el comercio, o la descripción sin la tarjeta', () => {
    expect(nombreMovimiento('MERCADONA', 'COMPRA TARJ ****1234')).toBe('MERCADONA');
    expect(nombreMovimiento('****1234', 'COMPRA BAR PEPE ****1234')).toBe('COMPRA BAR PEPE');
    expect(nombreMovimiento(null, null)).toBe('Movimiento bancario');
  });
});
