/**
 * Migración de datos: Control-Financiero (origen) → Panel-jordi (destino, tablas fin_*).
 *
 *   npx tsx scripts/finanzas/migrar.ts backup                      # 1. copia completa del origen a backups/ (solo lectura)
 *   npx tsx scripts/finanzas/migrar.ts dry-run                     # 2. cuenta y comprueba, NO escribe nada
 *   npx tsx scripts/finanzas/migrar.ts ejecutar --confirmo         # 3. escribe en el destino (idempotente)
 *   npx tsx scripts/finanzas/migrar.ts comparar                    # 4. filas e importes por cuenta y mes, origen vs destino
 *
 * Variables (en .env.local o en el entorno):
 *   ORIGEN_SUPABASE_URL, ORIGEN_SUPABASE_SERVICE_ROLE_KEY   proyecto de Control-Financiero (solo se LEE)
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY     proyecto Panel-jordi
 *   IBAN_HASH_SECRET                                        la misma que en Vercel (huella de los IBAN)
 *   ORIGEN_USER_ID  (opcional)  id de Google del perfil a migrar; obligatorio si el origen tiene más de un perfil
 *
 * Reglas: se conservan los id originales (reejecutar no duplica); nunca se escribe un IBAN o tarjeta completos
 * (bank_links.iban → últimos 4 + huella; textos → «···1234»); no se toca el origen.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { type Contexto, type Fila, transformar } from '../../lib/finanzas/migracion';

try {
  process.loadEnvFile('.env.local');
} catch {}

const [modo = '', ...banderas] = process.argv.slice(2);

function requerida(nombre: string): string {
  const v = process.env[nombre];
  if (!v) {
    console.error(`Falta la variable ${nombre}.`);
    process.exit(1);
  }
  return v;
}

const sinSesion = { auth: { persistSession: false, autoRefreshToken: false } };
const origen = () => createClient(requerida('ORIGEN_SUPABASE_URL'), requerida('ORIGEN_SUPABASE_SERVICE_ROLE_KEY'), sinSesion);
const destino = () => createClient(requerida('NEXT_PUBLIC_SUPABASE_URL'), requerida('SUPABASE_SERVICE_ROLE_KEY'), sinSesion);

// Orden de dependencias. «filtro»: columna que enlaza con el usuario en el origen.
const TABLAS_ORIGEN = [
  'profiles', 'accounts', 'categories', 'recurring_rules', 'bank_links', 'loans', 'transactions',
  'loan_payments', 'budgets', 'transfers', 'savings_goals', 'dismissed_suggestions', 'category_rules',
];

async function leerTodo(db: SupabaseClient, tabla: string): Promise<Fila[]> {
  const filas: Fila[] = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await db.from(tabla).select('*').range(desde, desde + 999);
    if (error) throw new Error(`${tabla}: ${error.message}`);
    filas.push(...(data ?? []));
    if (!data || data.length < 1000) return filas;
  }
}

async function leerOrigen(db: SupabaseClient) {
  const datos: Record<string, Fila[]> = {};
  for (const t of TABLAS_ORIGEN) {
    try {
      datos[t] = await leerTodo(db, t);
    } catch (e) {
      // Una tabla opcional que no existe en el origen (migración antigua) se cuenta como vacía.
      console.warn(`  ! ${t}: no se pudo leer (${e instanceof Error ? e.message : e}); se trata como vacía`);
      datos[t] = [];
    }
  }
  return datos;
}

// ── backup ────────────────────────────────────────────────────────────────
async function backup() {
  const datos = await leerOrigen(origen());
  const carpeta = `backups/finanzas-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  mkdirSync(carpeta, { recursive: true });
  for (const [t, filas] of Object.entries(datos)) writeFileSync(`${carpeta}/${t}.json`, JSON.stringify(filas, null, 1));
  console.log(`Backup guardado en ${carpeta}/ (carpeta ignorada por git; guárdala también fuera de este equipo):`);
  for (const [t, filas] of Object.entries(datos)) console.log(`  ${t.padEnd(22)} ${filas.length}`);
}

// Columnas que existen en el destino (el origen puede traer alguna de más).
async function columnasDestino(db: SupabaseClient, tabla: string): Promise<Set<string>> {
  const { data, error } = await db.from(`fin_${tabla}`).select('*').limit(1);
  if (error) throw new Error(`fin_${tabla}: ${error.message}`);
  if (data?.length) return new Set(Object.keys(data[0]));
  return new Set(); // tabla vacía: no se puede saber → no se filtra
}

// ── dry-run / ejecutar ────────────────────────────────────────────────────
async function migrar(escribir: boolean) {
  const o = origen();
  const d = destino();
  const datos = await leerOrigen(o);

  // Perfil de origen
  const perfiles = datos.profiles;
  const idOrigen = process.env.ORIGEN_USER_ID ?? (perfiles.length === 1 ? perfiles[0].id : null);
  if (!idOrigen) {
    console.error(`El origen tiene ${perfiles.length} perfiles. Indica ORIGEN_USER_ID con el id (${perfiles.map((p) => `${p.id} ${p.email}`).join(' | ')}).`);
    process.exit(1);
  }
  const propios = (f: Fila) => (f.user_id ?? f.id) === idOrigen;
  const mios: Record<string, Fila[]> = Object.fromEntries(TABLAS_ORIGEN.map((t) => [t, datos[t].filter(propios)]));

  // Usuario destino = el único permitido
  const { data: perm, error: ePerm } = await d.from('permitidos').select('user_id');
  if (ePerm || perm?.length !== 1) throw new Error('El destino debe tener exactamente un usuario en «permitidos».');
  const ctx: Contexto = { userId: perm[0].user_id, catMap: new Map(), masked: [] };

  console.log(`${escribir ? 'EJECUTANDO' : 'DRY-RUN (no se escribe nada)'}: origen ${idOrigen} → destino ${ctx.userId}`);

  // 1. Perfil (el trigger del destino crea las categorías por defecto)
  if (escribir) {
    const { error } = await d.from('fin_profiles').upsert(transformar('profiles', mios.profiles[0], ctx)!, { onConflict: 'id' });
    if (error) throw new Error(`fin_profiles: ${error.message}`);
  }

  // 2. Categorías: si el destino ya tiene (nombre, tipo), se reutiliza su id
  const { data: catsDest } = await d.from('fin_categories').select('id, name, type').eq('user_id', ctx.userId);
  const porClave = new Map((catsDest ?? []).map((c) => [`${c.type}|${c.name}`, c.id as string]));
  const catsNuevas: Fila[] = [];
  for (const c of mios.categories) {
    const existente = porClave.get(`${c.type}|${c.name}`);
    if (existente) ctx.catMap.set(c.id, existente);
    else catsNuevas.push(transformar('categories', c, ctx)!);
  }
  if (escribir && catsNuevas.length) {
    const { error } = await d.from('fin_categories').upsert(catsNuevas, { onConflict: 'id' });
    if (error) throw new Error(`fin_categories: ${error.message}`);
  }

  // 3. Resto de tablas en orden
  const resumen: { tabla: string; origen: number; aEscribir: number }[] = [
    { tabla: 'profiles', origen: mios.profiles.length, aEscribir: 1 },
    { tabla: 'categories', origen: mios.categories.length, aEscribir: catsNuevas.length },
  ];
  for (const tabla of TABLAS_ORIGEN.filter((t) => !['profiles', 'categories'].includes(t))) {
    const filas = mios[tabla].map((f) => transformar(tabla, f, ctx)!);
    const cols = await columnasDestino(d, tabla);
    const limpias = filas.map((f) => (cols.size ? Object.fromEntries(Object.entries(f).filter(([k]) => cols.has(k))) : f));
    resumen.push({ tabla, origen: mios[tabla].length, aEscribir: limpias.length });
    if (!escribir || !limpias.length) continue;

    // transactions.refund_of apunta a otra fila de la misma tabla: primero sin el vínculo, luego se rellena
    const refunds = tabla === 'transactions' ? limpias.filter((f) => f.refund_of).map((f) => ({ id: f.id, refund_of: f.refund_of })) : [];
    const lote = tabla === 'transactions' ? limpias.map((f) => ({ ...f, refund_of: null })) : limpias;
    const clave = tabla === 'dismissed_suggestions' ? 'user_id,key' : 'id';
    for (let i = 0; i < lote.length; i += 500) {
      const { error } = await d.from(`fin_${tabla}`).upsert(lote.slice(i, i + 500), { onConflict: clave });
      if (error) throw new Error(`fin_${tabla}: ${error.message}`);
    }
    for (const r of refunds) {
      const { error } = await d.from('fin_transactions').update({ refund_of: r.refund_of }).eq('id', r.id);
      if (error) throw new Error(`fin_transactions.refund_of: ${error.message}`);
    }
  }

  console.table(resumen);
  const agrupado = new Map<string, number>();
  ctx.masked.forEach((m) => agrupado.set(m.campo, (agrupado.get(m.campo) ?? 0) + m.cambios));
  console.log(agrupado.size ? `Números largos enmascarados a «···1234»: ${JSON.stringify(Object.fromEntries(agrupado))}` : 'Ningún número largo encontrado en textos.');
  console.log(`IBAN de bank_links: ${mios.bank_links.filter((l) => l.iban).length} reducidos a últimos 4 + huella.`);
  if (!escribir) console.log('\nNo se ha escrito nada. Revisa y, si todo está bien (y con backup hecho), ejecuta: ejecutar --confirmo');
  else console.log('\nHecho. Ahora ejecuta: comparar');
}

// ── comparar ──────────────────────────────────────────────────────────────
const mes = (f: Fila) => String(f.date).slice(0, 7);
const cent = (n: unknown) => Math.round(Number(n) * 100);

async function comparar() {
  const o = origen();
  const d = destino();
  const origenTx = (await leerTodo(o, 'transactions')).filter((t) => !process.env.ORIGEN_USER_ID || t.user_id === process.env.ORIGEN_USER_ID);
  const destinoTx = await leerTodo(d, 'fin_transactions');
  const nombreCuenta = new Map<string, string>();
  for (const a of await leerTodo(o, 'accounts')) nombreCuenta.set(a.id, a.name);
  for (const a of await leerTodo(d, 'fin_accounts')) nombreCuenta.set(a.id, a.name);

  type Acc = { filas: number; ingresos: number; gastos: number };
  const agrupar = (txs: Fila[]) => {
    const m = new Map<string, Acc>();
    for (const t of txs) {
      const k = `${t.account_id ?? '(sin cuenta)'}|${mes(t)}`;
      const a = m.get(k) ?? { filas: 0, ingresos: 0, gastos: 0 };
      a.filas++;
      if (t.type === 'income') a.ingresos += cent(t.amount);
      else a.gastos += cent(t.amount);
      m.set(k, a);
    }
    return m;
  };
  const a = agrupar(origenTx);
  const b = agrupar(destinoTx);
  const claves = [...new Set([...a.keys(), ...b.keys()])].sort();
  const vacio: Acc = { filas: 0, ingresos: 0, gastos: 0 };
  const eur = (c: number) => (c / 100).toFixed(2);
  let difs = 0;
  const lineas = ['| Cuenta | Mes | Filas origen | Filas destino | Ingresos origen | Ingresos destino | Gastos origen | Gastos destino | OK |', '|---|---|---|---|---|---|---|---|---|'];
  for (const k of claves) {
    const [cuenta, m] = k.split('|');
    const x = a.get(k) ?? vacio;
    const y = b.get(k) ?? vacio;
    const ok = x.filas === y.filas && x.ingresos === y.ingresos && x.gastos === y.gastos;
    if (!ok) difs++;
    lineas.push(`| ${nombreCuenta.get(cuenta) ?? cuenta} | ${m} | ${x.filas} | ${y.filas} | ${eur(x.ingresos)} | ${eur(y.ingresos)} | ${eur(x.gastos)} | ${eur(y.gastos)} | ${ok ? '✓' : '✗'} |`);
  }
  const tot = (m: Map<string, Acc>) => [...m.values()].reduce((s, v) => ({ filas: s.filas + v.filas, ingresos: s.ingresos + v.ingresos, gastos: s.gastos + v.gastos }), { ...vacio });
  const ta = tot(a);
  const tb = tot(b);
  lineas.push(`| **TOTAL** | | ${ta.filas} | ${tb.filas} | ${eur(ta.ingresos)} | ${eur(tb.ingresos)} | ${eur(ta.gastos)} | ${eur(tb.gastos)} | ${difs === 0 ? '✓' : '✗'} |`);
  const informe = lineas.join('\n');
  console.log(informe);
  mkdirSync('backups', { recursive: true });
  writeFileSync(`backups/comparacion-${new Date().toISOString().slice(0, 10)}.md`, informe + '\n');
  console.log(difs === 0 ? '\nTodo coincide.' : `\n${difs} filas (cuenta, mes) NO coinciden: revisa antes de dar la migración por buena.`);
  process.exit(difs === 0 ? 0 : 2);
}

// ── main ──────────────────────────────────────────────────────────────────
(async () => {
  if (modo === 'backup') return backup();
  if (modo === 'dry-run') return migrar(false);
  if (modo === 'ejecutar') {
    if (!banderas.includes('--confirmo')) {
      console.error('Para escribir en el destino añade --confirmo (haz antes el backup y el dry-run).');
      process.exit(1);
    }
    return migrar(true);
  }
  if (modo === 'comparar') return comparar();
  console.error('Uso: migrar.ts backup | dry-run | ejecutar --confirmo | comparar');
  process.exit(1);
})().catch((e) => {
  console.error('ERROR:', e instanceof Error ? e.message : e);
  process.exit(1);
});
