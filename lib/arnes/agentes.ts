// Los agentes del arnés de Antonio, en el orden en que salen en /antonio, con su chat en Grok Bot.
// Antonio va primero: las peticiones de Jordi y los fallos de sus rutinas son suyos.
export const AGENTES = [
  { id: "antonio", nombre: "Antonio", chat: null },
  { id: "guionista", nombre: "Guionista", chat: "19f8baf3-f8b2-45f3-8006-5a4e85b67439" },
  { id: "editor", nombre: "Editor", chat: "c5f8bf2b-80d7-42c1-9224-009d0b5ad127" },
  { id: "analista", nombre: "Analista", chat: "8946420f-f06f-4861-9998-1f47d7181882" },
  { id: "ideas", nombre: "Ideas", chat: "c509603a-45f3-4485-bbd6-fc1c9fe073a0" },
  { id: "dia", nombre: "Día a día", chat: "d1308275-d272-4756-bfc4-1599118a67cb" },
  { id: "salud", nombre: "Salud", chat: "51c0028f-5ba5-44d1-a549-a969fef04c00" },
  { id: "documentos", nombre: "Documentos", chat: "7f953df6-fb33-4d19-b227-3eee3c06aedf" },
  { id: "finanzas", nombre: "Finanzas", chat: "237513b2-964e-4b8b-bfe5-42c95b764647", congelado: true },
  { id: "revisor", nombre: "Revisor de código", chat: "d3c921e4-f8bd-418e-bb13-91aefc16f1af" },
] as const;

export type AgenteArnes = (typeof AGENTES)[number]["id"];
export const IDS_AGENTES = AGENTES.map((a) => a.id) as [AgenteArnes, ...AgenteArnes[]];

export function enlaceChat(agente: AgenteArnes): string | null {
  const chat = AGENTES.find((a) => a.id === agente)?.chat;
  return chat ? `grokbot://app/v1/agent?id=${chat}` : null;
}

export function nombreAgente(agente: string): string {
  return AGENTES.find((a) => a.id === agente)?.nombre ?? agente;
}

// Quién firma en el registro de Actividad (actividad_bots) → a qué agente del arnés le toca el fallo.
export const AGENTE_DE_BOT: Record<string, AgenteArnes> = {
  antonio: "antonio",
  ideas: "ideas",
  guionista: "guionista",
  editor: "editor",
  dia: "dia",
  salud: "salud",
  documentos: "documentos",
  finanzas: "finanzas",
};
