export const CATEGORIAS = [
  "Seguros",
  "Contratos",
  "Vehículos y maquinaria",
  "Permisos y autorizaciones",
  "Identidad y trámites",
  "Salud",
  "Hogar",
  "Finanzas e impuestos",
  "Notas",
] as const;
export type Categoria = (typeof CATEGORIAS)[number] | "Sin clasificar";
export const TODAS_CATEGORIAS: Categoria[] = [...CATEGORIAS, "Sin clasificar"];
