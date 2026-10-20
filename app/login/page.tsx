import Image from "next/image";
import { entrarConGoogle } from "@/lib/acciones";
import { Button } from "@/components/shadcn/button";

export default async function Login({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image src="/icon-192.png" alt="" width={72} height={72} className="rounded-2xl" priority />
        <h1 className="text-2xl font-bold">Panel Jordi</h1>
        <p className="text-muted-foreground">Acceso privado</p>
      </div>
      <form action={entrarConGoogle} className="flex flex-col gap-3">
        <Button size="lg" type="submit">Entrar con Google</Button>
        {error && <p role="alert" className="text-center text-sm font-medium text-destructive">No se ha podido entrar. Prueba otra vez.</p>}
      </form>
    </main>
  );
}
