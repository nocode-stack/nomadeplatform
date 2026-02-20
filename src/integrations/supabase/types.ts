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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
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
      engine_options: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          order_index: number
          power: string
          price_modifier: number
          transmission: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          power: string
          price_modifier?: number
          transmission: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          power?: string
          price_modifier?: number
          transmission?: string
          updated_at?: string
        }
        Relationships: []
      }
      exterior_color_options: {
        Row: {
          color_code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          order_index: number
          price_modifier: number
          updated_at: string
        }
        Insert: {
          color_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          price_modifier?: number
          updated_at?: string
        }
        Update: {
          color_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          price_modifier?: number
          updated_at?: string
        }
        Relationships: []
      }
      interior_color_options: {
        Row: {
          color_code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          order_index: number
          price_modifier: number
          updated_at: string
        }
        Insert: {
          color_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          price_modifier?: number
          updated_at?: string
        }
        Update: {
          color_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
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
          price_modifier: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          price_modifier?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          price_modifier?: number
          updated_at?: string
        }
        Relationships: []
      }
      NEW_Billing: {
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
            foreignKeyName: "NEW_Billing_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "NEW_Clients"
            referencedColumns: ["id"]
          },
        ]
      }
      NEW_Budget: {
        Row: {
          base_price: number
          budget_code: string | null
          client_id: string | null
          color_modifier: number
          comunidad_autonoma: string | null
          created_at: string
          created_by: string | null
          discount_amount: number
          discount_percentage: number | null
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
          project_id: string | null
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
          discount_amount?: number
          discount_percentage?: number | null
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
          project_id?: string | null
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
          discount_percentage?: number | null
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
          project_id?: string | null
          reservation_amount?: number | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "NEW_Budget_electric_system_id_fkey"
            columns: ["electric_system_id"]
            isOneToOne: false
            referencedRelation: "NEW_Budget_Electric"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "NEW_Budget_engine_option_id_fkey"
            columns: ["engine_option_id"]
            isOneToOne: false
            referencedRelation: "engine_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "NEW_Budget_exterior_color_id_fkey"
            columns: ["exterior_color_id"]
            isOneToOne: false
            referencedRelation: "exterior_color_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "NEW_Budget_interior_color_id_fkey"
            columns: ["interior_color_id"]
            isOneToOne: false
            referencedRelation: "interior_color_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "NEW_Budget_model_option_id_fkey"
            columns: ["model_option_id"]
            isOneToOne: false
            referencedRelation: "model_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "NEW_Budget_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "NEW_Budget_Packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "NEW_Budget_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "NEW_Projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "NEW_Budget_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_assignments_status"
            referencedColumns: ["project_id"]
          },
        ]
      }
      NEW_Budget_Additional_Items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          order_index: number
          price: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          price?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      NEW_Budget_Discounts: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          label: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      NEW_Budget_Electric: {
        Row: {
          created_at: string
          description: string | null
          discount_price: number | null
          id: string
          is_active: boolean
          is_standalone: boolean
          name: string
          order_index: number
          pack_pricing_rules: Json | null
          price: number
          required_packs: string[] | null
          system_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_price?: number | null
          id?: string
          is_active?: boolean
          is_standalone?: boolean
          name: string
          order_index?: number
          pack_pricing_rules?: Json | null
          price?: number
          required_packs?: string[] | null
          system_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_price?: number | null
          id?: string
          is_active?: boolean
          is_standalone?: boolean
          name?: string
          order_index?: number
          pack_pricing_rules?: Json | null
          price?: number
          required_packs?: string[] | null
          system_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      NEW_Budget_Items: {
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
            foreignKeyName: "NEW_Budget_Items_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "NEW_Budget"
            referencedColumns: ["id"]
          },
        ]
      }
      NEW_Budget_Packs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      NEW_Clients: {
        Row: {
          address: string | null
          birthdate: string | null
          client_code: string | null
          client_status: string
          client_type: string | null
          created_at: string
          dni: string | null
          email: string | null
          id: string
          name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          birthdate?: string | null
          client_code?: string | null
          client_status?: string
          client_type?: string | null
          created_at?: string
          dni?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          birthdate?: string | null
          client_code?: string | null
          client_status?: string
          client_type?: string | null
          created_at?: string
          dni?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      NEW_Comments: {
        Row: {
          created_at: string
          id: string
          is_important: boolean
          message: string
          project_id: string
          tagged_user_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_important?: boolean
          message: string
          project_id: string
          tagged_user_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_important?: boolean
          message?: string
          project_id?: string
          tagged_user_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "NEW_Comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "NEW_Projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "NEW_Comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_assignments_status"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "NEW_Comments_tagged_user_id_fkey"
            columns: ["tagged_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "NEW_Comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      NEW_Contracts: {
        Row: {
          billing_address: string
          billing_entity_name: string | null
          billing_entity_nif: string | null
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
            foreignKeyName: "new_contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "NEW_Clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "NEW_Contracts_parent_contract_id_fkey"
            columns: ["parent_contract_id"]
            isOneToOne: false
            referencedRelation: "NEW_Contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "new_contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "NEW_Projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "new_contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_assignments_status"
            referencedColumns: ["project_id"]
          },
        ]
      }
      NEW_Incident_Items: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          incident_id: string
          priority: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          incident_id: string
          priority?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          incident_id?: string
          priority?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "NEW_Incident_Items_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "NEW_Incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      NEW_Incident_Status: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          order_index: number
          status_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          order_index: number
          status_code: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          order_index?: number
          status_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      NEW_Incidents: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          incident_date: string
          photos: Json | null
          project_id: string
          reference_number: string | null
          repair_entry_date: string | null
          repair_exit_date: string | null
          status_id: string | null
          updated_at: string
          workshop: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          incident_date: string
          photos?: Json | null
          project_id: string
          reference_number?: string | null
          repair_entry_date?: string | null
          repair_exit_date?: string | null
          status_id?: string | null
          updated_at?: string
          workshop: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          incident_date?: string
          photos?: Json | null
          project_id?: string
          reference_number?: string | null
          repair_entry_date?: string | null
          repair_exit_date?: string | null
          status_id?: string | null
          updated_at?: string
          workshop?: string
        }
        Relationships: [
          {
            foreignKeyName: "NEW_Incidents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "NEW_Projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "NEW_Incidents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_assignments_status"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "NEW_Incidents_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "NEW_Incident_Status"
            referencedColumns: ["id"]
          },
        ]
      }
      NEW_Nomade_Info: {
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
      NEW_Production_Schedule: {
        Row: {
          created_at: string
          end_date: string
          id: string
          production_code: string
          project_id: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          production_code: string
          project_id?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          production_code?: string
          project_id?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "NEW_Production_Schedule_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "NEW_Projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "NEW_Production_Schedule_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_assignments_status"
            referencedColumns: ["project_id"]
          },
        ]
      }
      NEW_Production_Settings: {
        Row: {
          applies_from_slot_id: string | null
          created_at: string
          days_between_slots: number
          default_slot_duration: number
          id: string
          is_active: boolean
          last_updated_by: string | null
          updated_at: string
        }
        Insert: {
          applies_from_slot_id?: string | null
          created_at?: string
          days_between_slots: number
          default_slot_duration: number
          id?: string
          is_active?: boolean
          last_updated_by?: string | null
          updated_at?: string
        }
        Update: {
          applies_from_slot_id?: string | null
          created_at?: string
          days_between_slots?: number
          default_slot_duration?: number
          id?: string
          is_active?: boolean
          last_updated_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "new_production_settings_applies_from_slot_id_fkey"
            columns: ["applies_from_slot_id"]
            isOneToOne: false
            referencedRelation: "NEW_Production_Schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "NEW_Production_Settings_applies_from_slot_id_fkey"
            columns: ["applies_from_slot_id"]
            isOneToOne: false
            referencedRelation: "NEW_Production_Schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      NEW_Project_Phase_Progress: {
        Row: {
          comments: string | null
          created_at: string
          end_date: string | null
          id: string
          phase_template_id: string
          project_id: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          phase_template_id: string
          project_id: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          phase_template_id?: string
          project_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "NEW_Project_Phase_Progress_phase_template_id_fkey"
            columns: ["phase_template_id"]
            isOneToOne: false
            referencedRelation: "NEW_Project_Phase_Template"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "NEW_Project_Phase_Progress_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "NEW_Projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "NEW_Project_Phase_Progress_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_assignments_status"
            referencedColumns: ["project_id"]
          },
        ]
      }
      NEW_Project_Phase_Template: {
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
      NEW_Projects: {
        Row: {
          client_id: string | null
          client_name: string | null
          comercial: string | null
          created_at: string
          delivery_date: string | null
          id: string
          project_code: string | null
          slot_id: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          client_id?: string | null
          client_name?: string | null
          comercial?: string | null
          created_at?: string
          delivery_date?: string | null
          id?: string
          project_code?: string | null
          slot_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          client_id?: string | null
          client_name?: string | null
          comercial?: string | null
          created_at?: string
          delivery_date?: string | null
          id?: string
          project_code?: string | null
          slot_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "NEW_Projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "NEW_Clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "NEW_Projects_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "NEW_Production_Schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "NEW_Projects_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "NEW_Vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      NEW_Vehicles: {
        Row: {
          created_at: string
          dimensions: string | null
          engine: string | null
          estado_pago: string | null
          exterior_color: string | null
          fecha_pago: string | null
          id: string
          location: string | null
          matricula: string | null
          numero_bastidor: string
          plazas: string | null
          project_id: string | null
          proveedor: string | null
          transmission_type: string | null
          updated_at: string | null
          vehicle_code: string
          warranty_status: string | null
        }
        Insert: {
          created_at?: string
          dimensions?: string | null
          engine?: string | null
          estado_pago?: string | null
          exterior_color?: string | null
          fecha_pago?: string | null
          id?: string
          location?: string | null
          matricula?: string | null
          numero_bastidor: string
          plazas?: string | null
          project_id?: string | null
          proveedor?: string | null
          transmission_type?: string | null
          updated_at?: string | null
          vehicle_code: string
          warranty_status?: string | null
        }
        Update: {
          created_at?: string
          dimensions?: string | null
          engine?: string | null
          estado_pago?: string | null
          exterior_color?: string | null
          fecha_pago?: string | null
          id?: string
          location?: string | null
          matricula?: string | null
          numero_bastidor?: string
          plazas?: string | null
          project_id?: string | null
          proveedor?: string | null
          transmission_type?: string | null
          updated_at?: string | null
          vehicle_code?: string
          warranty_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "NEW_Vehicles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "NEW_Projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "NEW_Vehicles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_assignments_status"
            referencedColumns: ["project_id"]
          },
        ]
      }
      production_schedule: {
        Row: {
          client_name: string | null
          created_at: string
          delivery_date: string | null
          id: string
          model: string | null
          notes: string | null
          production_code: string
          project_id: string | null
          scheduled_date: string
          status: string
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          delivery_date?: string | null
          id?: string
          model?: string | null
          notes?: string | null
          production_code: string
          project_id?: string | null
          scheduled_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          created_at?: string
          delivery_date?: string | null
          id?: string
          model?: string | null
          notes?: string | null
          production_code?: string
          project_id?: string | null
          scheduled_date?: string
          status?: string
          updated_at?: string
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
      project_assignments_status: {
        Row: {
          client_code: string | null
          client_id: string | null
          client_name: string | null
          created_at: string | null
          matricula: string | null
          numero_bastidor: string | null
          project_code: string | null
          project_id: string | null
          project_status: string | null
          slot_end_date: string | null
          slot_id: string | null
          slot_production_code: string | null
          slot_start_date: string | null
          slot_synced: boolean | null
          sync_status: string | null
          updated_at: string | null
          vehicle_code: string | null
          vehicle_id: string | null
          vehicle_synced: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "NEW_Projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "NEW_Clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "NEW_Projects_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "NEW_Production_Schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "NEW_Projects_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "NEW_Vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      check_auth_user_exists: {
        Args: { user_email: string }
        Returns: boolean
      }
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
      generate_budget_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_budget_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_client_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_contract_version: {
        Args: {
          p_contract_data: Json
          p_contract_type: string
          p_project_id: string
        }
        Returns: string
      }
      generate_incident_reference_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_new_budget_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_production_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_production_schedule_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_project_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_prospect_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_vehicle_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      initialize_new_project_phases: {
        Args: { project_id_param: string }
        Returns: undefined
      }
      initialize_project_phases: {
        Args: { project_id_param: string }
        Returns: undefined
      }
      sync_all_project_assignments: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_type: string
          details: string
          project_code: string
        }[]
      }
      sync_all_project_statuses: {
        Args: Record<PropertyKey, never>
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
