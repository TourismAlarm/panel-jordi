import Link from "next/link";
import { supabaseServidor } from "@/lib/supabase/server";
import { salir } from "@/app/acciones";

// Provisional (paso 3): lista simple de vídeos. La pantalla «Te toca» llega después.
export default async function Inicio() {
  const supabase = await supabaseServidor();
  const { data: videos } = await supabase
    .from("videos")
    .select("id, titulo, siguiente_paso")
    .order("id");

  return (
    <main>
      <h1>Vídeos</h1>
      {!videos?.length && <p className="apagado">Nada pendiente.</p>}
      {videos?.map((v) => (
        <Link key={v.id} href={`/videos/${v.id}`} className="tarjeta enlace">
          <span className="codigo">{v.id}</span>
          <strong>{v.titulo}</strong>
          {v.siguiente_paso && <span className="apagado">{v.siguiente_paso}</span>}
        </Link>
      ))}
      <form action={salir}>
        <button className="secundario">Salir</button>
      </form>
    </main>
  );
}
