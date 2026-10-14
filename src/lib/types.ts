export type Role = "customer" | "business_admin" | "super_admin";
export type BusinessStatus = "active" | "suspended" | "trial";
export type TransactionType = "purchase" | "redemption";
export type CouponStatus = "available" | "redeemed" | "expired";

export interface Business {
  id: string;
  name: string;
  slug: string;
  status: BusinessStatus;
  plan: "free" | "pro" | "enterprise";
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  role: Role;
  business_id: string | null;
  created_at: string;
}

export interface LoyaltyProgram {
  id: string;
  business_id: string;
  name: string;
  purchases_required: number;
  reward_description: string;
  active: boolean;
  created_at: string;
}

export interface CustomerBusinessProgress {
  id: string;
  customer_id: string;
  business_id: string;
  purchases_count: number;
  updated_at: string;
}

export interface Transaction {
  id: string;
  business_id: string;
  customer_id: string;
  registered_by: string | null;
  type: TransactionType;
  amount: number | null;
  note: string | null;
  created_at: string;
}

export interface Coupon {
  id: string;
  customer_id: string;
  business_id: string;
  loyalty_program_id: string | null;
  reward_description: string;
  status: CouponStatus;
  created_at: string;
  redeemed_at: string | null;
}

// Minimal hand-written Database type (no supabase CLI available in this
// environment to auto-generate one). Extend via `supabase gen types` once
// you can run the CLI against your project.
export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: Business;
        Insert: Partial<Business>;
        Update: Partial<Business>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      loyalty_programs: {
        Row: LoyaltyProgram;
        Insert: Partial<LoyaltyProgram>;
        Update: Partial<LoyaltyProgram>;
        Relationships: [];
      };
      customer_business_progress: {
        Row: CustomerBusinessProgress;
        Insert: Partial<CustomerBusinessProgress>;
        Update: Partial<CustomerBusinessProgress>;
        Relationships: [];
      };
      transactions: {
        Row: Transaction;
        Insert: Partial<Transaction>;
        Update: Partial<Transaction>;
        Relationships: [];
      };
      coupons: {
        Row: Coupon;
        Insert: Partial<Coupon>;
        Update: Partial<Coupon>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      register_purchase: {
        Args: { p_customer_id: string; p_amount?: number | null; p_note?: string | null };
        Returns: {
          transaction_id: string;
          purchases_count: number;
          purchases_required: number;
          coupon_issued: boolean;
          coupon_id: string | null;
        }[];
      };
      redeem_coupon: {
        Args: { p_coupon_id: string };
        Returns: Coupon;
      };
      current_role: {
        Args: Record<string, never>;
        Returns: string;
      };
      current_business_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
}
