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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          context: string | null
          created_at: string
          id: string
          messages: Json
          organization_id: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          id?: string
          messages?: Json
          organization_id?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: string | null
          created_at?: string
          id?: string
          messages?: Json
          organization_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          address: string
          building_type: Database["public"]["Enums"]["building_type"]
          city: string
          created_at: string
          id: string
          name: string
          notes: string | null
          organization_id: string
          postal_code: string
          total_area: number | null
          updated_at: string
          year_built: number | null
        }
        Insert: {
          address: string
          building_type?: Database["public"]["Enums"]["building_type"]
          city: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          postal_code: string
          total_area?: number | null
          updated_at?: string
          year_built?: number | null
        }
        Update: {
          address?: string
          building_type?: Database["public"]["Enums"]["building_type"]
          city?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          postal_code?: string
          total_area?: number | null
          updated_at?: string
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "buildings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_types: {
        Row: {
          category: string
          created_at: string
          default_distribution_key: string
          description: string | null
          id: string
          is_chargeable: boolean
          is_system: boolean
          name: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          default_distribution_key?: string
          description?: string | null
          id?: string
          is_chargeable?: boolean
          is_system?: boolean
          name: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          default_distribution_key?: string
          description?: string | null
          id?: string
          is_chargeable?: boolean
          is_system?: boolean
          name?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_requests: {
        Row: {
          created_at: string
          document_type: string
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          status: string
          tenant_id: string
          tenant_user_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          tenant_id: string
          tenant_user_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          tenant_id?: string
          tenant_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          building_id: string | null
          created_at: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_size: number | null
          file_url: string
          id: string
          lease_id: string | null
          notes: string | null
          organization_id: string
          tenant_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          building_id?: string | null
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          file_size?: number | null
          file_url: string
          id?: string
          lease_id?: string | null
          notes?: string | null
          organization_id: string
          tenant_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          building_id?: string | null
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          file_size?: number | null
          file_url?: string
          id?: string
          lease_id?: string | null
          notes?: string | null
          organization_id?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          created_at: string
          deposit_amount: number | null
          deposit_paid: boolean | null
          end_date: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          payment_day: number | null
          rent_amount: number
          start_date: string
          tenant_id: string
          unit_id: string
          updated_at: string
          utility_advance: number | null
        }
        Insert: {
          created_at?: string
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          payment_day?: number | null
          rent_amount: number
          start_date: string
          tenant_id: string
          unit_id: string
          updated_at?: string
          utility_advance?: number | null
        }
        Update: {
          created_at?: string
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          payment_day?: number | null
          rent_amount?: number
          start_date?: string
          tenant_id?: string
          unit_id?: string
          updated_at?: string
          utility_advance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      letter_automation_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          last_run_at: string | null
          name: string
          organization_id: string
          template_id: string | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name: string
          organization_id: string
          template_id?: string | null
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name?: string
          organization_id?: string
          template_id?: string | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "letter_automation_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letter_automation_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "letter_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      letter_orders: {
        Row: {
          content_pdf_path: string | null
          cost_cents: number | null
          created_at: string
          created_by: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          letterxpress_id: string | null
          options: Json | null
          organization_id: string
          pages: number | null
          recipient_address: Json
          recipient_id: string | null
          recipient_type: string
          scheduled_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["letter_status"] | null
          subject: string
          template_id: string | null
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          content_pdf_path?: string | null
          cost_cents?: number | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          letterxpress_id?: string | null
          options?: Json | null
          organization_id: string
          pages?: number | null
          recipient_address: Json
          recipient_id?: string | null
          recipient_type?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["letter_status"] | null
          subject: string
          template_id?: string | null
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          content_pdf_path?: string | null
          cost_cents?: number | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          letterxpress_id?: string | null
          options?: Json | null
          organization_id?: string
          pages?: number | null
          recipient_address?: Json
          recipient_id?: string | null
          recipient_type?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["letter_status"] | null
          subject?: string
          template_id?: string | null
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "letter_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letter_orders_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "letter_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      letter_settings: {
        Row: {
          api_key_encrypted: string | null
          created_at: string
          default_sender: Json | null
          id: string
          letterhead_pdf_path: string | null
          organization_id: string
          test_mode: boolean | null
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          created_at?: string
          default_sender?: Json | null
          id?: string
          letterhead_pdf_path?: string | null
          organization_id: string
          test_mode?: boolean | null
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          created_at?: string
          default_sender?: Json | null
          id?: string
          letterhead_pdf_path?: string | null
          organization_id?: string
          test_mode?: boolean | null
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "letter_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      letter_templates: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_system: boolean | null
          name: string
          organization_id: string | null
          placeholders: Json | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          is_system?: boolean | null
          name: string
          organization_id?: string | null
          placeholders?: Json | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_system?: boolean | null
          name?: string
          organization_id?: string | null
          placeholders?: Json | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "letter_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          organization_id: string
          sent_at: string | null
          subject: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          organization_id: string
          sent_at?: string | null
          subject: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          organization_id?: string
          sent_at?: string | null
          subject?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      meter_readings: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          meter_id: string
          notes: string | null
          reading_date: string
          reading_value: number
          recorded_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          meter_id: string
          notes?: string | null
          reading_date: string
          reading_value: number
          recorded_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          meter_id?: string
          notes?: string | null
          reading_date?: string
          reading_value?: number
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meter_readings_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "meters"
            referencedColumns: ["id"]
          },
        ]
      }
      meters: {
        Row: {
          calibration_valid_until: string | null
          created_at: string
          id: string
          installation_date: string | null
          meter_number: string
          meter_type: Database["public"]["Enums"]["meter_type"]
          notes: string | null
          reading_interval_months: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          calibration_valid_until?: string | null
          created_at?: string
          id?: string
          installation_date?: string | null
          meter_number: string
          meter_type: Database["public"]["Enums"]["meter_type"]
          notes?: string | null
          reading_interval_months?: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          calibration_valid_until?: string | null
          created_at?: string
          id?: string
          installation_date?: string | null
          meter_number?: string
          meter_type?: Database["public"]["Enums"]["meter_type"]
          notes?: string | null
          reading_interval_months?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meters_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      operating_cost_items: {
        Row: {
          amount: number
          cost_name: string
          cost_type: string
          created_at: string
          distribution_key: string
          id: string
          is_custom: boolean
          statement_id: string
        }
        Insert: {
          amount?: number
          cost_name: string
          cost_type: string
          created_at?: string
          distribution_key: string
          id?: string
          is_custom?: boolean
          statement_id: string
        }
        Update: {
          amount?: number
          cost_name?: string
          cost_type?: string
          created_at?: string
          distribution_key?: string
          id?: string
          is_custom?: boolean
          statement_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operating_cost_items_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "operating_cost_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      operating_cost_statements: {
        Row: {
          building_id: string
          created_at: string
          id: string
          options_generate_pdf: boolean
          options_individual_statements: boolean
          options_send_email: boolean
          organization_id: string
          payment_deadline: string | null
          period_end: string
          period_start: string
          status: string
          total_costs: number
          updated_at: string
          vacancy_costs_to_landlord: boolean
        }
        Insert: {
          building_id: string
          created_at?: string
          id?: string
          options_generate_pdf?: boolean
          options_individual_statements?: boolean
          options_send_email?: boolean
          organization_id: string
          payment_deadline?: string | null
          period_end: string
          period_start: string
          status?: string
          total_costs?: number
          updated_at?: string
          vacancy_costs_to_landlord?: boolean
        }
        Update: {
          building_id?: string
          created_at?: string
          id?: string
          options_generate_pdf?: boolean
          options_individual_statements?: boolean
          options_send_email?: boolean
          organization_id?: string
          payment_deadline?: string | null
          period_end?: string
          period_start?: string
          status?: string
          total_costs?: number
          updated_at?: string
          vacancy_costs_to_landlord?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "operating_cost_statements_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operating_cost_statements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      operating_cost_tenant_results: {
        Row: {
          area: number
          cost_breakdown: Json | null
          cost_share: number
          created_at: string
          heating_share: number
          id: string
          is_vacant: boolean
          persons: number
          prepayments: number
          result: number
          statement_id: string
          tenant_id: string | null
          tenant_name: string | null
          unit_id: string
          unit_number: string
        }
        Insert: {
          area?: number
          cost_breakdown?: Json | null
          cost_share?: number
          created_at?: string
          heating_share?: number
          id?: string
          is_vacant?: boolean
          persons?: number
          prepayments?: number
          result?: number
          statement_id: string
          tenant_id?: string | null
          tenant_name?: string | null
          unit_id: string
          unit_number: string
        }
        Update: {
          area?: number
          cost_breakdown?: Json | null
          cost_share?: number
          created_at?: string
          heating_share?: number
          id?: string
          is_vacant?: boolean
          persons?: number
          prepayments?: number
          result?: number
          statement_id?: string
          tenant_id?: string | null
          tenant_name?: string | null
          unit_id?: string
          unit_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "operating_cost_tenant_results_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "operating_cost_statements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operating_cost_tenant_results_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operating_cost_tenant_results_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          is_personal: boolean | null
          logo_url: string | null
          name: string
          owner_user_id: string | null
          phone: string | null
          postal_code: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_personal?: boolean | null
          logo_url?: string | null
          name: string
          owner_user_id?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_personal?: boolean | null
          logo_url?: string | null
          name?: string
          owner_user_id?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          onboarding_completed: boolean | null
          organization_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_completed?: boolean | null
          organization_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_completed?: boolean | null
          organization_id?: string | null
          updated_at?: string
          user_id?: string
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
      task_activities: {
        Row: {
          action: string
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          task_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_activities_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          created_at: string
          file_path: string
          file_type: string
          id: string
          task_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_path: string
          file_type?: string
          id?: string
          task_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string
          file_type?: string
          id?: string
          task_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          building_id: string | null
          category: Database["public"]["Enums"]["task_category"] | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean | null
          organization_id: string
          priority: string | null
          source: Database["public"]["Enums"]["task_source"] | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          building_id?: string | null
          category?: Database["public"]["Enums"]["task_category"] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          organization_id: string
          priority?: string | null
          source?: Database["public"]["Enums"]["task_source"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          building_id?: string | null
          category?: Database["public"]["Enums"]["task_category"] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          organization_id?: string
          priority?: string | null
          source?: Database["public"]["Enums"]["task_source"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_documents: {
        Row: {
          amount: number | null
          building_id: string | null
          category: string
          created_at: string
          document_date: string | null
          file_size: number | null
          file_url: string
          id: string
          notes: string | null
          ocr_data: Json | null
          organization_id: string
          title: string
          updated_at: string
          year: number
        }
        Insert: {
          amount?: number | null
          building_id?: string | null
          category: string
          created_at?: string
          document_date?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          notes?: string | null
          ocr_data?: Json | null
          organization_id: string
          title: string
          updated_at?: string
          year: number
        }
        Update: {
          amount?: number | null
          building_id?: string | null
          category?: string
          created_at?: string
          document_date?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          notes?: string | null
          ocr_data?: Json | null
          organization_id?: string
          title?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "tax_documents_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_unit_access: {
        Row: {
          granted_at: string
          id: string
          lease_id: string | null
          tenant_id: string
          tenant_user_id: string
          unit_id: string
        }
        Insert: {
          granted_at?: string
          id?: string
          lease_id?: string | null
          tenant_id: string
          tenant_user_id: string
          unit_id: string
        }
        Update: {
          granted_at?: string
          id?: string
          lease_id?: string | null
          tenant_id?: string
          tenant_user_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_unit_access_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_unit_access_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_unit_access_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          organization_id: string
          phone: string | null
          postal_code: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          building_id: string | null
          created_at: string
          description: string | null
          id: string
          is_income: boolean
          lease_id: string | null
          organization_id: string
          transaction_date: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          building_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_income?: boolean
          lease_id?: string | null
          organization_id: string
          transaction_date: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          building_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_income?: boolean
          lease_id?: string | null
          organization_id?: string
          transaction_date?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          area: number
          building_id: string
          created_at: string
          floor: number | null
          id: string
          notes: string | null
          rent_amount: number
          rooms: number
          status: Database["public"]["Enums"]["unit_status"]
          unit_number: string
          updated_at: string
          utility_advance: number | null
        }
        Insert: {
          area: number
          building_id: string
          created_at?: string
          floor?: number | null
          id?: string
          notes?: string | null
          rent_amount: number
          rooms: number
          status?: Database["public"]["Enums"]["unit_status"]
          unit_number: string
          updated_at?: string
          utility_advance?: number | null
        }
        Update: {
          area?: number
          building_id?: string
          created_at?: string
          floor?: number | null
          id?: string
          notes?: string | null
          rent_amount?: number
          rooms?: number
          status?: Database["public"]["Enums"]["unit_status"]
          unit_number?: string
          updated_at?: string
          utility_advance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "units_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
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
      user_subscriptions: {
        Row: {
          app_id: string
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          app_id?: string
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          app_id?: string
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      utility_costs: {
        Row: {
          amount: number
          billing_year: number
          building_id: string
          cost_type: string
          created_at: string
          distribution_key: string
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          billing_year: number
          building_id: string
          cost_type: string
          created_at?: string
          distribution_key?: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_year?: number
          building_id?: string
          cost_type?: string
          created_at?: string
          distribution_key?: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "utility_costs_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_personal_organization: {
        Args: { _first_name?: string; _last_name?: string; _user_id: string }
        Returns: string
      }
      get_user_organization_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member" | "tenant"
      building_type: "apartment" | "house" | "commercial" | "mixed"
      document_type:
        | "contract"
        | "protocol"
        | "invoice"
        | "insurance"
        | "tax"
        | "correspondence"
        | "other"
      letter_status:
        | "draft"
        | "submitted"
        | "printing"
        | "sent"
        | "delivered"
        | "error"
        | "cancelled"
      meter_status: "current" | "reading_due" | "overdue"
      meter_type: "electricity" | "gas" | "water" | "heating"
      task_category: "water_damage" | "heating" | "electrical" | "other"
      task_source: "tenant" | "landlord" | "caretaker"
      task_status: "open" | "in_progress" | "completed" | "cancelled"
      transaction_type:
        | "rent"
        | "deposit"
        | "utility"
        | "repair"
        | "insurance"
        | "tax"
        | "other_income"
        | "other_expense"
      unit_status: "rented" | "vacant" | "renovating"
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
      app_role: ["admin", "member", "tenant"],
      building_type: ["apartment", "house", "commercial", "mixed"],
      document_type: [
        "contract",
        "protocol",
        "invoice",
        "insurance",
        "tax",
        "correspondence",
        "other",
      ],
      letter_status: [
        "draft",
        "submitted",
        "printing",
        "sent",
        "delivered",
        "error",
        "cancelled",
      ],
      meter_status: ["current", "reading_due", "overdue"],
      meter_type: ["electricity", "gas", "water", "heating"],
      task_category: ["water_damage", "heating", "electrical", "other"],
      task_source: ["tenant", "landlord", "caretaker"],
      task_status: ["open", "in_progress", "completed", "cancelled"],
      transaction_type: [
        "rent",
        "deposit",
        "utility",
        "repair",
        "insurance",
        "tax",
        "other_income",
        "other_expense",
      ],
      unit_status: ["rented", "vacant", "renovating"],
    },
  },
} as const
