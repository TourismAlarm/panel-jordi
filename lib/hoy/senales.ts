// «Hoy»: convierte lo que pasa en cada módulo en una lista corta y ordenada por urgencia. Lógica pura (pruebas en senales.test.ts).
// Nada de IA aquí: la IA solo redacta después el resumen a partir de estas señales.
import { diasHasta } from "@/lib/fechas";

export type Nivel = "urgente" | "hoy" | "saber";
export type ModuloSenal = "agenda" | "correo" | "documentos" | "elsa" | "finanzas" | "salud" | "sistema";

export type Senal = {
  id: string;
  modulo: ModuloSenal;
  nivel: Nivel;
  titulo: string;
  detalle?: string;
  href?: string;
};

const ORDEN_NIVEL: Record<Nivel, number> = { urgente: 0, hoy: 1, saber: 2 };
const ORDEN_MODULO: Record<ModuloSenal, number> = { agenda: 0, elsa: 1, finanzas: 2, documentos: 3, salud: 4, correo: 5, sistema: 6 };

export function ordenar(senales: Senal[]): Senal[] {
  return [...senales].sort((a, b) => ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel] || ORDEN_MODULO[a.modulo] - ORDEN_MODULO[b.modulo]);
}

const eur = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const plural = (n: number, uno: string, varios = `${uno}s`) => `${n} ${n === 1 ? uno : varios}`;

// ── ELSA ─────────────────────────────────────────────────────
export type ProyectoElsa = { id: string; titulo: string | null; fecha_trabajo: string | null; pasoTuyo: string }; // solo los que te tocan

export function senalesElsa(p: { hoy: string; proyectos: ProyectoElsa[]; reglasPorDecidir: number; pcUltimoOk: string | null; ahora: number }): Senal[] {
  const s: Senal[] = [];
  for (const x of p.proyectos) {
    const dias = x.fecha_trabajo ? diasHasta(x.fecha_trabajo, p.hoy) : null;
    const nivel: Nivel = dias !== null && dias <= 0 ? "urgente" : dias !== null && dias <= 2 ? "hoy" : "saber";
    s.push({
      id: `elsa-${x.id}`,
      modulo: "elsa",
      nivel,
      titulo: x.titulo ?? x.id,
      detalle: x.pasoTuyo,
      href: `/elsa/videos/${x.id}`,
    });
  }
  if (p.reglasPorDecidir > 0) {
    s.push({ id: "elsa-reglas", modulo: "elsa", nivel: "saber", titulo: `${plural(p.reglasPorDecidir, "cosa")} que los agentes quieren aprender de ti`, detalle: "¿Sí o no?", href: "/elsa/aprendizaje" });
  }
  const horas = p.pcUltimoOk ? (p.ahora - new Date(p.pcUltimoOk).getTime()) / 3_600_000 : null;
  if (horas === null || horas > 12) {
    s.push({ id: "elsa-pc", modulo: "sistema", nivel: "hoy", titulo: "El PC no ha sincronizado ELSA", detalle: horas === null ? "Aún no hay señal suya" : `Última vez hace ${Math.round(horas)} h`, href: "/elsa" });
  }
  return s;
}

// ── Finanzas ─────────────────────────────────────────────────
export type EnlaceBanco = { banco: string; estado: string; valido_hasta: string | null; error: string | null };
export type Prestamo = { nombre: string; importe: number; dia: number };

