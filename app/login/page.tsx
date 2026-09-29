"use client";

import Image from "next/image";
import { useActionState } from "react";
import { BotonEnviar, Campo, Entrada, ErrorCampo } from "@/components/ui";
import { entrar } from "@/lib/acciones";
import s from "./login.module.css";

export default function Login() {
  const [estado, accion] = useActionState(entrar, null);
  return (
    <main className={s.login}>
      <div className={s.marca}>
        <Image src="/icon-192.png" alt="" width={64} height={64} className={s.logo} priority />
        <h1>Panel ELSA</h1>
        <p className="suave">Preguntas y guiones de los vídeos</p>
      </div>
      <form action={accion} className={s.form}>
        <Campo etiqueta="Email">
          <Entrada name="email" type="email" autoComplete="username" inputMode="email" required />
        </Campo>
        <Campo etiqueta="Contraseña">
          <Entrada name="password" type="password" autoComplete="current-password" required />
        </Campo>
        {estado?.error && <ErrorCampo>{estado.error}</ErrorCampo>}
        <BotonEnviar texto="Entrar" enviando="Entrando…" />
      </form>
    </main>
  );
}
