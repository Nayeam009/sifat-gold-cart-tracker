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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          blurb: string | null
          created_at: string
          group_name: string
          id: string
          image_url: string | null
          is_published: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          blurb?: string | null
          created_at?: string
          group_name?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          blurb?: string | null
          created_at?: string
          group_name?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_discount: number | null
          min_subtotal: number
          starts_at: string | null
          times_used: number
          updated_at: string
          usage_limit: number | null
        }
        Insert: {
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_subtotal?: number
          starts_at?: string | null
          times_used?: number
          updated_at?: string
          usage_limit?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_subtotal?: number
          starts_at?: string | null
          times_used?: number
          updated_at?: string
          usage_limit?: number | null
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          address_line: string
          city: string
          created_at: string
          id: string
          is_default: boolean
          label: string
          phone: string
          recipient_name: string
          updated_at: string
          user_id: string
          zone: string
        }
        Insert: {
          address_line: string
          city: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          phone: string
          recipient_name: string
          updated_at?: string
          user_id: string
          zone?: string
        }
        Update: {
          address_line?: string
          city?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          phone?: string
          recipient_name?: string
          updated_at?: string
          user_id?: string
          zone?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_published: boolean
          question: string
          sort_order: number
          topic: string | null
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_published?: boolean
          question: string
          sort_order?: number
          topic?: string | null
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_published?: boolean
          question?: string
          sort_order?: number
          topic?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      homepage_banners: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_published: boolean
          link_url: string | null
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          link_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          link_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number | null
          order_id: string
          product_id: string | null
          product_name: string
          product_slug: string
          quantity: number
          sku: string | null
          unit_price: number
          variant_id: string | null
          variant_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          line_total?: number | null
          order_id: string
          product_id?: string | null
          product_name: string
          product_slug: string
          quantity: number
          sku?: string | null
          unit_price: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_slug?: string
          quantity?: number
          sku?: string | null
          unit_price?: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          admin_id: string | null
          created_at: string
          field: string
          id: string
          new_value: string | null
          old_value: string | null
          order_id: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          field: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          order_id: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          field?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          admin_notes: string | null
          area: string
          city: string
          coupon_code: string | null
          created_at: string
          customer_name: string
          delivery_fee: number
          delivery_zone: string | null
          discount: number
          email: string | null
          id: string
          idempotency_key: string | null
          notes: string | null
          order_number: string
          payment_method: string
          payment_status: string
          phone: string
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address: string
          admin_notes?: string | null
          area: string
          city: string
          coupon_code?: string | null
          created_at?: string
          customer_name: string
          delivery_fee: number
          delivery_zone?: string | null
          discount?: number
          email?: string | null
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          order_number: string
          payment_method?: string
          payment_status?: string
          phone: string
          status?: string
          subtotal: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          admin_notes?: string | null
          area?: string
          city?: string
          coupon_code?: string | null
          created_at?: string
          customer_name?: string
          delivery_fee?: number
          delivery_zone?: string | null
          discount?: number
          email?: string | null
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          order_number?: string
          payment_method?: string
          payment_status?: string
          phone?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_url: string
          product_id: string
          sort_order: number
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          product_id: string
          sort_order?: number
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          price: number | null
          product_id: string
          sku: string
          sort_order: number
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          price?: number | null
          product_id: string
          sku: string
          sort_order?: number
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: number | null
          product_id?: string
          sku?: string
          sort_order?: number
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          compare_at_price: number | null
          created_at: string
          description: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          name: string
          occasions: string[]
          price: number
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          sku: string
          slug: string
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          name: string
          occasions?: string[]
          price: number
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          sku: string
          slug: string
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          name?: string
          occasions?: string[]
          price?: number
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          sku?: string
          slug?: string
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          is_public: boolean
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          is_public?: boolean
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          is_public?: boolean
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      stock_adjustments: {
        Row: {
          admin_id: string | null
          change: number
          created_at: string
          id: string
          item_label: string
          new_qty: number
          note: string | null
          previous_qty: number
          product_id: string | null
          reason: string
          variant_id: string | null
        }
        Insert: {
          admin_id?: string | null
          change: number
          created_at?: string
          id?: string
          item_label: string
          new_qty: number
          note?: string | null
          previous_qty: number
          product_id?: string | null
          reason: string
          variant_id?: string | null
        }
        Update: {
          admin_id?: string | null
          change?: number
          created_at?: string
          id?: string
          item_label?: string
          new_qty?: number
          note?: string | null
          previous_qty?: number
          product_id?: string | null
          reason?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_adjustments_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          body: string
          created_at: string
          customer_name: string
          id: string
          is_published: boolean
          location: string | null
          rating: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          customer_name: string
          id?: string
          is_published?: boolean
          location?: string | null
          rating?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          customer_name?: string
          id?: string
          is_published?: boolean
          location?: string | null
          rating?: number
          sort_order?: number
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_adjust_stock: {
        Args: {
          p_change: number
          p_note: string
          p_product_id: string
          p_reason: string
          p_variant_id: string
        }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      place_order: {
        Args: {
          p_coupon?: string
          p_customer: Json
          p_items: Json
          p_user_id?: string
        }
        Returns: Json
      }
      place_order_once: {
        Args: {
          p_coupon: string
          p_customer: Json
          p_idem: string
          p_items: Json
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "customer"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "customer"],
    },
  },
} as const
