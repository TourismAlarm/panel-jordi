import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { Tema } from "@/components/app/Tema";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { salir } from "@/lib/acciones";
import { usuarioActual } from "@/lib/datos/sesion";
import { desconectarGoogleAccion } from "@/lib/hoy/acciones";
import { estadoGoogle, googleConfigurado } from "@/lib/google/cliente";
import { supabaseServidor } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Ajustes" };

const AVISOS_GOOGLE: Record<string, string> = {
  ok: "Google conectado.",
  cancelado: "Has cancelado la conexión con Google.",
  "estado-invalido": "La conexión caducó. Vuelve a intentarlo.",
  "sin-configurar": "Faltan las claves de Google en Vercel (ver README).",
  error: "No se pudo conectar con Google. Vuelve a intentarlo.",
};

export default async function Ajustes({ searchParams }: PageProps<"/ajustes">) {
  const { google } = await searchParams;
  const { email } = await usuarioActual();
  const { data } = await (await supabaseServidor()).auth.getClaims();
  const g = googleConfigurado() && data?.claims?.sub ? await estadoGoogle(data.claims.sub as string) : null;
  return (
    <main className="mx-auto flex max-w-[var(--ancho)] flex-col gap-6 px-4 py-6">
      <h1 className="text-3xl font-bold">Ajustes</h1>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Tema</h2>
        <Tema />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Google (agenda y correo)</h2>
        {typeof google === "string" && AVISOS_GOOGLE[google] && (
          <p role="status" className="font-semibold">{AVISOS_GOOGLE[google]}</p>
        )}
        <Card className="flex flex-col gap-3">
          <p className="text-muted-foreground">
            Solo lectura: el panel ve tus citas de hoy y los correos sin leer, pero no puede enviar, borrar ni cambiar nada.
          </p>
          {!googleConfigurado() ? (
            <p className="font-semibold">Pendiente de configurar en Vercel (ver README).</p>
          ) : g?.conectado ? (
            <>
              <p className="font-semibold">Conectado{g.correo ? ` como ${g.correo}` : ""}</p>
              <form action={desconectarGoogleAccion}>
                <Button variant="destructive" size="lg" type="submit">Desconectar Google</Button>
              </form>
            </>
          ) : (
            <Button asChild size="lg">
              <a href="/api/google/conectar">Conectar Google</a>
            </Button>
          )}
        </Card>
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
