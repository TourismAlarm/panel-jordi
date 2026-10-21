import type { Foto } from "./reunir";
import type { ResumenDia } from "./resumen-ia";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const ETIQUETA = { urgente: "Urgente", hoy: "Hoy", saber: "Para saber" } as const;

// Correo del resumen diario: texto sencillo, sin imágenes. Todo lo que viene de fuera (correos, eventos) va escapado.
export function correoDelResumen(f: Pick<Foto, "fecha" | "senales" | "eventos" | "fallos">, r: Pick<ResumenDia, "resumen" | "prioridades">, baseUrl: string) {
  const base = baseUrl.replace(/\/$/, "");
  const grupos = (["urgente", "hoy", "saber"] as const)
    .map((n) => ({ n, items: f.senales.filter((s) => s.nivel === n) }))
    .filter((g) => g.items.length);
  const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;color:#111;line-height:1.5">
<h1 style="font-size:22px;margin:0 0 8px">Tu día · ${esc(f.fecha)}</h1>
<p style="font-size:16px;margin:0 0 16px">${esc(r.resumen)}</p>
${r.prioridades.length ? `<h2 style="font-size:16px;margin:16px 0 4px">Prioridades</h2><ol style="margin:0;padding-left:20px">${r.prioridades.map((p) => `<li>${esc(p)}</li>`).join("")}</ol>` : ""}
${grupos.map((g) => `<h2 style="font-size:16px;margin:16px 0 4px">${ETIQUETA[g.n]}</h2><ul style="margin:0;padding-left:20px">${g.items.map((s) => `<li>${s.href ? `<a href="${esc(base + s.href)}" style="color:#111">${esc(s.titulo)}</a>` : esc(s.titulo)}${s.detalle ? ` <span style="color:#555">· ${esc(s.detalle)}</span>` : ""}</li>`).join("")}</ul>`).join("")}
${f.fallos.length ? `<p style="color:#a00;margin-top:16px">No se ha podido leer: ${esc(f.fallos.join(", "))}.</p>` : ""}
<p style="margin-top:24px"><a href="${esc(base)}" style="color:#111;font-weight:600">Abrir el panel</a></p>
</div>`;
  const texto = [`Tu día · ${f.fecha}`, "", r.resumen, "", ...r.prioridades.map((p, i) => `${i + 1}. ${p}`), "", `${base}`].join("\n");
  return { asunto: `Tu día · ${f.fecha}`, html, texto };
}
