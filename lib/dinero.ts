// Dinero en euros, formato es-ES. Los importes se guardan como número con 2 decimales;
// para sumar muchos se pasa a céntimos enteros y se evita el error de coma flotante.
const EUR = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const EUR_ENTERO = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export function aCentimos(euros: number): number {
  return Math.round(euros * 100);
}

export function deCentimos(centimos: number): number {
  return centimos / 100;
}

export function sumarEuros(importes: number[]): number {
  return deCentimos(importes.reduce((t, i) => t + aCentimos(i), 0));
}

export function formatearEuros(euros: number, opciones: { sinDecimales?: boolean } = {}): string {
  return (opciones.sinDecimales ? EUR_ENTERO : EUR).format(euros);
}
