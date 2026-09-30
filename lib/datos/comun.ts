import "server-only";

// Si Supabase devuelve error, se lanza: lo recoge la pantalla de error con su botón «Reintentar».
// Así nunca se enseña una lista vacía que en realidad era un fallo de conexión.
export function comprobar<T>(respuesta: { data: T | null; error: { message: string } | null }, que: string): T {
  if (respuesta.error) {
    console.error(`Supabase · ${que}:`, respuesta.error.message);
    throw new Error(`No se han podido leer ${que}.`);
  }
  return respuesta.data as T;
}
