// Salud: la app NO diagnostica ni receta. Si apuntas algo que puede ser serio, recomienda consultar a un médico.
export const ETIQUETAS_SINTOMA = [
  { id: "dolor_agudo", texto: "Dolor agudo", serio: true },
  { id: "mareo", texto: "Mareo", serio: true },
  { id: "dolor_pecho", texto: "Dolor en el pecho", serio: true },
  { id: "falta_aire", texto: "Falta de aire", serio: true },
  { id: "desmayo", texto: "Desmayo", serio: true },
  { id: "cansancio", texto: "Cansancio", serio: false },
  { id: "dolor_leve", texto: "Dolor leve", serio: false },
  { id: "otro", texto: "Otro", serio: false },
] as const;

export const AVISO_MEDICO =
  "Esto no es un diagnóstico. Si el dolor es fuerte o repentino, o tienes mareos, dolor en el pecho, falta de aire o un desmayo, consulta a un médico. En una urgencia, llama al 112.";

const PALABRAS =
  /\b(dolor (agudo|fuerte|intenso|punzante|repentino)|mareo|mareos|mareado|desmayo|desmayad|pecho|falta de aire|no puedo respirar|palpitaciones|visi[oó]n borrosa|hormigueo|entumecimiento)\b/i;

export type RegistroSalud = { tipo: "sintoma" | "condicion" | "nota"; etiqueta?: string | null; texto?: string | null; intensidad?: number | null };

// ¿Hay que enseñar el aviso de consultar a un médico?
export function necesitaAvisoMedico(r: RegistroSalud): boolean {
  if (r.tipo === "condicion") return true; // cualquier condición médica
  const etiqueta = ETIQUETAS_SINTOMA.find((e) => e.id === r.etiqueta);
  if (etiqueta?.serio) return true;
  if (r.etiqueta === "dolor_leve" && (r.intensidad ?? 0) >= 4) return true;
  return !!r.texto && PALABRAS.test(r.texto);
}
