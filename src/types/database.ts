/**
 * Database types — mirrors the PostgreSQL schema exactly.
 * Generated from Supabase: supabase gen types typescript --local > src/types/database.ts
 * This file is a manual placeholder until the Supabase project is created.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          whatsapp: string
          email: string | null
          notes: string | null
          vip: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          whatsapp: string
          email?: string | null
          notes?: string | null
          vip?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          whatsapp?: string
          email?: string | null
          notes?: string | null
          vip?: boolean
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          duration: number
          price: number
          is_whatsapp_only: boolean
          active: boolean
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          duration: number
          price: number
          is_whatsapp_only?: boolean
          active?: boolean
          position?: number
          created_at?: string
        }
        Update: {
          name?: string
          slug?: string
          description?: string | null
          duration?: number
          price?: number
          is_whatsapp_only?: boolean
          active?: boolean
          position?: number
        }
      }
      complements: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          price: number
          active: boolean
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          price: number
          active?: boolean
          position?: number
          created_at?: string
        }
        Update: {
          name?: string
          slug?: string
          description?: string | null
          price?: number
          active?: boolean
          position?: number
        }
      }
      service_complements: {
        Row: {
          service_id: string
          complement_id: string
        }
        Insert: {
          service_id: string
          complement_id: string
        }
        Update: {
          service_id?: string
          complement_id?: string
        }
      }
      appointment_complements: {
        Row: {
          appointment_id: string
          complement_id: string
          price: number
        }
        Insert: {
          appointment_id: string
          complement_id: string
          price: number
        }
        Update: {
          price?: number
        }
      }
      time_slots: {
        Row: {
          id: string
          date: string
          start_time: string
          end_time: string
          is_vip: boolean
          status: 'available' | 'blocked' | 'booked'
        }
        Insert: {
          id?: string
          date: string
          start_time: string
          end_time: string
          is_vip?: boolean
          status?: 'available' | 'blocked' | 'booked'
        }
        Update: {
          status?: 'available' | 'blocked' | 'booked'
          is_vip?: boolean
        }
      }
      appointments: {
        Row: {
          id: string
          reference_code: string
          client_id: string
          service_id: string
          slot_id: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          notes: string | null
          reminder_sent: boolean
          cancelled_at: string | null
          cancellation_reason: string | null
          service_price: number
          complements_price: number
          total_price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reference_code?: string
          client_id: string
          service_id: string
          slot_id: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          notes?: string | null
          reminder_sent?: boolean
          cancelled_at?: string | null
          cancellation_reason?: string | null
          service_price?: number
          complements_price?: number
          total_price?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          notes?: string | null
          reminder_sent?: boolean
          cancelled_at?: string | null
          cancellation_reason?: string | null
          updated_at?: string
        }
      }
      blocked_periods: {
        Row: {
          id: string
          date_start: string
          date_end: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          date_start: string
          date_end: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          date_start?: string
          date_end?: string
          reason?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
