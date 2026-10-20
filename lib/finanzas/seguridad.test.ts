import { describe, expect, it } from 'vitest';
import { enmascarar, enmascararNumeros } from './seguridad';

describe('enmascarar números sensibles', () => {
  it('deja solo los 4 últimos dígitos de un IBAN', () => {
    expect(enmascarar('Transferencia a ES91 2100 0418 4502 0005 1332 alquiler')).toBe('Transferencia a ···1332 alquiler');
    expect(enmascarar('ES9121000418450200051332')).toBe('···1332');
  });
  it('enmascara números de tarjeta con espacios, guiones o seguidos', () => {
    expect(enmascarar('Pago tarjeta 4111 1111 1111 1111')).toBe('Pago tarjeta ···1111');
    expect(enmascarar('4111-1111-1111-1234')).toBe('···1234');
    expect(enmascarar('4111111111111234')).toBe('···1234');
  });
  it('no toca importes, fechas ni referencias cortas', () => {
    expect(enmascarar('Compra 1.234,56 EUR el 20/10/2026 ref 123456')).toBe('Compra 1.234,56 EUR el 20/10/2026 ref 123456');
    expect(enmascarar('Mercadona ****1234')).toBe('Mercadona ****1234');
  });
  it('cuenta los cambios y admite null', () => {
    expect(enmascararNumeros('a 4111111111111111 b ES9121000418450200051332').cambios).toBe(2);
    expect(enmascararNumeros(null)).toEqual({ texto: null, cambios: 0 });
  });
});
