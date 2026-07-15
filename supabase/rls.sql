-- =====================================================
-- DavetMasa - Row Level Security (RLS) Politikaları
-- Multi-tenant güvenlik: A müşterisi B müşterisinin verisini ASLA göremez
-- =====================================================

-- =====================================================
-- Yardımcı fonksiyonlar
-- =====================================================

-- Kullanıcının üyesi olduğu organizasyon ID'lerini döndürür
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF uuid AS $$
  SELECT organization_id FROM organization_members WHERE user_id = (SELECT auth.uid())
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Kullanıcının belirli bir organizasyondaki rolünü döndürür
CREATE OR REPLACE FUNCTION get_user_org_role(org_id uuid)
RETURNS text AS $$
  SELECT role FROM organization_members
  WHERE user_id = (SELECT auth.uid()) AND organization_id = org_id
  LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Etkinliğin organizasyon ID'sini döndürür
CREATE OR REPLACE FUNCTION get_event_org_id(evt_id uuid)
RETURNS uuid AS $$
  SELECT organization_id FROM events WHERE id = evt_id
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- RLS Etkinleştirme
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES Politikaları
-- =====================================================
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = (SELECT auth.uid()));

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = (SELECT auth.uid()));

-- =====================================================
-- ORGANIZATIONS Politikaları
-- =====================================================
CREATE POLICY "orgs_select_member" ON organizations
  FOR SELECT USING (id IN (SELECT get_user_org_ids()));

CREATE POLICY "orgs_insert_authenticated" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "orgs_update_owner" ON organizations
  FOR UPDATE USING (owner_id = (SELECT auth.uid()));

CREATE POLICY "orgs_delete_owner" ON organizations
  FOR DELETE USING (owner_id = (SELECT auth.uid()));

-- =====================================================
-- ORGANIZATION_MEMBERS Politikaları
-- =====================================================
CREATE POLICY "org_members_select" ON organization_members
  FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_members_insert" ON organization_members
  FOR INSERT WITH CHECK (
    get_user_org_role(organization_id) IN ('owner', 'admin')
    OR (
      -- Organizasyon oluşturulurken owner kendini ekleyebilir
      user_id = (SELECT auth.uid()) AND role = 'owner'
    )
  );

CREATE POLICY "org_members_update" ON organization_members
  FOR UPDATE USING (
    get_user_org_role(organization_id) IN ('owner', 'admin')
  );

CREATE POLICY "org_members_delete" ON organization_members
  FOR DELETE USING (
    get_user_org_role(organization_id) IN ('owner', 'admin')
  );

-- =====================================================
-- EVENTS Politikaları
-- =====================================================
CREATE POLICY "events_select" ON events
  FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "events_insert" ON events
  FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "events_update" ON events
  FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "events_delete" ON events
  FOR DELETE USING (
    get_user_org_role(organization_id) IN ('owner', 'admin')
  );

-- =====================================================
-- TABLES Politikaları
-- =====================================================
CREATE POLICY "tables_select" ON tables
  FOR SELECT USING (
    get_event_org_id(event_id) IN (SELECT get_user_org_ids())
  );

CREATE POLICY "tables_insert" ON tables
  FOR INSERT WITH CHECK (
    get_event_org_id(event_id) IN (SELECT get_user_org_ids())
  );

CREATE POLICY "tables_update" ON tables
  FOR UPDATE USING (
    get_event_org_id(event_id) IN (SELECT get_user_org_ids())
  );

CREATE POLICY "tables_delete" ON tables
  FOR DELETE USING (
    get_event_org_id(event_id) IN (SELECT get_user_org_ids())
  );

-- =====================================================
-- GUESTS Politikaları
-- =====================================================
CREATE POLICY "guests_select" ON guests
  FOR SELECT USING (
    get_event_org_id(event_id) IN (SELECT get_user_org_ids())
  );

CREATE POLICY "guests_insert" ON guests
  FOR INSERT WITH CHECK (
    get_event_org_id(event_id) IN (SELECT get_user_org_ids())
  );

CREATE POLICY "guests_update" ON guests
  FOR UPDATE USING (
    get_event_org_id(event_id) IN (SELECT get_user_org_ids())
  );

CREATE POLICY "guests_delete" ON guests
  FOR DELETE USING (
    get_event_org_id(event_id) IN (SELECT get_user_org_ids())
  );

-- =====================================================
-- LAYOUTS Politikaları
-- =====================================================
CREATE POLICY "layouts_select" ON layouts
  FOR SELECT USING (
    get_event_org_id(event_id) IN (SELECT get_user_org_ids())
  );

CREATE POLICY "layouts_insert" ON layouts
  FOR INSERT WITH CHECK (
    get_event_org_id(event_id) IN (SELECT get_user_org_ids())
  );

-- =====================================================
-- PAYMENTS Politikaları (Sadece owner görür)
-- =====================================================
CREATE POLICY "payments_select_owner" ON payments
  FOR SELECT USING (
    get_user_org_role(organization_id) = 'owner'
  );

-- =====================================================
-- AUDIT_LOGS Politikaları (Owner ve admin görür)
-- =====================================================
CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT USING (
    get_user_org_role(organization_id) IN ('owner', 'admin')
  );
