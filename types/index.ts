// Core enum types matching database
export type UserRole = 'owner' | 'supervisor' | 'employee';
export type PaymentMethod = 'cash' | 'mtn_momo' | 'orange_money' | 'credit';
export type TransactionStatus = 'completed' | 'voided';
export type StockMovementType = 'sale' | 'restock' | 'adjustment' | 'return';
export type AdjustmentReason = 
  | 'restock' | 'found' | 'return_to_stock'
  | 'expired' | 'damaged' | 'lost' | 'supplier_short' 
  | 'internal_use' | 'promotional' | 'owner_withdrawal';
export type ReturnReason = 'damaged' | 'expired' | 'wrong_item' | 'changed_mind' | 'defective' | 'other';
export type RefundMethod = 'cash' | 'credit_to_account' | 'exchange';
export type CashSessionStatus = 'open' | 'closed' | 'expired';
export type SyncStatus = 'pending' | 'synced' | 'conflict' | 'failed';
export type ActivityType = 
  | 'login' | 'logout'
  | 'sale_completed' | 'sale_voided' | 'return_processed'
  | 'price_changed' | 'stock_adjusted' | 'stock_restocked'
  | 'customer_created' | 'credit_sale' | 'credit_payment'
  | 'session_opened' | 'session_closed'
  | 'employee_added' | 'employee_updated' | 'settings_changed';

export type BusinessType = 'provision' | 'hardware' | 'phone_electronics' | 'cosmetics' | 'general';
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled';
export type SubscriptionPlan = 'starter' | 'professional';

// Database table interfaces
export interface Shop {
  id: string;
  name: string;
  owner_id: string;
  phone?: string;
  address?: string;
  business_type?: BusinessType;
  currency: string;
  
  // Settings
  supervisor_enabled: boolean;
  low_stock_threshold: number;
  discrepancy_alert_threshold: number;
  
  // Subscription
  subscription_status: SubscriptionStatus;
  subscription_plan: SubscriptionPlan;
  trial_ends_at?: string;
  subscription_expires_at?: string;
  
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  shop_id: string;
  name: string;
  phone?: string;
  role: UserRole;
  pin_code?: string;
  
  // Supervisor permissions
  can_change_prices?: boolean;
  can_process_returns?: boolean;
  can_void_transactions?: boolean;
  discount_limit_percent?: number;
  
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  image_url?: string;
  barcode?: string;
  unit: string;
  is_generic: boolean;
  business_types?: BusinessType[];
  created_at: string;
  updated_at: string;
}

export interface ShopProduct {
  id: string;
  shop_id: string;
  product_id: string;
  product?: Product;
  
  cost_price: number;
  selling_price: number;
  current_quantity: number;
  reorder_level: number;
  auto_reorder_level?: number;
  use_auto_reorder: boolean;
  
  is_active: boolean;
  is_favorite: boolean;
  
  last_restocked_at?: string;
  last_sold_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  shop_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  
  credit_balance: number;
  credit_limit?: number;
  
  total_purchases: number;
  total_credit_used: number;
  total_credit_paid: number;
  
  last_purchase_at?: string;
  last_payment_at?: string;
  
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CashSession {
  id: string;
  shop_id: string;
  employee_id: string;
  
  opening_balance: number;
  closing_balance?: number;
  expected_balance?: number;
  discrepancy?: number;
  
  cash_sales_total: number;
  cash_refunds_total: number;
  cash_credit_payments: number;
  
  status: CashSessionStatus;
  notes?: string;
  
  session_date: string;
  opened_at: string;
  closed_at?: string;
  
  opening_balance_adjusted: boolean;
  adjustment_reason?: string;
  adjusted_by?: string;
  
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  shop_id: string;
  employee_id: string;
  customer_id?: string;
  cash_session_id?: string;

  subtotal: number;
  discount_amount: number;
  total_amount: number;

  status: TransactionStatus;

  voided_at?: string;
  voided_by?: string;
  void_reason?: string;

  local_id?: string;
  sync_status: SyncStatus;
  synced_at?: string;

  notes?: string;
  receipt_number: string;

  created_at: string;
  updated_at: string;

  // Relations (populated by database joins)
  employee?: { id: string; name: string; role: string };
  customer?: { id: string; name: string; phone?: string };
  items?: TransactionItem[];
  payments?: TransactionPayment[];
  cash_session?: { id: string; opened_at: string; session_date: string };
  voided_by_profile?: { id: string; name: string };
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  shop_product_id: string;

  quantity: number;
  price_at_sale: number;
  subtotal: number;

  created_at: string;

  // Relations (populated by database joins)
  shop_product?: {
    id: string;
    product?: {
      id: string;
      name: string;
    };
  };
}

export interface TransactionPayment {
  id: string;
  transaction_id: string;
  
  payment_method: PaymentMethod;
  amount: number;
  
  amount_given?: number;
  change_given?: number;
  
  reference_number?: string;
  
  created_at: string;
}

export interface CreditPayment {
  id: string;
  shop_id: string;
  customer_id: string;
  
  amount: number;
  payment_method: PaymentMethod;
  
  recorded_by: string;
  cash_session_id?: string;
  
  notes?: string;
  created_at: string;
}

export interface Return {
  id: string;
  shop_id: string;
  original_transaction_id: string;
  
  employee_id: string;
  customer_id?: string;
  cash_session_id?: string;
  
  total_refund_amount: number;
  refund_method: RefundMethod;
  
  new_transaction_id?: string;
  
  notes?: string;
  created_at: string;
}

export interface ReturnItem {
  id: string;
  return_id: string;
  shop_product_id: string;
  
  quantity: number;
  refund_amount: number;
  
  reason: ReturnReason;
  reason_notes?: string;
  
  restore_to_stock: boolean;
  created_at: string;
}

export interface StockMovement {
  id: string;
  shop_id: string;
  shop_product_id: string;
  
  movement_type: StockMovementType;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  
  adjustment_reason?: AdjustmentReason;
  
  reference_type?: string;
  reference_id?: string;
  
  user_id: string;
  notes?: string;
  
  owner_pin_verified: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  shop_id: string;
  user_id?: string;
  
  activity_type: ActivityType;
  
  reference_type?: string;
  reference_id?: string;
  
  metadata: Record<string, any>;
  description: string;
  
  ip_address?: string;
  user_agent?: string;
  
  created_at: string;
}

// Application-specific types
export interface CartItem {
  shop_product_id: string;
  product: ShopProduct;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
  amount_given?: number;
  change_given?: number;
  reference_number?: string;
}

export interface OfflineTransaction {
  local_id: string;
  shop_id: string;
  employee_id: string;
  customer_id?: string;
  items: CartItem[];
  payments: PaymentEntry[];
  total_amount: number;
  discount_amount: number;
  subtotal: number;
  created_at: string;
  sync_status: SyncStatus;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

// Form data types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  shop_name: string;
  business_type?: BusinessType;
}

export interface ProductFormData {
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  current_quantity: number;
  reorder_level: number;
  image?: File;
}

export interface CustomerFormData {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  credit_limit?: number;
  notes?: string;
}

export interface EmployeeFormData {
  name: string;
  phone?: string;
  role: UserRole;
  pin_code?: string;
  can_change_prices?: boolean;
  can_process_returns?: boolean;
  can_void_transactions?: boolean;
  discount_limit_percent?: number;
}
