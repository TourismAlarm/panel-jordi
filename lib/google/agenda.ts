import "server-only";
import { sumarDias } from "@/lib/fechas";
import type { Correo, Evento } from "@/lib/hoy/senales";
import { getGoogle } from "./cliente";

// Madrid cambia entre +01:00 y +02:00: se calcula para el día pedido.
export function inicioDiaMadrid(iso: string): string {
  const mediodia = new Date(`${iso}T12:00:00Z`);
  const nombre = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Madrid", timeZoneName: "longOffset" }).formatToParts(mediodia).find((p) => p.type === "timeZoneName")?.value ?? "GMT+01:00";
  const offset = nombre.replace("GMT", "") || "+00:00";
  return `${iso}T00:00:00${offset}`;
}

type EventosGoogle = { items?: { summary?: string; location?: string; status?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } }[] };

// Eventos de hoy del calendario principal. Solo lectura.
export async function eventosDeHoy(token: string, hoy: string): Promise<Evento[]> {
  const q = new URLSearchParams({ timeMin: inicioDiaMadrid(hoy), timeMax: inicioDiaMadrid(sumarDias(hoy, 1)), singleEvents: "true", orderBy: "startTime", maxResults: "25", timeZone: "Europe/Madrid" });
  const j = await getGoogle<EventosGoogle>(token, `https://www.googleapis.com/calendar/v3/calendars/primary/events?${q}`);
  return (j.items ?? [])
    .filter((e) => e.status !== "cancelled")
    .map((e) => ({ titulo: e.summary || "(sin título)", inicio: e.start?.dateTime ?? null, fin: e.end?.dateTime ?? null, todoElDia: !e.start?.dateTime, lugar: e.location ?? null }));
}

type ListaMensajes = { messages?: { id: string }[] };
type Mensaje = { snippet?: string; internalDate?: string; payload?: { headers?: { name: string; value: string }[] } };

// Correos sin leer de los últimos 2 días en la bandeja principal (sin promociones ni redes). Solo se leen cabeceras y un extracto.
export async function correosSinLeer(token: string, maximo = 12): Promise<Correo[]> {
  const q = new URLSearchParams({ q: "in:inbox is:unread newer_than:2d -category:promotions -category:social -category:forums", maxResults: String(maximo) });
  const lista = await getGoogle<ListaMensajes>(token, `https://gmail.googleapis.com/gmail/v1/users/me/messages?${q}`);
  const out = await Promise.all(
    (lista.messages ?? []).map(async ({ id }) => {
      const m = await getGoogle<Mensaje>(token, `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`);
      const h = (n: string) => m.payload?.headers?.find((x) => x.name.toLowerCase() === n)?.value ?? "";
      return { de: h("from").replace(/<.*>/, "").replace(/["]/g, "").trim() || h("from"), asunto: h("subject") || "(sin asunto)", resumen: (m.snippet ?? "").slice(0, 200), fecha: m.internalDate ? new Date(Number(m.internalDate)).toISOString() : null } satisfies Correo;
    }),
  );
  return out;
}