export function senalesFinanzas(p: {
  hoy: string;
  enlaces: EnlaceBanco[];
  prestamos: Prestamo[];
  sinCategoria: number;
  restante: number | null; // saldo de la cuenta del día a día
  porDia: number | null; // lo que toca gastar por día hasta la nómina
  diasNomina: number | null;
}): Senal[] {
  const s: Senal[] = [];
  for (const e of p.enlaces) {
    const dias = e.valido_hasta ? diasHasta(e.valido_hasta.slice(0, 10), p.hoy) : null;
    if (e.estado !== "active" || (dias !== null && dias < 0)) {
      s.push({ id: `fin-banco-${e.banco}`, modulo: "finanzas", nivel: "hoy", titulo: `${e.banco}: conexión caducada`, detalle: "Hay que reconectarla para seguir viendo movimientos", href: "/finanzas/ajustes" });
    } else if (dias !== null && dias <= 7) {
      s.push({ id: `fin-banco-${e.banco}`, modulo: "finanzas", nivel: "saber", titulo: `${e.banco}: la conexión caduca en ${plural(dias, "día")}`, href: "/finanzas/ajustes" });
    } else if (e.error) {
      s.push({ id: `fin-banco-${e.banco}`, modulo: "finanzas", nivel: "saber", titulo: `${e.banco}: la última sincronización falló`, detalle: e.error.slice(0, 120), href: "/finanzas/ajustes" });
    }
  }
  const diaHoy = Number(p.hoy.slice(8, 10));
  for (const l of p.prestamos) {
    const falta = l.dia - diaHoy; // dentro del mes; si ya pasó, no se avisa (se ve en Finanzas)
    if (falta >= 0 && falta <= 3) {
      s.push({
        id: `fin-cuota-${l.nombre}`,
        modulo: "finanzas",
        nivel: falta === 0 ? "urgente" : "hoy",
        titulo: `Cuota de ${l.nombre}: ${eur(l.importe)}`,
        detalle: falta === 0 ? "Se cobra hoy" : falta === 1 ? "Se cobra mañana" : `Se cobra en ${falta} días`,
        href: "/finanzas?tab=debts",
      });
    }
  }
  if (p.sinCategoria > 0) {
    s.push({ id: "fin-sincat", modulo: "finanzas", nivel: "saber", titulo: `${plural(p.sinCategoria, "movimiento")} sin categoría`, href: "/finanzas?tab=movements" });
  }
  if (p.restante !== null && p.porDia !== null && p.diasNomina !== null) {
    s.push({
      id: "fin-ritmo",
      modulo: "finanzas",
      nivel: p.porDia < 0 ? "urgente" : "saber",
      titulo: p.porDia < 0 ? `Cuenta del día a día en negativo (${eur(p.restante)})` : `Hasta la nómina: ${eur(p.porDia)} al día`,
      detalle: `Quedan ${eur(p.restante)} y ${plural(p.diasNomina, "día")}`,
      href: "/finanzas",
    });
  }
  return s;
}

// ── Salud ────────────────────────────────────────────────────
export function senalesSalud(p: { hoy: string; ultimoDato: string | null; lineas: string[]; avisoMedico: boolean }): Senal[] {
  const s: Senal[] = [];
  if (p.avisoMedico) {
    s.push({ id: "sal-medico", modulo: "salud", nivel: "urgente", titulo: "Apuntaste algo que conviene consultar con un médico", href: "/salud" });
  }
  if (p.ultimoDato === null) return s;
  const atraso = diasHasta(p.hoy, p.ultimoDato);
  if (atraso >= 3) {
    s.push({ id: "sal-viejo", modulo: "salud", nivel: "saber", titulo: `Sin datos del reloj desde hace ${atraso} días`, href: "/salud" });
  } else if (p.lineas.length) {
    s.push({ id: "sal-resumen", modulo: "salud", nivel: "saber", titulo: p.lineas[0], detalle: p.lineas.slice(1, 3).join(" · ") || undefined, href: "/salud" });
  }
  return s;
}

// ── Documentos ───────────────────────────────────────────────
export type VencimientoDoc = { id: string; nombre: string; vencimiento: string };

// Vencido o a 7 días o menos: urgente · hasta 29 días: para hoy si es esta semana…, si no, para saber.
export function senalesDocumentos(p: { hoy: string; docs: VencimientoDoc[] }): Senal[] {
  const s: Senal[] = [];
  for (const d of p.docs) {
    const dias = diasHasta(d.vencimiento, p.hoy);
    if (dias >= 30) continue;
    const cuando = dias < -1 ? `Venció hace ${-dias} días` : dias === -1 ? "Venció ayer" : dias === 0 ? "Vence hoy" : dias === 1 ? "Vence mañana" : `Vence en ${dias} días`;
    s.push({ id: `doc-${d.id}`, modulo: "documentos", nivel: dias <= 7 ? "urgente" : "saber", titulo: d.nombre, detalle: cuando, href: `/documentos/${d.id}` });
  }
  return s;
}

// ── Bandeja ──────────────────────────────────────────────────
export function senalesBandeja(nuevos: number): Senal[] {
  return nuevos > 0 ? [{ id: "bandeja", modulo: "sistema", nivel: "hoy", titulo: `${plural(nuevos, "aviso")} nuevo${nuevos === 1 ? "" : "s"} en la bandeja`, href: "/bandeja" }] : [];
}

// ── Google (agenda y correo) ─────────────────────────────────
export type Evento = { titulo: string; inicio: string | null; fin: string | null; todoElDia: boolean; lugar: string | null };
export type Correo = { de: string; asunto: string; resumen: string; fecha: string | null };

export function senalesAgenda(eventos: Evento[], hora: (iso: string) => string): Senal[] {
  return eventos.map((e, i) => ({
    id: `agenda-${i}`,
    modulo: "agenda" as const,
    nivel: "hoy" as const,
    titulo: e.titulo,
    detalle: [e.todoElDia || !e.inicio ? "Todo el día" : hora(e.inicio), e.lugar].filter(Boolean).join(" · "),
  }));
}
