"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Punto } from "@/lib/salud/resumen";

// Recharts con los colores del tema (negro/gris): sin colores de adorno.
export function GraficaMetrica({ puntos, unidad, tipo, decimales }: { puntos: Punto[]; unidad: string; tipo: "linea" | "barras"; decimales: number }) {
  const datos = puntos.map((p) => ({ dia: p.fecha.slice(5).split("-").reverse().join("/"), valor: p.valor }));
  const formato = (v: number) => `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: decimales }).format(v)} ${unidad}`.trim();
  const ejes = (
    <>
      <CartesianGrid stroke="var(--borde)" strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="dia" tick={{ fill: "var(--texto-suave)", fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={24} />
      <YAxis tick={{ fill: "var(--texto-suave)", fontSize: 12 }} tickLine={false} axisLine={false} width={44} domain={tipo === "barras" ? [0, "auto"] : ["auto", "auto"]} />
      <Tooltip
        formatter={(v) => [formato(Number(v)), ""]}
        labelStyle={{ color: "var(--texto)" }}
        contentStyle={{ background: "var(--superficie)", border: "1px solid var(--borde)", borderRadius: 12 }}
      />
    </>
  );
  return (
    <div className="h-64 w-full" role="img" aria-label="Gráfica del histórico">
      <ResponsiveContainer width="100%" height="100%">
        {tipo === "barras" ? (
          <BarChart data={datos}>
            {ejes}
            <Bar dataKey="valor" fill="var(--texto)" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={datos}>
            {ejes}
            <Line dataKey="valor" stroke="var(--texto)" strokeWidth={2.5} dot={datos.length < 40} type="monotone" />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
