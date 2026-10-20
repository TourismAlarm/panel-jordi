"use client";

import Image from "next/image";
import { useActionState } from "react";
import { entrar } from "@/lib/acciones";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";

export default function Login() {
  const [estado, accion, enviando] = useActionState(entrar, null);
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image src="/icon-192.png" alt="" width={72} height={72} className="rounded-2xl" priority />
        <h1 className="text-2xl font-bold">Panel Jordi</h1>
        <p className="text-muted-foreground">Acceso privado</p>
      </div>
      <form action={accion} className="flex flex-col gap-3">
        <Input name="email" type="email" autoComplete="username" inputMode="email" placeholder="Email" aria-label="Email" required />
        <Input name="password" type="password" autoComplete="current-password" placeholder="Contraseña" aria-label="Contraseña" required />
        {estado?.error && <p role="alert" className="font-medium text-destructive">{estado.error}</p>}
        <Button size="lg" type="submit" disabled={enviando}>{enviando ? "Entrando…" : "Entrar"}</Button>
      </form>
    </main>
  );
}
