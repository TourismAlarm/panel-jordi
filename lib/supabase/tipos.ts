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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      actividad_bots: {
        Row: {
          bot: string
          creado: string
          enlace: string | null
          fin: string | null
          id: number
          inicio: string
          nota: string | null
          resultado: string
          tarea: string
        }
        Insert: {
          bot: string
          creado?: string
          enlace?: string | null
          fin?: string | null
          id?: never
          inicio: string
          nota?: string | null
          resultado: string
          tarea: string
        }
        Update: {
          bot?: string
          creado?: string
          enlace?: string | null
          fin?: string | null
          id?: never
          inicio?: string
          nota?: string | null
          resultado?: string
          tarea?: string
        }
        Relationships: []
      }
      arnes_rutinas: {
        Row: {
          activa: boolean
          actualizado: string
          horario: string
          id: string
          nombre: string
          nota: string | null
          proxima: string | null
          resultado: string | null
          ultima_ejecucion: string | null
          user_id: string
        }
        Insert: {
          activa?: boolean
          actualizado?: string
          horario: string
          id: string
          nombre: string
          nota?: string | null
          proxima?: string | null
          resultado?: string | null
          ultima_ejecucion?: string | null
          user_id: string
        }
        Update: {
          activa?: boolean
          actualizado?: string
          horario?: string
          id?: string
          nombre?: string
          nota?: string | null
          proxima?: string | null
          resultado?: string | null
          ultima_ejecucion?: string | null
          user_id?: string
        }
        Relationships: []
      }
      arnes_tareas: {
        Row: {
          actualizado_en: string
          agente: string
          cerrada_en: string | null
          empezada_en: string
          enlace: string | null
          estado: string
          falta: string | null
          id: string
          paso_actual: string | null
          titulo: string
          user_id: string
        }
        Insert: {
          actualizado_en: string
          agente: string
          cerrada_en?: string | null
          empezada_en?: string
          enlace?: string | null
          estado: string
          falta?: string | null
          id: string
          paso_actual?: string | null
          titulo: string
          user_id: string
        }
        Update: {
          actualizado_en?: string
          agente?: string
          cerrada_en?: string | null
          empezada_en?: string
          enlace?: string | null
          estado?: string
          falta?: string | null
          id?: string
          paso_actual?: string | null
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      bandeja: {
        Row: {
          created_at: string
          cuerpo: string | null
          estado: string
          id: string
          modulo: string
          origen_bot: string | null
          respuesta: string | null
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cuerpo?: string | null
          estado?: string
          id?: string
          modulo: string
          origen_bot?: string | null
          respuesta?: string | null
          tipo: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          cuerpo?: string | null
          estado?: string
          id?: string
          modulo?: string
          origen_bot?: string | null
          respuesta?: string | null
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      bots_llamadas: {
        Row: {
          bot: string
          creado: string
          estado: number
          id: number
          metodo: string
          ruta: string
        }
        Insert: {
          bot: string
          creado?: string
          estado: number
          id?: never
          metodo: string
          ruta: string
        }
        Update: {
          bot?: string
          creado?: string
          estado?: number
          id?: never
          metodo?: string
          ruta?: string
        }
        Relationships: []
      }
      contadores: {
        Row: {
          nombre: string
          valor: number
        }
        Insert: {
          nombre: string
          valor: number
        }
        Update: {
          nombre?: string
          valor?: number
        }
        Relationships: []
      }
      doc_documentos: {
        Row: {
          categoria: string
          error: string | null
          estado: string
          id: string
          mime: string | null
          nombre: string
          procesado_en: string | null
          ruta: string | null
          subido_en: string
          tamano: number | null
          tipo: string | null
          user_id: string
        }
        Insert: {
          categoria?: string
          error?: string | null
          estado?: string
          id?: string
          mime?: string | null
          nombre: string
          procesado_en?: string | null
          ruta?: string | null
          subido_en?: string
          tamano?: number | null
          tipo?: string | null
          user_id: string
        }
        Update: {
          categoria?: string
          error?: string | null
          estado?: string
          id?: string
          mime?: string | null
          nombre?: string
          procesado_en?: string | null
          ruta?: string | null
          subido_en?: string
          tamano?: number | null
          tipo?: string | null
          user_id?: string
        }
        Relationships: []
      }
      doc_fichas: {
        Row: {
          actualizado_en: string
          condiciones: string[]
          contacto: string | null
          documento_id: string
          importes: Json
          inicio: string | null
          origen: string
          partes: string[]
          referencia: string | null
          resumen: string | null
          titular: string | null
          user_id: string
          vencimiento: string | null
        }
        Insert: {
          actualizado_en?: string
          condiciones?: string[]
          contacto?: string | null
          documento_id: string
          importes?: Json
          inicio?: string | null
          origen?: string
          partes?: string[]
          referencia?: string | null
          resumen?: string | null
          titular?: string | null
          user_id: string
          vencimiento?: string | null
        }
        Update: {
          actualizado_en?: string
          condiciones?: string[]
          contacto?: string | null
          documento_id?: string
          importes?: Json
          inicio?: string | null
          origen?: string
          partes?: string[]
          referencia?: string | null
          resumen?: string | null
          titular?: string | null
          user_id?: string
          vencimiento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doc_fichas_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: true
            referencedRelation: "doc_documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      doc_paginas: {
        Row: {
          documento_id: string
          id: string
          pagina: number
          texto: string
          tsv: unknown
          user_id: string
        }
        Insert: {
          documento_id: string
          id?: string
          pagina: number
          texto: string
          tsv?: unknown
          user_id: string
        }
        Update: {
          documento_id?: string
          id?: string
          pagina?: number
          texto?: string
          tsv?: unknown
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doc_paginas_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "doc_documentos"
            referencedColumns: ["id"]
          },
        ]
      }
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
      encargos_edicion: {
        Row: {
          brutos: Json
          creado: string
          creado_por: string
          decision_jordi: string | null
          duracion_real_s: number | null
          error: string | null
          estado: string
          fase: string
          feedback: string | null
          final_url: string | null
          guion_md: string | null
          id: string
          instrucciones: Json
          preguntas: Json
          reemplaza_id: string | null
          reglas: Json
          resultado_notas: string | null
          resultado_url: string | null
          revisado_en: string | null
          terminado_en: string | null
          tomado_en: string | null
          version: number
          version_externa: string | null
          video_id: string
        }
        Insert: {
          brutos?: Json
          creado?: string
          creado_por: string
          decision_jordi?: string | null
          duracion_real_s?: number | null
          error?: string | null
          estado?: string
          fase: string
          feedback?: string | null
          final_url?: string | null
          guion_md?: string | null
          id?: string
          instrucciones: Json
          preguntas?: Json
          reemplaza_id?: string | null
          reglas?: Json
          resultado_notas?: string | null
          resultado_url?: string | null
          revisado_en?: string | null
          terminado_en?: string | null
          tomado_en?: string | null
          version: number
          version_externa?: string | null
          video_id: string
        }
        Update: {
          brutos?: Json
          creado?: string
          creado_por?: string
          decision_jordi?: string | null
          duracion_real_s?: number | null
          error?: string | null
          estado?: string
          fase?: string
          feedback?: string | null
          final_url?: string | null
          guion_md?: string | null
          id?: string
          instrucciones?: Json
          preguntas?: Json
          reemplaza_id?: string | null
          reglas?: Json
          resultado_notas?: string | null
          resultado_url?: string | null
          revisado_en?: string | null
          terminado_en?: string | null
          tomado_en?: string | null
          version?: number
          version_externa?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "encargos_edicion_reemplaza_id_fkey"
            columns: ["reemplaza_id"]
            isOneToOne: false
            referencedRelation: "encargos_edicion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encargos_edicion_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_accounts: {
        Row: {
          balance: number
          created_at: string | null
          currency: string
          id: string
          is_active: boolean
          name: string
          role: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          currency?: string
          id?: string
          is_active?: boolean
          name: string
          role?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          currency?: string
          id?: string
          is_active?: boolean
          name?: string
          role?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fin_bank_auth_states: {
        Row: {
          aspsp_country: string
          aspsp_name: string
          created_at: string | null
          state: string
          user_id: string
        }
        Insert: {
          aspsp_country: string
          aspsp_name: string
          created_at?: string | null
          state: string
          user_id: string
        }
        Update: {
          aspsp_country?: string
          aspsp_name?: string
          created_at?: string | null
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      fin_bank_links: {
        Row: {
          account_id: string | null
          account_name: string | null
          account_uid: string
          aspsp_country: string
          aspsp_name: string
          created_at: string | null
          currency: string | null
          iban_hash: string | null
          iban_ultimos4: string | null
          id: string
          last_error: string | null
          last_synced_at: string | null
          provider: string
          session_id: string
          status: string
          updated_at: string | null
          user_id: string
          valid_until: string | null
        }
        Insert: {
          account_id?: string | null
          account_name?: string | null
          account_uid: string
          aspsp_country: string
          aspsp_name: string
          created_at?: string | null
          currency?: string | null
          iban_hash?: string | null
          iban_ultimos4?: string | null
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          provider?: string
          session_id: string
          status?: string
          updated_at?: string | null
          user_id: string
          valid_until?: string | null
        }
        Update: {
          account_id?: string | null
          account_name?: string | null
          account_uid?: string
          aspsp_country?: string
          aspsp_name?: string
          created_at?: string | null
          currency?: string | null
          iban_hash?: string | null
          iban_ultimos4?: string | null
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          provider?: string
          session_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_bank_links_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "fin_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_budgets: {
        Row: {
          alert_threshold: number
          amount: number
          category_id: string | null
          created_at: string | null
          id: string
          month: number
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          alert_threshold?: number
          amount: number
          category_id?: string | null
          created_at?: string | null
          id?: string
          month: number
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          alert_threshold?: number
          amount?: number
          category_id?: string | null
          created_at?: string | null
          id?: string
          month?: number
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "fin_budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "fin_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_system: boolean
          name: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean
          name: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean
          name?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fin_category_rules: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          pattern: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          pattern: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          pattern?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_category_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "fin_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_dismissed_suggestions: {
        Row: {
          created_at: string | null
          key: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          key: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          key?: string
          user_id?: string
        }
        Relationships: []
      }
      fin_loan_payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          interest_paid: number
          loan_id: string
          notes: string | null
          payment_date: string
          principal_paid: number
          transaction_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          interest_paid?: number
          loan_id: string
          notes?: string | null
          payment_date: string
          principal_paid?: number
          transaction_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          interest_paid?: number
          loan_id?: string
          notes?: string | null
          payment_date?: string
          principal_paid?: number
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "fin_loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_loan_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "fin_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_loans: {
        Row: {
          account_id: string | null
          bank_match: string | null
          contact_name: string
          created_at: string | null
          due_date: string | null
          id: string
          interest_rate: number
          monthly_payment: number | null
          notes: string | null
          outstanding_amount: number
          payment_day: number | null
          principal_amount: number
          start_date: string
          status: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          bank_match?: string | null
          contact_name: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          interest_rate?: number
          monthly_payment?: number | null
          notes?: string | null
          outstanding_amount: number
          payment_day?: number | null
          principal_amount: number
          start_date: string
          status?: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          bank_match?: string | null
          contact_name?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          interest_rate?: number
          monthly_payment?: number | null
          notes?: string | null
          outstanding_amount?: number
          payment_day?: number | null
          principal_amount?: number
          start_date?: string
          status?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_loans_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "fin_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          currency: string
          email: string
          financial_month_start_day: number
          full_name: string | null
          id: string
          onboarding_completed: boolean
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          currency?: string
          email: string
          financial_month_start_day?: number
          full_name?: string | null
          id: string
          onboarding_completed?: boolean
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          currency?: string
          email?: string
          financial_month_start_day?: number
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      fin_recurring_rules: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string | null
          created_at: string | null
          description: string
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean
          next_occurrence: string
          start_date: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id?: string | null
          created_at?: string | null
          description: string
          end_date?: string | null
          frequency: string
          id?: string
          is_active?: boolean
          next_occurrence: string
          start_date: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          created_at?: string | null
          description?: string
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          next_occurrence?: string
          start_date?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_recurring_rules_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "fin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_recurring_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "fin_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_savings_goals: {
        Row: {
          color: string | null
          created_at: string | null
          current_amount: number
          description: string | null
          icon: string | null
          id: string
          is_completed: boolean
          name: string
          target_amount: number
          target_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          current_amount?: number
          description?: string | null
          icon?: string | null
          id?: string
          is_completed?: boolean
          name: string
          target_amount: number
          target_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          current_amount?: number
          description?: string | null
          icon?: string | null
          id?: string
          is_completed?: boolean
          name?: string
          target_amount?: number
          target_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fin_transactions: {
        Row: {
          account_id: string | null
          amount: number
          bank_link_id: string | null
          category_id: string | null
          counterparty: string | null
          created_at: string | null
          date: string
          description: string | null
          external_id: string | null
          id: string
          kind: string
          loan_id: string | null
          notes: string | null
          recurring_rule_id: string | null
          refund_of: string | null
          source: string
          tags: string[] | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          bank_link_id?: string | null
          category_id?: string | null
          counterparty?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          external_id?: string | null
          id?: string
          kind?: string
          loan_id?: string | null
          notes?: string | null
          recurring_rule_id?: string | null
          refund_of?: string | null
          source?: string
          tags?: string[] | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          bank_link_id?: string | null
          category_id?: string | null
          counterparty?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          external_id?: string | null
          id?: string
          kind?: string
          loan_id?: string | null
          notes?: string | null
          recurring_rule_id?: string | null
          refund_of?: string | null
          source?: string
          tags?: string[] | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "fin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_bank_link_id_fkey"
            columns: ["bank_link_id"]
            isOneToOne: false
            referencedRelation: "fin_bank_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "fin_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "fin_loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_recurring_rule_id_fkey"
            columns: ["recurring_rule_id"]
            isOneToOne: false
            referencedRelation: "fin_recurring_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_refund_of_fkey"
            columns: ["refund_of"]
            isOneToOne: false
            referencedRelation: "fin_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_transfers: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          description: string | null
          from_account_id: string
          id: string
          to_account_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          date?: string
          description?: string | null
          from_account_id: string
          id?: string
          to_account_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          description?: string | null
          from_account_id?: string
          id?: string
          to_account_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_transfers_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "fin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transfers_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "fin_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      google_tokens: {
        Row: {
          correo: string | null
          creado_en: string
          refresh_cifrado: string
          scopes: string
          user_id: string
        }
        Insert: {
          correo?: string | null
          creado_en?: string
          refresh_cifrado: string
          scopes: string
          user_id: string
        }
        Update: {
          correo?: string | null
          creado_en?: string
          refresh_cifrado?: string
          scopes?: string
          user_id?: string
        }
        Relationships: []
      }
      guiones_propuestos: {
        Row: {
          actualizado: string
          creado: string
          duracion_s: number | null
          estado: string
          evento_calendario: string | null
          fuente_bot: string
          gancho: string
          id: string
          idea_id: string | null
          nota_jordi: string | null
          planos: Json
          preguntas: Json
          prueba: string | null
          reemplaza_id: string | null
          reglas_cumplidas: Json
          tema: string | null
          textos_pantalla: Json
          tipo_gancho: string | null
          titulo: string
          version: number
          video_id: string | null
        }
        Insert: {
          actualizado?: string
          creado?: string
          duracion_s?: number | null
          estado?: string
          evento_calendario?: string | null
          fuente_bot: string
          gancho: string
          id?: string
          idea_id?: string | null
          nota_jordi?: string | null
          planos?: Json
          preguntas?: Json
          prueba?: string | null
          reemplaza_id?: string | null
          reglas_cumplidas?: Json
          tema?: string | null
          textos_pantalla?: Json
          tipo_gancho?: string | null
          titulo: string
          version?: number
          video_id?: string | null
        }
        Update: {
          actualizado?: string
          creado?: string
          duracion_s?: number | null
          estado?: string
          evento_calendario?: string | null
          fuente_bot?: string
          gancho?: string
          id?: string
          idea_id?: string | null
          nota_jordi?: string | null
          planos?: Json
          preguntas?: Json
          prueba?: string | null
          reemplaza_id?: string | null
          reglas_cumplidas?: Json
          tema?: string | null
          textos_pantalla?: Json
          tipo_gancho?: string | null
          titulo?: string
          version?: number
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guiones_propuestos_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guiones_propuestos_reemplaza_id_fkey"
            columns: ["reemplaza_id"]
            isOneToOne: false
            referencedRelation: "guiones_propuestos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guiones_propuestos_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          actualizado: string
          creado: string
          estado: string
          formato: string | null
          fuente_bot: string
          gancho: string
          id: string
          nota_jordi: string | null
          por_que_funciona: string | null
          referencias: Json
          titulo: string
          trabajo_sugerido: string | null
        }
        Insert: {
          actualizado?: string
          creado?: string
          estado?: string
          formato?: string | null
          fuente_bot: string
          gancho: string
          id?: string
          nota_jordi?: string | null
          por_que_funciona?: string | null
          referencias?: Json
          titulo: string
          trabajo_sugerido?: string | null
        }
        Update: {
          actualizado?: string
          creado?: string
          estado?: string
          formato?: string | null
          fuente_bot?: string
          gancho?: string
          id?: string
          nota_jordi?: string | null
          por_que_funciona?: string | null
          referencias?: Json
          titulo?: string
          trabajo_sugerido?: string | null
        }
        Relationships: []
      }
      informes_bots: {
        Row: {
          bot: string
          creado: string
          cuerpo_md: string
          datos: Json
          id: string
          periodo_desde: string | null
          periodo_hasta: string | null
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          bot: string
          creado?: string
          cuerpo_md: string
          datos?: Json
          id?: string
          periodo_desde?: string | null
          periodo_hasta?: string | null
          tipo: string
          titulo: string
          user_id: string
        }
        Update: {
          bot?: string
          creado?: string
          cuerpo_md?: string
          datos?: Json
          id?: string
          periodo_desde?: string | null
          periodo_hasta?: string | null
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      informes_redes: {
        Row: {
          fecha: string
          markdown: string
          semana: string
          subido_en: string
          titulo: string
        }
        Insert: {
          fecha: string
          markdown: string
          semana: string
          subido_en?: string
          titulo: string
        }
        Update: {
          fecha?: string
          markdown?: string
          semana?: string
          subido_en?: string
          titulo?: string
        }
        Relationships: []
      }
      memoria_comun: {
        Row: {
          actualizado: string
          autor: string
          clave: string
          contenido: string
          creado: string
          id: string
          tipo: string
        }
        Insert: {
          actualizado?: string
          autor: string
          clave: string
          contenido: string
          creado?: string
          id?: string
          tipo: string
        }
        Update: {
          actualizado?: string
          autor?: string
          clave?: string
          contenido?: string
          creado?: string
          id?: string
          tipo?: string
        }
        Relationships: []
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
      publicaciones: {
        Row: {
          actualizado_en: string
          creado_por: string
          enlace: string | null
          estado: string
          fecha: string | null
          red: string
          video_id: string
        }
        Insert: {
          actualizado_en?: string
          creado_por: string
          enlace?: string | null
          estado: string
          fecha?: string | null
          red: string
          video_id: string
        }
        Update: {
          actualizado_en?: string
          creado_por?: string
          enlace?: string | null
          estado?: string
          fecha?: string | null
          red?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publicaciones_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
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
      redes_reels: {
        Row: {
          actualizado_en: string
          duracion_s: number | null
          elsa: boolean
          gancho: string | null
          ge: string | null
          permalink: string
          prueba: string | null
          tema: string | null
          tipo_gancho: string | null
        }
        Insert: {
          actualizado_en?: string
          duracion_s?: number | null
          elsa?: boolean
          gancho?: string | null
          ge?: string | null
          permalink: string
          prueba?: string | null
          tema?: string | null
          tipo_gancho?: string | null
        }
        Update: {
          actualizado_en?: string
          duracion_s?: number | null
          elsa?: boolean
          gancho?: string | null
          ge?: string | null
          permalink?: string
          prueba?: string | null
          tema?: string | null
          tipo_gancho?: string | null
        }
        Relationships: []
      }
      reglas: {
        Row: {
          actualizada_en: string
          actualizada_por: string | null
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
          version: number
        }
        Insert: {
          actualizada_en?: string
          actualizada_por?: string | null
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
          version?: number
        }
        Update: {
          actualizada_en?: string
          actualizada_por?: string | null
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
          version?: number
        }
        Relationships: []
      }
      reglas_historial: {
        Row: {
          accion: string
          clave: string
          creado: string
          estado_antes: string | null
          estado_despues: string | null
          id: number
          por_que: string | null
          quien: string
          regla_id: string
          texto_antes: string | null
          texto_despues: string | null
        }
        Insert: {
          accion: string
          clave: string
          creado?: string
          estado_antes?: string | null
          estado_despues?: string | null
          id?: never
          por_que?: string | null
          quien: string
          regla_id: string
          texto_antes?: string | null
          texto_despues?: string | null
        }
        Update: {
          accion?: string
          clave?: string
          creado?: string
          estado_antes?: string | null
          estado_despues?: string | null
          id?: never
          por_que?: string | null
          quien?: string
          regla_id?: string
          texto_antes?: string | null
          texto_despues?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reglas_historial_regla_id_fkey"
            columns: ["regla_id"]
            isOneToOne: false
            referencedRelation: "reglas"
            referencedColumns: ["id"]
          },
        ]
      }
      resumenes_diarios: {
        Row: {
          agenda: Json
          agenda_en: string | null
          correos: Json
          correos_en: string | null
          enviado_en: string | null
          error_envio: string | null
          fecha: string
          generado_en: string | null
          id: string
          origen: string | null
          marcas: Json
          prioridades: Json
          resumen: string | null
          senales: Json
          user_id: string
        }
        Insert: {
          agenda?: Json
          agenda_en?: string | null
          correos?: Json
          correos_en?: string | null
          enviado_en?: string | null
          error_envio?: string | null
          fecha: string
          generado_en?: string | null
          id?: string
          origen?: string | null
          marcas?: Json
          prioridades?: Json
          resumen?: string | null
          senales?: Json
          user_id: string
        }
        Update: {
          agenda?: Json
          agenda_en?: string | null
          correos?: Json
          correos_en?: string | null
          enviado_en?: string | null
          error_envio?: string | null
          fecha?: string
          generado_en?: string | null
          id?: string
          origen?: string | null
          marcas?: Json
          prioridades?: Json
          resumen?: string | null
          senales?: Json
          user_id?: string
        }
        Relationships: []
      }
      revisiones: {
        Row: {
          bot: string
          creado: string
          fase: string
          guion_id: string | null
          id: string
          por_regla: Json
          resultado: string
          resumen: string | null
          video_id: string | null
        }
        Insert: {
          bot: string
          creado?: string
          fase: string
          guion_id?: string | null
          id?: string
          por_regla?: Json
          resultado: string
          resumen?: string | null
          video_id?: string | null
        }
        Update: {
          bot?: string
          creado?: string
          fase?: string
          guion_id?: string | null
          id?: string
          por_regla?: Json
          resultado?: string
          resumen?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revisiones_guion_id_fkey"
            columns: ["guion_id"]
            isOneToOne: false
            referencedRelation: "guiones_propuestos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revisiones_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      sal_entrenos: {
        Row: {
          actualizado_en: string
          calorias: number | null
          distancia_km: number | null
          duracion_min: number | null
          fc_media: number | null
          fecha: string
          fuente: string
          id: string
          id_externo: string | null
          tipo: string
          user_id: string
        }
        Insert: {
          actualizado_en?: string
          calorias?: number | null
          distancia_km?: number | null
          duracion_min?: number | null
          fc_media?: number | null
          fecha: string
          fuente?: string
          id?: string
          id_externo?: string | null
          tipo: string
          user_id: string
        }
        Update: {
          actualizado_en?: string
          calorias?: number | null
          distancia_km?: number | null
          duracion_min?: number | null
          fc_media?: number | null
          fecha?: string
          fuente?: string
          id?: string
          id_externo?: string | null
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      sal_metricas: {
        Row: {
          actualizado_en: string
          fecha: string
          fuente: string
          id: string
          metrica: string
          unidad: string | null
          user_id: string
          valor: number
        }
        Insert: {
          actualizado_en?: string
          fecha: string
          fuente?: string
          id?: string
          metrica: string
          unidad?: string | null
          user_id: string
          valor: number
        }
        Update: {
          actualizado_en?: string
          fecha?: string
          fuente?: string
          id?: string
          metrica?: string
          unidad?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      sal_registros: {
        Row: {
          aviso_medico: boolean
          creado_en: string
          etiqueta: string | null
          fecha: string
          id: string
          intensidad: number | null
          texto: string | null
          tipo: string
          user_id: string
        }
        Insert: {
          aviso_medico?: boolean
          creado_en?: string
          etiqueta?: string | null
          fecha: string
          id?: string
          intensidad?: number | null
          texto?: string | null
          tipo: string
          user_id: string
        }
        Update: {
          aviso_medico?: boolean
          creado_en?: string
          etiqueta?: string | null
          fecha?: string
          id?: string
          intensidad?: number | null
          texto?: string | null
          tipo?: string
          user_id?: string
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
          origen: string
          por_revisar: boolean
          siguiente_paso: string | null
          sin_guion: boolean
          titulo: string | null
        }
        Insert: {
          actualizado_en?: string
          estado: string
          fecha_trabajo?: string | null
          guion_md?: string | null
          id: string
          montaje_url?: string | null
          origen?: string
          por_revisar?: boolean
          siguiente_paso?: string | null
          sin_guion?: boolean
          titulo?: string | null
        }
        Update: {
          actualizado_en?: string
          estado?: string
          fecha_trabajo?: string | null
          guion_md?: string | null
          id?: string
          montaje_url?: string | null
          origen?: string
          por_revisar?: boolean
          siguiente_paso?: string | null
          sin_guion?: boolean
          titulo?: string | null
        }
        Relationships: []
      }
      videos_guion_historial: {
        Row: {
          creado: string
          guion_md: string
          id: number
          quien: string
          video_id: string
        }
        Insert: {
          creado?: string
          guion_md: string
          id?: never
          quien: string
          video_id: string
        }
        Update: {
          creado?: string
          guion_md?: string
          id?: never
          quien?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_guion_historial_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
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
      windsor_fotos_tiktok: {
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
      crear_encargo: {
        Args: {
          p_brutos: Json
          p_fase: string
          p_feedback: string
          p_guion_md: string
          p_instrucciones: Json
          p_quien: string
          p_reemplaza: string
          p_video: string
        }
        Returns: Json
      }
      entregar_montaje: {
        Args: {
          p_duracion: number
          p_fase: string
          p_notas: string
          p_quien: string
          p_url: string
          p_version: string
          p_video: string
        }
        Returns: Json
      }
      crear_ge_de_guion: {
        Args: { p_guion: string; p_guion_md: string }
        Returns: string
      }
      crear_ge_urgencia: {
        Args: { p_fecha: string; p_texto: string }
        Returns: string
      }
      decidir_encargo: {
        Args: {
          p_siempre: boolean
          p_texto: string
          p_tipo: string
          p_video: string
        }
        Returns: boolean
      }
      doc_buscar: {
        Args: { q: string }
        Returns: {
          documento_id: string
          extracto: string
          pagina: number
          relevancia: number
        }[]
      }
      encargo_revisado: {
        Args: { p_fase: string; p_resultado: string; p_video: string }
        Returns: undefined
      }
      es_permitido: { Args: never; Returns: boolean }
      fin_crear_categorias: { Args: { p_user_id: string }; Returns: undefined }
      hoy_guardar_resumen_sencillo: {
        Args: {
          p_fecha: string
          p_forzar: boolean
          p_prioridades: Json
          p_resumen: string
          p_senales: Json
          p_user: string
        }
        Returns: boolean
      }
      hoy_publicar_contexto: {
        Args: {
          p_agenda: Json
          p_correos: Json
          p_fecha: string
          p_user: string
        }
        Returns: undefined
      }
      preguntas_de_guion: {
        Args: { p_preguntas: Json; p_video: string }
        Returns: undefined
      }
      regla_cambiar: {
        Args: {
          p_accion: string
          p_estado: string
          p_por_que: string
          p_quien: string
          p_regla: Database["public"]["Tables"]["reglas"]["Row"]
          p_texto: string
        }
        Returns: number
      }
      regla_crear: {
        Args: {
          p_agente: string
          p_estado?: string
          p_evidencia: string
          p_medida: string
          p_origen?: string
          p_por_que: string
          p_quien: string
          p_regla: string
        }
        Returns: string
      }
      regla_decidir: {
        Args: { p_decision: string; p_id: string; p_texto: string }
        Returns: boolean
      }
      regla_deshacer: { Args: { p_id: string }; Returns: boolean }
      regla_editar: {
        Args: {
          p_clave: string
          p_por_que: string
          p_quien: string
          p_regla: string
        }
        Returns: number
      }
      regla_retirar: {
        Args: { p_clave: string; p_por_que: string; p_quien: string }
        Returns: number
      }
      rls_auditoria: {
        Args: never
        Returns: {
          tabla: string
        }[]
      }
      siguiente_ge: { Args: never; Returns: string }
      siguiente_regla: { Args: never; Returns: string }
      tomar_encargo: {
        Args: never
        Returns: {
          brutos: Json
          creado: string
          creado_por: string
          decision_jordi: string | null
          duracion_real_s: number | null
          error: string | null
          estado: string
          fase: string
          feedback: string | null
          final_url: string | null
          guion_md: string | null
          id: string
          instrucciones: Json
          preguntas: Json
          reemplaza_id: string | null
          reglas: Json
          resultado_notas: string | null
          resultado_url: string | null
          revisado_en: string | null
          terminado_en: string | null
          tomado_en: string | null
          version: number
          video_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "encargos_edicion"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

type Tablas = Database["public"]["Tables"]

// Una fila de cualquier tabla: Fila<"videos">, Fila<"preguntas">…
export type Fila<T extends keyof Tablas> = Tablas[T]["Row"]
