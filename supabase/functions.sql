-- =====================================================
-- DavetMasa - RPC Fonksiyonları
-- Public lookup ve yardımcı fonksiyonlar
-- =====================================================

-- =====================================================
-- Public Misafir Arama (QR Lookup)
-- Anonim kullanıcılar tarafından çağrılabilir
-- Hassas bilgiler (telefon, email, not) DÖNDÜRÜLMEZ
-- =====================================================
CREATE OR REPLACE FUNCTION public_guest_lookup(lookup_slug text, search_name text)
RETURNS TABLE (
  guest_name text,
  table_name text,
  seat_number int
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.full_name AS guest_name,
    t.name AS table_name,
    g.seat_number
  FROM guests g
  JOIN events e ON g.event_id = e.id
  LEFT JOIN tables t ON g.table_id = t.id
  WHERE e.public_lookup_slug = lookup_slug
    AND e.status = 'active'
    AND g.full_name ILIKE '%' || search_name || '%'
  ORDER BY g.full_name
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Anonim kullanıcılara erişim izni
GRANT EXECUTE ON FUNCTION public_guest_lookup(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public_guest_lookup(text, text) TO authenticated;

-- =====================================================
-- Masa Doluluk Bilgisi
-- Belirli bir masadaki mevcut misafir sayısını döndürür
-- =====================================================
CREATE OR REPLACE FUNCTION get_table_occupancy(tbl_id uuid)
RETURNS int AS $$
  SELECT COUNT(*)::int FROM guests WHERE table_id = tbl_id
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- Etkinlik İstatistikleri
-- Bir etkinliğin genel durumunu döndürür
-- =====================================================
CREATE OR REPLACE FUNCTION get_event_stats(evt_id uuid)
RETURNS TABLE (
  total_guests bigint,
  seated_guests bigint,
  unseated_guests bigint,
  total_tables bigint,
  total_capacity bigint,
  checked_in bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM guests WHERE event_id = evt_id) AS total_guests,
    (SELECT COUNT(*) FROM guests WHERE event_id = evt_id AND table_id IS NOT NULL) AS seated_guests,
    (SELECT COUNT(*) FROM guests WHERE event_id = evt_id AND table_id IS NULL) AS unseated_guests,
    (SELECT COUNT(*) FROM tables WHERE event_id = evt_id) AS total_tables,
    (SELECT COALESCE(SUM(capacity), 0) FROM tables WHERE event_id = evt_id) AS total_capacity,
    (SELECT COUNT(*) FROM guests WHERE event_id = evt_id AND check_in_status = 'checked_in') AS checked_in;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
