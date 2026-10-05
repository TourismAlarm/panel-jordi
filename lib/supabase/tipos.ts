// Generado desde el proyecto Supabase «Panel-jordi». No se edita a mano:
// si cambia una tabla, se vuelve a generar (ver ARQUITECTURA.md).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ejecuciones_agentes: {
        Row: {
          agente: string
          fin: string | null
          id: number
          inicio: string | null
          origen_id: string
          resultado: string | null
          resumen: string | null
          video_id: string | null
        }
        Insert: {
          agente: string
          fin?: string | null
          id?: never
          inicio?: string | null
          origen_id: string
          resultado?: string | null
          resumen?: string | null
          video_id?: string | null
        }
        Update: {
          agente?: string
          fin?: string | null
          id?: never
          inicio?: string | null
          origen_id?: string
          resultado?: string | null
          resumen?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ejecuciones_agentes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      permitidos: {
        Row: {
          user_id: string
        }
        Insert: {
          user_id: string
        }
        Update: {
          user_id?: string
        }
        Relationships: []
      }
      peticiones: {
        Row: {
          creada_en: string
          error: string | null
          estado: string
          fecha_trabajo: string | null
          id: string
          motivo: string | null
          pregunta_id: string | null
          procesada_en: string | null
          recogida_en: string | null
          siempre: boolean
          texto: string | null
          tipo: string
          video_id: string | null
        }
        Insert: {
          creada_en?: string
          error?: string | null
          estado?: string
          fecha_trabajo?: string | null
          id?: string
          motivo?: string | null
          pregunta_id?: string | null
          procesada_en?: string | null
          recogida_en?: string | null
          siempre?: boolean
          texto?: string | null
          tipo: string
          video_id?: string | null
        }
        Update: {
          creada_en?: string
          error?: string | null
          estado?: string
          fecha_trabajo?: string | null
          id?: string
          motivo?: string | null
          pregunta_id?: string | null
          procesada_en?: string | null
          recogida_en?: string | null
          siempre?: boolean
          texto?: string | null
          tipo?: string
          video_id?: string | null
        }
        Relationships: []
      }
      preguntas: {
        Row: {
          clave: string
          id: string
          orden: number
          recogida_en: string | null
          respondida_en: string | null
          respuesta: string | null
          texto: string
          video_id: string
        }
        Insert: {
          clave: string
          id?: string
          orden: number
          recogida_en?: string | null
          respondida_en?: string | null
          respuesta?: string | null
          texto: string
          video_id: string
        }
        Update: {
          clave?: string
          id?: string
          orden?: number
          recogida_en?: string | null
          respondida_en?: string | null
          respuesta?: string | null
          texto?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preguntas_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      reglas: {
        Row: {
          actualizada_en: string
          agente: string
          clave: string
          creada_en: string
          decidida_en: string | null
          decision: string | null
          decision_texto: string | null
          estado: string
          evidencia: string | null
          id: string
          medida: string | null
          origen: string
          regla: string
        }
        Insert: {
          actualizada_en?: string
          agente: string
          clave: string
          creada_en?: string
          decidida_en?: string | null
          decision?: string | null
          decision_texto?: string | null
          estado?: string
          evidencia?: string | null
          id?: string
          medida?: string | null
          origen?: string
          regla: string
        }
        Update: {
          actualizada_en?: string
          agente?: string
          clave?: string
          creada_en?: string
          decidida_en?: string | null
          decision?: string | null
          decision_texto?: string | null
          estado?: string
          evidencia?: string | null
          id?: string
          medida?: string | null
          origen?: string
          regla?: string
        }
        Relationships: []
      }
      sync_estado: {
        Row: {
          id: number
          mensaje: string | null
          ultimo_error: string | null
          ultimo_inicio: string | null
          ultimo_ok: string | null
        }
        Insert: {
          id?: number
          mensaje?: string | null
          ultimo_error?: string | null
          ultimo_inicio?: string | null
          ultimo_ok?: string | null
        }
        Update: {
          id?: number
          mensaje?: string | null
          ultimo_error?: string | null
          ultimo_inicio?: string | null
          ultimo_ok?: string | null
        }
        Relationships: []
      }
      videos: {
        Row: {
          actualizado_en: string
          estado: string
          fecha_trabajo: string | null
          guion_md: string | null
          id: string
          montaje_url: string | null
          por_revisar: boolean
          siguiente_paso: string | null
          titulo: string | null
        }
        Insert: {
          actualizado_en?: string
          estado: string
          fecha_trabajo?: string | null
          guion_md?: string | null
          id: string
          montaje_url?: string | null
          por_revisar?: boolean
          siguiente_paso?: string | null
          titulo?: string | null
        }
        Update: {
          actualizado_en?: string
          estado?: string
          fecha_trabajo?: string | null
          guion_md?: string | null
          id?: string
          montaje_url?: string | null
          por_revisar?: boolean
          siguiente_paso?: string | null
          titulo?: string | null
        }
        Relationships: []
      }
      windsor_fotos: {
        Row: {
          datos: Json
          fecha: string
          tomada_en: string
        }
        Insert: {
          datos: Json
          fecha: string
          tomada_en?: string
        }
        Update: {
          datos?: Json
          fecha?: string
          tomada_en?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      es_permitido: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type Tablas = Database["public"]["Tables"]

// Una fila de cualquier tabla: Fila<"videos">, Fila<"preguntas">…
export type Fila<T extends keyof Tablas> = Tablas[T]["Row"]
