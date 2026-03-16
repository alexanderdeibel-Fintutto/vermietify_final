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
      app_invitations: {
        Row: {
          accepted_at: string | null
          app_id: string
          app_name: string
          company_id: string
          created_at: string
          id: string
          property_address: string | null
          property_name: string | null
          recipient_email: string
          recipient_name: string | null
          sent_at: string
          sent_by: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          app_id: string
          app_name: string
          company_id: string
          created_at?: string
          id?: string
          property_address?: string | null
          property_name?: string | null
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string
          sent_by: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          app_id?: string
          app_name?: string
          company_id?: string
          created_at?: string
          id?: string
          property_address?: string | null
          property_name?: string | null
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string
          sent_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          address: string | null
          area_sqm: number | null
          city: string | null
          company_id: string
          created_at: string
          current_value: number | null
          description: string | null
          id: string
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          serial_number: string | null
          type: string
          units: number | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          area_sqm?: number | null
          city?: string | null
          company_id: string
          created_at?: string
          current_value?: number | null
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          type?: string
          units?: number | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          area_sqm?: number | null
          city?: string | null
          company_id?: string
          created_at?: string
          current_value?: number | null
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          type?: string
          units?: number | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          balance: number | null
          bic: string | null
          company_id: string
          created_at: string | null
          currency: string | null
          iban: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          balance?: number | null
          bic?: string | null
          company_id: string
          created_at?: string | null
          currency?: string | null
          iban?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          balance?: number | null
          bic?: string | null
          company_id?: string
          created_at?: string | null
          currency?: string | null
          iban?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          chart_of_accounts: string | null
          city: string | null
          created_at: string | null
          id: string
          is_personal: boolean
          legal_form: string | null
          name: string
          tax_id: string | null
          theme_index: number
          updated_at: string | null
          vat_id: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          chart_of_accounts?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          is_personal?: boolean
          legal_form?: string | null
          name: string
          tax_id?: string | null
          theme_index?: number
          updated_at?: string | null
          vat_id?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          chart_of_accounts?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          is_personal?: boolean
          legal_form?: string | null
          name?: string
          tax_id?: string | null
          theme_index?: number
          updated_at?: string | null
          vat_id?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          role: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          role?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          company_id: string
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          tax_id: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          company_id: string
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          tax_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          company_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          tax_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      email_inboxes: {
        Row: {
          allowed_senders: string[] | null
          company_id: string
          created_at: string
          id: string
          inbox_address: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          allowed_senders?: string[] | null
          company_id: string
          created_at?: string
          id?: string
          inbox_address: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          allowed_senders?: string[] | null
          company_id?: string
          created_at?: string
          id?: string
          inbox_address?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_inboxes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      email_receipts: {
        Row: {
          amount: number | null
          category: string | null
          company_id: string
          confidence: number | null
          created_at: string
          date: string | null
          description: string | null
          file_name: string | null
          file_url: string | null
          id: string
          inbox_id: string
          question_text: string | null
          receipt_id: string | null
          received_at: string
          sender_email: string
          status: string
          subject: string | null
          tax_amount: number | null
          transaction_id: string | null
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount?: number | null
          category?: string | null
          company_id: string
          confidence?: number | null
          created_at?: string
          date?: string | null
          description?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          inbox_id: string
          question_text?: string | null
          receipt_id?: string | null
          received_at?: string
          sender_email: string
          status?: string
          subject?: string | null
          tax_amount?: number | null
          transaction_id?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number | null
          category?: string | null
          company_id?: string
          confidence?: number | null
          created_at?: string
          date?: string | null
          description?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          inbox_id?: string
          question_text?: string | null
          receipt_id?: string | null
          received_at?: string
          sender_email?: string
          status?: string
          subject?: string | null
          tax_amount?: number | null
          transaction_id?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_receipts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_receipts_inbox_id_fkey"
            columns: ["inbox_id"]
            isOneToOne: false
            referencedRelation: "email_inboxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_receipts_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_receipts_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          category: string
          company_id: string
          created_at: string
          id: string
          name: string
          subject: string
          template_key: string
          updated_at: string
          variables: string[] | null
        }
        Insert: {
          body: string
          category?: string
          company_id: string
          created_at?: string
          id?: string
          name: string
          subject: string
          template_key: string
          updated_at?: string
          variables?: string[] | null
        }
        Update: {
          body?: string
          category?: string
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          subject?: string
          template_key?: string
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          company_id: string
          contact_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string | null
          status: string | null
          tax_amount: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          company_id: string
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string | null
          status?: string | null
          tax_amount?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          company_id?: string
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string | null
          status?: string | null
          tax_amount?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          referral_code: string | null
          referred_by: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      receipts: {
        Row: {
          amount: number | null
          company_id: string
          created_at: string | null
          date: string | null
          description: string | null
          file_name: string
          file_type: string | null
          file_url: string | null
          id: string
          invoice_id: string | null
          transaction_id: string | null
        }
        Insert: {
          amount?: number | null
          company_id: string
          created_at?: string | null
          date?: string | null
          description?: string | null
          file_name: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          invoice_id?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number | null
          company_id?: string
          created_at?: string | null
          date?: string | null
          description?: string | null
          file_name?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          invoice_id?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          converted_at: string | null
          created_at: string
          id: string
          invitation_id: string | null
          referral_code: string
          referred_email: string
          referred_user_id: string | null
          referrer_user_id: string
          reward_applied: boolean | null
          reward_applied_at: string | null
          reward_type: string | null
          status: string
          stripe_coupon_id: string | null
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          id?: string
          invitation_id?: string | null
          referral_code: string
          referred_email: string
          referred_user_id?: string | null
          referrer_user_id: string
          reward_applied?: boolean | null
          reward_applied_at?: string | null
          reward_type?: string | null
          status?: string
          stripe_coupon_id?: string | null
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          id?: string
          invitation_id?: string | null
          referral_code?: string
          referred_email?: string
          referred_user_id?: string | null
          referrer_user_id?: string
          reward_applied?: boolean | null
          reward_applied_at?: string | null
          reward_type?: string | null
          status?: string
          stripe_coupon_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "app_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          bank_account_id: string | null
          building: string | null
          category: string | null
          company_id: string
          contact_id: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          building?: string | null
          category?: string | null
          company_id: string
          contact_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          building?: string | null
          category?: string | null
          company_id?: string
          contact_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_referral_leaderboard: {
        Args: { limit_count?: number }
        Returns: {
          avatar_url: string
          converted_count: number
          display_name: string
          rank: number
        }[]
      }
      is_company_member: { Args: { company_uuid: string }; Returns: boolean }
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
