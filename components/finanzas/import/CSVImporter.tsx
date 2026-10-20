'use client';

import { useGlobalToast } from '@/components/finanzas/Toaster';
import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse';
import { Upload, Check, X, Save, ChevronRight, Landmark, Tag, Hash, Calendar, DollarSign, Store, CreditCard } from 'lucide-react';
import { autoCategorize, getAllRules } from '@/lib/finanzas/categorization/autoCategorize';

interface CSVRow {
  [key: string]: string;
}

interface ColumnMapping {
  date?: string;
  description?: string;   // Concepto del banco → se usa para categorizar
  merchant?: string;      // Comercio / Detalle → descripción visible final
  amount?: string;
  category?: string;
  account?: string;
  external_id?: string;
}

interface BankTemplate {
  id: string;
  name: string;
  mapping: ColumnMapping;
}

interface UserCategory {
  id: string;
  name: string;
  type: string;
  icon?: string | null;
  color?: string | null;
}

interface UserAccount {
  id: string;
  name: string;
  type: string;
  balance?: number;
}

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  category?: string;
  account?: string;
  external_id?: string;
  isDuplicate?: boolean;
  rawRow: CSVRow;
  category_id: string | null;
  suggestedCategory: string | null;
}

const COMMON_TEMPLATES: BankTemplate[] = [
  {
    id: 'caixabank',
    name: 'CaixaBank',
    mapping: {
      date: 'Fecha',
      description: 'Concepto',
      amount: 'Importe',
      external_id: 'Referencia'
    }
  },
  {
    id: 'santander',
    name: 'Santander',
    mapping: {
      date: 'FECHA',
      description: 'CONCEPTO',
      amount: 'IMPORTE',
      external_id: 'NUM. OPERACION'
    }
  },
  {
    id: 'bbva',
    name: 'BBVA',
    mapping: {
      date: 'F.VALOR',
      description: 'CONCEPTO',
      amount: 'IMPORTE',
      external_id: 'REFERENCIA'
    }
  }
];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const toUuidOrNull = (val: string) => (val && UUID_REGEX.test(val) ? val : null);

