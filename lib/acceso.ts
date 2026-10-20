// Único usuario permitido. Si ALLOWED_EMAIL falta, nadie entra.
export function correoPermitido(email: string | null | undefined): boolean {
  const permitido = process.env.ALLOWED_EMAIL?.trim().toLowerCase();
  return !!permitido && !!email && email.trim().toLowerCase() === permitido;
}
