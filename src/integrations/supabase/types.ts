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
      additional_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_general: boolean | null
          name: string
          order_index: number
          price: number
          price_export: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_general?: boolean | null
          name: string
          order_index?: number
          price?: number
          price_export?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_general?: boolean | null
          name?: string
          order_index?: number
          price?: number
          price_export?: number
          updated_at?: string
        }
        Relationships: []
      }
      billing: {
        Row: {
          billing_address: string | null
          client_id: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          nif: string | null
          phone: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          billing_address?: string | null
          client_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          nif?: string | null
          phone?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_address?: string | null
          client_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          nif?: string | null
          phone?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      budget: {
        Row: {
          base_price: number
          budget_code: string | null
          client_id: string | null
          color_modifier: number
          comunidad_autonoma: string | null
          created_at: string
          created_by: string | null
          discount_amount: number
          discount_amount_label: string | null
          discount_percentage: number | null
          discount_percentage_label: string | null
          electric_system_id: string | null
          electric_system_price: number
          engine_option_id: string | null
          id: string
          interior_color_id: string | null
          is_active: boolean | null
          is_primary: boolean | null
          iva_rate: number | null
          location: string | null
          model_option_id: string | null
          notes: string | null
          pack_id: string | null
          pack_price: number
          reservation_amount: number | null
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          base_price?: number
          budget_code?: string | null
          client_id?: string | null
          color_modifier?: number
          comunidad_autonoma?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount: number
          discount_amount_label?: string | null
          discount_percentage?: number | null
          discount_percentage_label?: string | null
          electric_system_id?: string | null
          electric_system_price?: number
          engine_option_id?: string | null
          id?: string
          interior_color_id?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          iva_rate?: number | null
          location?: string | null
          model_option_id?: string | null
          notes?: string | null
          pack_id?: string | null
          pack_price?: number
          reservation_amount?: number | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          base_price?: number
          budget_code?: string | null
          client_id?: string | null
          color_modifier?: number
          comunidad_autonoma?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          discount_amount_label?: string | null
          discount_percentage?: number | null
          discount_percentage_label?: string | null
          electric_system_id?: string | null
          electric_system_price?: number
          engine_option_id?: string | null
          id?: string
          interior_color_id?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          iva_rate?: number | null
          location?: string | null
          model_option_id?: string | null
          notes?: string | null
          pack_id?: string | null
          pack_price?: number
          reservation_amount?: number | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_electric_system_id_fkey"
            columns: ["electric_system_id"]
            isOneToOne: false
            referencedRelation: "electric_system"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_engine_option_id_fkey"
            columns: ["engine_option_id"]
            isOneToOne: false
            referencedRelation: "engine_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_interior_color_id_fkey"
            columns: ["interior_color_id"]
            isOneToOne: false
            referencedRelation: "interior_color_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_model_option_id_fkey"
            columns: ["model_option_id"]
            isOneToOne: false
            referencedRelation: "model_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "budget_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          budget_id: string | null
          concept_id: string | null
          created_at: string
          discount_percentage: number | null
          discount_reason_id: string | null
          id: string
          is_custom: boolean
          is_discount: boolean
          line_total: number
          name: string
          order_index: number | null
          pack_id: string | null
          price: number
          quantity: number
          updated_at: string
        }
        Insert: {
          budget_id?: string | null
          concept_id?: string | null
          created_at?: string
          discount_percentage?: number | null
          discount_reason_id?: string | null
          id?: string
          is_custom?: boolean
          is_discount?: boolean
          line_total: number
          name: string
          order_index?: number | null
          pack_id?: string | null
          price: number
          quantity?: number
          updated_at?: string
        }
        Update: {
          budget_id?: string | null
          concept_id?: string | null
          created_at?: string
          discount_percentage?: number | null
          discount_reason_id?: string | null
          id?: string
          is_custom?: boolean
          is_discount?: boolean
          line_total?: number
          name?: string
          order_index?: number | null
          pack_id?: string | null
          price?: number
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budget"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_pack_components: {
        Row: {
          created_at: string | null
          id: string
          name: string
          order_index: number
          pack_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          order_index?: number
          pack_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          order_index?: number
          pack_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_pack_components_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "budget_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_packs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number | null
          price_export: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number | null
          price_export?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number | null
          price_export?: number
          updated_at?: string
        }
        Relationships: []
      }
      budget_packs_extras: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          name: string
          order_index: number
          price: number
          price_export: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          price?: number
          price_export?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          price?: number
          price_export?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      budget_packs_extras_components: {
        Row: {
          created_at: string | null
          id: string
          name: string
          order_index: number
          pack_extra_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          order_index?: number
          pack_extra_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          order_index?: number
          pack_extra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_packs_extras_components_pack_extra_id_fkey"
            columns: ["pack_extra_id"]
            isOneToOne: false
            referencedRelation: "budget_packs_extras"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_transport: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          name: string
          order_index: number
          price: number
          price_export: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          price?: number
          price_export?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          price?: number
          price_export?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          address_number: string | null
          autonomous_community: string | null
          birthdate: string | null
          city: string | null
          client_code: string | null
          client_status: string
          client_type: string | null
          comercial: string | null
          country: string | null
          created_at: string
          dni: string | null
          email: string | null
          fair: string | null
          id: string
          is_active: boolean | null
          is_hot_lead: boolean | null
          lead_type: string | null
          name: string | null
          phone: string | null
          surname: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          address_number?: string | null
          autonomous_community?: string | null
          birthdate?: string | null
          city?: string | null
          client_code?: string | null
          client_status?: string
          client_type?: string | null
          comercial?: string | null
          country?: string | null
          created_at?: string
          dni?: string | null
          email?: string | null
          fair?: string | null
          id?: string
          is_active?: boolean | null
          is_hot_lead?: boolean | null
          lead_type?: string | null
          name?: string | null
          phone?: string | null
          surname?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          address_number?: string | null
          autonomous_community?: string | null
          birthdate?: string | null
          city?: string | null
          client_code?: string | null
          client_status?: string
          client_type?: string | null
          comercial?: string | null
          country?: string | null
          created_at?: string
          dni?: string | null
          email?: string | null
          fair?: string | null
          id?: string
          is_active?: boolean | null
          is_hot_lead?: boolean | null
          lead_type?: string | null
          name?: string | null
          phone?: string | null
          surname?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          billing_address: string
          billing_entity_name: string | null
          billing_entity_nif: string | null
          budget_id: string | null
          client_dni: string | null
          client_email: string
          client_full_name: string
          client_id: string
          client_phone: string | null
          contract_status: string
          contract_type: string
          created_at: string
          delivery_months: number | null
          estado_visual: string
          iban: string
          id: string
          is_active: boolean
          is_latest: boolean | null
          is_primary: boolean | null
          parent_contract_id: string | null
          payment_conditions: string | null
          payment_first_amount: number | null
          payment_first_percentage: number | null
          payment_reserve: number | null
          payment_second_amount: number | null
          payment_second_percentage: number | null
          payment_third_amount: number | null
          payment_third_percentage: number | null
          project_id: string
          signaturit_id: string | null
          signed_pdf_url: string | null
          total_price: number
          updated_at: string
          vehicle_engine: string | null
          vehicle_model: string
          vehicle_plate: string | null
          vehicle_vin: string | null
          version: number
        }
        Insert: {
          billing_address: string
          billing_entity_name?: string | null
          billing_entity_nif?: string | null
          budget_id?: string | null
          client_dni?: string | null
          client_email: string
          client_full_name: string
          client_id: string
          client_phone?: string | null
          contract_status?: string
          contract_type: string
          created_at?: string
          delivery_months?: number | null
          estado_visual?: string
          iban: string
          id?: string
          is_active?: boolean
          is_latest?: boolean | null
          is_primary?: boolean | null
          parent_contract_id?: string | null
          payment_conditions?: string | null
          payment_first_amount?: number | null
          payment_first_percentage?: number | null
          payment_reserve?: number | null
          payment_second_amount?: number | null
          payment_second_percentage?: number | null
          payment_third_amount?: number | null
          payment_third_percentage?: number | null
          project_id: string
          signaturit_id?: string | null
          signed_pdf_url?: string | null
          total_price: number
          updated_at?: string
          vehicle_engine?: string | null
          vehicle_model: string
          vehicle_plate?: string | null
          vehicle_vin?: string | null
          version?: number
        }
        Update: {
          billing_address?: string
          billing_entity_name?: string | null
          billing_entity_nif?: string | null
          budget_id?: string | null
          client_dni?: string | null
          client_email?: string
          client_full_name?: string
          client_id?: string
          client_phone?: string | null
          contract_status?: string
          contract_type?: string
          created_at?: string
          delivery_months?: number | null
          estado_visual?: string
          iban?: string
          id?: string
          is_active?: boolean
          is_latest?: boolean | null
          is_primary?: boolean | null
          parent_contract_id?: string | null
          payment_conditions?: string | null
          payment_first_amount?: number | null
          payment_first_percentage?: number | null
          payment_reserve?: number | null
          payment_second_amount?: number | null
          payment_second_percentage?: number | null
          payment_third_amount?: number | null
          payment_third_percentage?: number | null
          project_id?: string
          signaturit_id?: string | null
          signed_pdf_url?: string | null
          total_price?: number
          updated_at?: string
          vehicle_engine?: string | null
          vehicle_model?: string
          vehicle_plate?: string | null
          vehicle_vin?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "contracts_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budget"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_parent_contract_id_fkey"
            columns: ["parent_contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      department_permissions: {
        Row: {
          created_at: string
          department_id: string
          id: string
          permission_type: string
          permission_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id: string
          id?: string
          permission_type: string
          permission_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string
          id?: string
          permission_type?: string
          permission_value?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_permissions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      electric_system: {
        Row: {
          created_at: string
          description: string | null
          discount_price: number | null
          discount_price_export: number | null
          id: string
          is_active: boolean
          is_standalone: boolean
          name: string
          order_index: number
          pack_pricing_rules: Json | null
          price: number
          price_export: number
          required_packs: string[] | null
          system_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_price?: number | null
          discount_price_export?: number | null
          id?: string
          is_active?: boolean
          is_standalone?: boolean
          name: string
          order_index?: number
          pack_pricing_rules?: Json | null
          price?: number
          price_export?: number
          required_packs?: string[] | null
          system_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_price?: number | null
          discount_price_export?: number | null
          id?: string
          is_active?: boolean
          is_standalone?: boolean
          name?: string
          order_index?: number
          pack_pricing_rules?: Json | null
          price?: number
          price_export?: number
          required_packs?: string[] | null
          system_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      engine_options: {
        Row: {
          available_locations: string[]
          created_at: string
          id: string
          is_active: boolean
          name: string
          order_index: number
          price_export: number
          price_modifier: number
          updated_at: string
        }
        Insert: {
          available_locations?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          price_export?: number
          price_modifier?: number
          updated_at?: string
        }
        Update: {
          available_locations?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          price_export?: number
          price_modifier?: number
          updated_at?: string
        }
        Relationships: []
      }
      interior_color_options: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          order_index: number
          price_export: number
          price_modifier: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          price_export?: number
          price_modifier?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          price_export?: number
          price_modifier?: number
          updated_at?: string
        }
        Relationships: []
      }
      model_options: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          order_index: number
          price_export: number
          price_modifier: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          price_export?: number
          price_modifier?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          price_export?: number
          price_modifier?: number
          updated_at?: string
        }
        Relationships: []
      }
      nomade_info: {
        Row: {
          address: string
          bank_sabadell: string
          bank_santander: string
          city: string
          company_name: string
          created_at: string
          id: string
          is_active: boolean
          legal_text: string
          logo_url: string | null
          nif: string
          updated_at: string
        }
        Insert: {
          address?: string
          bank_sabadell?: string
          bank_santander?: string
          city?: string
          company_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          legal_text?: string
          logo_url?: string | null
          nif?: string
          updated_at?: string
        }
        Update: {
          address?: string
          bank_sabadell?: string
          bank_santander?: string
          city?: string
          company_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          legal_text?: string
          logo_url?: string | null
          nif?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_phase_template: {
        Row: {
          created_at: string
          group: string
          id: string
          is_active: boolean
          phase_name: string
          phase_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          group: string
          id?: string
          is_active?: boolean
          phase_name: string
          phase_order: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          group?: string
          id?: string
          is_active?: boolean
          phase_name?: string
          phase_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      regional_config: {
        Row: {
          budget_footer: string | null
          created_at: string | null
          currency: string
          id: string
          iedmt_applies: boolean
          iedmt_auto_amount: number
          iedmt_manual_amount: number
          iedmt_rate: number
          iva_label: string
          iva_rate: number
          legal_text: string | null
          legal_text_extra: string | null
          location: string
          updated_at: string | null
        }
        Insert: {
          budget_footer?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          iedmt_applies?: boolean
          iedmt_auto_amount?: number
          iedmt_manual_amount?: number
          iedmt_rate?: number
          iva_label?: string
          iva_rate?: number
          legal_text?: string | null
          legal_text_extra?: string | null
          location: string
          updated_at?: string | null
        }
        Update: {
          budget_footer?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          iedmt_applies?: boolean
          iedmt_auto_amount?: number
          iedmt_manual_amount?: number
          iedmt_rate?: number
          iva_label?: string
          iva_rate?: number
          legal_text?: string | null
          legal_text_extra?: string | null
          location?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          department_id: string | null
          email: string
          id: string
          name: string
          phone: string | null
          role: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          department_id?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          department_id?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_project_code_to_project: {
        Args: { code_id_param: string; project_id_param: string }
        Returns: undefined
      }
      assign_slot_to_project_atomic: {
        Args: { p_project_id?: string; p_slot_id: string }
        Returns: undefined
      }
      assign_vehicle_to_project_atomic: {
        Args: { p_project_id?: string; p_vehicle_id: string }
        Returns: undefined
      }
      calculate_electric_system_price_for_pack: {
        Args: { pack_id?: string; pack_name?: string; system_id: string }
        Returns: {
          discount_amount: number
          discount_reason: string
          final_price: number
          is_free: boolean
          original_price: number
        }[]
      }
      calculate_project_status: {
        Args: { project_id_param: string }
        Returns: string
      }
      check_auth_user_exists: { Args: { user_email: string }; Returns: boolean }
      check_client_status_for_project: {
        Args: { project_id_param: string }
        Returns: boolean
      }
      create_user_profile_if_missing: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      delete_users_except_email: {
        Args: { keep_email: string }
        Returns: {
          deleted_email: string
          deleted_name: string
        }[]
      }
      generate_budget_code: { Args: never; Returns: string }
      generate_budget_number: { Args: never; Returns: string }
      generate_client_code: { Args: never; Returns: string }
      generate_contract_version: {
        Args: {
          p_contract_data: Json
          p_contract_type: string
          p_project_id: string
        }
        Returns: string
      }
      generate_incident_reference_number: { Args: never; Returns: string }
      generate_new_budget_code: { Args: never; Returns: string }
      generate_production_code: { Args: never; Returns: string }
      generate_production_schedule_code: { Args: never; Returns: string }
      generate_project_code: { Args: never; Returns: string }
      generate_prospect_code: { Args: never; Returns: string }
      generate_vehicle_code: { Args: never; Returns: string }
      get_user_department: { Args: never; Returns: string }
      initialize_new_project_phases: {
        Args: { project_id_param: string }
        Returns: undefined
      }
      initialize_project_phases: {
        Args: { project_id_param: string }
        Returns: undefined
      }
      is_admin_department: { Args: never; Returns: boolean }
      is_business_department: { Args: never; Returns: boolean }
      sync_all_project_assignments: {
        Args: never
        Returns: {
          action_type: string
          details: string
          project_code: string
        }[]
      }
      sync_all_project_statuses: {
        Args: never
        Returns: {
          action: string
          new_status: string
          old_status: string
          project_code: string
          project_id: string
        }[]
      }
    }
    Enums: {
      project_code_status: "available" | "assigned" | "completed" | "cancelled"
      project_priority: "low" | "medium" | "high" | "critical"
      project_status:
      | "prospect"
      | "pre_production"
      | "production"
      | "reworks"
      | "pre_delivery"
      | "delivered"
      | "repair"
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
      project_code_status: ["available", "assigned", "completed", "cancelled"],
      project_priority: ["low", "medium", "high", "critical"],
      project_status: [
        "prospect",
        "pre_production",
        "production",
        "reworks",
        "pre_delivery",
        "delivered",
        "repair",
      ],
    },
  },
} as const
