import type { Metadata } from "next";
import Link from "next/link";
import { Chat } from "@/components/documentos/Chat";

export const metadata: Metadata = { title: "Preguntar a mis documentos" };
export const maxDuration = 60;

export default function Preguntar() {
  return (
    <main className="mx-auto flex max-w-[var(--ancho)] flex-col gap-4 px-4 py-5">
      <header>
        <Link href="/documentos" className="inline-flex min-h-12 items-center font-semibold underline">← Documentos</Link>
        <h1 className="text-3xl font-bold">Preguntar</h1>
      </header>
      <Chat />
    </main>
  );
}
