'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { QuickAdd } from '@/components/finanzas/QuickAdd';
import { HomeScreen } from '@/components/finanzas/v2/HomeScreen';
import { MovementsScreen } from '@/components/finanzas/v2/MovementsScreen';
import { DebtsScreen } from '@/components/finanzas/v2/DebtsScreen';
import { monthLabel } from '@/components/finanzas/v2/ui';
import { useProfile } from '@/hooks/finanzas/useProfile';
import { monthOfDate, periodLabel, periodOf, todayIso } from '@/lib/finanzas/period';

type Tab = 'home' | 'movements' | 'debts';

/** Mes financiero actual: con día de cobro 26, el 26 de octubre ya es "noviembre". */
function currentMonth(startDay = 1) {
  return monthOfDate(todayIso(), startDay);
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Inicio' },
  { id: 'movements', label: 'Movimientos' },
  { id: 'debts', label: 'Deudas' },
];

const PILL = 'flex min-h-12 shrink-0 items-center rounded-full border px-5 text-base font-semibold';

export function FinanzasApp() {
  const [tab, setTab] = useState<Tab>('home');
  const { profile, isLoading: profileLoading } = useProfile();
  const startDay = profile?.financial_month_start_day ?? 1;
  const [pickedMonth, setMonth] = useState<string | null>(null);
  const month = pickedMonth ?? currentMonth(startDay);
  const [movementsFilter, setMovementsFilter] = useState<'all' | 'uncategorized'>('all');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const monthInput = useRef<HTMLInputElement>(null);

  const goto = (t: 'movements' | 'debts', filter?: string) => {
    if (t === 'movements') setMovementsFilter(filter === 'uncategorized' ? 'uncategorized' : 'all');
    setTab(t);
    window.scrollTo({ top: 0 });
  };

  const openMonthPicker = () => {
    const el = monthInput.current;
    if (!el) return;
    // showPicker no existe en todos los navegadores
    try {
      (el as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
    } catch {
      el.focus();
    }
  };

  return (
    <div className="tabular-nums">
      <div className="mx-auto max-w-xl px-4 pt-3 pb-8">
        <nav aria-label="Finanzas" className="mb-4 flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => (t.id === 'home' ? setTab('home') : t.id === 'movements' ? goto('movements') : setTab('debts'))}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`${PILL} ${tab === t.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground'}`}
            >
              {t.label}
            </button>
          ))}
          <Link href="/finanzas/ajustes" className={`${PILL} border-border bg-card text-foreground`}>
            Ajustes
          </Link>
        </nav>
        {tab !== 'debts' && (
          <div className="flex items-center justify-between mb-3">
            <div className="relative">
              <button onClick={openMonthPicker} className="flex items-center gap-1.5 py-2 text-xl font-bold" aria-label={`Mes: ${monthLabel(month)}. Cambiar mes`}>
                <span className="flex flex-col items-start leading-tight">
                  {monthLabel(month)}
                  {startDay > 1 && <span className="text-[13px] font-medium text-[var(--texto-suave)]">{periodLabel(periodOf(month, startDay))}</span>}
                </span>
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              <input
                ref={monthInput}
                type="month"
                value={month}
                max={currentMonth(startDay)}
                onChange={(e) => e.target.value && setMonth(e.target.value)}
                className="absolute inset-0 opacity-0 pointer-events-none"
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
            {month !== currentMonth(startDay) && (
              <button onClick={() => setMonth(null)} className="text-sm font-semibold text-[var(--bien)] h-11 px-2">
                Volver a hoy
              </button>
            )}
          </div>
        )}

        {profileLoading && tab !== 'debts' ? (
          <div className="flex justify-center py-16" aria-label="Cargando">
            <div className="w-8 h-8 rounded-full border-[3px] border-[var(--borde)] border-t-[var(--texto)] animate-spin" />
          </div>
        ) : null}
        {!profileLoading && tab === 'home' && <HomeScreen month={month} onGoto={goto} />}
        {!profileLoading && tab === 'movements' && (
          <MovementsScreen key={`${month}-${movementsFilter}`} month={month} initialFilter={movementsFilter} onAdd={() => setQuickAddOpen(true)} />
        )}
        {tab === 'debts' && <DebtsScreen />}
      </div>


      <QuickAdd hideFab externalOpen={quickAddOpen} onExternalClose={() => setQuickAddOpen(false)} />
    </div>
  );
}
