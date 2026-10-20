'use client';

import { useGlobalToast } from '@/components/finanzas/Toaster';

import { useState } from 'react';
import { FileText, FileSpreadsheet, Database } from 'lucide-react';
import { exportTransactionsToExcel } from '@/lib/finanzas/export/exportExcel';
import { exportMonthlyReportToPDF } from '@/lib/finanzas/export/exportPDF';
import { exportFullBackup } from '@/lib/finanzas/export/exportJSON';
import { useSession } from '@/hooks/finanzas/useSession';

export function ExportManager() {
  const { data: session } = useSession();
  const { toast } = useGlobalToast();
  const [isExporting, setIsExporting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const [transactionsRes, accountsRes] = await Promise.all([
        fetch(`/api/finanzas/transactions?month=${selectedMonth}`),
        fetch('/api/finanzas/accounts')
      ]);

      const transactions = await transactionsRes.json();
      const accounts = await accountsRes.json();

      await exportTransactionsToExcel(transactions, accounts, selectedMonth);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast('Error al exportar a Excel', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/finanzas/transactions?month=${selectedMonth}`);
      const transactions = await response.json();

      await exportMonthlyReportToPDF(
        transactions,
        selectedMonth,
        session?.user?.name || session?.user?.email || 'Usuario'
      );
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast('Error al exportar a PDF', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const [transactionsRes, accountsRes, categoriesRes] = await Promise.all([
        fetch('/api/finanzas/transactions'),
        fetch('/api/finanzas/accounts'),
        fetch('/api/finanzas/categories')
      ]);

      const transactions = await transactionsRes.json();
      const accounts = await accountsRes.json();
      const categories = await categoriesRes.json();

      exportFullBackup(transactions, accounts, categories);
    } catch (error) {
      console.error('Error exporting backup:', error);
      toast('Error al exportar backup', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
        <h2 className="text-2xl font-bold text-foreground mb-6">Exportar Datos</h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Seleccionar mes
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Exportar a Excel */}
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex flex-col items-center gap-3 p-6 border-2 border-[color-mix(in_srgb,var(--bien)_40%,transparent)] rounded-xl hover:border-[color-mix(in_srgb,var(--bien)_40%,transparent)] hover:bg-[color-mix(in_srgb,var(--bien)_14%,var(--superficie))] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-16 h-16 bg-[color-mix(in_srgb,var(--bien)_14%,var(--superficie))] rounded-full flex items-center justify-center">
              <FileSpreadsheet className="text-[var(--bien)]" size={32} />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-foreground">Excel</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Exportar transacciones del mes seleccionado
              </p>
            </div>
          </button>

          {/* Exportar a PDF */}
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex flex-col items-center gap-3 p-6 border-2 border-[color-mix(in_srgb,var(--mal)_40%,transparent)] rounded-xl hover:border-[color-mix(in_srgb,var(--mal)_40%,transparent)] hover:bg-[color-mix(in_srgb,var(--mal)_12%,var(--superficie))] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-16 h-16 bg-[color-mix(in_srgb,var(--mal)_12%,var(--superficie))] rounded-full flex items-center justify-center">
              <FileText className="text-destructive" size={32} />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-foreground">PDF</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Informe mensual en PDF
              </p>
            </div>
          </button>

          {/* Backup completo JSON */}
          <button
            onClick={handleExportBackup}
            disabled={isExporting}
            className="flex flex-col items-center gap-3 p-6 border-2 border-border rounded-xl hover:border-border hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Database className="text-foreground" size={32} />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-foreground">Backup JSON</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Respaldo completo de todos los datos
              </p>
            </div>
          </button>
        </div>

        {isExporting && (
          <div className="mt-6 flex items-center justify-center gap-3 text-foreground">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-border"></div>
            <span>Exportando...</span>
          </div>
        )}
      </div>
    </div>
  );
}
