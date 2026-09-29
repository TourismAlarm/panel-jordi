// Iconos de la app: trazos simples a 24×24 que toman el color del texto.
// Para añadir uno: nuevo nombre en TRAZOS y ya se puede usar <Icono nombre="…" />.

const TRAZOS = {
  inicio: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  videos: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m10 9 5 3-5 3z" />
    </>
  ),
  actividad: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  mas: <path d="M4 7h16M4 12h16M4 17h16" />,
  flecha: <path d="m9 6 6 6-6 6" />,
  volver: <path d="m15 6-6 6 6 6" />,
  actualizar: (
    <>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.5-6" />
      <path d="M20.5 3.5V9H15" />
    </>
  ),
  check: <path d="M5 12.5 10 17l9-10" />,
  alerta: (
    <>
      <path d="M12 3.5 2.5 20h19z" />
      <path d="M12 10v4.5M12 17.2v.3" />
    </>
  ),
  pregunta: <path d="M20.5 12a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1-4.4A8.5 8.5 0 1 1 20.5 12z" />,
  reloj: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  salir: (
    <>
      <path d="M9 20.5H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h3" />
      <path d="m15.5 16.5 4.5-4.5-4.5-4.5M20 12H9" />
    </>
  ),
  piezas: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  guion: (
    <>
      <path d="M6 3.5h8l4 4v13H6z" />
      <path d="M14 3.5v4h4M9 12h6M9 16h6" />
    </>
  ),
} as const;

export type NombreIcono = keyof typeof TRAZOS;

export function Icono({ nombre, tamano = 22 }: { nombre: NombreIcono; tamano?: number }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      style={{ flex: "none" }}
    >
      {TRAZOS[nombre]}
    </svg>
  );
}
