import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// El refresh token de Google se guarda cifrado (AES-256-GCM). Clave: GOOGLE_TOKEN_KEY (32 bytes en hex o base64).
export function claveDeToken(valor = process.env.GOOGLE_TOKEN_KEY): Buffer {
  const v = valor?.trim().replace(/^["']|["']$/g, "");
  if (!v) throw new Error("Falta GOOGLE_TOKEN_KEY.");
  const b = /^[0-9a-f]{64}$/i.test(v) ? Buffer.from(v, "hex") : Buffer.from(v, "base64");
  if (b.length !== 32) throw new Error("GOOGLE_TOKEN_KEY debe ser de 32 bytes (64 caracteres hex).");
  return b;
}

export function cifrar(texto: string, clave = claveDeToken()): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", clave, iv);
  const datos = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), datos].map((x) => x.toString("base64")).join(".");
}

export function descifrar(cifrado: string, clave = claveDeToken()): string {
  const [iv, tag, datos] = cifrado.split(".").map((x) => Buffer.from(x, "base64"));
  if (!iv || !tag || !datos) throw new Error("Token cifrado no válido.");
  const d = createDecipheriv("aes-256-gcm", clave, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(datos), d.final()]).toString("utf8");
}
