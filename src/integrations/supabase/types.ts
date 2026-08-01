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
      contact_info: {
        Row: {
          address_line: string
          email: string
          hours_weekday: string
          hours_weekend: string
          id: number
          instagram_url: string
          map_embed_url: string
          phone: string
          tiktok_url: string
          updated_at: string
          x_url: string
        }
        Insert: {
          address_line?: string
          email?: string
          hours_weekday?: string
          hours_weekend?: string
          id?: number
          instagram_url?: string
          map_embed_url?: string
          phone?: string
          tiktok_url?: string
          updated_at?: string
          x_url?: string
        }
        Update: {
          address_line?: string
          email?: string
          hours_weekday?: string
          hours_weekend?: string
          id?: number
          instagram_url?: string
          map_embed_url?: string
          phone?: string
          tiktok_url?: string
          updated_at?: string
          x_url?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string
          status?: string
          subject?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string
          status?: string
          subject?: string
        }
        Relationships: []
      }
      daily_specials: {
        Row: {
          active: boolean
          badge: string
          created_at: string
          day: string
          description: string
          id: string
          image_url: string | null
          price: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          badge?: string
          created_at?: string
          day?: string
          description?: string
          id?: string
          image_url?: string | null
          price?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          badge?: string
          created_at?: string
          day?: string
          description?: string
          id?: string
          image_url?: string | null
          price?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          active: boolean
          calories: number | null
          category: string
          category_id: string | null
          created_at: string
          description: string
          id: string
          name: string
          price: string
          sort_order: number
          tag: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          calories?: number | null
          category: string
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          name: string
          price: string
          sort_order?: number
          tag?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          calories?: number | null
          category?: string
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          name?: string
          price?: string
          sort_order?: number
          tag?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string
        }
        Relationships: []
      }
      nfl_streamed_games: {
        Row: {
          created_at: string
          date_time: string | null
          game_id: number
          id: string
          label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_time?: string | null
          game_id: number
          id?: string
          label?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_time?: string | null
          game_id?: number
          id?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          path: string
          referrer: string | null
          session_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          referrer?: string | null
          session_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      party_shows: {
        Row: {
          act: string
          active: boolean
          created_at: string
          date_label: string
          event_type: string
          genre: string
          id: string
          image_url: string | null
          sort_order: number
          time_label: string
          updated_at: string
        }
        Insert: {
          act: string
          active?: boolean
          created_at?: string
          date_label: string
          event_type?: string
          genre?: string
          id?: string
          image_url?: string | null
          sort_order?: number
          time_label: string
          updated_at?: string
        }
        Update: {
          act?: string
          active?: boolean
          created_at?: string
          date_label?: string
          event_type?: string
          genre?: string
          id?: string
          image_url?: string | null
          sort_order?: number
          time_label?: string
          updated_at?: string
        }
        Relationships: []
      }
      party_spaces: {
        Row: {
          active: boolean
          capacity: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          price: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          capacity: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          name: string
          price: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          capacity?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          price?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string
          date: string
          email: string
          id: string
          name: string
          party_size: number
          phone: string
          special_requests: string | null
          status: string
          time: string
        }
        Insert: {
          created_at?: string
          date: string
          email: string
          id?: string
          name: string
          party_size: number
          phone: string
          special_requests?: string | null
          status?: string
          time: string
        }
        Update: {
          created_at?: string
          date?: string
          email?: string
          id?: string
          name?: string
          party_size?: number
          phone?: string
          special_requests?: string | null
          status?: string
          time?: string
        }
        Relationships: []
      }
      site_media: {
        Row: {
          hero_video_url: string | null
          id: number
          updated_at: string
        }
        Insert: {
          hero_video_url?: string | null
          id?: number
          updated_at?: string
        }
        Update: {
          hero_video_url?: string | null
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: number
          notification_email: string
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          id?: number
          notification_email?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Update: {
          id?: number
          notification_email?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      space_reservations: {
        Row: {
          created_at: string
          email: string
          event_date: string
          id: string
          message: string | null
          name: string
          party_size: number
          phone: string
          space: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          event_date: string
          id?: string
          message?: string | null
          name: string
          party_size: number
          phone: string
          space: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          event_date?: string
          id?: string
          message?: string | null
          name?: string
          party_size?: number
          phone?: string
          space?: string
          status?: string
        }
        Relationships: []
      }
      sports_cache: {
        Row: {
          cache_key: string
          payload: Json
          updated_at: string
        }
        Insert: {
          cache_key: string
          payload: Json
          updated_at?: string
        }
        Update: {
          cache_key?: string
          payload?: Json
          updated_at?: string
        }
        Relationships: []
      }
      sports_schedule: {
        Row: {
          active: boolean
          created_at: string
          id: string
          league: string
          match_label: string
          note: string
          sort_order: number
          updated_at: string
          when_label: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          league: string
          match_label: string
          note?: string
          sort_order?: number
          updated_at?: string
          when_label: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          league?: string
          match_label?: string
          note?: string
          sort_order?: number
          updated_at?: string
          when_label?: string
        }
        Relationships: []
      }
      ufc_streamed_events: {
        Row: {
          created_at: string
          date_time: string | null
          event_id: number
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_time?: string | null
          event_id: number
          id?: string
          name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_time?: string | null
          event_id?: number
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_pulse: {
        Row: {
          accent: boolean
          active: boolean
          copy: string
          created_at: string
          days_label: string
          id: string
          image_url: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          accent?: boolean
          active?: boolean
          copy?: string
          created_at?: string
          days_label?: string
          id?: string
          image_url?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Update: {
          accent?: boolean
          active?: boolean
          copy?: string
          created_at?: string
          days_label?: string
          id?: string
          image_url?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_first_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
