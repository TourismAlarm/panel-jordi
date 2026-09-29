// Fechas y textos en español, siempre en hora de Madrid (el servidor de Vercel va en UTC).

const zona = "Europe/Madrid";

// «jue 2 oct» — para fechas de trabajo (columna date, sin hora).
export function dia(fechaISO: string | null) {
  if (!fechaISO) return "";
  return new Intl.DateTimeFormat("es-ES", { timeZone: zona, weekday: "short", day: "numeric", month: "short" })
    .format(new Date(`${fechaISO}T12:00:00Z`))
    .replace(".", "");
}

// «2 oct, 17:05» — para momentos exactos.
export function fecha(iso: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: zona,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// «hace 5 min», «hace 3 h» y, pasado un día, la fecha.
export function haceCuanto(iso: string | null) {
  if (!iso) return "";
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "ahora mismo";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return fecha(iso);
}

// plural(3, "pregunta") → «3 preguntas»; plural(1, "respuesta enviada", "respuestas enviadas")
export function plural(n: number, uno: string, varios = `${uno}s`) {
  return `${n} ${n === 1 ? uno : varios}`;
}

// «17:05»
export function hora(iso: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("es-ES", { timeZone: zona, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

// Día en Madrid como «2026-09-29», para agrupar.
function claveDia(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: zona }).format(d);
}

// «Hoy», «Ayer» o «lun 28 sep».
export function diaRelativo(iso: string | null) {
  if (!iso) return "Sin fecha";
  const clave = claveDia(new Date(iso));
  if (clave === claveDia(new Date())) return "Hoy";
  if (clave === claveDia(new Date(Date.now() - 864e5))) return "Ayer";
  return dia(clave);
}

// Agrupa una lista ya ordenada en bloques consecutivos con la misma etiqueta.
export function agruparPor<T>(lista: T[], etiqueta: (x: T) => string) {
  const grupos: { etiqueta: string; items: T[] }[] = [];
  for (const x of lista) {
    const e = etiqueta(x);
    const ultimo = grupos.at(-1);
    if (ultimo?.etiqueta === e) ultimo.items.push(x);
    else grupos.push({ etiqueta: e, items: [x] });
  }
  return grupos;
}

// Día de hoy en Madrid, «2026-09-29». Sirve para comparar con fecha_trabajo.
export function hoy() {
  return claveDia(new Date());
}

// Para fechas de trabajo (columna date): «Hoy», «Mañana», «Ayer» o «jue 2 oct».
export function diaCercano(fechaISO: string | null) {
  if (!fechaISO) return "Sin fecha";
  const h = hoy();
  if (fechaISO === h) return "Hoy";
  const dt = (n: number) => claveDia(new Date(Date.now() + n * 864e5));
  if (fechaISO === dt(1)) return "Mañana";
  if (fechaISO === dt(-1)) return "Ayer";
  return dia(fechaISO);
}

// «Martes 29 de septiembre»
export function hoyLargo() {
  const t = new Intl.DateTimeFormat("es-ES", { timeZone: zona, weekday: "long", day: "numeric", month: "long" })
    .format(new Date())
    .replace(",", "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}
