import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/finanzas/sesion';
import { supabaseAdmin } from '@/lib/finanzas/db';
import { aplicarCategoria } from '@/lib/finanzas/categorization/aplicar';
import { propuestasPendientes } from '@/lib/finanzas/propuestas';

// GET /api/finanzas/proposals — las categorías que propone el bot y esperan tu sí o tu no.
export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  return NextResponse.json({ items: await propuestasPendientes(session.user.id) });
}

const schema = z
  .object({ aceptar: z.array(z.string().uuid()).max(300).default([]), rechazar: z.array(z.string().uuid()).max(300).default([]) })
  .refine((d) => d.aceptar.length + d.rechazar.length > 0, { message: 'nada que decidir' });

// POST /api/finanzas/proposals — { aceptar: [ids], rechazar: [ids] }. Aceptar pone la categoría y aprende el comercio, igual que hacerlo a mano.
export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = session.user.id;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 });

  const pendientes = new Map((await propuestasPendientes(userId)).map((p) => [p.id, p]));
  const ahora = new Date().toISOString();
  let aceptadas = 0;
  let tambien = 0;
  const fallos: string[] = [];

  for (const id of parsed.data.aceptar) {
    const p = pendientes.get(id);
    if (!p) continue; // ya decidida, o su movimiento ya tiene categoría por una regla recién aprendida
    const r = await aplicarCategoria(userId, p.movimiento_id, p.categoria_id, { learn: true });
    if (!r.ok) {
      fallos.push(`${p.descripcion}: ${r.error}`);
      continue;
    }
    aceptadas++;
    tambien += r.alsoUpdated;
    const { error } = await supabaseAdmin.from('propuestas_categoria').update({ estado: 'aceptada', decidida_en: ahora }).eq('id', id).eq('user_id', userId);
    if (error) console.error('Finanzas · aceptar propuesta:', error.message);
  }

  const rechazar = parsed.data.rechazar.filter((id) => pendientes.has(id));
  if (rechazar.length) {
    const { error } = await supabaseAdmin.from('propuestas_categoria').update({ estado: 'rechazada', decidida_en: ahora }).in('id', rechazar).eq('user_id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, aceptadas, rechazadas: rechazar.length, tambien, fallos });
}
