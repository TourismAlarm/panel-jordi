"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { leerAhora } from "@/lib/documentos/acciones";

export function BotonLeer({ id }: { id: string }) {
  const router = useRouter();
  const [pendiente, empezar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        size="sm"
        disabled={pendiente}
        aria-busy={pendiente}
        onClick={() =>
          empezar(async () => {
            setError(null);
            const r = await leerAhora(id);
            if (r?.error) setError(r.error);
            else router.refresh();
          })
        }
      >
        <Sparkles size={18} />
        {pendiente ? "Leyendo… (puede tardar)" : "Leer ahora con IA"}
      </Button>
      {error && <p role="alert" className="font-semibold text-destructive">{error}</p>}
    </div>
  );
}
