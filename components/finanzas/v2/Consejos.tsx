'use client';

import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CircleCheck, Eye, Lightbulb, type LucideIcon } from 'lucide-react';
import { useGlobalToast } from '@/components/finanzas/Toaster';

type Nivel = 'problema' | 'ojo' | 'consejo' | 'bien';
type Consejo = { id: string; nivel: Nivel; titulo: string; detalle: string; enlace: string | null; actualizado: string };

const NIVEL: Record<Nivel, { rotulo: string; color: string; icono: LucideIcon }> = {
  problema: { rotulo: 'Problema', color: 'var(--mal)', icono: AlertTriangle },
  ojo: { rotulo: 'A vigilar', color: 'var(--ojo)', icono: Eye },
  consejo: { rotulo: 'Consejo', color: 'var(--mod-finanzas)', icono: Lightbulb },
  bien: { rotulo: 'Va bien', color: 'var(--bien)', icono: CircleCheck },
};

// «Lo que ve Antonio»: lo que te diría un asesor sobre tu dinero. Problemas primero. «Visto» lo quita de aquí.
// Sin nada que decir no ocupa sitio.
export function Consejos() {
  const queryClient = useQueryClient();
  const { toast } = useGlobalToast();
  const { data } = useQuery<{ items: Consejo[] }>({
    queryKey: ['advice'],
    queryFn: async () => {
      const res = await fetch('/api/finanzas/advice');
      if (!res.ok) throw new Error('No se pudo cargar');
      return res.json();
    },
  });
  const items = data?.items ?? [];
  if (!items.length) return null;

  const visto = async (id: string) => {
    queryClient.setQueryData<{ items: Consejo[] }>(['advice'], (d) => (d ? { items: d.items.filter((c) => c.id !== id) } : d));
    const res = await fetch('/api/finanzas/advice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visto: id }) });
    if (!res.ok) toast('No se pudo guardar', 'error');
    queryClient.invalidateQueries({ queryKey: ['advice'] });
  };

  return (
    <section aria-label="Lo que ve Antonio" className="flex flex-col gap-2">
      <h2 className="text-lg font-bold">Lo que ve Antonio</h2>
      {items.map((c) => {
        const n = NIVEL[c.nivel] ?? NIVEL.consejo;
        const Icono = n.icono;
        return (
          <article key={c.id} className="flex gap-3 rounded-lg p-4" style={{ background: `color-mix(in srgb, ${n.color} 10%, var(--superficie))` }}>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full" style={{ color: n.color, background: `color-mix(in srgb, ${n.color} 18%, transparent)` }}>
              <Icono size={18} strokeWidth={2.4} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-sm font-bold uppercase tracking-wide" style={{ color: n.color }}>{n.rotulo}</span>
              <h3 className="text-base font-semibold leading-snug">{c.titulo}</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--texto)]">{c.detalle}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {c.enlace &&
                  (c.enlace.startsWith('/') ? (
                    <Link href={c.enlace} className="flex h-9 items-center rounded-full px-3.5 text-sm font-semibold text-white no-underline" style={{ background: n.color }}>Ver</Link>
                  ) : (
                    <a href={c.enlace} target="_blank" rel="noopener noreferrer" className="flex h-9 items-center rounded-full px-3.5 text-sm font-semibold text-white no-underline" style={{ background: n.color }}>Abrir</a>
                  ))}
                <button onClick={() => visto(c.id)} className="h-9 rounded-full border border-[var(--borde)] bg-card px-3.5 text-sm font-semibold">Visto</button>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
