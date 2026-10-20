import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { Proximamente } from "@/components/app/Proximamente";

export const metadata: Metadata = { title: "Documentos" };

export default function Pagina() {
  return <Proximamente titulo="Documentos" icono={FileText} texto="Archivo de documentos con búsqueda y avisos de vencimiento." />;
}
