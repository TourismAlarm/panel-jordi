import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  AreaTexto,
  Aviso,
  Boton,
  BotonEnlace,
  Campo,
  Cifra,
  Cifras,
  Desplegable,
  Entrada,
  Esqueleto,
  Etiqueta,
  Fila,
  Icono,
  Lista,
  Pantalla,
  Punto,
  Seccion,
  Segmentos,
  Tarjeta,
  Vacio,
  type NombreIcono,
  type Tono,
} from "@/components/ui";
import { Registro } from "@/components/actividad/Registro";
import { ListaAgentes } from "@/components/actividad/ListaAgentes";
import { TarjetaProyecto } from "@/components/proyectos/TarjetaProyecto";
import { Guion } from "@/components/videos/Guion";

export const metadata: Metadata = { title: "Piezas" };

// Catálogo de la base: cada pieza con un ejemplo inventado. Sirve para ver lo que hay antes de montar
// una pantalla nueva y para pedir cambios por su nombre («usa una Cifra», «pon una Etiqueta ojo»).

const TONOS: Tono[] = ["bien", "ojo", "mal", "info", "neutro"];
const ICONOS: NombreIcono[] = [
  "inicio",
  "videos",
  "actividad",
  "mas",
  "flecha",
  "volver",
  "actualizar",
  "check",
  "alerta",
  "pregunta",
  "reloj",
  "salir",
  "piezas",
  "guion",
  "lugar",
  "camion",
  "calendario",
  "info",
];

const hace = (min: number) => new Date(Date.now() - min * 60000).toISOString();

function Pieza({ nombre, uso, children }: { nombre: string; uso: string; children: ReactNode }) {
  return (
    <Seccion titulo={nombre}>
      <p className="suave pequeno">{uso}</p>
      {children}
    </Seccion>
  );
}

