// Nunca se guardan números completos de tarjeta o cuenta: solo los últimos 4 dígitos.

// IBAN (ES91 2100 0418 …) y números de 13 a 19 dígitos seguidos o en grupos (tarjetas, cuentas).
const IBAN = /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}(?:[ ]?[A-Z0-9]{1,4})?\b/g;
const NUMERO_LARGO = /\b\d(?:[ -]?\d){12,18}\b/g;

function pasa(coincidencia: string): string {
  const limpio = coincidencia.replace(/[ -]/g, '');
  return `···${limpio.slice(-4)}`;
}

/** Sustituye IBAN y números largos por «···1234». Devuelve el texto y cuántos números ha enmascarado. */
export function enmascararNumeros(texto: string | null | undefined): { texto: string | null; cambios: number } {
  if (texto == null) return { texto: null, cambios: 0 };
  let cambios = 0;
  const reemplazo = (m: string) => {
    cambios++;
    return pasa(m);
  };
  // Los IBAN llevan letras; solo cuentan como IBAN si tienen la longitud mínima y dígitos suficientes.
  const sinIban = texto.replace(IBAN, (m) => (m.replace(/ /g, '').length >= 15 && (m.match(/\d/g) || []).length >= 10 ? reemplazo(m) : m));
  const resultado = sinIban.replace(NUMERO_LARGO, reemplazo);
  return { texto: resultado, cambios };
}

export function enmascarar(texto: string | null | undefined): string | null {
  return enmascararNumeros(texto).texto;
}
