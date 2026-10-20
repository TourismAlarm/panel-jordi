import type { LucideIcon } from "lucide-react";
import { CalendarCheck, FileText, HeartPulse, Inbox, Settings, Truck, Wallet } from "lucide-react";

// ÚNICO sitio donde se registran los módulos. Para añadir uno: una entrada aquí y su carpeta en app/(panel)/<id>/.
// Las tablas de cada módulo llevan su prefijo (fin_, sal_, elsa_, doc_) con user_id y RLS.
export type Modulo = {
  id: string;
  nombre: string;
  href: string;
  icono: LucideIcon;
  descripcion: string;
  estado: "activo" | "proximamente";
  barra: boolean; // sale en la barra inferior del móvil
};

export const MODULOS: Modulo[] = [
  { id: "hoy", nombre: "Hoy", href: "/", icono: CalendarCheck, descripcion: "Lo urgente del día", estado: "proximamente", barra: true },
  { id: "finanzas", nombre: "Finanzas", href: "/finanzas", icono: Wallet, descripcion: "Gasto, presupuesto y deudas", estado: "activo", barra: true },
  { id: "salud", nombre: "Salud", href: "/salud", icono: HeartPulse, descripcion: "Tu estado de un vistazo", estado: "proximamente", barra: true },
  { id: "elsa", nombre: "ELSA", href: "/elsa", icono: Truck, descripcion: "Panel de contenido", estado: "activo", barra: true },
  { id: "documentos", nombre: "Documentos", href: "/documentos", icono: FileText, descripcion: "Archivo con vencimientos", estado: "proximamente", barra: true },
];

// Páginas del sistema (no son módulos): salen en el lateral y en la cabecera del móvil.
export const SISTEMA: Pick<Modulo, "id" | "nombre" | "href" | "icono" | "descripcion">[] = [
  { id: "bandeja", nombre: "Bandeja", href: "/bandeja", icono: Inbox, descripcion: "Avisos y preguntas" },
  { id: "ajustes", nombre: "Ajustes", href: "/ajustes", icono: Settings, descripcion: "Tema y cuenta" },
];

export function moduloActivo(ruta: string) {
  const todos = [...MODULOS, ...SISTEMA];
  return todos.find((m) => (m.href === "/" ? ruta === "/" : ruta === m.href || ruta.startsWith(`${m.href}/`)));
}
