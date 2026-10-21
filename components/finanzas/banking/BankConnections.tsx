'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Landmark, RefreshCw, Plus, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

interface BankLinkView {
  id: string;
  aspsp_name: string;
  aspsp_country: string;
  iban: string | null;
  account_name: string | null;
  valid_until: string | null;
  status: 'active' | 'expired' | 'error' | 'revoked';
  last_synced_at: string | null;
  last_error: string | null;
}

interface LinksResponse {
  configured: boolean;
  migrated: boolean;
  links: BankLinkView[];
}

interface Aspsp {
  name: string;
  country: string;
}

/** Los bancos que usas, para tenerlos a mano arriba de la lista. */
const SHORTCUTS: { label: string; match: RegExp; countries: string[] }[] = [
  { label: 'BBVA', match: /^bbva$/i, countries: ['ES'] },
  { label: 'Revolut', match: /revolut/i, countries: ['ES', 'LT'] },
  { label: 'Trade Republic', match: /trade ?republic/i, countries: ['ES', 'DE'] },
];

function daysUntil(date: string | null): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

function formatDate(date: string | null): string {
  if (!date) return 'nunca';
  return new Date(date).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function BankConnections() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [country, setCountry] = useState('ES');
  const [connecting, setConnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const { data, isLoading } = useQuery<LinksResponse>({
    queryKey: ['bank-links'],
    queryFn: async () => {
      const res = await fetch('/api/finanzas/banking/links');
      if (!res.ok) { const b = await res.json().catch(() => null); throw new Error(b?.error || 'No se pudieron cargar las cuentas'); }
      return res.json();
    },
  });

  const { data: aspsps, isLoading: loadingAspsps } = useQuery<Aspsp[]>({
    queryKey: ['aspsps', country],
    enabled: showPicker && Boolean(data?.configured),
    queryFn: async () => {
      const res = await fetch(`/api/finanzas/banking/aspsps?country=${country}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Error cargando bancos');
      return body;
    },
  });

  // Mensaje al volver del banco
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('banco');
    if (!result) return;
    if (result === 'ok') {
      setNotice({ type: 'success', text: `Banco conectado. ${params.get('nuevos') || 0} movimientos importados.` });
    } else {
      setNotice({ type: 'error', text: `No se pudo conectar: ${params.get('motivo') || 'error desconocido'}` });
    }
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  const connect = async (aspsp: Aspsp) => {
    setConnecting(aspsp.name);
    setNotice(null);
    try {
      const res = await fetch('/api/finanzas/banking/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aspsp_name: aspsp.name, aspsp_country: aspsp.country }),
      });
      const body = await res.json();
      if (!res.ok || !body.url) throw new Error(body.error || 'Error iniciando la conexión');
      window.location.href = body.url; // Al banco a autorizar
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Error' });
      setConnecting(null);
    }
  };

  const syncNow = async () => {
    setSyncing(true);
    setNotice(null);
    try {
      const res = await fetch('/api/finanzas/banking/sync', { method: 'POST' });
      const text = await res.text();
      let body: { error?: string; results?: unknown } = {};
      try {
        body = JSON.parse(text);
      } catch {
        // Respuesta no JSON (p.ej. timeout de la función): mensaje legible
        throw new Error('La sincronización tardó demasiado. Reintenta: continúa desde donde se quedó.');
      }
      if (!res.ok) throw new Error(body.error || 'Error sincronizando');
      const results = body.results as { inserted: number; status: string; bank: string }[];
      const nuevos = results.reduce((s, r) => s + r.inserted, 0);
      const problems = results.filter((r) => r.status !== 'ok').map((r) => r.bank);
      setNotice({
        type: problems.length ? 'error' : 'success',
        text: problems.length
          ? `${nuevos} movimientos nuevos. Revisa: ${problems.join(', ')}`
          : `${nuevos} movimientos nuevos.`,
      });
      queryClient.invalidateQueries({ queryKey: ['bank-links'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Error' });
    } finally {
      setSyncing(false);
    }
  };

  const shortcuts = (aspsps || []).filter((a) => SHORTCUTS.some((s) => s.match.test(a.name)));
  const others = (aspsps || []).filter((a) => !SHORTCUTS.some((s) => s.match.test(a.name)));

  return (
    <div className="bg-card  rounded-2xl shadow-lg p-6 border-2 border-border  mb-6">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <Landmark className="text-muted-foreground " size={24} />
          <h2 className="text-xl font-bold text-foreground ">Bancos conectados</h2>
        </div>
        {data?.links?.length ? (
          <button
            type="button"
            onClick={syncNow}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-muted text-foreground hover:bg-muted   disabled:opacity-50"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Sincronizando…' : 'Sincronizar ahora'}
          </button>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground  mb-4">
        Los movimientos entran solos cada mañana. Los traspasos entre tus cuentas no cuentan como gasto.
      </p>

      {notice && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            notice.type === 'success'
              ? 'bg-[color-mix(in_srgb,var(--bien)_14%,var(--superficie))] text-[var(--bien)]  '
              : 'bg-[color-mix(in_srgb,var(--mal)_12%,var(--superficie))] text-destructive  '
          }`}
        >
          {notice.text}
        </div>
      )}

      {isLoading ? (
        <Loader2 className="animate-spin text-muted-foreground" />
      ) : !data?.configured ? (
        <p className="text-sm text-[var(--ojo)] ">
          Falta configurar Enable Banking en Vercel (ENABLE_BANKING_APP_ID y ENABLE_BANKING_PRIVATE_KEY).
        </p>
      ) : !data.migrated ? (
        <p className="text-sm text-[var(--ojo)] ">
          Falta aplicar la migración <code>011_bank_sync.sql</code> en Supabase.
        </p>
      ) : (
        <>
          <ul className="space-y-2 mb-4">
            {data.links.map((link) => {
              const days = daysUntil(link.valid_until);
              const expired = link.status === 'expired' || (days !== null && days <= 0);
              const soon = !expired && days !== null && days <= 14;
              return (
                <li
                  key={link.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border "
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground  truncate">
                      {link.aspsp_name} {link.iban}
                    </p>
                    <p className="text-xs text-muted-foreground ">
                      Última sincronización: {formatDate(link.last_synced_at)}
                    </p>
                    {link.status === 'error' && link.last_error && (
                      <p className="text-xs text-destructive  truncate">{link.last_error}</p>
                    )}
                  </div>
                  {expired || soon ? (
                    <button
                      type="button"
                      onClick={() => connect({ name: link.aspsp_name, country: link.aspsp_country })}
                      disabled={connecting !== null}
                      className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--ojo)] text-[var(--ojo)] hover:bg-[var(--ojo)]"
                    >
                      <AlertTriangle size={14} />
                      {expired ? 'Reconectar' : `Renovar (${days} d)`}
                    </button>
                  ) : (
                    <span className="shrink-0 flex items-center gap-1 text-xs text-[var(--bien)] ">
                      <CheckCircle2 size={14} />
                      {days !== null ? `${days} d` : 'Activo'}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          {!showPicker ? (
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-neutral-700 text-white hover:bg-neutral-600"
            >
              <Plus size={16} /> Conectar un banco
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground ">País del banco</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-border  bg-card  text-sm"
                >
                  <option value="ES">España</option>
                  <option value="DE">Alemania</option>
                  <option value="LT">Lituania</option>
                </select>
              </div>
              {loadingAspsps ? (
                <Loader2 className="animate-spin text-muted-foreground" />
              ) : (
                <>
                  {shortcuts.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {shortcuts.map((a) => (
                        <button
                          key={a.name}
                          type="button"
                          onClick={() => connect(a)}
                          disabled={connecting !== null}
                          className="px-4 py-2 rounded-xl text-sm font-semibold bg-neutral-700 text-white hover:bg-neutral-700 disabled:opacity-50  "
                        >
                          {connecting === a.name ? 'Abriendo banco…' : a.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const a = others.find((o) => o.name === e.target.value);
                      if (a) connect(a);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-border  bg-card  text-sm"
                  >
                    <option value="" disabled>
                      Otro banco ({others.length})
                    </option>
                    {others.map((a) => (
                      <option key={a.name} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  {shortcuts.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      BBVA, Revolut y Trade Republic no aparecen en este país; prueba con otro.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
