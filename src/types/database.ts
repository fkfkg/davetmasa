// =====================================================
// DavetMasa - TypeScript Veritabanı Tipleri
// Supabase tablolarının TypeScript karşılıkları
// =====================================================

export type UserRole = 'owner' | 'admin' | 'member';
export type EventType = 'wedding' | 'engagement' | 'corporate' | 'graduation' | 'birthday' | 'other';
export type EventStatus = 'draft' | 'active' | 'completed' | 'archived';
export type TableType = 'round' | 'rectangle' | 'square' | 'oval' | 'custom';
export type GuestSide = 'groom' | 'bride' | 'common' | 'other';
export type CheckInStatus = 'pending' | 'checked_in' | 'no_show';
export type PlanType = 'free' | 'single_event' | 'salon' | 'agency';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  owner_id: string;
  name: string;
  logo_url: string | null;
  plan: PlanType;
  subscription_status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Event {
  id: string;
  organization_id: string;
  title: string;
  event_type: EventType;
  event_date: string | null;
  event_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  guest_count_estimate: number;
  status: EventStatus;
  public_lookup_slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: string;
  event_id: string;
  name: string;
  type: TableType;
  capacity: number;
  x_position: number;
  y_position: number;
  rotation: number;
  width: number;
  height: number;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Computed (frontend only)
  guest_count?: number;
}

export interface SalonTemplateTable {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  capacity: number;
  type: TableType;
  rotation?: number;
  shape?: string;
  color?: string;
  sort_order?: number;
}

export interface SalonTemplate {
  id: string;
  name: string;
  description: string | null;
  width: number;
  height: number;
  default_tables: SalonTemplateTable[];
  created_at: string;
  updated_at: string;
}

export interface Guest {
  id: string;
  event_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  side: GuestSide;
  group_name: string | null;
  tags: string[];
  notes: string | null;
  is_vip: boolean;
  is_child: boolean;
  is_elderly: boolean;
  is_disabled: boolean;
  meal_preference: string | null;
  table_id: string | null;
  seat_number: number | null;
  check_in_status: CheckInStatus;
  created_at: string;
  updated_at: string;
  // Joined data
  table?: Table;
}

export interface Layout {
  id: string;
  event_id: string;
  layout_json: Record<string, unknown>;
  version: number;
  created_by: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  organization_id: string;
  provider: string;
  provider_payment_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  plan: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  created_at: string;
}

// Event Stats (RPC function return)
export interface EventStats {
  total_guests: number;
  seated_guests: number;
  unseated_guests: number;
  total_tables: number;
  total_capacity: number;
  checked_in: number;
}

// Public Guest Lookup (QR ekranı)
export interface PublicGuestResult {
  guest_name: string;
  table_name: string | null;
  seat_number: number | null;
}

// Form tipleri
export interface EventFormData {
  title: string;
  event_type: EventType;
  event_date: string;
  event_time?: string;
  venue_name: string;
  venue_address: string;
  guest_count_estimate: number;
}

export interface GuestFormData {
  full_name: string;
  phone: string;
  email: string;
  side: GuestSide;
  group_name: string;
  notes: string;
  is_vip: boolean;
  is_child: boolean;
  is_elderly: boolean;
  is_disabled: boolean;
  meal_preference: string;
}

// Save status
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

// Offline queue item
export interface OfflineQueueItem {
  id: string;
  timestamp: number;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  retries: number;
}
