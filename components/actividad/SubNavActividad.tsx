import { Segmentos } from "@/components/ui";

// Agentes (los del PC) · Bots (los de Grok Bot, en la nube).
export function SubNavActividad({ activa }: { activa: "agentes" | "bots" }) {
  return (
    <Segmentos
      opciones={[
        { href: "/elsa/actividad", texto: "Agentes", activo: activa === "agentes" },
        { href: "/elsa/actividad/bots", texto: "Bots", activo: activa === "bots" },
      ]}
    />
  );
}
