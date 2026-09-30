import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import s from "./Campo.module.css";

// Etiqueta + control. <Campo etiqueta="Email"><Entrada name="email" /></Campo>
export function Campo({ etiqueta, children }: { etiqueta: ReactNode; children: ReactNode }) {
  return (
    <label className={s.campo}>
      <span className={s.etiqueta}>{etiqueta}</span>
      {children}
    </label>
  );
}

export function Entrada(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={s.control} {...props} />;
}

// Crece con el texto en los navegadores que lo permiten.
export function AreaTexto(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${s.control} ${s.area}`} rows={3} {...props} />;
}

// Texto de error bajo un formulario.
export function ErrorCampo({ children }: { children: ReactNode }) {
  return (
    <p className={s.error} role="alert">
      {children}
    </p>
  );
}
