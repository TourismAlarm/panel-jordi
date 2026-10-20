import { NextRequest, NextResponse } from 'next/server';
import { cronNoAutorizado } from '@/lib/cron-auth';
import { syncAll } from '@/lib/finanzas/banking/sync';
import { isEnableBankingConfigured } from '@/lib/finanzas/banking/enableBanking';

export const maxDuration = 300;

// GET /api/cron/finanzas-bancos - Lo llama el cron de Vercel una vez al día (sincroniza los bancos conectados).
// Vercel manda "Authorization: Bearer <CRON_SECRET>" automáticamente.
export async function GET(request: NextRequest) {
  const denegado = cronNoAutorizado(request);
  if (denegado) return denegado;
  if (!isEnableBankingConfigured()) {
    return NextResponse.json({ skipped: 'Enable Banking no configurado' });
  }

  try {
    const results = await syncAll();
    const summary = {
      cuentas: results.length,
      nuevos: results.reduce((s, r) => s + r.inserted, 0),
      caducadas: results.filter((r) => r.status === 'expired').map((r) => r.bank),
      errores: results.filter((r) => r.status === 'error').map((r) => `${r.bank}: ${r.error}`),
    };
    console.log('🏦 Sync bancos:', JSON.stringify(summary));
    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error sincronizando';
    console.error('❌ cron sync-banks:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
