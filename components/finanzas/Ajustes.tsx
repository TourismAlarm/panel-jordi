'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/finanzas/useProfile';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/finanzas/useSession';
import { Settings, Calendar, Globe, User, Save, ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';
import { BankConnections } from '@/components/finanzas/banking/BankConnections';
import { AccountsManager } from '@/components/finanzas/finance/AccountsManager';
import { CategoriesManager } from '@/components/finanzas/finance/CategoriesManager';
import { CSVImporter } from '@/components/finanzas/import/CSVImporter';
import { ExportManager } from '@/components/finanzas/finance/ExportManager';

export function Ajustes() {
  const { data: session } = useSession();
  const router = useRouter();
  const { profile, isLoading, updateProfile, isUpdating } = useProfile();

  const [formData, setFormData] = useState({
    full_name: '',
    currency: 'EUR',
    financial_month_start_day: 1,
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [clearConfirm, setClearConfirm] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [clearMessage, setClearMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load profile data when available
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        currency: profile.currency || 'EUR',
        financial_month_start_day: profile.financial_month_start_day || 1,
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      updateProfile(formData, {
        onSuccess: () => {
          setMessage({ type: 'success', text: '✅ Configuración guardada correctamente' });
          setTimeout(() => setMessage(null), 3000);
        },
        onError: (error: Error) => {
          setMessage({ type: 'error', text: `❌ Error: ${error.message}` });
          setTimeout(() => setMessage(null), 5000);
        },
      });
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleClearData = async () => {
    if (clearConfirm !== 'BORRAR') return;

    setIsClearing(true);
    setClearMessage(null);

    try {
      const response = await fetch('/api/finanzas/admin/clear-data', { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok) {
        setClearMessage({ type: 'error', text: `❌ Error: ${data.error}` });
      } else {
        setClearMessage({ type: 'success', text: `✅ ${data.message}` });
        setClearConfirm('');
      }
    } catch {
      setClearMessage({ type: 'error', text: '❌ Error de conexión. Inténtalo de nuevo.' });
    } finally {
      setIsClearing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-border border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground ">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {/* Back Button */}
          <button
            onClick={() => router.push('/finanzas')}
            className="flex items-center gap-2 text-muted-foreground  hover:text-foreground  transition-colors mb-4 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Volver</span>
          </button>

          <div className="flex items-center gap-3 mb-2">
            <Settings className="text-foreground " size={32} />
            <h1 className="text-3xl font-bold text-foreground ">
              Configuración
            </h1>
          </div>
          <p className="text-muted-foreground ">
            Mes financiero, bancos, cuentas y categorías
          </p>
        </div>

        <BankConnections />

        {/* Success/Error Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl border-2 ${
              message.type === 'success'
                ? 'bg-[color-mix(in_srgb,var(--bien)_14%,var(--superficie))] border-[color-mix(in_srgb,var(--bien)_40%,transparent)] text-[var(--bien)]   '
                : 'bg-[color-mix(in_srgb,var(--mal)_12%,var(--superficie))] border-[color-mix(in_srgb,var(--mal)_40%,transparent)] text-destructive   '
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Section */}
          <div className="bg-card  rounded-2xl shadow-lg p-6 border-2 border-border ">
            <div className="flex items-center gap-3 mb-6">
              <User className="text-muted-foreground " size={24} />
              <h2 className="text-xl font-bold text-foreground ">
                Información Personal
              </h2>
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground  mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Tu nombre"
                  className="w-full px-4 py-3 rounded-xl border-2 border-border  bg-card  text-foreground  focus:border-border focus:ring-4 focus:ring-neutral-500/20 transition-all"
                />
                <p className="text-xs text-muted-foreground  mt-1">
                  Ponlo como sale en tus transferencias (nombre y apellidos): sirve para detectar los traspasos entre tus cuentas.
                </p>
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground  mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={session?.user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border-2 border-border  bg-muted  text-muted-foreground  cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground  mt-1">
                  El email no se puede cambiar
                </p>
              </div>
            </div>
          </div>

          {/* Financial Settings Section */}
          <div className="bg-card  rounded-2xl shadow-lg p-6 border-2 border-border ">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="text-muted-foreground " size={24} />
              <h2 className="text-xl font-bold text-foreground ">
                Configuración Financiera
              </h2>
            </div>

            <div className="space-y-6">
              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground  mb-2">
                  Moneda
                </label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-border  bg-card  text-foreground  focus:border-border focus:ring-4 focus:ring-neutral-500/20 transition-all appearance-none"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="MXN">MXN ($)</option>
                  </select>
                </div>
              </div>

              {/* Financial Month Start Day */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground  mb-2">
                  Día de Inicio del Mes Financiero
                </label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={formData.financial_month_start_day}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value >= 1 && value <= 31) {
                      setFormData({ ...formData, financial_month_start_day: value });
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border  bg-card  text-foreground  focus:border-border focus:ring-4 focus:ring-neutral-500/20 transition-all"
                />
                <div className="mt-3 p-4 rounded-xl bg-muted  border-2 border-border ">
                  <p className="text-sm text-foreground  mb-2">
                    <strong>¿Qué es esto?</strong>
                  </p>
                  <p className="text-xs text-foreground  mb-2">
                    Si cobras el día {formData.financial_month_start_day} de cada mes, tus transacciones se agruparán de forma que el dinero que cobras esté en el mes correcto.
                  </p>
                  <p className="text-xs text-foreground ">
                    <strong>Ejemplo:</strong> Si cobras el 26, las transacciones del 26 Nov - 25 Dic se mostrarán como &quot;Diciembre&quot;.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Zona de Peligro */}
          <div className="bg-card  rounded-2xl shadow-lg p-6 border-2 border-[color-mix(in_srgb,var(--mal)_40%,transparent)] ">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="text-destructive " size={24} />
              <h2 className="text-xl font-bold text-destructive ">
                Zona de Peligro
              </h2>
            </div>
            <p className="text-sm text-muted-foreground  mb-6">
              Acciones irreversibles. Úsalas con precaución.
            </p>

            {/* Borrar datos de prueba */}
            <div className="border-2 border-[color-mix(in_srgb,var(--mal)_40%,transparent)]  rounded-xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <Trash2 className="text-destructive  mt-0.5 shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-foreground ">
                    Borrar todos los datos financieros
                  </h3>
                  <p className="text-sm text-muted-foreground  mt-1">
                    Elimina todas las transacciones, cuentas, presupuestos, préstamos, metas de ahorro
                    y reglas recurrentes. Las categorías del sistema se mantienen. Tu cuenta permanece intacta.
                  </p>
                </div>
              </div>

              {clearMessage && (
                <div
                  className={`mb-4 p-3 rounded-lg text-sm ${
                    clearMessage.type === 'success'
                      ? 'bg-[color-mix(in_srgb,var(--bien)_14%,var(--superficie))] border border-[color-mix(in_srgb,var(--bien)_40%,transparent)] text-[var(--bien)]   '
                      : 'bg-[color-mix(in_srgb,var(--mal)_12%,var(--superficie))] border border-[color-mix(in_srgb,var(--mal)_40%,transparent)] text-destructive   '
                  }`}
                >
                  {clearMessage.text}
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground ">
                  Escribe <span className="font-mono font-bold text-destructive ">BORRAR</span> para confirmar:
                </p>
                <input
                  type="text"
                  value={clearConfirm}
                  onChange={(e) => setClearConfirm(e.target.value)}
                  placeholder="Escribe BORRAR para confirmar"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-[color-mix(in_srgb,var(--mal)_40%,transparent)]  bg-card  text-foreground  focus:border-[color-mix(in_srgb,var(--mal)_40%,transparent)] focus:ring-4 focus:ring-destructive/20 transition-all"
                />
                <button
                  type="button"
                  onClick={handleClearData}
                  disabled={clearConfirm !== 'BORRAR' || isClearing}
                  className={`
                    flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all
                    ${clearConfirm === 'BORRAR' && !isClearing
                      ? 'bg-destructive hover:opacity-90 text-white shadow-md hover:shadow-lg'
                      : 'bg-muted  text-muted-foreground  cursor-not-allowed'
                    }
                  `}
                >
                  <Trash2 size={16} />
                  {isClearing ? 'Borrando datos...' : 'Borrar todos los datos'}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUpdating}
              className={`
                flex items-center gap-2 px-8 py-3 rounded-xl font-semibold
                transition-all duration-300 shadow-lg hover:shadow-xl
                ${isUpdating
                  ? 'bg-neutral-700 cursor-not-allowed text-white'
                  : 'bg-gradient-to-r from-neutral-700 to-neutral-600 hover:from-neutral-700 hover:to-neutral-600 text-white transform hover:scale-105'
                }
              `}
            >
              <Save size={20} />
              {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>

        {/* Herramientas que antes eran pestañas */}
        <div className="mt-6 bg-card  rounded-2xl shadow-lg border-2 border-border  divide-y divide-border ">
          {[
            { title: 'Cuentas', hint: 'Saldos y cuentas manuales (efectivo…)', node: <AccountsManager /> },
            { title: 'Categorías', hint: 'Crear, renombrar o borrar categorías', node: <CategoriesManager /> },
            { title: 'Importar CSV', hint: 'Para bancos que no se pueden conectar', node: <CSVImporter /> },
            { title: 'Exportar', hint: 'Excel, PDF o copia completa', node: <ExportManager /> },
          ].map((section) => (
            <details key={section.title} className="group">
              <summary className="flex items-center justify-between gap-3 p-5 cursor-pointer list-none">
                <span className="flex flex-col">
                  <span className="text-lg font-bold text-foreground ">{section.title}</span>
                  <span className="text-sm text-muted-foreground ">{section.hint}</span>
                </span>
                <span aria-hidden="true" className="text-muted-foreground transition-transform group-open:rotate-90">›</span>
              </summary>
              <div className="px-3 pb-5">{section.node}</div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
