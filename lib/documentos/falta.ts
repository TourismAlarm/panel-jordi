// «¿Qué me falta?»: documentos que suelen ir juntos y no están. Sin IA: reglas simples sobre lo que ya has archivado.
// Es una sugerencia, no una obligación legal.
export type DocResumen = { categoria: string; tipo: string | null; nombre: string };

const REGLAS: { cuando: RegExp; falta: { que: string; buscar: RegExp }[] }[] = [
  {
    cuando: /veh[ií]culo|coche|furgoneta|cami[oó]n|maquinaria|matr[ií]cula/i,
    falta: [
      { que: "Seguro del vehículo (póliza y último recibo)", buscar: /seguro|p[oó]liza/i },
      { que: "ITV", buscar: /\bitv\b|inspecci[oó]n t[eé]cnica/i },
      { que: "Permiso de circulación", buscar: /permiso de circulaci[oó]n/i },
      { que: "Ficha técnica", buscar: /ficha t[eé]cnica/i },
    ],
  },
  {
    cuando: /alquiler|hipoteca|vivienda|piso|escritura|hogar/i,
    falta: [
      { que: "Seguro del hogar", buscar: /seguro.*(hogar|vivienda)|(hogar|vivienda).*seguro/i },
      { que: "Contrato o escritura de la vivienda", buscar: /contrato|escritura/i },
      { que: "Último recibo del IBI o de la comunidad", buscar: /\bibi\b|comunidad/i },
    ],
  },
  {
    cuando: /p[oó]liza|seguro/i,
    falta: [{ que: "Último recibo pagado del seguro", buscar: /recibo/i }],
  },
  {
    cuando: /dni|pasaporte|identidad|empadron/i,
    falta: [
      { que: "DNI", buscar: /\bdni\b/i },
      { que: "Pasaporte", buscar: /pasaporte/i },
    ],
  },
  {
    cuando: /irpf|renta|impuesto|declaraci[oó]n/i,
    falta: [
      { que: "Última declaración de la renta", buscar: /renta|irpf|declaraci[oó]n/i },
      { que: "Certificado de estar al corriente con Hacienda", buscar: /corriente|hacienda|aeat/i },
    ],
  },
];

const texto = (d: DocResumen) => `${d.categoria} ${d.tipo ?? ""} ${d.nombre}`;

export function queFalta(docs: DocResumen[]): string[] {
  const todo = docs.map(texto);
  const out: string[] = [];
  for (const r of REGLAS) {
    if (!todo.some((t) => r.cuando.test(t))) continue;
    for (const f of r.falta) if (!todo.some((t) => f.buscar.test(t)) && !out.includes(f.que)) out.push(f.que);
  }
  return out;
}
