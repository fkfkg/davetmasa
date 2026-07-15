-- =====================================================
-- DavetMasa - Veritabanı Şeması
-- Düğün salonları ve organizasyon firmaları için
-- masa oturma planı SaaS uygulaması
-- =====================================================

-- UUID oluşturma için pgcrypto (Supabase'de varsayılan aktif)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Metin arama (ILIKE) performansı için pg_trgm
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- 1. PROFILES - Kullanıcı Profilleri
-- auth.users tablosuyla 1:1 ilişki
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE profiles IS 'Kullanıcı profil bilgileri. auth.users ile 1:1 ilişkili.';

-- =====================================================
-- 2. ORGANIZATIONS - Organizasyonlar (Salon/Firma/Ajans)
-- Her kullanıcı bir veya birden fazla organizasyon sahibi olabilir
-- =====================================================
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  logo_url text,
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'single_event', 'salon', 'agency')),
  subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trialing')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE organizations IS 'Salon, firma veya ajans bilgileri. Multi-tenant izolasyon birimi.';

-- =====================================================
-- 3. ORGANIZATION_MEMBERS - Organizasyon Üyeleri
-- Bir organizasyonda birden fazla kullanıcı olabilir
-- =====================================================
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(organization_id, user_id)
);

COMMENT ON TABLE organization_members IS 'Organizasyon üyelikleri ve rolleri (owner/admin/member).';

-- =====================================================
-- 4. EVENTS - Etkinlikler (Düğün, Nişan, Kurumsal vb.)
-- Her etkinlik bir organizasyona bağlıdır
-- =====================================================
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  event_type text DEFAULT 'wedding' CHECK (event_type IN ('wedding', 'engagement', 'corporate', 'graduation', 'birthday', 'other')),
  event_date date,
  event_time text,
  venue_name text,
  venue_address text,
  guest_count_estimate int DEFAULT 0,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  public_lookup_slug text UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE events IS 'Etkinlik kayıtları. Her etkinliğin misafir listesi ve masa planı vardır.';

-- =====================================================
-- 5. TABLES - Masalar
-- Her masa bir etkinliğe bağlıdır, konum bilgisi içerir
-- =====================================================
CREATE TABLE IF NOT EXISTS tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text DEFAULT 'round' CHECK (type IN ('round', 'rectangle', 'square', 'oval', 'custom')),
  capacity int DEFAULT 10 CHECK (capacity > 0),
  x_position numeric DEFAULT 100,
  y_position numeric DEFAULT 100,
  rotation numeric DEFAULT 0,
  width numeric DEFAULT 120,
  height numeric DEFAULT 120,
  color text DEFAULT '#C9A96E',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE tables IS 'Masa tanımları. Konum (x,y), boyut, kapasite ve stil bilgisi içerir.';

-- =====================================================
-- 6. GUESTS - Misafirler
-- Her misafir bir etkinliğe bağlıdır, opsiyonel olarak bir masaya atanır
-- =====================================================
CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  phone text,
  email text,
  side text DEFAULT 'other' CHECK (side IN ('groom', 'bride', 'common', 'other')),
  group_name text,
  tags jsonb DEFAULT '[]'::jsonb,
  notes text,
  is_vip boolean DEFAULT false,
  is_child boolean DEFAULT false,
  is_elderly boolean DEFAULT false,
  is_disabled boolean DEFAULT false,
  meal_preference text,
  table_id uuid REFERENCES tables(id) ON DELETE SET NULL,
  seat_number int,
  check_in_status text DEFAULT 'pending' CHECK (check_in_status IN ('pending', 'checked_in', 'no_show')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE guests IS 'Misafir listesi. İsim, taraf, grup, VIP durumu ve masa ataması içerir.';

-- =====================================================
-- 7. LAYOUTS - Salon Planı Versiyonları
-- Her kayıt bir salon planı anlık görüntüsüdür
-- =====================================================
CREATE TABLE IF NOT EXISTS layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  layout_json jsonb DEFAULT '{}'::jsonb,
  version int DEFAULT 1,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE layouts IS 'Salon planı versiyonları. JSON formatında layout verisi saklar.';

-- =====================================================
-- 8. PAYMENTS - Ödeme Kayıtları
-- iyzico ile entegre ödeme takibi
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  provider text DEFAULT 'iyzico',
  provider_payment_id text,
  amount numeric NOT NULL CHECK (amount >= 0),
  currency text DEFAULT 'TRY',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  plan text,
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE payments IS 'Ödeme kayıtları. iyzico entegrasyonu ile abonelik ve tek seferlik ödemeler.';

-- =====================================================
-- 9. AUDIT_LOGS - İşlem Geçmişi
-- Geri alma ve denetim için tüm kritik işlemler loglanır
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE audit_logs IS 'Denetim günlüğü. Silme ve güncelleme işlemlerinin geçmişini tutar.';