export default function Piezas() {
  return (
    <Pantalla
      volver={{ href: "/mas", texto: "Más" }}
      titulo="Piezas de la app"
      subtitulo="La base con la que se montan todas las pantallas. Los datos de esta página son de ejemplo."
      accion={false}
    >
      <Aviso tono="info" icono="piezas">
        Cada bloque lleva el nombre de la pieza. Para una pantalla nueva basta con combinarlas.
      </Aviso>

      <h2 style={{ marginTop: 12 }}>Básicas</h2>

      <Pieza nombre="Tono" uso="Colores con significado. Todas las piezas los entienden igual.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {TONOS.map((t) => (
            <Etiqueta key={t} tono={t}>
              {t}
            </Etiqueta>
          ))}
        </div>
      </Pieza>

      <Pieza nombre="Etiqueta y Punto" uso="Estado de algo en dos palabras. El Punto es la versión mínima.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <Etiqueta tono="ojo">Te toca revisar</Etiqueta>
          <Etiqueta tono="info">Montando</Etiqueta>
          <Etiqueta tono="bien">Publicado</Etiqueta>
          <Punto tono="mal" titulo="Falló" />
          <Punto tono="bien" titulo="Bien" />
        </div>
      </Pieza>

      <Pieza nombre="Cifra" uso="Número grande que se pulsa. Van de cuatro en cuatro dentro de Cifras.">
        <Cifras>
          <Cifra valor={3} texto="Preguntas" tono="ojo" href="#" />
          <Cifra valor={0} texto="Por revisar" tono="bien" href="#" />
          <Cifra valor={5} texto="En marcha" tono="info" href="#" />
          <Cifra valor={1} texto="Fallos 7 días" tono="mal" href="#" />
        </Cifras>
      </Pieza>

      <Pieza nombre="Tarjeta" uso="Caja para una cosa. Con enlace se pulsa entera; con tono lleva borde de color.">
        <Tarjeta>
          <strong>Tarjeta normal</strong>
          <span className="suave pequeno">Sirve para cualquier contenido.</span>
        </Tarjeta>
        <Tarjeta href="#" tono="ojo">
          <strong>Tarjeta con enlace y tono «ojo»</strong>
          <span className="suave pequeno">Tiene flecha porque lleva a otra pantalla.</span>
        </Tarjeta>
        <Tarjeta destacada>
          <strong>Tarjeta destacada</strong>
          <span className="suave pequeno">Para lo más urgente de la pantalla.</span>
        </Tarjeta>
      </Pieza>

      <Pieza nombre="Lista y Fila" uso="Varias cosas cortas seguidas, como los ajustes del móvil.">
        <Lista>
          <Fila inicio={<Icono nombre="reloj" />} titulo="Fila con icono" detalle="Y un detalle debajo" fin="17:05" />
          <Fila href="#" inicio={<Punto tono="bien" />} titulo="Fila que se pulsa" detalle={<Etiqueta tono="info">Con etiqueta</Etiqueta>} />
          <Fila titulo="Fila sencilla" />
        </Lista>
      </Pieza>

      <Pieza nombre="Aviso" uso="Franja para avisar sin cortar el paso.">
        <Aviso tono="info">2 respuestas enviadas. El PC las recoge en menos de 15 min.</Aviso>
        <Aviso tono="bien">Enviada.</Aviso>
        <Aviso tono="mal">No se ha podido guardar.</Aviso>
      </Pieza>

      <Pieza nombre="Vacio" uso="Cuando no hay nada que enseñar: mejor un mensaje que un hueco.">
        <Vacio titulo="Nada pendiente" texto="El sistema sigue solo." />
      </Pieza>

      <Pieza nombre="Desplegable" uso="Contenido largo que se abre al tocar (el guion, los cerrados…).">
        <Desplegable titulo="Tócame">
          <p>Aquí dentro va el contenido.</p>
        </Desplegable>
      </Pieza>

      <Pieza nombre="Boton, Campo, Entrada y AreaTexto" uso="Formularios. BotonEnviar se bloquea solo mientras envía.">
        <Campo etiqueta="Entrada">
          <Entrada placeholder="Una línea" />
        </Campo>
        <Campo etiqueta="AreaTexto">
          <AreaTexto placeholder="Varias líneas; crece al escribir" />
        </Campo>
        <Boton type="button">Principal</Boton>
        <Boton type="button" variante="secundario">
          Secundario
        </Boton>
        <Boton type="button" variante="peligro">
          Peligro
        </Boton>
      </Pieza>

      <Pieza nombre="BotonEnlace" uso="Como un botón, pero lleva a otra pantalla. «compacto» para dentro de tarjetas.">
        <BotonEnlace href="#">
          <Icono nombre="guion" />
          Leer el guion
        </BotonEnlace>
        <div>
          <BotonEnlace href="#" variante="secundario" compacto>
            <Icono nombre="guion" tamano={18} />
            Guion
          </BotonEnlace>
        </div>
      </Pieza>

      <Pieza nombre="Segmentos" uso="Cambiar de vista dentro de la misma pantalla.">
        <Segmentos
          opciones={[
            { href: "/piezas", texto: "Guion", activo: true },
            { href: "/piezas?b", texto: "Con indicaciones", activo: false },
            { href: "/piezas?c", texto: "Notas", activo: false },
          ]}
        />
      </Pieza>

      <Pieza nombre="Esqueleto" uso="Lo que se ve mientras cargan los datos.">
        <Tarjeta>
          <Esqueleto alto={12} ancho="25%" />
          <Esqueleto alto={20} ancho="80%" />
          <Esqueleto alto={14} ancho="55%" />
        </Tarjeta>
      </Pieza>

      <Pieza nombre="Icono" uso="Trazos simples que toman el color del texto.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {ICONOS.map((n) => (
            <span key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, width: 64 }}>
              <Icono nombre={n} />
              <span className="suave" style={{ fontSize: "0.7rem" }}>
                {n}
              </span>
            </span>
          ))}
        </div>
      </Pieza>

      <h2 style={{ marginTop: 24 }}>Del panel</h2>
      <p className="suave pequeno">Piezas que ya saben qué es un vídeo, una pregunta o un agente.</p>

      <Pieza nombre="TarjetaProyecto" uso="Un proyecto en la portada. Borde naranja si es hoy o mañana.">
        <TarjetaProyecto
          p={{
            id: "GE_000",
            titulo: "Proyecto de ejemplo",
            estado: "guion_listo_esperando_material",
            fecha_trabajo: null,
            por_revisar: false,
            tieneGuion: true,
            ficha: { hora: "08:00", franja: null, lugar: "Mataró", camion: "23 + 24", trabajo: null, version: "v0002", porConfirmar: [] },
          }}
          preguntas={2}
        />
      </Pieza>

      <Pieza nombre="Guion (modo lectura)" uso="Texto del guion con los bloques marcados: quién habla en cada momento.">
        <Tarjeta>
          <Guion
            lectura
            md={"**A CÁMARA · GANCHO** *(ya grabado)*\n\nEsta máquina no tiene ruedas.\n\n**VOZ EN OFF**\n\nSe las ponemos.\nTanquetas.\n\n**CIERRE · VOZ EN OFF**\n\nCargada y amarrada."}
          />
        </Tarjeta>
      </Pieza>

      <Pieza nombre="ListaAgentes" uso="Cada agente con su último resultado.">
        <ListaAgentes
          agentes={[
            { agente: "guionista", fin: hace(12), resultado: "ok" },
            { agente: "montador", fin: hace(300), resultado: "correccion" },
            { agente: "observador", fin: hace(2000), resultado: "bloqueado" },
          ]}
        />
      </Pieza>

      <Pieza nombre="Registro" uso="Actividad de los agentes agrupada por días.">
        <Registro
          filas={[
            { id: 1, agente: "guionista", video_id: "E000", fin: hace(20), resultado: "ok", resumen: "Guion v2 con tus respuestas." },
            { id: 2, agente: "sync", video_id: null, fin: hace(1500), resultado: "ok", resumen: "8 vídeos, 11 preguntas." },
          ]}
        />
      </Pieza>
    </Pantalla>
  );
}
