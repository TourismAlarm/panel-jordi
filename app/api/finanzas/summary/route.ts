import { NextRequest, NextResponse } from 'next/server';
import { authOptions, ensureProfile, getServerSession } from '@/lib/finanzas/sesion';
import { ErrorResumen, resumenInicio } from '@/lib/finanzas/resumen-inicio';

// GET /api/summary?month=YYYY-MM — todo lo que necesita la pantalla de Inicio.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  await ensureProfile(session);
  try {
    return NextResponse.json(await resumenInicio(session.user.id, new URL(request.url).searchParams.get('month')));
  } catch (e) {
    if (e instanceof ErrorResumen) return NextResponse.json({ error: e.message }, { status: 500 });
    throw e;
  }
}
