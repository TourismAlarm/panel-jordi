import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card } from "@/components/shadcn/card";
import { ultimoInforme } from "@/lib/datos/informes";
import { formatearDiaCorto, formatearFechaHora } from "@/lib/fechas";

// Bloque «Último informe» de Finanzas y Salud. Sin informes no ocupa sitio.
export async function UltimoInforme({ bot }: { bot: "finanzas" | "salud" }) {
  const informe = await ultimoInforme(bot);
  if (!informe) return null;
  const periodo = informe.periodo_desde && informe.periodo_hasta ? `${formatearDiaCorto(informe.periodo_desde)} – ${formatearDiaCorto(informe.periodo_hasta)} · ` : "";
  return (
    <Card className="flex flex-col gap-2">
      <details>
        <summary className="cursor-pointer">
          <span className="text-sm font-semibold text-muted-foreground">Último informe</span>
          <p className="text-lg font-semibold">{informe.titulo}</p>
          <p className="text-sm text-muted-foreground">
            {periodo}
            {formatearFechaHora(informe.creado)}
          </p>
        </summary>
        <div className="prose prose-sm mt-3 max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{informe.cuerpo_md}</ReactMarkdown>
        </div>
      </details>
    </Card>
  );
}
