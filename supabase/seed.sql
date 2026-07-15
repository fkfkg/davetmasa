-- =====================================================
-- DavetMasa - Demo Verisi (Seed)
-- Test için örnek veri
-- NOT: Gerçek ortamda çalıştırmayın!
-- =====================================================

-- Bu seed dosyası Supabase Dashboard'dan manuel olarak
-- bir test kullanıcısı oluşturduktan sonra çalıştırılmalıdır.
-- Aşağıdaki UUID'leri gerçek kullanıcı ID'niz ile değiştirin.

-- Örnek UUID'ler (gerçek ID'lerle değiştirin)
-- Test user ID: 00000000-0000-0000-0000-000000000001

DO $$
DECLARE
  v_user_id uuid := '00000000-0000-0000-0000-000000000001';
  v_org_id uuid := gen_random_uuid();
  v_event_id uuid := gen_random_uuid();
  v_table1_id uuid := gen_random_uuid();
  v_table2_id uuid := gen_random_uuid();
  v_table3_id uuid := gen_random_uuid();
  v_table4_id uuid := gen_random_uuid();
  v_table5_id uuid := gen_random_uuid();
BEGIN
  -- Profil (eğer yoksa)
  INSERT INTO profiles (id, full_name, phone)
  VALUES (v_user_id, 'Demo Kullanıcı', '05551234567')
  ON CONFLICT (id) DO NOTHING;

  -- Organizasyon
  INSERT INTO organizations (id, owner_id, name, plan, subscription_status)
  VALUES (v_org_id, v_user_id, 'Manisa Gold Düğün Salonu', 'salon', 'active');

  -- Organizasyon üyeliği
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (v_org_id, v_user_id, 'owner');

  -- Etkinlik
  INSERT INTO events (id, organization_id, title, event_type, event_date, venue_name, venue_address, guest_count_estimate, status, public_lookup_slug)
  VALUES (v_event_id, v_org_id, 'Ali & Ayşe Düğünü', 'wedding', '2026-07-20', 'Manisa Gold Düğün Salonu', 'Manisa Merkez', 450, 'active', 'ali-ayse-2026');

  -- Masalar
  INSERT INTO tables (id, event_id, name, type, capacity, x_position, y_position, color, sort_order) VALUES
  (v_table1_id, v_event_id, 'Masa 1', 'round', 10, 150, 150, '#C9A96E', 1),
  (v_table2_id, v_event_id, 'Masa 2', 'round', 12, 350, 150, '#C9A96E', 2),
  (v_table3_id, v_event_id, 'VIP Masa', 'rectangle', 8, 250, 350, '#FFD700', 3),
  (v_table4_id, v_event_id, 'Çocuk Masası', 'round', 15, 150, 500, '#87CEEB', 4),
  (v_table5_id, v_event_id, 'Masa 4', 'round', 10, 450, 350, '#C9A96E', 5);

  -- Misafirler (Türk isimleri)
  INSERT INTO guests (event_id, full_name, phone, side, group_name, is_vip, is_child, is_elderly, is_disabled, table_id, seat_number) VALUES
  -- Damat tarafı
  (v_event_id, 'Ahmet Yılmaz', '05551001001', 'groom', 'Aile', false, false, false, false, v_table1_id, 1),
  (v_event_id, 'Mehmet Yılmaz', '05551001002', 'groom', 'Aile', false, false, true, false, v_table1_id, 2),
  (v_event_id, 'Fatma Yılmaz', '05551001003', 'groom', 'Aile', false, false, true, false, v_table1_id, 3),
  (v_event_id, 'Hasan Demir', '05551001004', 'groom', 'Arkadaş', false, false, false, false, v_table1_id, 4),
  (v_event_id, 'Mustafa Kara', '05551001005', 'groom', 'İş', true, false, false, false, v_table3_id, 1),
  (v_event_id, 'Kemal Öztürk', '05551001006', 'groom', 'Arkadaş', false, false, false, false, v_table2_id, 1),
  (v_event_id, 'Ali Can Yılmaz', NULL, 'groom', 'Aile', false, true, false, false, v_table4_id, 1),
  (v_event_id, 'Emre Yılmaz', NULL, 'groom', 'Aile', false, true, false, false, v_table4_id, 2),
  -- Gelin tarafı
  (v_event_id, 'Zeynep Kaya', '05551002001', 'bride', 'Aile', false, false, false, false, v_table2_id, 2),
  (v_event_id, 'Ayşe Kaya', '05551002002', 'bride', 'Aile', false, false, true, false, v_table2_id, 3),
  (v_event_id, 'Hatice Kaya', '05551002003', 'bride', 'Aile', false, false, false, false, v_table2_id, 4),
  (v_event_id, 'Meryem Arslan', '05551002004', 'bride', 'Arkadaş', false, false, false, false, v_table2_id, 5),
  (v_event_id, 'Seda Yıldız', '05551002005', 'bride', 'İş', true, false, false, false, v_table3_id, 2),
  (v_event_id, 'Esra Çelik', '05551002006', 'bride', 'Arkadaş', false, false, false, false, NULL, NULL),
  (v_event_id, 'Elif Kaya', NULL, 'bride', 'Aile', false, true, false, false, v_table4_id, 3),
  -- Ortak misafirler
  (v_event_id, 'İbrahim Şahin', '05551003001', 'common', 'Komşu', false, false, true, true, v_table3_id, 3),
  (v_event_id, 'Süleyman Aydın', '05551003002', 'common', 'Komşu', false, false, false, false, v_table5_id, 1),
  (v_event_id, 'Nurgül Koç', '05551003003', 'common', 'Komşu', false, false, false, false, v_table5_id, 2),
  (v_event_id, 'Burak Aslan', '05551003004', 'common', 'Arkadaş', false, false, false, false, NULL, NULL),
  (v_event_id, 'Derya Aksoy', '05551003005', 'common', 'Arkadaş', false, false, false, false, NULL, NULL);

  RAISE NOTICE 'Demo verisi başarıyla eklendi!';
  RAISE NOTICE 'Organization ID: %', v_org_id;
  RAISE NOTICE 'Event ID: %', v_event_id;
  RAISE NOTICE 'Public Lookup Slug: ali-ayse-2026';
END $$;
