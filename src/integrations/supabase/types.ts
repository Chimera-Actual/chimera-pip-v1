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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      assistant_webhooks: {
        Row: {
          assistant_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          webhook_url: string
        }
        Insert: {
          assistant_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          webhook_url: string
        }
        Update: {
          assistant_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          webhook_url?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          session_id: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          role: string
          session_id: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          session_id: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          auto_save_enabled: boolean | null
          created_at: string
          crt_effects_enabled: boolean | null
          data_backup_enabled: boolean | null
          id: string
          location_enabled: boolean | null
          location_latitude: number | null
          location_longitude: number | null
          location_name: string | null
          notifications_enabled: boolean | null
          sound_enabled: boolean | null
          theme_mode: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_save_enabled?: boolean | null
          created_at?: string
          crt_effects_enabled?: boolean | null
          data_backup_enabled?: boolean | null
          id?: string
          location_enabled?: boolean | null
          location_latitude?: number | null
          location_longitude?: number | null
          location_name?: string | null
          notifications_enabled?: boolean | null
          sound_enabled?: boolean | null
          theme_mode?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_save_enabled?: boolean | null
          created_at?: string
          crt_effects_enabled?: boolean | null
          data_backup_enabled?: boolean | null
          id?: string
          location_enabled?: boolean | null
          location_latitude?: number | null
          location_longitude?: number | null
          location_name?: string | null
          notifications_enabled?: boolean | null
          sound_enabled?: boolean | null
          theme_mode?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_tabs: {
        Row: {
          created_at: string
          font_size: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          position: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          font_size?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          position?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          font_size?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          position?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_widget_instances: {
        Row: {
          created_at: string
          custom_name: string | null
          id: string
          is_active: boolean | null
          position: number | null
          tab_id: string
          updated_at: string
          user_id: string
          widget_id: string
        }
        Insert: {
          created_at?: string
          custom_name?: string | null
          id?: string
          is_active?: boolean | null
          position?: number | null
          tab_id: string
          updated_at?: string
          user_id: string
          widget_id: string
        }
        Update: {
          created_at?: string
          custom_name?: string | null
          id?: string
          is_active?: boolean | null
          position?: number | null
          tab_id?: string
          updated_at?: string
          user_id?: string
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_widget_instances_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "user_tabs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_widget_instances_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widget_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_widget_settings: {
        Row: {
          created_at: string
          id: string
          settings: Json | null
          updated_at: string
          user_id: string
          widget_instance_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          settings?: Json | null
          updated_at?: string
          user_id: string
          widget_instance_id: string
        }
        Update: {
          created_at?: string
          id?: string
          settings?: Json | null
          updated_at?: string
          user_id?: string
          widget_instance_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_widget_settings_instance"
            columns: ["widget_instance_id"]
            isOneToOne: false
            referencedRelation: "user_widget_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_widget_instance"
            columns: ["widget_instance_id"]
            isOneToOne: false
            referencedRelation: "user_widget_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_definitions: {
        Row: {
          category: string
          component_name: string
          created_at: string
          default_settings: Json | null
          description: string | null
          icon: string
          id: string
          name: string
        }
        Insert: {
          category: string
          component_name: string
          created_at?: string
          default_settings?: Json | null
          description?: string | null
          icon: string
          id: string
          name: string
        }
        Update: {
          category?: string
          component_name?: string
          created_at?: string
          default_settings?: Json | null
          description?: string | null
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      widget_instance_images: {
        Row: {
          created_at: string | null
          id: string
          image_path: string
          image_purpose: string
          updated_at: string | null
          widget_instance_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_path: string
          image_purpose?: string
          updated_at?: string | null
          widget_instance_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_path?: string
          image_purpose?: string
          updated_at?: string | null
          widget_instance_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "widget_instance_images_widget_instance_id_fkey"
            columns: ["widget_instance_id"]
            isOneToOne: false
            referencedRelation: "user_widget_instances"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
