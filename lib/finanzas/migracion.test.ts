import { describe, expect, it } from 'vitest';
import { transformar, type Contexto } from './migracion';

process.env.IBAN_HASH_SECRET = 'secreto-de-prueba-0123456789';

const ctx = (): Contexto => ({ userId: 'uuid-destino', catMap: new Map([['cat-viejo', 'cat-nuevo']]), masked: [] });

describe('transformar para la migración', () => {
  it('cambia el user_id (id de Google → uuid del destino) y conserva el id de la fila', () => {
    const r = transformar('accounts', { id: 'a1', user_id: '1099999', name: 'BBVA', balance: 10 }, ctx())!;
    expect(r.user_id).toBe('uuid-destino');
    expect(r.id).toBe('a1');
  });
  it('el perfil toma como id el uuid del destino', () => {
    const r = transformar('profiles', { id: '1099999', email: 'x@y.z', full_name: 'J' }, ctx())!;
    expect(r.id).toBe('uuid-destino');
    expect(r).not.toHaveProperty('user_id');
  });
  it('bank_links: nunca pasa el IBAN completo; deja últimos 4 y huella', () => {
    const r = transformar('bank_links', { id: 'l1', user_id: 'g', iban: 'ES9121000418450200051332', session_id: 's' }, ctx())!;
    expect(r).not.toHaveProperty('iban');
    expect(r.iban_ultimos4).toBe('1332');
    expect(r.iban_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(r)).not.toContain('21000418');
  });
  it('transactions: remapea la categoría y enmascara números largos', () => {
    const c = ctx();
    const r = transformar('transactions', { id: 't1', user_id: 'g', category_id: 'cat-viejo', description: 'Tarjeta 4111 1111 1111 1111', counterparty: null, notes: null }, c)!;
    expect(r.category_id).toBe('cat-nuevo');
    expect(r.description).toBe('Tarjeta ···1111');
    expect(c.masked).toEqual([{ campo: 'transactions.description', cambios: 1 }]);
  });
  it('una categoría sin remapeo conserva su id (se creó con el id original)', () => {
    expect(transformar('budgets', { id: 'b', user_id: 'g', category_id: 'otra' }, ctx())!.category_id).toBe('otra');
  });
});
