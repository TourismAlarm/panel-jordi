import "server-only";
import { Resend } from "resend";

// Correos a ti mismo (resumen diario, vencimientos). Solo se escribe al correo propietario.
export async function enviarCorreo(p: { asunto: string; html: string; texto?: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const para = process.env.ALLOWED_EMAIL;
  const de = process.env.RESEND_FROM;
  if (!apiKey || !para || !de) throw new Error("Faltan RESEND_API_KEY, RESEND_FROM o ALLOWED_EMAIL.");
  const { data, error } = await new Resend(apiKey).emails.send({ from: de, to: para, subject: p.asunto, html: p.html, text: p.texto });
  if (error) throw new Error(`Resend: ${error.message}`);
  return data;
}
