/**
 * Database types — generated from the live Supabase schema. Do not edit by
 * hand; regenerate after any migration via the Supabase MCP
 * `generate_typescript_types` tool (or `supabase gen types typescript
 * --project-id mgzwmunzvtrwmhykyxcl` if using the CLI locally).
 * Last regenerated: 2026-07-31 (staff_members.avatar_url).
 */
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
      appointment_complements: {
        Row: {
          appointment_id: string
          complement_id: string
          price: number | null
        }
        Insert: {
          appointment_id: string
          complement_id: string
          price?: number | null
        }
        Update: {
          appointment_id?: string
          complement_id?: string
          price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_complements_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_complements_complement_id_fkey"
            columns: ["complement_id"]
            isOneToOne: false
            referencedRelation: "complements"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          checked_in_at: string | null
          checked_out_at: string | null
          client_id: string
          complements_price: number
          created_at: string
          discount: number | null
          id: string
          notes: string | null
          reference_code: string
          reminder_sent: boolean
          service_id: string
          service_price: number
          slot_id: string
          source: string
          started_at: string | null
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          checked_in_at?: string | null
          checked_out_at?: string | null
          client_id: string
          complements_price?: number
          created_at?: string
          discount?: number | null
          id?: string
          notes?: string | null
          reference_code: string
          reminder_sent?: boolean
          service_id: string
          service_price?: number
          slot_id: string
          source?: string
          started_at?: string | null
          status?: string
          total_price?: number
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          checked_in_at?: string | null
          checked_out_at?: string | null
          client_id?: string
          complements_price?: number
          created_at?: string
          discount?: number | null
          id?: string
          notes?: string | null
          reference_code?: string
          reminder_sent?: boolean
          service_id?: string
          service_price?: number
          slot_id?: string
          source?: string
          started_at?: string | null
          status?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string
          created_at: string
          id: string
          metadata: Json | null
          summary: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name: string
          created_at?: string
          id?: string
          metadata?: Json | null
          summary: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          summary?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      availability_rules: {
        Row: {
          active: boolean
          end_time: string
          id: string
          start_time: string
          weekday: number
        }
        Insert: {
          active?: boolean
          end_time: string
          id?: string
          start_time: string
          weekday: number
        }
        Update: {
          active?: boolean
          end_time?: string
          id?: string
          start_time?: string
          weekday?: number
        }
        Relationships: []
      }
      blocked_periods: {
        Row: {
          created_at: string
          date_end: string
          date_start: string
          id: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          date_end: string
          date_start: string
          id?: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          date_end?: string
          date_start?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          consent_terms: boolean
          consent_whatsapp: boolean
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          last_login_at: string | null
          name: string
          notes: string | null
          receive_reminder_emails: boolean
          updated_at: string
          vip: boolean
          whatsapp: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          consent_terms?: boolean
          consent_whatsapp?: boolean
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          last_login_at?: string | null
          name: string
          notes?: string | null
          receive_reminder_emails?: boolean
          updated_at?: string
          vip?: boolean
          whatsapp: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          consent_terms?: boolean
          consent_whatsapp?: boolean
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          last_login_at?: string | null
          name?: string
          notes?: string | null
          receive_reminder_emails?: boolean
          updated_at?: string
          vip?: boolean
          whatsapp?: string
        }
        Relationships: []
      }
      complements: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          position: number
          price: number | null
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          position?: number
          price?: number | null
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          position?: number
          price?: number | null
          slug?: string
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          appointment_id: string
          coupon_id: string
          created_at: string
          discount_amount: number
          id: string
        }
        Insert: {
          appointment_id: string
          coupon_id: string
          created_at?: string
          discount_amount: number
          id?: string
        }
        Update: {
          appointment_id?: string
          coupon_id?: string
          created_at?: string
          discount_amount?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_uses: number | null
          uses_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          uses_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          uses_count?: number
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          due_date: string
          id: string
          is_fixed: boolean
          paid_date: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description: string
          due_date: string
          id?: string
          is_fixed?: boolean
          paid_date?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          is_fixed?: boolean
          paid_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_redemptions: {
        Row: {
          client_id: string
          id: string
          notes: string | null
          redeemed_at: string
          redeemed_by: string | null
        }
        Insert: {
          client_id: string
          id?: string
          notes?: string | null
          redeemed_at?: string
          redeemed_by?: string | null
        }
        Update: {
          client_id?: string
          id?: string
          notes?: string | null
          redeemed_at?: string
          redeemed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_redemptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_settings: {
        Row: {
          active: boolean
          id: string
          reward_description: string
          updated_at: string
          visits_required: number
        }
        Insert: {
          active?: boolean
          id?: string
          reward_description?: string
          updated_at?: string
          visits_required?: number
        }
        Update: {
          active?: boolean
          id?: string
          reward_description?: string
          updated_at?: string
          visits_required?: number
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          phone: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          phone: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
        }
        Relationships: []
      }
      payment_fee_settings: {
        Row: {
          active: boolean
          created_at: string
          fee_percentage: number
          id: string
          method: string
          pix_key: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          fee_percentage?: number
          id?: string
          method: string
          pix_key?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          fee_percentage?: number
          id?: string
          method?: string
          pix_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          appointment_id: string
          created_at: string
          fee_amount: number
          fee_percentage: number
          gross_amount: number
          id: string
          method: string
          net_amount: number
          paid_at: string
          receipt_number: number
          refund_reason: string | null
          refunded_at: string | null
          tip_amount: number
        }
        Insert: {
          appointment_id: string
          created_at?: string
          fee_amount?: number
          fee_percentage?: number
          gross_amount: number
          id?: string
          method: string
          net_amount: number
          paid_at?: string
          receipt_number?: number
          refund_reason?: string | null
          refunded_at?: string | null
          tip_amount?: number
        }
        Update: {
          appointment_id?: string
          created_at?: string
          fee_amount?: number
          fee_percentage?: number
          gross_amount?: number
          id?: string
          method?: string
          net_amount?: number
          paid_at?: string
          receipt_number?: number
          refund_reason?: string | null
          refunded_at?: string | null
          tip_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          appointment_id: string
          client_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          service_id: string
          status: string
          updated_at: string
        }
        Insert: {
          appointment_id: string
          client_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          service_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          client_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          service_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_complements: {
        Row: {
          complement_id: string
          service_id: string
        }
        Insert: {
          complement_id: string
          service_id: string
        }
        Update: {
          complement_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_complements_complement_id_fkey"
            columns: ["complement_id"]
            isOneToOne: false
            referencedRelation: "complements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_complements_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          duration: number
          hidden_from_list: boolean
          id: string
          is_whatsapp_only: boolean
          name: string
          position: number
          price: number
          price_negotiable: boolean
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration: number
          hidden_from_list?: boolean
          id?: string
          is_whatsapp_only?: boolean
          name: string
          position?: number
          price: number
          price_negotiable?: boolean
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration?: number
          hidden_from_list?: boolean
          id?: string
          is_whatsapp_only?: boolean
          name?: string
          position?: number
          price?: number
          price_negotiable?: boolean
          slug?: string
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
          role: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          id: string
          name: string
          phone?: string | null
          role: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
      time_slots: {
        Row: {
          blocked_period_id: string | null
          date: string
          end_time: string
          id: string
          is_vip: boolean
          start_time: string
          status: string
        }
        Insert: {
          blocked_period_id?: string | null
          date: string
          end_time: string
          id?: string
          is_vip?: boolean
          start_time: string
          status?: string
        }
        Update: {
          blocked_period_id?: string | null
          date?: string
          end_time?: string
          id?: string
          is_vip?: boolean
          start_time?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_slots_blocked_period_id_fkey"
            columns: ["blocked_period_id"]
            isOneToOne: false
            referencedRelation: "blocked_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_entries: {
        Row: {
          client_id: string
          created_at: string
          id: string
          note: string | null
          notified_at: string | null
          preferred_date: string
          service_id: string
          status: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          note?: string | null
          notified_at?: string | null
          preferred_date: string
          service_id: string
          status?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          note?: string | null
          notified_at?: string | null
          preferred_date?: string
          service_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: { p_key: string; p_max: number; p_window_seconds: number }
        Returns: boolean
      }
      next_appointment_reference: { Args: never; Returns: string }
      redeem_coupon: {
        Args: { p_coupon_id: string }
        Returns: {
          discount_type: string
          discount_value: number
        }[]
      }
      release_coupon: { Args: { p_coupon_id: string }; Returns: undefined }
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
