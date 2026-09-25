"use client";

import { useActionState } from "react";
import { entrar } from "@/app/acciones";

export default function Login() {
  const [estado, accion, enviando] = useActionState(entrar, null);
  return (
    <main>
      <h1>Panel ELSA</h1>
      <form action={accion} className="tarjeta">
        <label>
          Email
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label>
          Contraseña
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        {estado?.error && <p className="error">{estado.error}</p>}
        <button disabled={enviando}>{enviando ? "Entrando…" : "Entrar"}</button>
      </form>
    </main>
  );
}
