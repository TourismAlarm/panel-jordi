import { redirect } from "next/navigation";

// La lista de vídeos ahora es la portada (Proyectos). Se deja la dirección para enlaces viejos.
export default function Videos() {
  redirect("/");
}
