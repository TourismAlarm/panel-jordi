import Link from "next/link";
import { supabaseServidor } from "@/lib/supabase/server";
import { CERRADOS, dia, estadoCorto, fecha, haceCuanto, resultadoClase } from "@/lib/formato";

const AGENTES = ["guionista", "archivador", "observador", "montador", "sync"];

// Portada: cifras de un vistazo, lo que te toca, próximos trabajos y cómo van los agentes.
export default async function Inicio() {
  const supabase = await supabaseServidor();
  const hace7 = new Date(Date.now() - 7 * 864e5).toISOString();
  const [{ data: preguntas }, { data: videos }, { count: enviadas }, { data: registro }] = await Promise.all([
    supabase
      .from("preguntas")
      .select("id, texto, video_id")
      .is("respondida_en", null)
      .order("video_id")
      .order("orden"),
    supabase
      .from("videos")
      .select("id, titulo, estado, por_revisar, fecha_trabajo, actualizado_en")
      .order("fecha_trabajo", { ascending: true, nullsFirst: false }),
    supabase
      .from("preguntas")
      .select("id", { count: "exact", head: true })
      .not("respondida_en", "is", null)
      .is("recogida_en", null),
    supabase
      .from("ejecuciones_agentes")
      .select("agente, fin, resultado")
      .gte("fin", hace7)
      .order("fin", { ascending: false }),
  ]);

  const todos = videos ?? [];
  const titulo = new Map(todos.map((v) => [v.id, v.titulo]));
  const revisar = todos.filter((v) => v.por_revisar);
  const enMarcha = todos.filter((v) => !CERRADOS.test(v.estado));
  const fallos = (registro ?? []).filter((r) => resultadoClase(r.resultado) === "r-mal").length;
  const ultimoSync = todos.reduce<string | null>((m, v) => (!m || v.actualizado_en > m ? v.actualizado_en : m), null);

  const grupos = new Map<string, string[]>();
  for (const p of preguntas ?? []) grupos.set(p.video_id, [...(grupos.get(p.video_id) ?? []), p.texto]);

  const ultimoPorAgente = new Map<string, { fin: string | null; resultado: string | null }>();
  for (const r of registro ?? []) if (!ultimoPorAgente.has(r.agente)) ultimoPorAgente.set(r.agente, r);

  const cifras = [
    { n: preguntas?.length ?? 0, t: "Preguntas", href: "#te-toca", mal: "ojo" },
    { n: revisar.length, t: "Por revisar", href: "#te-toca", mal: "ojo" },
    { n: enMarcha.length, t: "En marcha", href: "/videos", mal: "info" },
    { n: fallos, t: "Fallos 7 días", href: "/actividad", mal: "mal" },
  ];

  return (
    <main>
      <header className="cabecera">
        <h1>Panel ELSA</h1>
        <span className="apagado pequeno">Datos del PC {haceCuanto(ultimoSync)}</span>
      </header>

      <div className="cifras">
        {cifras.map((c) => (
          <Link key={c.t} href={c.href} className={`cifra ${c.n ? c.mal : "bien"}`}>
            <b>{c.n}</b>
            <span>{c.t}</span>
          </Link>
        ))}
      </div>

      {!!enviadas && (
        <p className="aviso">
          {enviadas} respuesta{enviadas > 1 ? "s" : ""} enviada{enviadas > 1 ? "s" : ""}. El PC la
          {enviadas > 1 ? "s" : ""} recoge en menos de 15 min.
        </p>
      )}

      <h2 id="te-toca">Te toca</h2>
      {!grupos.size && !revisar.length && (
        <div className="tarjeta vacio">
          <strong>Nada pendiente ✓</strong>
          <span className="apagado">El sistema sigue solo.</span>
        </div>
      )}
      {revisar.map((v) => (
        <Link key={`r-${v.id}`} href={`/videos/${v.id}`} className="tarjeta enlace destacado">
          <span className="fila">
            <span className="codigo">{v.id}</span>
            <span className="chip ojo"><i />Revisar montaje</span>
          </span>
          <strong>{v.titulo}</strong>
          <span className="apagado pequeno">Mira el correo «montaje listo» y contesta en el hilo.</span>
        </Link>
      ))}
      {[...grupos].map(([vid, textos]) => (
        <Link key={`p-${vid}`} href={`/videos/${vid}`} className="tarjeta enlace">
          <span className="fila">
            <span className="codigo">{vid}</span>
            <span className="chip ojo">
              <i />
              {textos.length} pregunta{textos.length > 1 ? "s" : ""}
            </span>
          </span>
          <strong>{titulo.get(vid) ?? vid}</strong>
          <span className="apagado pequeno recorte">{textos[0]}</span>
          <span className="cta">Contestar →</span>
        </Link>
      ))}

      <h2>Trabajos</h2>
      <div className="tarjeta lista">
        {enMarcha.map((v) => {
          const e = estadoCorto(v.estado);
          return (
            <Link key={v.id} href={`/videos/${v.id}`} className="linea">
              <span className="linea-fecha">{dia(v.fecha_trabajo)}</span>
              <span className="linea-texto">
                <strong>{v.titulo}</strong>
                <span className={`chip ${e.tono}`}>
                  <i />
                  {e.texto}
                </span>
              </span>
            </Link>
          );
        })}
      </div>

      <h2>Agentes</h2>
      <div className="tarjeta lista">
        {AGENTES.map((a) => {
          const u = ultimoPorAgente.get(a);
          return (
            <div key={a} className="linea agente">
              <span className={`punto ${u ? resultadoClase(u.resultado) : ""}`} aria-hidden />
              <strong>{a}</strong>
              <span className="apagado pequeno derecha">{u ? fecha(u.fin) : "sin actividad 7 d"}</span>
            </div>
          );
        })}
        <Link href="/actividad" className="cta pequeno">Ver toda la actividad →</Link>
      </div>
    </main>
  );
}
