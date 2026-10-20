import { salir } from "@/lib/acciones";
import { Button } from "@/components/shadcn/button";

export const metadata = { title: "Acceso denegado" };

export default function AccesoDenegado() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4 text-center">
      <h1 className="text-2xl font-bold">Acceso denegado</h1>
      <p className="text-muted-foreground">Este panel es privado. Tu cuenta no tiene permiso.</p>
      <form action={salir}>
        <Button size="lg" variant="outline" type="submit">Salir</Button>
      </form>
    </main>
  );
}
