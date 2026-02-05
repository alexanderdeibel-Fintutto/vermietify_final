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
      bank_accounts: {
        Row: {
          account_name: string
          account_type: string
          balance_cents: number
          balance_date: string | null
          connection_id: string
          created_at: string
          currency: string
          finapi_account_id: string | null
          iban: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          account_name: string
          account_type?: string
          balance_cents?: number
          balance_date?: string | null
          connection_id: string
          created_at?: string
          currency?: string
          finapi_account_id?: string | null
          iban: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_type?: string
          balance_cents?: number
          balance_date?: string | null
          connection_id?: string
          created_at?: string
          currency?: string
          finapi_account_id?: string | null
          iban?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "finapi_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          account_id: string
          amount_cents: number
          booking_date: string
          booking_text: string | null
          counterpart_iban: string | null
          counterpart_name: string | null
          created_at: string
          currency: string
          finapi_transaction_id: string | null
          id: string
          match_confidence: number | null
          match_status: string
          matched_at: string | null
          matched_by: string | null
          matched_lease_id: string | null
          matched_payment_id: string | null
          matched_tenant_id: string | null
          purpose: string | null
          transaction_type: string | null
          value_date: string | null
        }
        Insert: {
          account_id: string
          amount_cents: number
          booking_date: string
          booking_text?: string | null
          counterpart_iban?: string | null
          counterpart_name?: string | null
          created_at?: string
          currency?: string
          finapi_transaction_id?: string | null
          id?: string
          match_confidence?: number | null
          match_status?: string
          matched_at?: string | null
          matched_by?: string | null
          matched_lease_id?: string | null
          matched_payment_id?: string | null
          matched_tenant_id?: string | null
          purpose?: string | null
          transaction_type?: string | null
          value_date?: string | null
        }
        Update: {
          account_id?: string
          amount_cents?: number
          booking_date?: string
          booking_text?: string | null
          counterpart_iban?: string | null
          counterpart_name?: string | null
          created_at?: string
          currency?: string
          finapi_transaction_id?: string | null
          id?: string
          match_confidence?: number | null
          match_status?: string
          matched_at?: string | null
          matched_by?: string | null
          matched_lease_id?: string | null
          matched_payment_id?: string | null
          matched_tenant_id?: string | null
          purpose?: string | null
          transaction_type?: string | null
          value_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_matched_lease_id_fkey"
            columns: ["matched_lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_matched_tenant_id_fkey"
            columns: ["matched_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      calendar_events: {
        Row: {
          all_day: boolean
          category: Database["public"]["Enums"]["calendar_category"]
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_at: string | null
          id: string
          is_auto_generated: boolean
          location: string | null
          organization_id: string
          recurrence_rule: Json | null
          related_id: string | null
          related_type:
            | Database["public"]["Enums"]["related_entity_type"]
            | null
          reminder_minutes: number[] | null
          start_at: string
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          category?: Database["public"]["Enums"]["calendar_category"]
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          is_auto_generated?: boolean
          location?: string | null
          organization_id: string
          recurrence_rule?: Json | null
          related_id?: string | null
          related_type?:
            | Database["public"]["Enums"]["related_entity_type"]
            | null
          reminder_minutes?: number[] | null
          start_at: string
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          category?: Database["public"]["Enums"]["calendar_category"]
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          is_auto_generated?: boolean
          location?: string | null
          organization_id?: string
          recurrence_rule?: Json | null
          related_id?: string | null
          related_type?:
            | Database["public"]["Enums"]["related_entity_type"]
            | null
          reminder_minutes?: number[] | null
          start_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_ical_tokens: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_accessed_at: string | null
          organization_id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_accessed_at?: string | null
          organization_id: string
          token?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_accessed_at?: string | null
          organization_id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_ical_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_reminders: {
        Row: {
          channel: Database["public"]["Enums"]["reminder_channel"]
          created_at: string
          event_id: string
          id: string
          remind_at: string
          sent: boolean
          sent_at: string | null
          user_id: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["reminder_channel"]
          created_at?: string
          event_id: string
          id?: string
          remind_at: string
          sent?: boolean
          sent_at?: string | null
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["reminder_channel"]
          created_at?: string
          event_id?: string
          id?: string
          remind_at?: string
          sent?: boolean
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_reminders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      co2_calculations: {
        Row: {
          applied_to_billing_id: string | null
          building_id: string
          calculation_details: Json | null
          co2_emission_factor: number
          co2_emissions_kg: number
          co2_per_sqm_year: number
          created_at: string
          created_by: string | null
          energy_certificate_id: string | null
          energy_consumption_kwh: number
          energy_source: string
          heated_area_sqm: number
          id: string
          landlord_cost_cents: number
          landlord_share_percent: number
          organization_id: string
          period_end: string
          period_start: string
          stage: number
          status: string
          tenant_cost_cents: number
          tenant_share_percent: number
          total_co2_cost_cents: number
          updated_at: string
        }
        Insert: {
          applied_to_billing_id?: string | null
          building_id: string
          calculation_details?: Json | null
          co2_emission_factor: number
          co2_emissions_kg: number
          co2_per_sqm_year: number
          created_at?: string
          created_by?: string | null
          energy_certificate_id?: string | null
          energy_consumption_kwh: number
          energy_source?: string
          heated_area_sqm: number
          id?: string
          landlord_cost_cents?: number
          landlord_share_percent: number
          organization_id: string
          period_end: string
          period_start: string
          stage: number
          status?: string
          tenant_cost_cents?: number
          tenant_share_percent: number
          total_co2_cost_cents?: number
          updated_at?: string
        }
        Update: {
          applied_to_billing_id?: string | null
          building_id?: string
          calculation_details?: Json | null
          co2_emission_factor?: number
          co2_emissions_kg?: number
          co2_per_sqm_year?: number
          created_at?: string
          created_by?: string | null
          energy_certificate_id?: string | null
          energy_consumption_kwh?: number
          energy_source?: string
          heated_area_sqm?: number
          id?: string
          landlord_cost_cents?: number
          landlord_share_percent?: number
          organization_id?: string
          period_end?: string
          period_start?: string
          stage?: number
          status?: string
          tenant_cost_cents?: number
          tenant_share_percent?: number
          total_co2_cost_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "co2_calculations_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "co2_calculations_energy_certificate_id_fkey"
            columns: ["energy_certificate_id"]
            isOneToOne: false
            referencedRelation: "energy_certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "co2_calculations_organization_id_fkey"
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
      document_ocr_results: {
        Row: {
          confidence_score: number | null
          created_at: string
          detected_type: string
          document_id: string
          extracted_data: Json | null
          id: string
          organization_id: string
          processed_at: string
          raw_text: string | null
          suggested_building_id: string | null
          suggested_category: string | null
          suggested_unit_id: string | null
          updated_at: string
          user_feedback: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          detected_type?: string
          document_id: string
          extracted_data?: Json | null
          id?: string
          organization_id: string
          processed_at?: string
          raw_text?: string | null
          suggested_building_id?: string | null
          suggested_category?: string | null
          suggested_unit_id?: string | null
          updated_at?: string
          user_feedback?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          detected_type?: string
          document_id?: string
          extracted_data?: Json | null
          id?: string
          organization_id?: string
          processed_at?: string
          raw_text?: string | null
          suggested_building_id?: string | null
          suggested_category?: string | null
          suggested_unit_id?: string | null
          updated_at?: string
          user_feedback?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_ocr_results_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_ocr_results_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_ocr_results_suggested_building_id_fkey"
            columns: ["suggested_building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_ocr_results_suggested_unit_id_fkey"
            columns: ["suggested_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
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
      elster_certificates: {
        Row: {
          certificate_fingerprint: string
          certificate_name: string
          created_at: string
          id: string
          is_active: boolean
          organization_id: string
          updated_at: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          certificate_fingerprint: string
          certificate_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id: string
          updated_at?: string
          valid_from: string
          valid_until: string
        }
        Update: {
          certificate_fingerprint?: string
          certificate_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "elster_certificates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      elster_notices: {
        Row: {
          assessed_tax_cents: number
          created_at: string
          declared_tax_cents: number
          difference_cents: number
          fetched_at: string
          id: string
          notes: string | null
          notice_date: string
          notice_pdf_path: string | null
          submission_id: string
        }
        Insert: {
          assessed_tax_cents?: number
          created_at?: string
          declared_tax_cents?: number
          difference_cents?: number
          fetched_at?: string
          id?: string
          notes?: string | null
          notice_date: string
          notice_pdf_path?: string | null
          submission_id: string
        }
        Update: {
          assessed_tax_cents?: number
          created_at?: string
          declared_tax_cents?: number
          difference_cents?: number
          fetched_at?: string
          id?: string
          notes?: string | null
          notice_date?: string
          notice_pdf_path?: string | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "elster_notices_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "elster_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      elster_settings: {
        Row: {
          auto_fetch_notices: boolean
          created_at: string
          id: string
          notification_email: string | null
          organization_id: string
          tax_number: string | null
          tax_office_id: string | null
          tax_office_name: string | null
          test_mode: boolean
          updated_at: string
        }
        Insert: {
          auto_fetch_notices?: boolean
          created_at?: string
          id?: string
          notification_email?: string | null
          organization_id: string
          tax_number?: string | null
          tax_office_id?: string | null
          tax_office_name?: string | null
          test_mode?: boolean
          updated_at?: string
        }
        Update: {
          auto_fetch_notices?: boolean
          created_at?: string
          id?: string
          notification_email?: string | null
          organization_id?: string
          tax_number?: string | null
          tax_office_id?: string | null
          tax_office_name?: string | null
          test_mode?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "elster_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      elster_submissions: {
        Row: {
          building_ids: string[] | null
          certificate_id: string | null
          created_at: string
          created_by: string | null
          data_json: Json
          error_message: string | null
          form_type: Database["public"]["Enums"]["elster_form_type"]
          id: string
          organization_id: string
          protocol_pdf_path: string | null
          response_xml: string | null
          status: Database["public"]["Enums"]["elster_status"]
          submitted_at: string | null
          tax_year: number
          transfer_ticket: string | null
          updated_at: string
          xml_content: string | null
        }
        Insert: {
          building_ids?: string[] | null
          certificate_id?: string | null
          created_at?: string
          created_by?: string | null
          data_json?: Json
          error_message?: string | null
          form_type: Database["public"]["Enums"]["elster_form_type"]
          id?: string
          organization_id: string
          protocol_pdf_path?: string | null
          response_xml?: string | null
          status?: Database["public"]["Enums"]["elster_status"]
          submitted_at?: string | null
          tax_year: number
          transfer_ticket?: string | null
          updated_at?: string
          xml_content?: string | null
        }
        Update: {
          building_ids?: string[] | null
          certificate_id?: string | null
          created_at?: string
          created_by?: string | null
          data_json?: Json
          error_message?: string | null
          form_type?: Database["public"]["Enums"]["elster_form_type"]
          id?: string
          organization_id?: string
          protocol_pdf_path?: string | null
          response_xml?: string | null
          status?: Database["public"]["Enums"]["elster_status"]
          submitted_at?: string | null
          tax_year?: number
          transfer_ticket?: string | null
          updated_at?: string
          xml_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "elster_submissions_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "elster_certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elster_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_log: {
        Row: {
          attachments: Json | null
          body_html: string
          created_at: string
          error_message: string | null
          id: string
          opened_at: string | null
          organization_id: string
          recipient_email: string
          recipient_tenant_id: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string
          subject: string
          template_id: string | null
        }
        Insert: {
          attachments?: Json | null
          body_html: string
          created_at?: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          organization_id: string
          recipient_email: string
          recipient_tenant_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_id?: string | null
        }
        Update: {
          attachments?: Json | null
          body_html?: string
          created_at?: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          organization_id?: string
          recipient_email?: string
          recipient_tenant_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_recipient_tenant_id_fkey"
            columns: ["recipient_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_html: string
          category: string
          created_at: string
          default_attachments: Json | null
          id: string
          is_system: boolean
          name: string
          organization_id: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          body_html: string
          category?: string
          created_at?: string
          default_attachments?: Json | null
          id?: string
          is_system?: boolean
          name: string
          organization_id?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          body_html?: string
          category?: string
          created_at?: string
          default_attachments?: Json | null
          id?: string
          is_system?: boolean
          name?: string
          organization_id?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_certificates: {
        Row: {
          building_id: string
          certificate_type: string
          co2_emission_factor: number | null
          created_at: string
          energy_demand_kwh_sqm: number | null
          energy_source: string
          id: string
          notes: string | null
          organization_id: string
          pdf_path: string | null
          primary_energy_demand: number | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          building_id: string
          certificate_type: string
          co2_emission_factor?: number | null
          created_at?: string
          energy_demand_kwh_sqm?: number | null
          energy_source?: string
          id?: string
          notes?: string | null
          organization_id: string
          pdf_path?: string | null
          primary_energy_demand?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          building_id?: string
          certificate_type?: string
          co2_emission_factor?: number | null
          created_at?: string
          energy_demand_kwh_sqm?: number | null
          energy_source?: string
          id?: string
          notes?: string | null
          organization_id?: string
          pdf_path?: string | null
          primary_energy_demand?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "energy_certificates_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "energy_certificates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      esignature_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          order_id: string
          signer_email: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          order_id: string
          signer_email?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          order_id?: string
          signer_email?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "esignature_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "esignature_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      esignature_orders: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          document_id: string | null
          document_name: string
          document_path: string | null
          document_type: string
          expires_at: string | null
          id: string
          last_reminder_at: string | null
          message: string | null
          organization_id: string
          provider: string
          provider_order_id: string | null
          reminder_days: number[] | null
          signature_fields: Json | null
          signed_document_path: string | null
          signers: Json
          status: Database["public"]["Enums"]["esignature_status"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          document_name: string
          document_path?: string | null
          document_type?: string
          expires_at?: string | null
          id?: string
          last_reminder_at?: string | null
          message?: string | null
          organization_id: string
          provider?: string
          provider_order_id?: string | null
          reminder_days?: number[] | null
          signature_fields?: Json | null
          signed_document_path?: string | null
          signers?: Json
          status?: Database["public"]["Enums"]["esignature_status"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          document_name?: string
          document_path?: string | null
          document_type?: string
          expires_at?: string | null
          id?: string
          last_reminder_at?: string | null
          message?: string | null
          organization_id?: string
          provider?: string
          provider_order_id?: string | null
          reminder_days?: number[] | null
          signature_fields?: Json | null
          signed_document_path?: string | null
          signers?: Json
          status?: Database["public"]["Enums"]["esignature_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "esignature_orders_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "esignature_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finapi_connections: {
        Row: {
          bank_bic: string | null
          bank_id: string
          bank_logo_url: string | null
          bank_name: string
          created_at: string
          error_message: string | null
          finapi_user_id: string | null
          id: string
          last_sync_at: string | null
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          bank_bic?: string | null
          bank_id: string
          bank_logo_url?: string | null
          bank_name: string
          created_at?: string
          error_message?: string | null
          finapi_user_id?: string | null
          id?: string
          last_sync_at?: string | null
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          bank_bic?: string | null
          bank_id?: string
          bank_logo_url?: string | null
          bank_name?: string
          created_at?: string
          error_message?: string | null
          finapi_user_id?: string | null
          id?: string
          last_sync_at?: string | null
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finapi_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      handover_defects: {
        Row: {
          created_at: string
          description: string
          estimated_cost_cents: number | null
          id: string
          is_tenant_responsible: boolean
          photo_paths: string[] | null
          protocol_id: string
          resolved_at: string | null
          room_id: string | null
          severity: Database["public"]["Enums"]["defect_severity"]
        }
        Insert: {
          created_at?: string
          description: string
          estimated_cost_cents?: number | null
          id?: string
          is_tenant_responsible?: boolean
          photo_paths?: string[] | null
          protocol_id: string
          resolved_at?: string | null
          room_id?: string | null
          severity?: Database["public"]["Enums"]["defect_severity"]
        }
        Update: {
          created_at?: string
          description?: string
          estimated_cost_cents?: number | null
          id?: string
          is_tenant_responsible?: boolean
          photo_paths?: string[] | null
          protocol_id?: string
          resolved_at?: string | null
          room_id?: string | null
          severity?: Database["public"]["Enums"]["defect_severity"]
        }
        Relationships: [
          {
            foreignKeyName: "handover_defects_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "handover_protocols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handover_defects_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "handover_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      handover_keys: {
        Row: {
          created_at: string
          handed_over: boolean
          id: string
          key_label: string | null
          key_type: Database["public"]["Enums"]["key_type"]
          notes: string | null
          protocol_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          handed_over?: boolean
          id?: string
          key_label?: string | null
          key_type: Database["public"]["Enums"]["key_type"]
          notes?: string | null
          protocol_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          handed_over?: boolean
          id?: string
          key_label?: string | null
          key_type?: Database["public"]["Enums"]["key_type"]
          notes?: string | null
          protocol_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "handover_keys_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "handover_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      handover_protocols: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          organization_id: string
          participants: Json
          pdf_path: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["handover_status"]
          tenant_id: string | null
          type: Database["public"]["Enums"]["handover_type"]
          unit_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          participants?: Json
          pdf_path?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["handover_status"]
          tenant_id?: string | null
          type: Database["public"]["Enums"]["handover_type"]
          unit_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          participants?: Json
          pdf_path?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["handover_status"]
          tenant_id?: string | null
          type?: Database["public"]["Enums"]["handover_type"]
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "handover_protocols_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handover_protocols_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handover_protocols_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      handover_rooms: {
        Row: {
          created_at: string
          id: string
          items: Json
          notes: string | null
          order_index: number
          overall_status: string | null
          photos: string[] | null
          protocol_id: string
          room_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
          order_index?: number
          overall_status?: string | null
          photos?: string[] | null
          protocol_id: string
          room_name: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
          order_index?: number
          overall_status?: string | null
          photos?: string[] | null
          protocol_id?: string
          room_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "handover_rooms_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "handover_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      handover_signatures: {
        Row: {
          id: string
          protocol_id: string
          signature_path: string
          signed_at: string
          signer_name: string
          signer_type: Database["public"]["Enums"]["signer_type"]
        }
        Insert: {
          id?: string
          protocol_id: string
          signature_path: string
          signed_at?: string
          signer_name: string
          signer_type: Database["public"]["Enums"]["signer_type"]
        }
        Update: {
          id?: string
          protocol_id?: string
          signature_path?: string
          signed_at?: string
          signer_name?: string
          signer_type?: Database["public"]["Enums"]["signer_type"]
        }
        Relationships: [
          {
            foreignKeyName: "handover_signatures_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "handover_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      lease_rent_settings: {
        Row: {
          created_at: string
          id: string
          index_announcement_months: number | null
          index_base_date: string | null
          index_base_value: number | null
          index_min_change_percent: number | null
          last_adjustment_date: string | null
          lease_id: string
          next_adjustment_due: string | null
          rent_type: Database["public"]["Enums"]["rent_adjustment_type"]
          staffel_steps: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          index_announcement_months?: number | null
          index_base_date?: string | null
          index_base_value?: number | null
          index_min_change_percent?: number | null
          last_adjustment_date?: string | null
          lease_id: string
          next_adjustment_due?: string | null
          rent_type?: Database["public"]["Enums"]["rent_adjustment_type"]
          staffel_steps?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          index_announcement_months?: number | null
          index_base_date?: string | null
          index_base_value?: number | null
          index_min_change_percent?: number | null
          last_adjustment_date?: string | null
          lease_id?: string
          next_adjustment_due?: string | null
          rent_type?: Database["public"]["Enums"]["rent_adjustment_type"]
          staffel_steps?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lease_rent_settings_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: true
            referencedRelation: "leases"
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
      listing_inquiries: {
        Row: {
          contacted_at: string | null
          created_at: string
          email: string | null
          id: string
          listing_id: string
          message: string | null
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          portal_source: Database["public"]["Enums"]["portal_type"] | null
          status: Database["public"]["Enums"]["inquiry_status"]
          updated_at: string
          viewing_at: string | null
        }
        Insert: {
          contacted_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          listing_id: string
          message?: string | null
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          portal_source?: Database["public"]["Enums"]["portal_type"] | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          updated_at?: string
          viewing_at?: string | null
        }
        Update: {
          contacted_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          listing_id?: string
          message?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          portal_source?: Database["public"]["Enums"]["portal_type"] | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          updated_at?: string
          viewing_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_inquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_inquiries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_portals: {
        Row: {
          created_at: string
          error_message: string | null
          external_id: string | null
          id: string
          last_sync_at: string | null
          listing_id: string
          portal: Database["public"]["Enums"]["portal_type"]
          published_at: string | null
          status: Database["public"]["Enums"]["portal_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          last_sync_at?: string | null
          listing_id: string
          portal: Database["public"]["Enums"]["portal_type"]
          published_at?: string | null
          status?: Database["public"]["Enums"]["portal_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          last_sync_at?: string | null
          listing_id?: string
          portal?: Database["public"]["Enums"]["portal_type"]
          published_at?: string | null
          status?: Database["public"]["Enums"]["portal_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_portals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_settings: {
        Row: {
          auto_deactivate_on_rental: boolean | null
          auto_reply_enabled: boolean | null
          auto_reply_message: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          default_description: string | null
          id: string
          notify_on_inquiry: boolean | null
          organization_id: string
          updated_at: string
          viewing_time_slots: Json | null
        }
        Insert: {
          auto_deactivate_on_rental?: boolean | null
          auto_reply_enabled?: boolean | null
          auto_reply_message?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          default_description?: string | null
          id?: string
          notify_on_inquiry?: boolean | null
          organization_id: string
          updated_at?: string
          viewing_time_slots?: Json | null
        }
        Update: {
          auto_deactivate_on_rental?: boolean | null
          auto_reply_enabled?: boolean | null
          auto_reply_message?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          default_description?: string | null
          id?: string
          notify_on_inquiry?: boolean | null
          organization_id?: string
          updated_at?: string
          viewing_time_slots?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          available_from: string | null
          commission: string | null
          created_at: string
          deposit: number | null
          description: string | null
          energy_certificate_type: string | null
          energy_class: string | null
          energy_value: number | null
          features: Json | null
          heating_costs: number | null
          heating_included: boolean | null
          id: string
          main_photo_index: number | null
          organization_id: string
          photos: string[] | null
          rent_additional: number | null
          rent_cold: number
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          available_from?: string | null
          commission?: string | null
          created_at?: string
          deposit?: number | null
          description?: string | null
          energy_certificate_type?: string | null
          energy_class?: string | null
          energy_value?: number | null
          features?: Json | null
          heating_costs?: number | null
          heating_included?: boolean | null
          id?: string
          main_photo_index?: number | null
          organization_id: string
          photos?: string[] | null
          rent_additional?: number | null
          rent_cold?: number
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          available_from?: string | null
          commission?: string | null
          created_at?: string
          deposit?: number | null
          description?: string | null
          energy_certificate_type?: string | null
          energy_class?: string | null
          energy_value?: number | null
          features?: Json | null
          heating_costs?: number | null
          heating_included?: boolean | null
          id?: string
          main_photo_index?: number | null
          organization_id?: string
          photos?: string[] | null
          rent_additional?: number | null
          rent_cold?: number
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
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
      notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          id: string
          in_app_enabled: boolean
          notification_type: Database["public"]["Enums"]["notification_type"]
          push_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          notification_type: Database["public"]["Enums"]["notification_type"]
          push_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          notification_type?: Database["public"]["Enums"]["notification_type"]
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string
          digest_frequency: string
          email_frequency: string
          id: string
          quiet_hours_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          digest_frequency?: string
          email_frequency?: string
          id?: string
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          digest_frequency?: string
          email_frequency?: string
          id?: string
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          organization_id: string
          read_at: string | null
          related_id: string | null
          related_type: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          organization_id: string
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          organization_id?: string
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      portal_connections: {
        Row: {
          active_listings_count: number | null
          api_credentials: Json | null
          created_at: string
          error_message: string | null
          id: string
          is_connected: boolean | null
          last_sync_at: string | null
          organization_id: string
          portal: Database["public"]["Enums"]["portal_type"]
          status: string | null
          updated_at: string
        }
        Insert: {
          active_listings_count?: number | null
          api_credentials?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          is_connected?: boolean | null
          last_sync_at?: string | null
          organization_id: string
          portal: Database["public"]["Enums"]["portal_type"]
          status?: string | null
          updated_at?: string
        }
        Update: {
          active_listings_count?: number | null
          api_credentials?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          is_connected?: boolean | null
          last_sync_at?: string | null
          organization_id?: string
          portal?: Database["public"]["Enums"]["portal_type"]
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_connections_organization_id_fkey"
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      rent_adjustments: {
        Row: {
          announcement_document_id: string | null
          announcement_sent_at: string | null
          created_at: string
          created_by: string | null
          effective_date: string
          id: string
          index_change_percent: number | null
          index_new: number | null
          index_old: number | null
          lease_id: string
          new_rent_cents: number
          notes: string | null
          old_rent_cents: number
          organization_id: string
          status: Database["public"]["Enums"]["rent_adjustment_status"]
          step_number: number | null
          type: Database["public"]["Enums"]["rent_adjustment_type"]
          updated_at: string
        }
        Insert: {
          announcement_document_id?: string | null
          announcement_sent_at?: string | null
          created_at?: string
          created_by?: string | null
          effective_date: string
          id?: string
          index_change_percent?: number | null
          index_new?: number | null
          index_old?: number | null
          lease_id: string
          new_rent_cents: number
          notes?: string | null
          old_rent_cents: number
          organization_id: string
          status?: Database["public"]["Enums"]["rent_adjustment_status"]
          step_number?: number | null
          type: Database["public"]["Enums"]["rent_adjustment_type"]
          updated_at?: string
        }
        Update: {
          announcement_document_id?: string | null
          announcement_sent_at?: string | null
          created_at?: string
          created_by?: string | null
          effective_date?: string
          id?: string
          index_change_percent?: number | null
          index_new?: number | null
          index_old?: number | null
          lease_id?: string
          new_rent_cents?: number
          notes?: string | null
          old_rent_cents?: number
          organization_id?: string
          status?: Database["public"]["Enums"]["rent_adjustment_status"]
          step_number?: number | null
          type?: Database["public"]["Enums"]["rent_adjustment_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rent_adjustments_announcement_document_id_fkey"
            columns: ["announcement_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_adjustments_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_adjustments_organization_id_fkey"
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
      transaction_rules: {
        Row: {
          action_config: Json
          action_type: string
          conditions: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          last_match_at: string | null
          match_count: number
          name: string
          organization_id: string
          priority: number
          updated_at: string
        }
        Insert: {
          action_config?: Json
          action_type: string
          conditions?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_match_at?: string | null
          match_count?: number
          name: string
          organization_id: string
          priority?: number
          updated_at?: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          conditions?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_match_at?: string | null
          match_count?: number
          name?: string
          organization_id?: string
          priority?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_rules_organization_id_fkey"
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
      vpi_index: {
        Row: {
          change_yoy_percent: number | null
          created_at: string
          fetched_at: string
          id: string
          month: number
          value: number
          year: number
        }
        Insert: {
          change_yoy_percent?: number | null
          created_at?: string
          fetched_at?: string
          id?: string
          month: number
          value: number
          year: number
        }
        Update: {
          change_yoy_percent?: number | null
          created_at?: string
          fetched_at?: string
          id?: string
          month?: number
          value?: number
          year?: number
        }
        Relationships: []
      }
      whatsapp_broadcasts: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          delivered_count: number | null
          failed_count: number | null
          id: string
          name: string
          organization_id: string
          read_count: number | null
          recipient_count: number | null
          recipient_filter: Json
          scheduled_at: string | null
          sent_count: number | null
          started_at: string | null
          status: string
          template_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          delivered_count?: number | null
          failed_count?: number | null
          id?: string
          name: string
          organization_id: string
          read_count?: number | null
          recipient_count?: number | null
          recipient_filter?: Json
          scheduled_at?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string
          template_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          delivered_count?: number | null
          failed_count?: number | null
          id?: string
          name?: string
          organization_id?: string
          read_count?: number | null
          recipient_count?: number | null
          recipient_filter?: Json
          scheduled_at?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_broadcasts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_broadcasts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_contacts: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          last_message_at: string | null
          opt_out_at: string | null
          opted_in: boolean
          opted_in_at: string | null
          organization_id: string
          phone: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          last_message_at?: string | null
          opt_out_at?: string | null
          opted_in?: boolean
          opted_in_at?: string | null
          organization_id: string
          phone: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          last_message_at?: string | null
          opt_out_at?: string | null
          opted_in?: boolean
          opted_in_at?: string | null
          organization_id?: string
          phone?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          contact_id: string | null
          contact_phone: string
          content: string | null
          created_at: string
          direction: string
          error_message: string | null
          id: string
          media_url: string | null
          message_type: string
          organization_id: string
          status: string | null
          template_name: string | null
          template_params: Json | null
          whatsapp_message_id: string | null
        }
        Insert: {
          contact_id?: string | null
          contact_phone: string
          content?: string | null
          created_at?: string
          direction: string
          error_message?: string | null
          id?: string
          media_url?: string | null
          message_type?: string
          organization_id: string
          status?: string | null
          template_name?: string | null
          template_params?: Json | null
          whatsapp_message_id?: string | null
        }
        Update: {
          contact_id?: string | null
          contact_phone?: string
          content?: string | null
          created_at?: string
          direction?: string
          error_message?: string | null
          id?: string
          media_url?: string | null
          message_type?: string
          organization_id?: string
          status?: string | null
          template_name?: string | null
          template_params?: Json | null
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_settings: {
        Row: {
          access_token_encrypted: string | null
          away_enabled: boolean | null
          away_message: string | null
          business_account_id: string | null
          business_address: string | null
          business_description: string | null
          business_name: string | null
          created_at: string
          greeting_message: string | null
          id: string
          organization_id: string
          phone_number_id: string | null
          updated_at: string
          webhook_verify_token: string | null
        }
        Insert: {
          access_token_encrypted?: string | null
          away_enabled?: boolean | null
          away_message?: string | null
          business_account_id?: string | null
          business_address?: string | null
          business_description?: string | null
          business_name?: string | null
          created_at?: string
          greeting_message?: string | null
          id?: string
          organization_id: string
          phone_number_id?: string | null
          updated_at?: string
          webhook_verify_token?: string | null
        }
        Update: {
          access_token_encrypted?: string | null
          away_enabled?: boolean | null
          away_message?: string | null
          business_account_id?: string | null
          business_address?: string | null
          business_description?: string | null
          business_name?: string | null
          created_at?: string
          greeting_message?: string | null
          id?: string
          organization_id?: string
          phone_number_id?: string | null
          updated_at?: string
          webhook_verify_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          body: string
          buttons: Json | null
          category: string
          created_at: string
          footer: string | null
          header_content: string | null
          header_type: string | null
          id: string
          is_system: boolean
          language: string
          name: string
          organization_id: string
          rejection_reason: string | null
          status: string
          updated_at: string
          whatsapp_template_id: string | null
        }
        Insert: {
          body: string
          buttons?: Json | null
          category: string
          created_at?: string
          footer?: string | null
          header_content?: string | null
          header_type?: string | null
          id?: string
          is_system?: boolean
          language?: string
          name: string
          organization_id: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          whatsapp_template_id?: string | null
        }
        Update: {
          body?: string
          buttons?: Json | null
          category?: string
          created_at?: string
          footer?: string | null
          header_content?: string | null
          header_type?: string | null
          id?: string
          is_system?: boolean
          language?: string
          name?: string
          organization_id?: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          whatsapp_template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: number | null
          duration_ms: number | null
          error_message: string | null
          id: string
          organization_id: string
          status: Database["public"]["Enums"]["workflow_execution_status"]
          steps: Json | null
          trigger_data: Json | null
          triggered_at: string
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: number | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          organization_id: string
          status?: Database["public"]["Enums"]["workflow_execution_status"]
          steps?: Json | null
          trigger_data?: Json | null
          triggered_at?: string
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: number | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["workflow_execution_status"]
          steps?: Json | null
          trigger_data?: Json | null
          triggered_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          actions: Json
          conditions: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          error_count: number
          execution_count: number
          id: string
          is_active: boolean
          is_template: boolean
          last_executed_at: string | null
          name: string
          organization_id: string | null
          template_category: string | null
          trigger_config: Json
          trigger_type: Database["public"]["Enums"]["workflow_trigger_type"]
          updated_at: string
        }
        Insert: {
          actions?: Json
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          error_count?: number
          execution_count?: number
          id?: string
          is_active?: boolean
          is_template?: boolean
          last_executed_at?: string | null
          name: string
          organization_id?: string | null
          template_category?: string | null
          trigger_config?: Json
          trigger_type: Database["public"]["Enums"]["workflow_trigger_type"]
          updated_at?: string
        }
        Update: {
          actions?: Json
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          error_count?: number
          execution_count?: number
          id?: string
          is_active?: boolean
          is_template?: boolean
          last_executed_at?: string | null
          name?: string
          organization_id?: string | null
          template_category?: string | null
          trigger_config?: Json
          trigger_type?: Database["public"]["Enums"]["workflow_trigger_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      calendar_category:
        | "viewing"
        | "handover"
        | "deadline"
        | "payment"
        | "maintenance"
        | "other"
      defect_severity: "light" | "medium" | "severe"
      document_type:
        | "contract"
        | "protocol"
        | "invoice"
        | "insurance"
        | "tax"
        | "correspondence"
        | "other"
      elster_form_type:
        | "anlage_v"
        | "anlage_kap"
        | "anlage_so"
        | "ust_va"
        | "ust_jahreserklaerung"
      elster_status:
        | "draft"
        | "validating"
        | "submitted"
        | "accepted"
        | "rejected"
        | "notice_received"
      esignature_status:
        | "draft"
        | "sent"
        | "viewed"
        | "signed"
        | "declined"
        | "expired"
        | "cancelled"
      handover_status: "planned" | "in_progress" | "completed" | "signed"
      handover_type: "move_in" | "move_out"
      inquiry_status: "new" | "contacted" | "viewing" | "cancelled" | "rented"
      key_type:
        | "front_door"
        | "apartment"
        | "basement"
        | "mailbox"
        | "garage"
        | "other"
      letter_status:
        | "draft"
        | "submitted"
        | "printing"
        | "sent"
        | "delivered"
        | "error"
        | "cancelled"
      listing_status: "draft" | "active" | "paused" | "rented"
      meter_status: "current" | "reading_due" | "overdue"
      meter_type: "electricity" | "gas" | "water" | "heating"
      notification_type:
        | "payment_received"
        | "payment_overdue"
        | "payment_reminder"
        | "contract_ending"
        | "contract_created"
        | "contract_terminated"
        | "tenant_created"
        | "tenant_document"
        | "task_assigned"
        | "task_due"
        | "task_completed"
        | "meter_reading_due"
        | "meter_reading_submitted"
        | "document_uploaded"
        | "document_signed"
        | "message_received"
        | "inquiry_received"
        | "billing_created"
        | "billing_sent"
        | "workflow_completed"
        | "workflow_failed"
        | "system_alert"
        | "system_info"
      portal_status: "pending" | "published" | "error" | "removed"
      portal_type: "immoscout" | "immowelt" | "ebay" | "website"
      related_entity_type:
        | "building"
        | "unit"
        | "tenant"
        | "contract"
        | "handover"
      reminder_channel: "app" | "email" | "push"
      rent_adjustment_status: "pending" | "announced" | "active" | "cancelled"
      rent_adjustment_type: "index" | "staffel" | "vergleichsmiete"
      signer_type: "landlord" | "tenant" | "witness" | "caretaker"
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
      workflow_action_type:
        | "send_email"
        | "create_notification"
        | "create_task"
        | "send_letter"
        | "send_whatsapp"
        | "update_field"
        | "call_webhook"
        | "wait"
      workflow_execution_status: "running" | "completed" | "failed"
      workflow_trigger_type:
        | "time_daily"
        | "time_weekly"
        | "time_monthly"
        | "time_yearly"
        | "event_tenant_created"
        | "event_contract_created"
        | "event_contract_terminated"
        | "event_payment_overdue"
        | "event_payment_received"
        | "event_meter_reading_due"
        | "event_document_uploaded"
        | "event_task_created"
        | "event_contract_ending"
        | "event_building_created"
        | "event_unit_created"
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
      calendar_category: [
        "viewing",
        "handover",
        "deadline",
        "payment",
        "maintenance",
        "other",
      ],
      defect_severity: ["light", "medium", "severe"],
      document_type: [
        "contract",
        "protocol",
        "invoice",
        "insurance",
        "tax",
        "correspondence",
        "other",
      ],
      elster_form_type: [
        "anlage_v",
        "anlage_kap",
        "anlage_so",
        "ust_va",
        "ust_jahreserklaerung",
      ],
      elster_status: [
        "draft",
        "validating",
        "submitted",
        "accepted",
        "rejected",
        "notice_received",
      ],
      esignature_status: [
        "draft",
        "sent",
        "viewed",
        "signed",
        "declined",
        "expired",
        "cancelled",
      ],
      handover_status: ["planned", "in_progress", "completed", "signed"],
      handover_type: ["move_in", "move_out"],
      inquiry_status: ["new", "contacted", "viewing", "cancelled", "rented"],
      key_type: [
        "front_door",
        "apartment",
        "basement",
        "mailbox",
        "garage",
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
      listing_status: ["draft", "active", "paused", "rented"],
      meter_status: ["current", "reading_due", "overdue"],
      meter_type: ["electricity", "gas", "water", "heating"],
      notification_type: [
        "payment_received",
        "payment_overdue",
        "payment_reminder",
        "contract_ending",
        "contract_created",
        "contract_terminated",
        "tenant_created",
        "tenant_document",
        "task_assigned",
        "task_due",
        "task_completed",
        "meter_reading_due",
        "meter_reading_submitted",
        "document_uploaded",
        "document_signed",
        "message_received",
        "inquiry_received",
        "billing_created",
        "billing_sent",
        "workflow_completed",
        "workflow_failed",
        "system_alert",
        "system_info",
      ],
      portal_status: ["pending", "published", "error", "removed"],
      portal_type: ["immoscout", "immowelt", "ebay", "website"],
      related_entity_type: [
        "building",
        "unit",
        "tenant",
        "contract",
        "handover",
      ],
      reminder_channel: ["app", "email", "push"],
      rent_adjustment_status: ["pending", "announced", "active", "cancelled"],
      rent_adjustment_type: ["index", "staffel", "vergleichsmiete"],
      signer_type: ["landlord", "tenant", "witness", "caretaker"],
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
      workflow_action_type: [
        "send_email",
        "create_notification",
        "create_task",
        "send_letter",
        "send_whatsapp",
        "update_field",
        "call_webhook",
        "wait",
      ],
      workflow_execution_status: ["running", "completed", "failed"],
      workflow_trigger_type: [
        "time_daily",
        "time_weekly",
        "time_monthly",
        "time_yearly",
        "event_tenant_created",
        "event_contract_created",
        "event_contract_terminated",
        "event_payment_overdue",
        "event_payment_received",
        "event_meter_reading_due",
        "event_document_uploaded",
        "event_task_created",
        "event_contract_ending",
        "event_building_created",
        "event_unit_created",
      ],
    },
  },
} as const
