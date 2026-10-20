'use client';

import type { ReactNode } from 'react';

/** Paleta del rediseño (ver lienzo "Control Financiero · rediseño"). */
export const C = {
  ground: 'var(--fondo)',
  card: 'var(--superficie)',
  ink: 'var(--texto)',
  muted: 'var(--texto-suave)',
  line: 'var(--borde)',
  track: 'var(--superficie-2)',
  green: 'var(--bien)',
  greenTint: 'color-mix(in srgb,var(--bien) 14%,var(--superficie))',
  amber: 'var(--ojo)',
  amberTint: 'color-mix(in srgb,var(--ojo) 14%,var(--superficie))',
  amberLine: 'color-mix(in srgb,var(--ojo) 40%,var(--superficie))',
  blue: 'var(--texto)',
  blueTint: 'var(--superficie-2)',
};

const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const eur2 = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 1.240 € (sin céntimos) para cifras grandes; con céntimos para movimientos. */
export function money(n: number | null | undefined, cents = false): string {
  if (n === null || n === undefined || !isFinite(n)) return '—';
  return (cents ? eur2 : eur).format(n);
}

export function shortDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const label = new Date(y, m - 1, 1).toLocaleDateString('es-ES', { month: 'long' });
  const now = new Date();
  const capital = label.charAt(0).toUpperCase() + label.slice(1);
  return y === now.getFullYear() ? capital : `${capital} ${y}`;
}

export function Card({ children, className = '', tone = 'white' }: { children: ReactNode; className?: string; tone?: 'white' | 'amber' | 'blue' | 'dark' }) {
  const tones = {
    white: 'bg-card',
    amber: 'bg-[color-mix(in_srgb,var(--ojo)_14%,var(--superficie))]',
    blue: 'bg-[var(--superficie-2)]',
    dark: 'bg-[var(--texto)] text-[var(--fondo)]',
  };
  return <div className={`${tones[tone]} rounded-2xl p-4 ${className}`}>{children}</div>;
}

export function Bar({ value, color = C.ink, track = C.track, height = 6 }: { value: number; color?: string; track?: string; height?: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="rounded-full overflow-hidden" style={{ height, background: track }} role="presentation">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Cerrar" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-[var(--fondo)] rounded-t-3xl sm:rounded-3xl p-5 pb-8 text-[var(--texto)]`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="w-11 h-11 -mr-2 flex items-center justify-center rounded-xl hover:bg-black/5">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-[var(--texto-suave)]">{label}</span>
      {children}
      {hint && <span className="text-xs text-[var(--texto-suave)]">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'h-12 w-full rounded-xl border border-[var(--borde)] bg-card px-3.5 text-base text-[var(--texto)] outline-none focus:border-[var(--texto)] focus:ring-2 focus:ring-black/10';

export const primaryButton =
  'h-12 w-full rounded-2xl bg-[var(--texto)] text-[var(--fondo)] text-base font-semibold disabled:opacity-50 active:scale-[0.99] transition';

export function Loading() {
  return (
    <div className="flex justify-center py-16" aria-label="Cargando">
      <div className="w-8 h-8 rounded-full border-[3px] border-[var(--borde)] border-t-[var(--texto)] animate-spin" />
    </div>
  );
}

export function ErrorBox({ text }: { text: string }) {
  return <Card tone="amber"><p className="text-sm text-[var(--ojo)]">{text}</p></Card>;
}
