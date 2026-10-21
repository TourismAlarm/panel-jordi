import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from '@/lib/finanzas/sesion';
import { limpiar } from '@/lib/finanzas/db';

// GET /api/finanzas/diagnostico — para ti: dice si la clave de servicio de Vercel parece la de este proyecto.
// Nunca devuelve la clave: solo su forma (la parte central de un JWT no es secreta; el secreto es la firma).
export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const crudo = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const urlCruda = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = limpiar(crudo);
  const url = limpiar(urlCruda);
  const refUrl = url?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1] ?? null;

  const informe: Record<string, unknown> = {
    clave_presente: !!crudo,
    longitud: clave?.length ?? 0,
    espacios_o_comillas_sobrantes: !!crudo && crudo !== clave,
    url_proyecto: refUrl,
  };

  if (clave?.startsWith('sb_secret_')) informe.formato = 'sb_secret (clave secreta nueva)';
  else if (clave?.startsWith('sb_publishable_')) informe.formato = 'sb_publishable (¡es la clave PÚBLICA, no la de servicio!)';
  else if (clave?.split('.').length === 3) {
    informe.formato = 'jwt (clave antigua)';
    try {
      const payload = JSON.parse(Buffer.from(clave.split('.')[1], 'base64url').toString('utf8'));
      informe.jwt_rol = payload.role; // debe ser service_role
      informe.jwt_proyecto = payload.ref; // debe coincidir con url_proyecto
      informe.coincide_con_este_proyecto = payload.ref === refUrl;
      informe.es_service_role = payload.role === 'service_role';
    } catch {
      informe.formato = 'jwt ilegible (clave cortada o con caracteres de más)';
    }
  } else if (clave) informe.formato = 'desconocido (no parece una clave de Supabase)';

  if (clave && url) {
    const { error, status } = await createClient(url, clave, { auth: { persistSession: false } })
      .from('fin_profiles')
      .select('id', { head: true, count: 'exact' });
    informe.prueba_de_conexion = error ? { ok: false, estado_http: status, mensaje: error.message } : { ok: true };
  }
  return NextResponse.json(informe);
}
