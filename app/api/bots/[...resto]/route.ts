import { NextResponse } from "next/server";

// Cualquier /api/bots/* que no existe responde JSON 404, nunca una página HTML: así un bot sabe que la ruta no está.
const noExiste = () => NextResponse.json({ error: "esa ruta no existe", ayuda: "docs/bots-api.md" }, { status: 404 });
export { noExiste as GET, noExiste as POST, noExiste as PATCH, noExiste as PUT, noExiste as DELETE };
