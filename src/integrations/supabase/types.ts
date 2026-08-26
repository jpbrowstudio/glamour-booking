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
      blocks: {
        Row: {
          created_at: string
          date: string
          id: string
          time: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          time?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          time?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          anio: number | null
          area_code: string
          created_at: string
          date: string
          dia: number | null
          email: string
          id: string
          mes: number | null
          name: string
          notes: string | null
          phone: string
          reminder_at: string | null
          service_id: string
          service_name: string
          status: string
          time: string
        }
        Insert: {
          anio?: number | null
          area_code?: string
          created_at?: string
          date: string
          dia?: number | null
          email?: string
          id?: string
          mes?: number | null
          name: string
          notes?: string | null
          phone: string
          reminder_at?: string | null
          service_id: string
          service_name: string
          status?: string
          time: string
        }
        Update: {
          anio?: number | null
          area_code?: string
          created_at?: string
          date?: string
          dia?: number | null
          email?: string
          id?: string
          mes?: number | null
          name?: string
          notes?: string | null
          phone?: string
          reminder_at?: string | null
          service_id?: string
          service_name?: string
          status?: string
          time?: string
        }
        Relationships: []
      }
      carrusel: {
        Row: {
          activo: boolean
          created_at: string
          id_imagen: number
          imagen_url: string
          orden: number
          storage_path: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id_imagen?: never
          imagen_url: string
          orden?: number
          storage_path?: string | null
          titulo?: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id_imagen?: never
          imagen_url?: string
          orden?: number
          storage_path?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      horas_disponibles: {
        Row: {
          activo: boolean
          created_at: string
          dia_semana: number | null
          hora: string
          id_hora: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          dia_semana?: number | null
          hora: string
          id_hora?: never
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          dia_semana?: number | null
          hora?: string
          id_hora?: never
          updated_at?: string
        }
        Relationships: []
      }
      servicios: {
        Row: {
          activo: boolean
          created_at: string
          detalle_s: string
          duracion_min: number
          id_servicio: number
          nombre_s: string
          orden: number
          precio_s: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          detalle_s?: string
          duracion_min?: number
          id_servicio?: never
          nombre_s: string
          orden?: number
          precio_s?: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          detalle_s?: string
          duracion_min?: number
          id_servicio?: never
          nombre_s?: string
          orden?: number
          precio_s?: number
          updated_at?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          activo: boolean
          correo: string
          created_at: string
          id_usuario: number
          msn_whatsapp: string
          nombre: string
          telefono: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          correo: string
          created_at?: string
          id_usuario?: never
          msn_whatsapp?: string
          nombre: string
          telefono: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          correo?: string
          created_at?: string
          id_usuario?: never
          msn_whatsapp?: string
          nombre?: string
          telefono?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_availability: {
        Args: { _from: string; _to: string }
        Returns: {
          date: string
          id: string
          service_id: string
          status: string
          time: string
        }[]
      }
      is_studio_owner: { Args: never; Returns: boolean }
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
