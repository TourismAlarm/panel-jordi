import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/finanzas/sesion';
import { authOptions } from '@/lib/finanzas/sesion';
import { supabaseAdmin } from '@/lib/finanzas/db';
import { isEnableBankingConfigured } from '@/lib/finanzas/banking/enableBanking';

// GET /api/banking/links - Cuentas bancarias vinculadas y su estado
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('bank_links')
    .select('id, aspsp_name, aspsp_country, iban_ultimos4, account_name, valid_until, status, last_synced_at, last_error')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: true });

  if (error) {
    // Migración 011 sin aplicar todavía
    return NextResponse.json({ configured: isEnableBankingConfigured(), migrated: false, links: [] });
  }

  return NextResponse.json({
    configured: isEnableBankingConfigured(),
    migrated: true,
    links: (data || []).map((l) => ({
      ...l,
      iban_ultimos4: undefined,
      // Solo los 4 últimos dígitos (nunca se guarda el IBAN completo)
      iban: l.iban_ultimos4 ? `···${l.iban_ultimos4}` : null,
    })),
  });
}
