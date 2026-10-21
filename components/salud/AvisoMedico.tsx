import { Stethoscope } from "lucide-react";
import { AVISO_MEDICO } from "@/lib/salud/seguridad";

export function AvisoMedico({ className = "" }: { className?: string }) {
  return (
    <div role="alert" className={`flex gap-3 rounded-lg border-2 border-foreground bg-card p-4 ${className}`}>
      <Stethoscope size={28} className="mt-0.5 shrink-0" />
      <div>
        <p className="text-lg font-bold">Consulta a un médico</p>
        <p>{AVISO_MEDICO}</p>
      </div>
    </div>
  );
}
