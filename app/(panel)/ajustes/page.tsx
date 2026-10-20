import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { Tema } from "@/components/app/Tema";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { salir } from "@/lib/acciones";
import { usuarioActual } from "@/lib/datos/sesion";

export const metadata: Metadata = { title: "Ajustes" };

export default async function Ajustes() {
  const { email } = await usuarioActual();
  return (
    <main className="mx-auto flex max-w-[var(--ancho)] flex-col gap-6 px-4 py-6">
      <h1 className="text-3xl font-bold">Ajustes</h1>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Tema</h2>
        <Tema />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Cuenta</h2>
        <Card>
          <p className="font-semibold">{email ?? "Sesión iniciada"}</p>
          <p className="text-muted-foreground">Has entrado con esta cuenta</p>
        </Card>
        <form action={salir}>
          <Button variant="destructive" size="lg" type="submit">
            <LogOut size={20} />
            Salir
          </Button>
        </form>
      </section>
    </main>
  );
}
