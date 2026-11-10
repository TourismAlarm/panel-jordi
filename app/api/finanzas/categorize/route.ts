import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/finanzas/sesion';
import { z } from 'zod';
import { authOptions } from '@/lib/finanzas/sesion';
import { aplicarCategoria } from '@/lib/finanzas/categorization/aplicar';

const schema = z.object({
  id: z.string().uuid(),
  category_id: z.string().uuid(),
  learn: z.boolean().default(true),
  /** Solo con "Devoluciones": el gasto que te devuelven (null = no lo sé / otro mes) */
  refund_of: z.string().uuid().nullable().optional(),
});

/**
 * POST /api/categorize — pone categoría a un movimiento y, si learn, aprende la regla:
 * los próximos movimientos del mismo comercio (y los que ya están sin categoría) se
 * categorizan solos.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = session.user.id;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 });
  const { id, category_id, learn, refund_of } = parsed.data;

  const r = await aplicarCategoria(userId, id, category_id, { learn, refund_of });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json(r);
}
