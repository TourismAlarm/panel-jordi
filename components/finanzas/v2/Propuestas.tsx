'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { useGlobalToast } from '@/components/finanzas/Toaster';
import { money, shortDate } from './ui';

type Propuesta = { id: string; movimiento_id: string; descripcion: string; importe: number; tipo: 'income' | 'expense'; fecha: string; categoria: string; motivo: string | null; bot: string };

const COLOR = 'var(--mod-finanzas)';
const VISIBLES = 4;

// Categorías que propone el bot para movimientos sin categoría. Aquí decides: sí, no, o todas de golpe.
// Aceptar hace lo mismo que ponerla a mano (y aprende el comercio para la próxima vez). Sin propuestas no ocupa sitio.
export function Propuestas() {
  const queryClient = useQueryClient();
  const { toast } = useGlobalToast();
  const [todas, setTodas] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const { data } = useQuery<{ items: Propuesta[] }>({
    queryKey: ['proposals'],
    queryFn: async () => {
      const res = await fetch('/api/finanzas/proposals');
      if (!res.ok) throw new Error('No se pudieron cargar las propuestas');
      return res.json();
    },
  });
  const items = data?.items ?? [];
  if (!items.length) return null;

  const decidir = async (aceptar: string[], rechazar: string[]) => {
    setOcupado(true);
    try {
      const res = await fetch('/api/finanzas/proposals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aceptar, rechazar }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(body.error || 'No se pudo guardar', 'error');
        return;
      }
      if (body.fallos?.length) toast(`No se pudo con ${body.fallos.length}: ${body.fallos[0]}`, 'error');
      else if (aceptar.length) toast(body.tambien ? `Hecho · ${body.tambien} más del mismo comercio` : aceptar.length === 1 ? 'Hecho · la próxima vez lo hago solo' : `Hecho · ${body.aceptadas} con categoría`, 'success');
      else toast('Descartada · no te la vuelvo a proponer', 'success');
    } finally {
      setOcupado(false);
      for (const k of ['proposals', 'summary', 'transactions']) queryClient.invalidateQueries({ queryKey: [k] });
    }
  };

  const vistas = todas ? items : items.slice(0, VISIBLES);
  return (
    <section aria-label="Categorías propuestas" className="flex flex-col gap-3 rounded-2xl bg-card p-4" style={{ boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${COLOR} 45%, transparent)` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <h2 className="text-[15px] font-semibold" style={{ color: COLOR }}>
            {items.length === 1 ? 'Antonio propone 1 categoría' : `Antonio propone ${items.length} categorías`}
          </h2>
          <span className="text-xs text-[var(--texto-suave)]">Tú decides. Al aceptar, aprendo el comercio.</span>
        </div>
        {items.length > 1 && (
          <button disabled={ocupado} onClick={() => decidir(items.map((i) => i.id), [])} className="h-10 shrink-0 rounded-full px-4 text-sm font-semibold text-white disabled:opacity-50" style={{ background: COLOR }}>
            Aceptar todas
          </button>
        )}
      </div>

      <ul className="m-0 flex list-none flex-col p-0">
        {vistas.map((p) => (
          <li key={p.id} className="flex items-center gap-2 border-t border-[var(--borde)] py-2.5 first:border-t-0 first:pt-0">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-medium">{p.descripcion}</span>
              <span className="text-xs text-[var(--texto-suave)]">
                {shortDate(p.fecha)} · {p.tipo === 'expense' ? '-' : '+'}{money(p.importe, true)}
              </span>
              <span className="mt-0.5 inline-flex w-fit max-w-full items-center rounded-full px-2.5 py-0.5 text-[13px] font-semibold" style={{ color: COLOR, background: `color-mix(in srgb, ${COLOR} 14%, transparent)` }}>
                <span className="truncate">{p.categoria}</span>
              </span>
              {p.motivo && <span className="text-xs text-[var(--texto-suave)]">{p.motivo}</span>}
            </div>
            <button disabled={ocupado} onClick={() => decidir([], [p.id])} aria-label={`No es ${p.categoria}: ${p.descripcion}`} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[var(--borde)] text-[var(--texto-suave)] disabled:opacity-50">
              <X size={20} />
            </button>
            <button disabled={ocupado} onClick={() => decidir([p.id], [])} aria-label={`Sí, es ${p.categoria}: ${p.descripcion}`} className="flex size-11 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-50" style={{ background: COLOR }}>
              <Check size={20} strokeWidth={2.6} />
            </button>
          </li>
        ))}
      </ul>

      {items.length > VISIBLES && (
        <button onClick={() => setTodas(!todas)} className="h-10 text-sm font-semibold text-[var(--texto-suave)]">
          {todas ? 'Ver menos' : `Ver las ${items.length}`}
        </button>
      )}
    </section>
  );
}
