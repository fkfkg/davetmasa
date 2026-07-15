-- =====================================================
-- DavetMasa - Performans İndexleri
-- =====================================================

-- Misafir sorguları
CREATE INDEX IF NOT EXISTS idx_guests_event_id ON guests(event_id);
CREATE INDEX IF NOT EXISTS idx_guests_table_id ON guests(table_id);
CREATE INDEX IF NOT EXISTS idx_guests_full_name_trgm ON guests USING gin(full_name gin_trgm_ops);

-- Etkinlik sorguları
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_public_lookup_slug ON events(public_lookup_slug);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Masa sorguları
CREATE INDEX IF NOT EXISTS idx_tables_event_id ON tables(event_id);

-- Üyelik sorguları (RLS performansı için kritik)
CREATE INDEX IF NOT EXISTS idx_org_members_org_user ON organization_members(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);

-- Denetim günlüğü sorguları
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Layout sorguları
CREATE INDEX IF NOT EXISTS idx_layouts_event_id ON layouts(event_id);

-- Ödeme sorguları
CREATE INDEX IF NOT EXISTS idx_payments_org_id ON payments(organization_id);
