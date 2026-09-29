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
      videos: {
        Row: {
          actualizado_en: string
          estado: string
          fecha_trabajo: string | null
          guion_md: string | null
          id: string
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
          por_revisar?: boolean
          siguiente_paso?: string | null
          titulo?: string | null
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
