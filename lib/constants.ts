import type { BusinessType, PaymentMethod, UserRole } from '@/types';

export const APP_NAME = 'LIB-Merchant';
export const APP_VERSION = '1.0.0';

// Business types
export const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: 'provision', label: 'Provision Shop' },
  { value: 'hardware', label: 'Hardware Store' },
  { value: 'phone_electronics', label: 'Phone/Electronics Shop' },
  { value: 'cosmetics', label: 'Cosmetics/Beauty' },
  { value: 'general', label: 'General Retail' },
];

// User roles
export const USER_ROLES: { value: UserRole; label: string; description: string }[] = [
  { 
    value: 'owner', 
    label: 'Owner', 
    description: 'Full access to all features and settings' 
  },
  { 
    value: 'supervisor', 
    label: 'Supervisor', 
    description: 'Can manage inventory, process returns, and change prices' 
  },
  { 
    value: 'employee', 
    label: 'Employee/Cashier', 
    description: 'Can only make sales and view basic information' 
  },
];

// Payment methods
export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'mtn_momo', label: 'MTN MoMo', icon: '📱' },
  { value: 'orange_money', label: 'Orange Money', icon: '🍊' },
  { value: 'credit', label: 'Credit (Customer Owes)', icon: '💳' },
];

// Product categories (will be expanded with master catalog)
export const PRODUCT_CATEGORIES = {
  provision: [
    'Beverages',
    'Canned Foods',
    'Snacks',
    'Household Items',
    'Personal Care',
    'Baby Products',
    'Frozen Foods',
    'Bakery',
    'Condiments',
    'Other',
  ],
  hardware: [
    'Cement & Blocks',
    'Roofing Materials',
    'Plumbing',
    'Electrical',
    'Paint & Coatings',
    'Tools',
    'Fasteners',
    'Lumber',
    'Safety Equipment',
    'Other',
  ],
  phone_electronics: [
    'Mobile Phones',
    'Phone Accessories',
    'Chargers & Cables',
    'Headphones',
    'Power Banks',
    'Memory Cards',
    'Screen Protectors',
    'Phone Cases',
    'Speakers',
    'Other',
  ],
  cosmetics: [
    'Skin Care',
    'Hair Care',
    'Makeup',
    'Fragrances',
    'Nail Care',
    'Body Care',
    'Men\'s Grooming',
    'Hair Extensions',
    'Beauty Tools',
    'Other',
  ],
  general: [
    'General Merchandise',
    'Other',
  ],
};

// Units of measurement
export const UNITS = [
  { value: 'piece', label: 'Piece' },
  { value: 'pack', label: 'Pack' },
  { value: 'box', label: 'Box' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'liter', label: 'Liter (L)' },
  { value: 'ml', label: 'Milliliter (ml)' },
  { value: 'meter', label: 'Meter (m)' },
  { value: 'cm', label: 'Centimeter (cm)' },
  { value: 'bag', label: 'Bag' },
  { value: 'carton', label: 'Carton' },
];

// Return reasons
export const RETURN_REASONS = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'expired', label: 'Expired' },
  { value: 'wrong_item', label: 'Wrong Item' },
  { value: 'changed_mind', label: 'Changed Mind' },
  { value: 'defective', label: 'Defective' },
  { value: 'other', label: 'Other (specify)' },
];

// Adjustment reasons
export const ADJUSTMENT_REASONS = {
  positive: [
    { value: 'restock', label: 'Restock/Supplier Delivery' },
    { value: 'found', label: 'Found (Previously Miscounted)' },
    { value: 'return_to_stock', label: 'Return to Stock' },
  ],
  negative: [
    { value: 'expired', label: 'Expired' },
    { value: 'damaged', label: 'Damaged/Broken' },
    { value: 'lost', label: 'Lost/Stolen' },
    { value: 'supplier_short', label: 'Supplier Shortage' },
    { value: 'internal_use', label: 'Internal Use' },
    { value: 'promotional', label: 'Promotional Giveaway' },
    { value: 'owner_withdrawal', label: 'Owner Withdrawal' },
  ],
};

// Date ranges for reports
export const DATE_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'custom', label: 'Custom Range' },
];

// Subscription plans
export const SUBSCRIPTION_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 1500,
    currency: 'LRD',
    features: [
      '1 shop location',
      'Up to 3 employees',
      'Up to 500 products',
      'All core features',
      'Email support',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 3000,
    currency: 'LRD',
    features: [
      'Unlimited employees',
      'Unlimited products',
      'Advanced analytics',
      'Priority support',
      'WhatsApp notifications',
    ],
  },
];

// App settings defaults
export const DEFAULT_SETTINGS = {
  LOW_STOCK_THRESHOLD: 10,
  DISCREPANCY_ALERT_THRESHOLD: 500,
  TRIAL_PERIOD_DAYS: 30,
  SESSION_TIMEOUT_HOURS: 24,
  MAX_DISCOUNT_PERCENT: 50,
  DEFAULT_CURRENCY: 'LRD',
};

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// File upload
export const MAX_IMAGE_SIZE = 200 * 1024; // 200KB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Search debounce
export const SEARCH_DEBOUNCE_MS = 300;

// Offline sync
export const SYNC_RETRY_DELAY_MS = 5000;
export const MAX_SYNC_RETRIES = 3;
