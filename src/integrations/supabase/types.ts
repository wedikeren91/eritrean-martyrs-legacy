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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_action_log: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          id: string
          note: string | null
          target_id: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          id?: string
          note?: string | null
          target_id?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          id?: string
          note?: string | null
          target_id?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string
          description: string | null
          emoji: string
          id: string
          name: string
          threshold: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          name: string
          threshold: number
        }
        Update: {
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          name?: string
          threshold?: number
        }
        Relationships: []
      }
      bulk_uploads: {
        Row: {
          created_at: string
          error_rows: number | null
          errors_json: Json | null
          file_name: string
          id: string
          organization_id: string | null
          parsed_rows: number | null
          status: string
          total_rows: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_rows?: number | null
          errors_json?: Json | null
          file_name: string
          id?: string
          organization_id?: string | null
          parsed_rows?: number | null
          status?: string
          total_rows?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_rows?: number | null
          errors_json?: Json | null
          file_name?: string
          id?: string
          organization_id?: string | null
          parsed_rows?: number | null
          status?: string
          total_rows?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulk_uploads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contributions: {
        Row: {
          bulk_upload_id: string | null
          id: string
          organization_id: string | null
          person_data: Json
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_type: string
          status: Database["public"]["Enums"]["contribution_status"]
          submitted_at: string
          user_id: string
        }
        Insert: {
          bulk_upload_id?: string | null
          id?: string
          organization_id?: string | null
          person_data: Json
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_type?: string
          status?: Database["public"]["Enums"]["contribution_status"]
          submitted_at?: string
          user_id: string
        }
        Update: {
          bulk_upload_id?: string | null
          id?: string
          organization_id?: string | null
          person_data?: Json
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_type?: string
          status?: Database["public"]["Enums"]["contribution_status"]
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributions_bulk_upload_id_fkey"
            columns: ["bulk_upload_id"]
            isOneToOne: false
            referencedRelation: "bulk_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      martyr_profiles: {
        Row: {
          affiliation: string
          birth_city: string | null
          birth_date: string | null
          birth_province: string | null
          created_at: string
          death_date: string | null
          first_name: string
          gender: string
          id: string
          last_name: string
          life_story: string | null
          profile_picture_url: string | null
          status: string
          submitted_by: string | null
          updated_at: string
          verification_document_url: string | null
        }
        Insert: {
          affiliation: string
          birth_city?: string | null
          birth_date?: string | null
          birth_province?: string | null
          created_at?: string
          death_date?: string | null
          first_name: string
          gender?: string
          id?: string
          last_name: string
          life_story?: string | null
          profile_picture_url?: string | null
          status?: string
          submitted_by?: string | null
          updated_at?: string
          verification_document_url?: string | null
        }
        Update: {
          affiliation?: string
          birth_city?: string | null
          birth_date?: string | null
          birth_province?: string | null
          created_at?: string
          death_date?: string | null
          first_name?: string
          gender?: string
          id?: string
          last_name?: string
          life_story?: string | null
          profile_picture_url?: string | null
          status?: string
          submitted_by?: string | null
          updated_at?: string
          verification_document_url?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          country: string | null
          created_at: string
          display_name: string | null
          id: string
          logo_url: string | null
          name: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_plan: string | null
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          logo_url?: string | null
          name: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      persons: {
        Row: {
          approved_by: string | null
          battle: string | null
          bio: string | null
          category: string | null
          city: string | null
          created_at: string
          date_of_birth: string | null
          date_of_death: string | null
          deleted_at: string | null
          first_name: string
          id: string
          known_as: string | null
          last_name: string
          organization_id: string | null
          photo_url: string | null
          place_of_martyrdom: string | null
          quote: string | null
          rank: string | null
          region: string | null
          role: string | null
          significance: string | null
          slug: string
          status: string | null
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          battle?: string | null
          bio?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          date_of_death?: string | null
          deleted_at?: string | null
          first_name: string
          id?: string
          known_as?: string | null
          last_name: string
          organization_id?: string | null
          photo_url?: string | null
          place_of_martyrdom?: string | null
          quote?: string | null
          rank?: string | null
          region?: string | null
          role?: string | null
          significance?: string | null
          slug: string
          status?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          battle?: string | null
          bio?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          date_of_death?: string | null
          deleted_at?: string | null
          first_name?: string
          id?: string
          known_as?: string | null
          last_name?: string
          organization_id?: string | null
          photo_url?: string | null
          place_of_martyrdom?: string | null
          quote?: string | null
          rank?: string | null
          region?: string | null
          role?: string | null
          significance?: string | null
          slug?: string
          status?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "persons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          display_name: string | null
          id: string
          organization_id: string | null
          permissions: Json
          phone: string | null
          public_email: boolean | null
          public_location: boolean | null
          public_name: boolean | null
          public_phone: boolean | null
          relation: string | null
          state_province: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          organization_id?: string | null
          permissions?: Json
          phone?: string | null
          public_email?: boolean | null
          public_location?: boolean | null
          public_name?: boolean | null
          public_phone?: boolean | null
          relation?: string | null
          state_province?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          organization_id?: string | null
          permissions?: Json
          phone?: string | null
          public_email?: boolean | null
          public_location?: boolean | null
          public_name?: boolean | null
          public_phone?: boolean | null
          relation?: string | null
          state_province?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tributes: {
        Row: {
          created_at: string
          flower_count: number | null
          id: string
          message: string | null
          person_id: string
          tribute_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          flower_count?: number | null
          id?: string
          message?: string | null
          person_id: string
          tribute_type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          flower_count?: number | null
          id?: string
          message?: string | null
          person_id?: string
          tribute_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tributes_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_contribution: {
        Args: { _admin_id?: string; _contribution_id: string }
        Returns: string
      }
      check_approval_rate_limit: {
        Args: { _admin_id: string }
        Returns: undefined
      }
      check_badge_awards: { Args: { _user_id: string }; Returns: undefined }
      check_contributor_promotion: {
        Args: { _user_id: string }
        Returns: undefined
      }
      check_delete_rate_limit: {
        Args: { _admin_id: string }
        Returns: undefined
      }
      check_edit_rate_limit: { Args: { _admin_id: string }; Returns: undefined }
      count_admin_actions: {
        Args: { _action: string; _admin_id: string; _days: number }
        Returns: number
      }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_founder: { Args: never; Returns: boolean }
      log_edit_action: { Args: { _person_id: string }; Returns: undefined }
      reject_contribution: {
        Args: { _admin_id?: string; _contribution_id: string; _reason?: string }
        Returns: undefined
      }
      restore_person: { Args: { _person_id: string }; Returns: undefined }
      soft_delete_person: { Args: { _person_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "user" | "contributor" | "org_admin" | "founder"
      contribution_status: "pending" | "approved" | "rejected"
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
      app_role: ["user", "contributor", "org_admin", "founder"],
      contribution_status: ["pending", "approved", "rejected"],
    },
  },
} as const
