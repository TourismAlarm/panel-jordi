// Métricas canónicas del módulo Salud. El proceso del PC (y tú, a mano) usa estos nombres.
export type Metrica = {
  id: string;
  nombre: string;
  unidad: string;
  decimales: number;
  mejor: "alto" | "bajo" | "neutro"; // qué sentido es «mejor» (para el color del cambio)
  manual: boolean; // se puede apuntar a mano
  grupo: "sueno" | "actividad" | "cuerpo" | "animo";
};

export const METRICAS: Metrica[] = [
  { id: "sueno_horas", nombre: "Sueño", unidad: "h", decimales: 1, mejor: "alto", manual: false, grupo: "sueno" },
  { id: "sueno_puntuacion", nombre: "Calidad del sueño", unidad: "/100", decimales: 0, mejor: "alto", manual: false, grupo: "sueno" },
  { id: "pasos", nombre: "Pasos", unidad: "", decimales: 0, mejor: "alto", manual: false, grupo: "actividad" },
  { id: "minutos_activos", nombre: "Minutos activos", unidad: "min", decimales: 0, mejor: "alto", manual: false, grupo: "actividad" },
  { id: "calorias_activas", nombre: "Calorías activas", unidad: "kcal", decimales: 0, mejor: "neutro", manual: false, grupo: "actividad" },
  { id: "fc_reposo", nombre: "Pulso en reposo", unidad: "lpm", decimales: 0, mejor: "bajo", manual: false, grupo: "cuerpo" },
  { id: "hrv", nombre: "Variabilidad cardíaca", unidad: "ms", decimales: 0, mejor: "alto", manual: false, grupo: "cuerpo" },
  { id: "peso_kg", nombre: "Peso", unidad: "kg", decimales: 1, mejor: "neutro", manual: true, grupo: "cuerpo" },
  { id: "estres_medio", nombre: "Estrés", unidad: "/100", decimales: 0, mejor: "bajo", manual: false, grupo: "cuerpo" },
  { id: "body_battery", nombre: "Energía del reloj", unidad: "/100", decimales: 0, mejor: "alto", manual: false, grupo: "cuerpo" },
  { id: "animo", nombre: "Ánimo", unidad: "/5", decimales: 0, mejor: "alto", manual: true, grupo: "animo" },
  { id: "energia", nombre: "Energía", unidad: "/5", decimales: 0, mejor: "alto", manual: true, grupo: "animo" },
];

export const IDS_METRICAS = METRICAS.map((m) => m.id) as [string, ...string[]];
export const metrica = (id: string) => METRICAS.find((m) => m.id === id);

export function formatearValor(id: string, valor: number | null | undefined): string {
  if (valor === null || valor === undefined || !isFinite(valor)) return "—";
  const m = metrica(id);
  const num = new Intl.NumberFormat("es-ES", { maximumFractionDigits: m?.decimales ?? 1, minimumFractionDigits: 0 }).format(valor);
  return m?.unidad ? `${num} ${m.unidad}` : num;
}
