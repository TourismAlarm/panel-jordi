import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/finanzas/sesion';
import { authOptions } from '@/lib/finanzas/sesion';
import { ensureProfile } from '@/lib/finanzas/sesion';
import { syncAll } from '@/lib/finanzas/banking/sync';

export const maxDuration = 300;

// POST /api/banking/sync - "Sincronizar ahora" para el usuario actual
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  await ensureProfile(session);

  try {
    const results = await syncAll(session.user.id);
    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error sincronizando';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