export function CSVImporter() {
  const { toast } = useGlobalToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [csvData, setCSVData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customTemplateName, setCustomTemplateName] = useState('');
  const [savedTemplates, setSavedTemplates] = useState<BankTemplate[]>([]);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing'>('upload');
  const [_importStats, setImportStats] = useState({ total: 0, imported: 0, duplicates: 0, errors: 0 });
  const [userCategories, setUserCategories] = useState<UserCategory[]>([]);
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Cargar cuentas al subir el archivo para tenerlas disponibles en el mapeo
    fetch('/api/finanzas/accounts').then(r => r.json()).then((data) => {
      const accounts: UserAccount[] = Array.isArray(data) ? data : [];
      setUserAccounts(accounts);
      if (accounts.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accounts[0]!.id);
      }
    });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVRow[];
        setCSVData(data);
        setHeaders(Object.keys(data[0] || {}));
        setStep('mapping');
        autoDetectColumns(Object.keys(data[0] || {}));
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        toast('Error al leer el archivo CSV', 'error');
      }
    });
  };

  const autoDetectColumns = (cols: string[]) => {
    const detected: ColumnMapping = {};

    cols.forEach(col => {
      const lower = col.toLowerCase();

      if (lower.includes('fecha') || lower.includes('date') || lower.includes('f.valor')) {
        detected.date = col;
      } else if (lower.includes('concepto') || lower.includes('descripcion') || lower.includes('description')) {
        detected.description = col;
      } else if (
        lower.includes('comercio') || lower.includes('detalle') ||
        lower.includes('beneficiario') || lower.includes('establecimiento') ||
        lower.includes('nombre comercio') || lower.includes('merchant')
      ) {
        detected.merchant = col;
      } else if (lower.includes('importe') || lower.includes('amount') || lower.includes('cantidad')) {
        detected.amount = col;
      } else if (lower.includes('referencia') || lower.includes('reference') || lower.includes('num') || lower.includes('id')) {
        detected.external_id = col;
      } else if (lower.includes('categoria') || lower.includes('category')) {
        detected.category = col;
      } else if (lower.includes('cuenta') || lower.includes('account')) {
        detected.account = col;
      }
    });

    setMapping(detected);
  };

  const applyTemplate = (templateId: string) => {
    const template = [...COMMON_TEMPLATES, ...savedTemplates].find(t => t.id === templateId);
    if (template) {
      setMapping(template.mapping);
      setSelectedTemplate(templateId);
    }
  };

  const saveCustomTemplate = () => {
    if (!customTemplateName.trim()) {
      toast('Por favor ingresa un nombre para la plantilla', 'warning');
      return;
    }

    const newTemplate: BankTemplate = {
      id: `custom_${Date.now()}`,
      name: customTemplateName,
      mapping: { ...mapping }
    };

    const updated = [...savedTemplates, newTemplate];
    setSavedTemplates(updated);
    localStorage.setItem('csvTemplates', JSON.stringify(updated));
    setCustomTemplateName('');
    toast('Plantilla guardada correctamente', 'success');
  };

  const parseAmount = (value: string): number => {
    let cleaned = value.replace(/[€$£\s]/g, '');

    if (cleaned.includes(',') && cleaned.includes('.')) {
      if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else {
        cleaned = cleaned.replace(/,/g, '');
      }
    } else if (cleaned.includes(',')) {
      cleaned = cleaned.replace(',', '.');
    }

    return parseFloat(cleaned) || 0;
  };

  const parseDate = (value: string): string => {
    const v = value?.trim();
    if (!v) return new Date().toISOString().substring(0, 10);

    // dd/mm/yyyy or d/m/yyyy
    const dmy = v.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (dmy) {
      const day = dmy[1]!.padStart(2, '0');
      const month = dmy[2]!.padStart(2, '0');
      return `${dmy[3]!}-${month}-${day}`;
    }

    // dd/mm/yy (2-digit year)
    const dmy2 = v.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/);
    if (dmy2) {
      const day = dmy2[1]!.padStart(2, '0');
      const month = dmy2[2]!.padStart(2, '0');
      const year = parseInt(dmy2[3]!) < 50 ? `20${dmy2[3]!}` : `19${dmy2[3]!}`;
      return `${year}-${month}-${day}`;
    }

    // dd/mm (no year → infer year)
    const dm = v.match(/^(\d{1,2})[\/\-\.](\d{1,2})$/);
    if (dm) {
      const day = dm[1]!.padStart(2, '0');
      const month = dm[2]!.padStart(2, '0');
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // 1-12
      const txMonth = parseInt(month);
      // Si la transacción es de un mes futuro respecto al mes actual, pertenece al año anterior
      // Ej: importando en enero/feb/mar 2026 y el mes es diciembre → 2025
      const year = txMonth > currentMonth ? currentYear - 1 : currentYear;
      return `${year}-${month}-${day}`;
    }

    // yyyy-mm-dd or yyyy/mm/dd
    const ymd = v.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
    if (ymd) {
      const month = ymd[2]!.padStart(2, '0');
      const day = ymd[3]!.padStart(2, '0');
      return `${ymd[1]!}-${month}-${day}`;
    }

    // Try native Date parsing as last resort
    const parsed = new Date(v);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().substring(0, 10);
    }

    return new Date().toISOString().substring(0, 10);
  };

  // Encuentra el UUID de la categoría del usuario por nombre (case-insensitive)
  const findCategoryId = (categories: UserCategory[], name: string | null): string | null => {
    if (!name) return null;
    const match = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
    return match?.id ?? null;
  };

  const previewTransactions = async () => {
    if (!mapping.date || !mapping.description || !mapping.amount) {
      toast('Por favor mapea al menos Fecha, Descripción e Importe', 'warning');
      return;
    }
    if (!selectedAccountId) {
      toast('Por favor selecciona una cuenta destino antes de continuar', 'warning');
      return;
    }

    // Cargar categorías y transacciones existentes en paralelo
    const [catResponse, txResponse] = await Promise.all([
      fetch('/api/finanzas/categories'),
      fetch('/api/finanzas/transactions'),
    ]);

    const catData = await catResponse.json();
    const categories: UserCategory[] = Array.isArray(catData) ? catData : [];
    setUserCategories(categories);

    const existingData = await txResponse.json();
    const existingTransactions = Array.isArray(existingData) ? existingData : [];
    const existingIds = new Set(existingTransactions.map((t: any) => t.external_id).filter(Boolean));

    const rules = getAllRules();

    const parsed: ParsedTransaction[] = csvData.map(row => {
      const externalId = mapping.external_id ? row[mapping.external_id] : undefined;
      const concepto = (mapping.description ? row[mapping.description] : '') || '';
      const merchant = (mapping.merchant ? row[mapping.merchant] : '') || '';
      const amount = mapping.amount ? parseAmount(row[mapping.amount] || '') : 0;

      // Categorizar con concepto + comercio concatenados para máxima cobertura
      const textForCategorization = [concepto, merchant].filter(Boolean).join(' ');
      const suggestedCategoryName = autoCategorize(textForCategorization, rules);

      // Descripción visible: usar comercio/detalle si está disponible, si no el concepto
      const description = merchant || concepto;

      // Si el CSV ya trae una categoría mapeada y es UUID, usarla; si no, buscar por nombre sugerido
      const csvCategoryRaw = (mapping.category ? row[mapping.category] : '') || '';
      const csvCategoryId = toUuidOrNull(csvCategoryRaw);
      const category_id = csvCategoryId ?? findCategoryId(categories, suggestedCategoryName);

      return {
        date: mapping.date ? parseDate(row[mapping.date] || '') : '',
        description,
        amount,
        category: csvCategoryRaw,
        account: (mapping.account ? row[mapping.account] : '') || '',
        external_id: externalId || '',
        isDuplicate: externalId ? existingIds.has(externalId) : false,
        rawRow: row,
        category_id,
        suggestedCategory: suggestedCategoryName,
      };
    });

    setParsedTransactions(parsed);
    setStep('preview');
  };

  const updateTransactionCategory = (index: number, category_id: string | null) => {
    setParsedTransactions(prev =>
      prev.map((t, i) => i === index ? { ...t, category_id } : t)
    );
  };

  const updateTransactionDate = (index: number, date: string) => {
    setParsedTransactions(prev =>
      prev.map((t, i) => i === index ? { ...t, date } : t)
    );
  };

  const importTransactions = async () => {
    setStep('importing');
    let imported = 0;
    let duplicates = 0;
    let errors = 0;

    for (const transaction of parsedTransactions) {
      if (transaction.isDuplicate) {
        duplicates++;
        continue;
      }

      const absAmount = Math.abs(transaction.amount);
      if (!absAmount || isNaN(absAmount)) {
        errors++;
        continue;
      }

      try {
        const response = await fetch('/api/finanzas/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: transaction.date || new Date().toISOString().substring(0, 10),
            description: transaction.description || 'Sin descripción',
            amount: absAmount,
            type: transaction.amount >= 0 ? 'income' : 'expense',
            category_id: transaction.category_id,
            account_id: selectedAccountId ?? toUuidOrNull(transaction.account ?? ''),
            external_id: transaction.external_id || null,
          })
        });

        if (response.ok) {
          imported++;
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error importing transaction:', errorData);
          errors++;
        }
      } catch (error) {
        console.error('Error importing transaction:', error);
        errors++;
      }
    }

    setImportStats({
      total: parsedTransactions.length,
      imported,
      duplicates,
      errors
    });

    if (imported > 0) {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    }

    toast(`Importación completada: ${imported} transacciones importadas ${duplicates} duplicados omitidos ${errors} errores`, errors > 0 && imported === 0 ? 'error' : 'success');
    resetImport();
  };

  const resetImport = () => {
    setCSVData([]);
    setHeaders([]);
    setMapping({});
    setParsedTransactions([]);
    setSelectedTemplate('');
    setUserCategories([]);
    setUserAccounts([]);
    setSelectedAccountId(null);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const newCount = parsedTransactions.filter(t => !t.isDuplicate).length;
  const dupCount  = parsedTransactions.filter(t => t.isDuplicate).length;
  const categorizedCount   = parsedTransactions.filter(t => !t.isDuplicate && t.category_id).length;
  const uncategorizedCount = parsedTransactions.filter(t => !t.isDuplicate && !t.category_id).length;

  const STEPS = ['Archivo', 'Columnas', 'Revisar'];
  const stepIndex = { upload: 0, mapping: 1, preview: 2, importing: 2 }[step];

  const FIELD_META: { key: keyof ColumnMapping; label: string; icon: React.ReactNode; required?: boolean }[] = [
    { key: 'date',        label: 'Fecha',     icon: <Calendar size={14} />,   required: true },
    { key: 'description', label: 'Concepto',  icon: <Tag size={14} />,        required: true },
    { key: 'merchant',    label: 'Comercio',  icon: <Store size={14} /> },
    { key: 'amount',      label: 'Importe',   icon: <DollarSign size={14} />, required: true },
    { key: 'external_id', label: 'Referencia',icon: <Hash size={14} /> },
    { key: 'account',     label: 'Cuenta CSV',icon: <CreditCard size={14} /> },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* ── Header + stepper ── */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Importar CSV</h2>
          {step !== 'upload' && (
            <button onClick={resetImport} className="text-xs text-muted-foreground hover:text-muted-foreground transition-colors">
              Cancelar
            </button>
          )}
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1 last:flex-none">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                i < stepIndex  ? 'bg-[color-mix(in_srgb,var(--bien)_14%,var(--superficie))] text-[var(--bien)]' :
                i === stepIndex ? 'bg-neutral-700 text-white' :
                                  'bg-muted text-muted-foreground'
              }`}>
                {i < stepIndex ? <Check size={11} /> : <span>{i + 1}</span>}
                {s}
              </div>
              {i < STEPS.length - 1 && <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 1: Upload ── */}
      {step === 'upload' && (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" />
          <label htmlFor="csv-upload" className="flex flex-col items-center gap-4 cursor-pointer group">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-muted transition-colors">
              <Upload size={28} className="text-foreground" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground group-hover:text-foreground transition-colors">Selecciona un archivo CSV</p>
              <p className="text-sm text-muted-foreground mt-1">CaixaBank · Santander · BBVA · otros bancos</p>
            </div>
            <span className="px-5 py-2 bg-neutral-700 text-white text-sm font-medium rounded-xl hover:bg-neutral-600 transition-colors">
              Abrir archivo
            </span>
          </label>
        </div>
      )}

      {/* ── Step 2: Mapping ── */}
      {step === 'mapping' && (
        <div className="space-y-3">

          {/* Plantilla */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Plantilla de banco</p>
            <div className="flex flex-wrap gap-2">
              {[...COMMON_TEMPLATES, ...savedTemplates].map(t => (
                <button
                  key={t.id}
                  onClick={() => applyTemplate(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                    selectedTemplate === t.id
                      ? 'bg-neutral-700 text-white border-border'
                      : 'bg-card text-muted-foreground border-border hover:border-border'
                  }`}
                >
                  <Landmark size={13} />
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Columnas */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mapeo de columnas</p>
            <div className="grid grid-cols-2 gap-2">
              {FIELD_META.map(({ key, label, icon, required }) => (
                <div key={key} className="space-y-1">
                  <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    {icon} {label}{required && <span className="text-destructive">*</span>}
                  </label>
                  <select
                    value={mapping[key] || ''}
                    onChange={(e) => setMapping({ ...mapping, [key]: e.target.value })}
                    className={`w-full px-2.5 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500 ${
                      mapping[key] ? 'border-border bg-muted' : 'border-border bg-muted'
                    }`}
                  >
                    <option value="">—</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Cuenta destino */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cuenta destino <span className="text-destructive normal-case font-normal">obligatoria</span></p>
            {userAccounts.length === 0 ? (
              <p className="text-sm text-destructive">Sin cuentas. Créa una en la sección Cuentas.</p>
            ) : (
              <select
                value={selectedAccountId ?? ''}
                onChange={(e) => setSelectedAccountId(e.target.value || null)}
                className={`w-full px-3 py-2 text-sm font-medium border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-500 transition-colors ${
                  selectedAccountId ? 'border-[color-mix(in_srgb,var(--bien)_40%,transparent)] bg-[color-mix(in_srgb,var(--bien)_14%,var(--superficie))] text-[var(--bien)]' : 'border-[color-mix(in_srgb,var(--mal)_40%,transparent)] bg-[color-mix(in_srgb,var(--mal)_12%,var(--superficie))] text-destructive'
                }`}
              >
                <option value="">Selecciona una cuenta…</option>
                {userAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} · {acc.type}</option>
                ))}
              </select>
            )}
          </div>

          {/* Guardar plantilla */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={customTemplateName}
                onChange={(e) => setCustomTemplateName(e.target.value)}
                placeholder="Guardar como plantilla…"
                className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500"
              />
              <button onClick={saveCustomTemplate} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted text-muted-foreground text-sm font-medium rounded-lg transition-colors">
                <Save size={14} /> Guardar
              </button>
            </div>
          </div>

          <button
            onClick={previewTransactions}
            className="w-full py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            Continuar <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* ── Step 3: Preview ── */}
      {step === 'preview' && (
        <div className="space-y-3">

          {/* Resumen stats */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-4">
            <div className="flex gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-xl">
                <span className="text-lg font-bold text-foreground">{newCount}</span>
                <span className="text-xs text-foreground font-medium">nuevas</span>
              </div>
              {dupCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--ojo)] rounded-xl">
                  <span className="text-lg font-bold text-[var(--ojo)]">{dupCount}</span>
                  <span className="text-xs text-[var(--ojo)] font-medium">duplicadas</span>
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[color-mix(in_srgb,var(--bien)_14%,var(--superficie))] rounded-xl">
                <span className="text-lg font-bold text-[var(--bien)]">{categorizedCount}</span>
                <span className="text-xs text-[var(--bien)] font-medium">categorizadas</span>
              </div>
              {uncategorizedCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--ojo)] rounded-xl">
                  <span className="text-lg font-bold text-[var(--ojo)]">{uncategorizedCount}</span>
                  <span className="text-xs text-[var(--ojo)] font-medium">sin categoría</span>
                </div>
              )}
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="max-h-[420px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground w-6"></th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Fecha</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Descripción</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Categoría</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsedTransactions.slice(0, 50).map((tx, index) => (
                    <tr key={index} className={`transition-colors ${tx.isDuplicate ? 'opacity-40' : 'hover:bg-muted'}`}>
                      <td className="px-3 py-2">
                        {tx.isDuplicate
                          ? <X size={14} className="text-muted-foreground" />
                          : <Check size={14} className="text-[var(--bien)]" />}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {tx.isDuplicate
                          ? <span className="text-muted-foreground text-xs">{tx.date}</span>
                          : <input
                              type="date"
                              value={tx.date}
                              onChange={(e) => updateTransactionDate(index, e.target.value)}
                              className="text-xs px-1.5 py-1 border border-border rounded focus:outline-none focus:ring-1 focus:ring-neutral-500 text-muted-foreground"
                            />
                        }
                      </td>
                      <td className="px-3 py-2 text-foreground max-w-[160px] truncate font-medium" title={tx.description}>
                        {tx.description}
                      </td>
                      <td className="px-3 py-2">
                        {tx.isDuplicate ? null : (
                          <select
                            value={tx.category_id ?? ''}
                            onChange={(e) => updateTransactionCategory(index, e.target.value || null)}
                            className={`text-xs px-2 py-1 border rounded-lg w-full max-w-[140px] focus:outline-none focus:ring-1 focus:ring-neutral-500 ${
                              tx.category_id
                                ? 'border-[color-mix(in_srgb,var(--bien)_40%,transparent)] bg-[color-mix(in_srgb,var(--bien)_14%,var(--superficie))] text-[var(--bien)]'
                                : 'border-[var(--ojo)] bg-[var(--ojo)] text-[var(--ojo)]'
                            }`}
                          >
                            <option value="">Sin categoría</option>
                            {userCategories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className={`px-3 py-2 text-right font-semibold whitespace-nowrap ${tx.amount >= 0 ? 'text-[var(--bien)]' : 'text-destructive'}`}>
                        {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedTransactions.length > 50 && (
              <p className="text-xs text-muted-foreground text-center py-2 border-t border-border">
                Mostrando 50 de {parsedTransactions.length}
              </p>
            )}
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            <button onClick={() => setStep('mapping')} className="px-4 py-3 text-sm text-muted-foreground hover:bg-card hover:shadow-sm rounded-xl border border-border transition-all">
              ← Volver
            </button>
            <button
              onClick={importTransactions}
              className="flex-1 py-3 bg-[var(--bien)] hover:bg-[var(--bien)] text-white font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2"
            >
              <Check size={18} />
              Importar {newCount} transacciones
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Importing ── */}
      {step === 'importing' && (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-12 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full border-4 border-border border-t-transparent animate-spin" />
          <p className="text-muted-foreground font-medium">Importando transacciones…</p>
        </div>
      )}
    </div>
  );
}
