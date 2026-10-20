// Reglas de transformación de la migración Control-Financiero → fin_* (puras, con pruebas).
import { ibanHash, ibanUltimos4 } from './banking/transform';
import { enmascararNumeros } from './seguridad';

export type Fila = Record<string, any>;

export type Contexto = {
  userId: string; // uuid del destino
  catMap: Map<string, string>; // id categoría origen → destino
  masked: { campo: string; cambios: number }[];
};

function enmascarar(ctx: Contexto, campo: string, valor: unknown) {
  if (typeof valor !== 'string') return valor ?? null;
  const r = enmascararNumeros(valor);
  if (r.cambios) ctx.masked.push({ campo, cambios: r.cambios });
  return r.texto;
}

const sin = (f: Fila, ...cols: string[]) => Object.fromEntries(Object.entries(f).filter(([k]) => !cols.includes(k)));

export function transformar(tabla: string, f: Fila, ctx: Contexto): Fila | null {
  const base = { ...sin(f, 'user_id'), user_id: ctx.userId };
  const cat = (id: string | null) => (id ? ctx.catMap.get(id) ?? id : null);
  switch (tabla) {
    case 'profiles':
      return { ...sin(f, 'id', 'user_id'), id: ctx.userId };
    case 'accounts':
      return { ...base, name: enmascarar(ctx, 'accounts.name', f.name) };
    case 'categories':
      return base;
    case 'bank_links':
      return { ...sin(base, 'iban'), iban_ultimos4: ibanUltimos4(f.iban), iban_hash: ibanHash(f.iban) };
    case 'transactions':
      return {
        ...base,
        category_id: cat(f.category_id),
        description: enmascarar(ctx, 'transactions.description', f.description),
        notes: enmascarar(ctx, 'transactions.notes', f.notes),
        counterparty: enmascarar(ctx, 'transactions.counterparty', f.counterparty),
      };
    case 'budgets':
    case 'category_rules':
    case 'recurring_rules':
      return { ...base, category_id: cat(f.category_id) };
    case 'loans':
      return { ...base, notes: enmascarar(ctx, 'loans.notes', f.notes) };
    default:
      return base;
  }
}

