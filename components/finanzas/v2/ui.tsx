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

// useGrouping 'always': en español los miles de cuatro cifras salen sin punto por defecto («7600 €»); aquí siempre «7.600 €».
const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' } as Intl.NumberFormatOptions);
const eur2 = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' } as Intl.NumberFormatOptions);

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

/** El color del módulo: barras, iconos y lo que propone el bot. Los estados (bien, ojo, mal) siguen con sus tonos. */
export const MOD = 'var(--mod-finanzas)';

// Mismo lenguaje que Hoy y Salud: caja con borde fino y radio del panel. «dark» es la tarjeta principal de cada pestaña.
export function Card({ children, className = '', tone = 'white' }: { children: ReactNode; className?: string; tone?: 'white' | 'amber' | 'blue' | 'dark' }) {
  const tones = {
    white: 'bg-card border border-[var(--borde)]',
    amber: 'bg-[color-mix(in_srgb,var(--ojo)_10%,var(--superficie))] border border-[color-mix(in_srgb,var(--ojo)_35%,var(--superficie))]',
    blue: 'bg-card border border-[color-mix(in_srgb,var(--mod-finanzas)_45%,var(--superficie))]',
    dark: 'bg-[var(--texto)] text-[var(--fondo)]',
  };
  return <div className={`${tones[tone]} rounded-lg p-4 ${className}`}>{children}</div>;
}

/** Título de bloque, fuera de las cajas: como «Agenda» en Hoy. */
export function Titulo({ children, extra }: { children: ReactNode; extra?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-lg font-bold">{children}</h2>
      {extra && <span className="text-sm text-[var(--texto-suave)]">{extra}</span>}
    </div>
  );
}

/** Círculo con icono o letra, tintado con un color: da identidad a una fila sin gritar. */
export function Ficha({ color, children, size = 40 }: { color: string; children: ReactNode; size?: number }) {
  return (
    <span aria-hidden="true" className="flex shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ width: size, height: size, color, background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
      {children}
    </span>
  );
}

/** Línea de estado con icono: verde si va bien, ámbar si hay que mirar. */
export function Estado({ ok, children }: { ok: boolean; children: ReactNode }) {
  const color = ok ? 'var(--bien)' : 'var(--ojo)';
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <span aria-hidden="true" className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full" style={{ color, background: `color-mix(in srgb, ${color} 18%, transparent)` }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">{ok ? <path d="M5 12l5 5L20 7" /> : <path d="M12 7v6M12 17v.5" />}</svg>
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
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
  'h-12 w-full rounded-lg border border-[var(--borde)] bg-card px-3.5 text-base text-[var(--texto)] outline-none focus:border-[var(--texto)] focus:ring-2 focus:ring-black/10';

export const primaryButton =
  'h-12 w-full rounded-full bg-[var(--texto)] text-[var(--fondo)] text-base font-semibold disabled:opacity-50 active:scale-[0.99] transition';

export function Loading() {
  return (
    <div className="flex justify-center py-16" aria-label="Cargando">
      <div className="w-8 h-8 rounded-full border-[3px] border-[var(--borde)] border-t-[var(--texto)] animate-spin" />
    </div>
  );
}

export function ErrorBox({ text }: { text: string }) {
  return <Card tone="amber"><p className="text-base font-semibold text-[var(--ojo)]">{text}</p></Card>;
}
