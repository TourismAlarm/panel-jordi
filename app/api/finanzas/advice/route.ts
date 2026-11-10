import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/finanzas/sesion';
import { supabaseAdmin } from '@/lib/finanzas/db';
import { consejosActivos } from '@/lib/finanzas/consejos';

// GET /api/finanzas/advice — lo que Antonio te dice sobre tu dinero y aún no has marcado como visto.
export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  return NextResponse.json({ items: await consejosActivos(session.user.id) });
}

// POST /api/finanzas/advice — { visto: id }. Deja de salir; Antonio ve que lo has leído y no lo repite igual.
export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const parsed = z.object({ visto: z.string().uuid() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 });
  const { error } = await supabaseAdmin.from('consejos').update({ estado: 'visto' }).eq('id', parsed.data.visto).eq('user_id', session.user.id).eq('estado', 'activo');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
