import { supabaseServidor } from "@/lib/supabase/server";
import Registro from "@/app/registro";
import { salir } from "@/app/acciones";

export default async function Actividad() {
  const supabase = await supabaseServidor();
  const { data } = await supabase
    .from("ejecuciones_agentes")
    .select("id, agente, video_id, fin, resultado, resumen")
    .order("fin", { ascending: false })
    .limit(60);

  return (
    <main>
      <h1>Actividad</h1>
      <p className="apagado pequeno">Lo que han hecho los agentes, lo último arriba.</p>
      <Registro filas={data ?? []} conVideo />
      <form action={salir}>
        <button className="secundario">Salir</button>
      </form>
    </main>
  );
}
