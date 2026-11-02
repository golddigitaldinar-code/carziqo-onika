/*
# Carziqo Full Schema — Consolidated Migration

This migration creates the complete Carziqo autonomous taxi investment platform schema.
All tables, functions, triggers, storage buckets, and seed data in one idempotent pass.

## Tables
- profiles, vehicles, rentals, wallet_transactions, recharge_requests, withdrawal_requests,
  withdrawal_addresses, bank_cards, daily_earnings, checkins, carbon_records, bubble_records,
  team_members, messages, news, broadcasts, coupons, mall_products, mall_orders, gifts,
  faqs, admin_users, performance_records

## Security
- RLS on every table. Owner-scoped policies for user tables. Public read for content tables.
- Admin-only SECURITY DEFINER functions with is_admin() checks.
- Storage buckets: avatars (public), payment-proofs (private, admin-read).
*/

-- ============= ADMIN USERS TABLE (must exist before is_admin function) =============
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_admin" ON admin_users;
CREATE POLICY "select_own_admin" ON admin_users FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_admin" ON admin_users;
CREATE POLICY "insert_own_admin" ON admin_users FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_admin" ON admin_users;
CREATE POLICY "update_own_admin" ON admin_users FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============= IS_ADMIN HELPER FUNCTION =============
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM admin_users WHERE user_id = auth.uid() LIMIT 1),
    false
  );
$$;

-- ============= PROFILES =============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text DEFAULT '',
  phone text DEFAULT '',
  avatar_url text DEFAULT '',
  wallet_balance numeric DEFAULT 0,
  carbon_points numeric DEFAULT 0,
  vip_level int DEFAULT 0,
  withdrawal_password text DEFAULT '',
  referral_code text DEFAULT '',
  referrer_code text DEFAULT '',
  total_earnings numeric DEFAULT 0,
  free_vehicle_used boolean NOT NULL DEFAULT false,
  is_blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= VEHICLES =============
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  daily_return numeric NOT NULL DEFAULT 0,
  image_url text DEFAULT '',
  stock int DEFAULT 0,
  status text DEFAULT 'available',
  category text DEFAULT 'standard',
  settlement_cycle int DEFAULT 30,
  rental_limit int DEFAULT 1,
  is_free_vehicle boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_vehicles" ON vehicles;
CREATE POLICY "select_vehicles" ON vehicles FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_vehicles" ON vehicles;
CREATE POLICY "admin_insert_vehicles" ON vehicles FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_vehicles" ON vehicles;
CREATE POLICY "admin_update_vehicles" ON vehicles FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ============= RENTALS =============
CREATE TABLE IF NOT EXISTS rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  vehicle_name text DEFAULT '',
  rental_period int DEFAULT 30,
  daily_income numeric DEFAULT 0,
  total_income numeric DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_rentals" ON rentals;
CREATE POLICY "select_own_rentals" ON rentals FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_rentals" ON rentals;
CREATE POLICY "insert_own_rentals" ON rentals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_rentals" ON rentals;
CREATE POLICY "update_own_rentals" ON rentals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_rentals" ON rentals;
CREATE POLICY "delete_own_rentals" ON rentals FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= WALLET TRANSACTIONS =============
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'recharge',
  amount numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'completed',
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_wallet_tx" ON wallet_transactions;
CREATE POLICY "select_own_wallet_tx" ON wallet_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_wallet_tx" ON wallet_transactions;
CREATE POLICY "insert_own_wallet_tx" ON wallet_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_wallet_tx" ON wallet_transactions;
CREATE POLICY "update_own_wallet_tx" ON wallet_transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_wallet_tx" ON wallet_transactions;
CREATE POLICY "delete_own_wallet_tx" ON wallet_transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= RECHARGE REQUESTS =============
CREATE TABLE IF NOT EXISTS recharge_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  method text DEFAULT 'bank_transfer',
  status text DEFAULT 'pending',
  reference text DEFAULT '',
  transaction_hash text DEFAULT '',
  proof_path text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE recharge_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_recharges" ON recharge_requests;
CREATE POLICY "select_own_recharges" ON recharge_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_recharges" ON recharge_requests;
CREATE POLICY "insert_own_recharges" ON recharge_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_recharges" ON recharge_requests;
CREATE POLICY "update_own_recharges" ON recharge_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_recharges" ON recharge_requests;
CREATE POLICY "delete_own_recharges" ON recharge_requests FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= WITHDRAWAL REQUESTS =============
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'bank_transfer',
  bank_card_id uuid,
  withdrawal_address_id uuid,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_withdrawals" ON withdrawal_requests;
CREATE POLICY "select_own_withdrawals" ON withdrawal_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_withdrawals" ON withdrawal_requests;
CREATE POLICY "insert_own_withdrawals" ON withdrawal_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_withdrawals" ON withdrawal_requests;
CREATE POLICY "update_own_withdrawals" ON withdrawal_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_withdrawals" ON withdrawal_requests;
CREATE POLICY "delete_own_withdrawals" ON withdrawal_requests FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= WITHDRAWAL ADDRESSES =============
CREATE TABLE IF NOT EXISTS withdrawal_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT '',
  method text NOT NULL DEFAULT 'bank_transfer',
  account_name text NOT NULL DEFAULT '',
  account_number text NOT NULL DEFAULT '',
  bank_name text DEFAULT '',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE withdrawal_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_withdrawal_addresses" ON withdrawal_addresses;
CREATE POLICY "select_own_withdrawal_addresses" ON withdrawal_addresses FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_withdrawal_addresses" ON withdrawal_addresses;
CREATE POLICY "insert_own_withdrawal_addresses" ON withdrawal_addresses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_withdrawal_addresses" ON withdrawal_addresses;
CREATE POLICY "update_own_withdrawal_addresses" ON withdrawal_addresses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_withdrawal_addresses" ON withdrawal_addresses;
CREATE POLICY "delete_own_withdrawal_addresses" ON withdrawal_addresses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= BANK CARDS =============
CREATE TABLE IF NOT EXISTS bank_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name text NOT NULL,
  account_name text NOT NULL,
  account_number text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bank_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_bank_cards" ON bank_cards;
CREATE POLICY "select_own_bank_cards" ON bank_cards FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_bank_cards" ON bank_cards;
CREATE POLICY "insert_own_bank_cards" ON bank_cards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_bank_cards" ON bank_cards;
CREATE POLICY "update_own_bank_cards" ON bank_cards FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_bank_cards" ON bank_cards;
CREATE POLICY "delete_own_bank_cards" ON bank_cards FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= DAILY EARNINGS =============
CREATE TABLE IF NOT EXISTS daily_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  rental_id uuid REFERENCES rentals(id) ON DELETE SET NULL,
  vehicle_name text DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE daily_earnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_earnings" ON daily_earnings;
CREATE POLICY "select_own_earnings" ON daily_earnings FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_earnings" ON daily_earnings;
CREATE POLICY "insert_own_earnings" ON daily_earnings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_earnings" ON daily_earnings;
CREATE POLICY "update_own_earnings" ON daily_earnings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_earnings" ON daily_earnings;
CREATE POLICY "delete_own_earnings" ON daily_earnings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= CHECKINS =============
CREATE TABLE IF NOT EXISTS checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  streak int DEFAULT 1,
  points_earned int DEFAULT 5,
  date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_checkins" ON checkins;
CREATE POLICY "select_own_checkins" ON checkins FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_checkins" ON checkins;
CREATE POLICY "insert_own_checkins" ON checkins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_checkins" ON checkins;
CREATE POLICY "update_own_checkins" ON checkins FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_checkins" ON checkins;
CREATE POLICY "delete_own_checkins" ON checkins FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= CARBON RECORDS =============
CREATE TABLE IF NOT EXISTS carbon_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'earn',
  points numeric NOT NULL DEFAULT 0,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE carbon_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_carbon" ON carbon_records;
CREATE POLICY "select_own_carbon" ON carbon_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_carbon" ON carbon_records;
CREATE POLICY "insert_own_carbon" ON carbon_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_carbon" ON carbon_records;
CREATE POLICY "update_own_carbon" ON carbon_records FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_carbon" ON carbon_records;
CREATE POLICY "delete_own_carbon" ON carbon_records FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= BUBBLE RECORDS =============
CREATE TABLE IF NOT EXISTS bubble_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  points_earned int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bubble_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_bubbles" ON bubble_records;
CREATE POLICY "select_own_bubbles" ON bubble_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_bubbles" ON bubble_records;
CREATE POLICY "insert_own_bubbles" ON bubble_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_bubbles" ON bubble_records;
CREATE POLICY "update_own_bubbles" ON bubble_records FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_bubbles" ON bubble_records;
CREATE POLICY "delete_own_bubbles" ON bubble_records FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= TEAM MEMBERS =============
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id uuid,
  member_name text DEFAULT '',
  member_phone text DEFAULT '',
  vip_level int DEFAULT 0,
  total_investment numeric DEFAULT 0,
  commission numeric DEFAULT 0,
  status text DEFAULT 'active',
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_team" ON team_members;
CREATE POLICY "select_own_team" ON team_members FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_team" ON team_members;
CREATE POLICY "insert_own_team" ON team_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_team" ON team_members;
CREATE POLICY "update_own_team" ON team_members FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_team" ON team_members;
CREATE POLICY "delete_own_team" ON team_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_team_members_member_user_id ON team_members(member_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- ============= MESSAGES =============
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  is_read boolean DEFAULT false,
  response text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_messages" ON messages;
CREATE POLICY "select_own_messages" ON messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_messages" ON messages;
CREATE POLICY "insert_own_messages" ON messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_messages" ON messages;
CREATE POLICY "update_own_messages" ON messages FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_messages" ON messages;
CREATE POLICY "delete_own_messages" ON messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= NEWS =============
CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text DEFAULT '',
  content text DEFAULT '',
  image_url text DEFAULT '',
  category text DEFAULT 'general',
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_news" ON news;
CREATE POLICY "select_news" ON news FOR SELECT TO anon, authenticated USING (true);

-- ============= BROADCASTS =============
CREATE TABLE IF NOT EXISTS broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  content text DEFAULT '',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_broadcasts" ON broadcasts;
CREATE POLICY "select_own_broadcasts" ON broadcasts FOR SELECT TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);
DROP POLICY IF EXISTS "insert_own_broadcasts" ON broadcasts;
CREATE POLICY "insert_own_broadcasts" ON broadcasts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_broadcasts" ON broadcasts;
CREATE POLICY "update_own_broadcasts" ON broadcasts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_broadcasts" ON broadcasts;
CREATE POLICY "delete_own_broadcasts" ON broadcasts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= COUPONS =============
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  value numeric DEFAULT 0,
  status text DEFAULT 'active',
  expiry_date timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_coupons" ON coupons;
CREATE POLICY "select_own_coupons" ON coupons FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_coupons" ON coupons;
CREATE POLICY "insert_own_coupons" ON coupons FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_coupons" ON coupons;
CREATE POLICY "update_own_coupons" ON coupons FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_coupons" ON coupons;
CREATE POLICY "delete_own_coupons" ON coupons FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= MALL PRODUCTS =============
CREATE TABLE IF NOT EXISTS mall_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  image_url text DEFAULT '/assets/images/carziqo.webp',
  stock int DEFAULT 0,
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mall_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_mall_products" ON mall_products;
CREATE POLICY "select_mall_products" ON mall_products FOR SELECT TO anon, authenticated USING (true);

-- ============= MALL ORDERS =============
CREATE TABLE IF NOT EXISTS mall_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES mall_products(id) ON DELETE SET NULL,
  product_name text DEFAULT '',
  image_url text DEFAULT '/assets/images/carziqo.webp',
  quantity int DEFAULT 1,
  total_price numeric DEFAULT 0,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mall_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_orders" ON mall_orders;
CREATE POLICY "select_own_orders" ON mall_orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_orders" ON mall_orders;
CREATE POLICY "insert_own_orders" ON mall_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_orders" ON mall_orders;
CREATE POLICY "update_own_orders" ON mall_orders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_orders" ON mall_orders;
CREATE POLICY "delete_own_orders" ON mall_orders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= GIFTS =============
CREATE TABLE IF NOT EXISTS gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  carbon_cost numeric NOT NULL DEFAULT 0,
  image_url text DEFAULT '/assets/images/carziqo.webp',
  stock int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_gifts" ON gifts;
CREATE POLICY "select_gifts" ON gifts FOR SELECT TO anon, authenticated USING (true);

-- ============= FAQS =============
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_faqs" ON faqs;
CREATE POLICY "select_faqs" ON faqs FOR SELECT TO anon, authenticated USING (true);

-- ============= PERFORMANCE RECORDS =============
CREATE TABLE IF NOT EXISTS performance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  base_coefficient numeric DEFAULT 1.0,
  team_size int DEFAULT 0,
  weekly_reward numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE performance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_performance" ON performance_records;
CREATE POLICY "select_own_performance" ON performance_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_performance" ON performance_records;
CREATE POLICY "insert_own_performance" ON performance_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_performance" ON performance_records;
CREATE POLICY "update_own_performance" ON performance_records FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_performance" ON performance_records;
CREATE POLICY "delete_own_performance" ON performance_records FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= STORAGE: AVATARS BUCKET =============
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatar_public_read" ON storage.objects;
CREATE POLICY "avatar_public_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatar_upload_own" ON storage.objects;
CREATE POLICY "avatar_upload_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatar_update_own" ON storage.objects;
CREATE POLICY "avatar_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatar_delete_own" ON storage.objects;
CREATE POLICY "avatar_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============= STORAGE: PAYMENT PROOFS BUCKET =============
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('payment-proofs', 'payment-proofs', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "payment_proof_upload_own" ON storage.objects;
CREATE POLICY "payment_proof_upload_own" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

DROP POLICY IF EXISTS "payment_proof_read_admin" ON storage.objects;
CREATE POLICY "payment_proof_read_admin" ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND is_admin()
);

-- ============= ADMIN RPC FUNCTIONS =============

CREATE OR REPLACE FUNCTION public.admin_get_recharge_requests()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  amount numeric,
  method text,
  status text,
  reference text,
  transaction_hash text,
  created_at timestamptz,
  updated_at timestamptz,
  member_nickname text,
  member_phone text,
  proof_path text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  RETURN QUERY
  SELECT r.id, r.user_id, r.amount, r.method, r.status, r.reference, r.transaction_hash,
         r.created_at, r.updated_at, p.nickname, p.phone, r.proof_path
  FROM recharge_requests r
  LEFT JOIN profiles p ON p.user_id = r.user_id
  ORDER BY r.created_at DESC
  LIMIT 200;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_get_recharge_requests() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_recharge_requests() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_get_withdrawal_requests()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  amount numeric,
  method text,
  bank_card_id uuid,
  withdrawal_address_id uuid,
  status text,
  created_at timestamptz,
  addr_label text,
  addr_method text,
  addr_account_name text,
  addr_account_number text,
  addr_bank_name text,
  member_nickname text,
  member_phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  RETURN QUERY
  SELECT w.id, w.user_id, w.amount, w.method, w.bank_card_id, w.withdrawal_address_id,
         w.status, w.created_at,
         wa.label, wa.method, wa.account_name, wa.account_number, wa.bank_name,
         p.nickname, p.phone
  FROM withdrawal_requests w
  LEFT JOIN withdrawal_addresses wa ON wa.id = w.withdrawal_address_id
  LEFT JOIN profiles p ON p.user_id = w.user_id
  ORDER BY w.created_at DESC
  LIMIT 200;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_get_withdrawal_requests() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_withdrawal_requests() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_get_profiles()
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  RETURN QUERY
  SELECT * FROM profiles ORDER BY created_at DESC LIMIT 500;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_get_profiles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_profiles() TO authenticated;

-- ============= RECHARGE/WITHDRAWAL TRIGGERS =============

CREATE OR REPLACE FUNCTION public.on_recharge_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_amount numeric;
  v_user_id uuid;
  v_method text;
  v_existing_count integer;
BEGIN
  IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    v_user_id := NEW.user_id;
    v_amount := NEW.amount;
    v_method := NEW.method;

    SELECT COUNT(*) INTO v_existing_count
    FROM wallet_transactions
    WHERE user_id = v_user_id
      AND type = 'recharge'
      AND amount = v_amount
      AND created_at >= NEW.created_at
      AND created_at <= NEW.updated_at + interval '1 minute'
      AND description LIKE 'Recharge approved%';

    IF v_existing_count = 0 THEN
      UPDATE profiles
      SET wallet_balance = COALESCE(wallet_balance, 0) + v_amount
      WHERE user_id = v_user_id;

      INSERT INTO wallet_transactions (user_id, type, amount, status, description)
      VALUES (v_user_id, 'recharge', v_amount, 'completed', 'Recharge approved via ' || COALESCE(v_method, 'unknown'));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recharge_status_change ON recharge_requests;
CREATE TRIGGER trg_recharge_status_change
  AFTER UPDATE OF status ON recharge_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.on_recharge_status_change();

CREATE OR REPLACE FUNCTION public.on_withdrawal_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_amount numeric;
  v_user_id uuid;
BEGIN
  IF NEW.status <> OLD.status THEN
    v_user_id := NEW.user_id;
    v_amount := NEW.amount;

    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
      UPDATE wallet_transactions
      SET status = 'completed', description = 'Withdrawal approved by admin'
      WHERE user_id = v_user_id
        AND type = 'withdrawal_hold'
        AND amount = -v_amount
        AND status = 'pending';

    ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
      UPDATE profiles
      SET wallet_balance = COALESCE(wallet_balance, 0) + v_amount
      WHERE user_id = v_user_id;

      UPDATE wallet_transactions
      SET status = 'completed', description = 'Withdrawal rejected - amount refunded'
      WHERE user_id = v_user_id
        AND type = 'withdrawal_hold'
        AND amount = -v_amount
        AND status = 'pending';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_withdrawal_status_change ON withdrawal_requests;
CREATE TRIGGER trg_withdrawal_status_change
  AFTER UPDATE OF status ON withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.on_withdrawal_status_change();

-- ============= ADMIN APPROVE/REJECT FUNCTIONS =============

CREATE OR REPLACE FUNCTION public.admin_approve_recharge(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  req_status text;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  SELECT status INTO req_status FROM recharge_requests WHERE id = request_id;
  IF req_status IS NULL THEN
    RAISE EXCEPTION 'Recharge request not found';
  END IF;
  IF req_status = 'approved' THEN
    RAISE EXCEPTION 'Recharge already approved';
  END IF;
  IF req_status <> 'pending' THEN
    RAISE EXCEPTION 'Recharge request is not pending';
  END IF;
  UPDATE recharge_requests SET status = 'approved', updated_at = now() WHERE id = request_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_approve_recharge(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_reject_recharge(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  req_status text;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  SELECT status INTO req_status FROM recharge_requests WHERE id = request_id;
  IF req_status IS NULL THEN
    RAISE EXCEPTION 'Recharge request not found';
  END IF;
  IF req_status <> 'pending' THEN
    RAISE EXCEPTION 'Recharge request is not pending';
  END IF;
  UPDATE recharge_requests SET status = 'rejected', updated_at = now() WHERE id = request_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_reject_recharge(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_approve_withdrawal(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  req_status text;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  SELECT status INTO req_status FROM withdrawal_requests WHERE id = request_id;
  IF req_status IS NULL THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;
  IF req_status = 'approved' THEN
    RAISE EXCEPTION 'Withdrawal already approved';
  END IF;
  IF req_status <> 'pending' THEN
    RAISE EXCEPTION 'Withdrawal request is not pending';
  END IF;
  UPDATE withdrawal_requests SET status = 'approved', updated_at = now() WHERE id = request_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_approve_withdrawal(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_reject_withdrawal(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  req_status text;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  SELECT status INTO req_status FROM withdrawal_requests WHERE id = request_id;
  IF req_status IS NULL THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;
  IF req_status = 'rejected' THEN
    RAISE EXCEPTION 'Withdrawal already rejected';
  END IF;
  IF req_status <> 'pending' THEN
    RAISE EXCEPTION 'Withdrawal request is not pending';
  END IF;
  UPDATE withdrawal_requests SET status = 'rejected', updated_at = now() WHERE id = request_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_reject_withdrawal(uuid) TO authenticated;

-- ============= ADMIN USER MANAGEMENT =============

CREATE OR REPLACE FUNCTION public.admin_block_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;
  UPDATE profiles SET is_blocked = true WHERE user_id = p_user_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_block_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_block_user(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_unblock_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;
  UPDATE profiles SET is_blocked = false WHERE user_id = p_user_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_unblock_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_unblock_user(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_adjust_balance(
  p_user_id uuid,
  p_amount numeric,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_nickname text;
  v_new_balance numeric;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'User ID is required');
  END IF;
  IF p_amount IS NULL OR p_amount = 0 THEN
    RETURN jsonb_build_object('error', 'Amount must be non-zero');
  END IF;
  SELECT nickname INTO v_nickname FROM profiles WHERE user_id = p_user_id;
  IF v_nickname IS NULL THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;
  UPDATE profiles
  SET wallet_balance = COALESCE(wallet_balance, 0) + p_amount
  WHERE user_id = p_user_id
  RETURNING wallet_balance INTO v_new_balance;

  INSERT INTO wallet_transactions (user_id, type, amount, status, description)
  VALUES (
    p_user_id,
    'admin_adjustment',
    p_amount,
    'completed',
    'Admin balance adjustment: ' || COALESCE(p_reason, 'No reason provided')
  );

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_balance(uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_balance(uuid, numeric, text) TO authenticated;

-- ============= USER FUNCTIONS =============

CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_amount numeric,
  p_method text,
  p_address_id uuid,
  p_withdrawal_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_balance numeric;
  v_wd_pwd text;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;
  SELECT wallet_balance, withdrawal_password INTO v_balance, v_wd_pwd
  FROM profiles WHERE user_id = v_user_id;
  IF v_balance IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;
  IF p_amount < 500 THEN
    RETURN jsonb_build_object('error', 'Minimum withdrawal is ₱500');
  END IF;
  IF p_amount > v_balance THEN
    RETURN jsonb_build_object('error', 'Insufficient wallet balance');
  END IF;
  IF p_withdrawal_password IS NULL OR p_withdrawal_password = '' THEN
    RETURN jsonb_build_object('error', 'Withdrawal password required');
  END IF;
  IF v_wd_pwd IS NULL OR v_wd_pwd = '' THEN
    RETURN jsonb_build_object('error', 'Please set a withdrawal password first');
  END IF;
  IF p_withdrawal_password <> v_wd_pwd THEN
    RETURN jsonb_build_object('error', 'Withdrawal password incorrect');
  END IF;
  IF p_address_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Please select a withdrawal address');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM withdrawal_addresses WHERE id = p_address_id AND user_id = v_user_id) THEN
    RETURN jsonb_build_object('error', 'Invalid withdrawal address');
  END IF;
  INSERT INTO withdrawal_requests (user_id, amount, method, status, withdrawal_address_id)
  VALUES (v_user_id, p_amount, p_method, 'pending', p_address_id);
  UPDATE profiles SET wallet_balance = wallet_balance - p_amount WHERE user_id = v_user_id;
  INSERT INTO wallet_transactions (user_id, type, amount, status, description)
  VALUES (v_user_id, 'withdrawal_hold', -p_amount, 'pending', 'Withdrawal pending admin review via ' || p_method);
  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(numeric, text, uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.process_referral_signup(p_new_user_id uuid, p_referrer_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referrer_user_id uuid;
  v_referrer_nickname text;
  v_new_nickname text;
  v_new_phone text;
  v_signup_bonus numeric := 50;
  v_existing_count integer;
BEGIN
  IF p_referrer_code IS NULL OR TRIM(p_referrer_code) = '' THEN
    RETURN;
  END IF;
  SELECT user_id, nickname INTO v_referrer_user_id, v_referrer_nickname
  FROM profiles WHERE referral_code = TRIM(p_referrer_code) LIMIT 1;
  IF v_referrer_user_id IS NULL THEN
    RETURN;
  END IF;
  IF v_referrer_user_id = p_new_user_id THEN
    RETURN;
  END IF;
  SELECT COUNT(*) INTO v_existing_count
  FROM team_members WHERE user_id = v_referrer_user_id AND member_user_id = p_new_user_id;
  IF v_existing_count > 0 THEN
    RETURN;
  END IF;
  SELECT nickname, phone INTO v_new_nickname, v_new_phone
  FROM profiles WHERE user_id = p_new_user_id;
  INSERT INTO team_members (user_id, member_user_id, member_name, member_phone, vip_level, total_investment, commission, status)
  VALUES (v_referrer_user_id, p_new_user_id, COALESCE(v_new_nickname, 'New Member'), COALESCE(v_new_phone, ''), 0, 0, v_signup_bonus, 'active');
  UPDATE profiles
  SET wallet_balance = COALESCE(wallet_balance, 0) + v_signup_bonus,
      total_earnings = COALESCE(total_earnings, 0) + v_signup_bonus
  WHERE user_id = v_referrer_user_id;
  INSERT INTO wallet_transactions (user_id, type, amount, status, description)
  VALUES (v_referrer_user_id, 'referral_bonus', v_signup_bonus, 'completed',
    'Referral bonus: ' || COALESCE(v_new_nickname, 'New Member') || ' joined with your code');
END;
$$;
GRANT EXECUTE ON FUNCTION public.process_referral_signup(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.process_referral_investment(p_investing_user_id uuid, p_investment_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referrer_code text;
  v_referrer_user_id uuid;
  v_investing_nickname text;
  v_commission numeric;
BEGIN
  SELECT referrer_code, nickname INTO v_referrer_code, v_investing_nickname
  FROM profiles WHERE user_id = p_investing_user_id;
  IF v_referrer_code IS NULL OR TRIM(v_referrer_code) = '' THEN
    RETURN;
  END IF;
  SELECT user_id INTO v_referrer_user_id
  FROM profiles WHERE referral_code = TRIM(v_referrer_code) LIMIT 1;
  IF v_referrer_user_id IS NULL THEN
    RETURN;
  END IF;
  IF v_referrer_user_id = p_investing_user_id THEN
    RETURN;
  END IF;
  v_commission := p_investment_amount * 0.10;
  UPDATE team_members
  SET commission = COALESCE(commission, 0) + v_commission,
      total_investment = COALESCE(total_investment, 0) + p_investment_amount
  WHERE user_id = v_referrer_user_id AND member_user_id = p_investing_user_id;
  UPDATE profiles
  SET wallet_balance = COALESCE(wallet_balance, 0) + v_commission,
      total_earnings = COALESCE(total_earnings, 0) + v_commission
  WHERE user_id = v_referrer_user_id;
  INSERT INTO wallet_transactions (user_id, type, amount, status, description)
  VALUES (v_referrer_user_id, 'referral_commission', v_commission, 'completed',
    'Referral commission: 10% of ' || COALESCE(v_investing_nickname, 'member') || '''s investment');
END;
$$;
GRANT EXECUTE ON FUNCTION public.process_referral_investment(uuid, numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.rent_vehicle(p_vehicle_id uuid, p_rental_days integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_balance numeric;
  v_vehicle record;
  v_daily_rate numeric;
  v_daily_income numeric;
  v_total_income numeric;
  v_free_used boolean;
  v_existing_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;
  SELECT * INTO v_vehicle FROM vehicles WHERE id = p_vehicle_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Vehicle not found');
  END IF;
  IF v_vehicle.stock <= 0 THEN
    RETURN jsonb_build_object('error', 'Vehicle out of stock');
  END IF;
  SELECT wallet_balance, free_vehicle_used INTO v_balance, v_free_used
  FROM profiles WHERE user_id = v_user_id;
  IF v_balance IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;
  SELECT COUNT(*) INTO v_existing_count
  FROM rentals WHERE user_id = v_user_id AND vehicle_id = p_vehicle_id AND status = 'active';
  IF v_existing_count >= v_vehicle.rental_limit THEN
    RETURN jsonb_build_object('error', 'Rental limit reached for this vehicle');
  END IF;
  IF v_vehicle.is_free_vehicle THEN
    IF v_free_used THEN
      RETURN jsonb_build_object('error', 'Free trial already used');
    END IF;
    v_daily_income := v_vehicle.daily_return;
    v_total_income := v_vehicle.daily_return * v_vehicle.settlement_cycle;
    UPDATE profiles SET free_vehicle_used = true WHERE user_id = v_user_id;
    INSERT INTO rentals (user_id, vehicle_id, vehicle_name, rental_period, daily_income, total_income, status)
    VALUES (v_user_id, p_vehicle_id, v_vehicle.name, v_vehicle.settlement_cycle, v_daily_income, v_total_income, 'active');
    INSERT INTO wallet_transactions (user_id, type, amount, status, description)
    VALUES (v_user_id, 'free_trial', 0, 'completed', 'Free trial: ' || v_vehicle.name);
    UPDATE vehicles SET stock = stock - 1 WHERE id = p_vehicle_id;
  ELSE
    IF p_rental_days = 30 THEN
      v_daily_rate := 0.02;
    ELSIF p_rental_days = 60 THEN
      v_daily_rate := 0.03;
    ELSE
      RETURN jsonb_build_object('error', 'Rental period must be 30 or 60 days');
    END IF;
    IF v_vehicle.price > v_balance THEN
      RETURN jsonb_build_object('error', 'Insufficient wallet balance');
    END IF;
    v_daily_income := v_vehicle.price * v_daily_rate;
    v_total_income := v_daily_income * p_rental_days;
    UPDATE profiles SET wallet_balance = wallet_balance - v_vehicle.price WHERE user_id = v_user_id;
    INSERT INTO rentals (user_id, vehicle_id, vehicle_name, rental_period, daily_income, total_income, status)
    VALUES (v_user_id, p_vehicle_id, v_vehicle.name, p_rental_days, v_daily_income, v_total_income, 'active');
    INSERT INTO wallet_transactions (user_id, type, amount, status, description)
    VALUES (v_user_id, 'rental', -v_vehicle.price, 'completed', 'Rented ' || v_vehicle.name);
    UPDATE vehicles SET stock = stock - 1 WHERE id = p_vehicle_id;
    PERFORM process_referral_investment(v_user_id, v_vehicle.price);
  END IF;
  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.rent_vehicle(uuid, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_daily_earnings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_today text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
  v_existing_count integer;
  v_total_daily numeric := 0;
  v_rental record;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;
  SELECT COUNT(*) INTO v_existing_count
  FROM daily_earnings
  WHERE user_id = v_user_id AND to_char(date AT TIME ZONE 'UTC', 'YYYY-MM-DD') = v_today;
  IF v_existing_count > 0 THEN
    RETURN jsonb_build_object('success', true, 'already_claimed', true);
  END IF;
  FOR v_rental IN SELECT id, vehicle_name, daily_income FROM rentals WHERE user_id = v_user_id AND status = 'active'
  LOOP
    INSERT INTO daily_earnings (user_id, rental_id, vehicle_name, amount, date)
    VALUES (v_user_id, v_rental.id, v_rental.vehicle_name, v_rental.daily_income, now());
    v_total_daily := v_total_daily + v_rental.daily_income;
  END LOOP;
  IF v_total_daily = 0 THEN
    RETURN jsonb_build_object('success', true, 'no_earnings', true);
  END IF;
  UPDATE profiles
  SET wallet_balance = COALESCE(wallet_balance, 0) + v_total_daily,
      total_earnings = COALESCE(total_earnings, 0) + v_total_daily
  WHERE user_id = v_user_id;
  INSERT INTO wallet_transactions (user_id, type, amount, status, description)
  VALUES (v_user_id, 'daily_earnings', v_total_daily, 'completed', 'Daily earnings credited');
  RETURN jsonb_build_object('success', true, 'amount', v_total_daily);
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_daily_earnings() TO authenticated;

CREATE OR REPLACE FUNCTION public.exchange_carbon_points(p_points integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_carbon_points numeric;
  v_php_equiv numeric;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;
  IF p_points IS NULL OR p_points <= 0 THEN
    RETURN jsonb_build_object('error', 'Invalid points amount');
  END IF;
  SELECT carbon_points INTO v_carbon_points FROM profiles WHERE user_id = v_user_id;
  IF v_carbon_points IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;
  IF p_points > v_carbon_points THEN
    RETURN jsonb_build_object('error', 'Insufficient carbon points');
  END IF;
  v_php_equiv := p_points * 0.05;
  INSERT INTO carbon_records (user_id, type, points, description)
  VALUES (v_user_id, 'exchange', -p_points, 'Carbon Exchange');
  INSERT INTO wallet_transactions (user_id, type, amount, status, description)
  VALUES (v_user_id, 'carbon_exchange', v_php_equiv, 'completed', 'Carbon exchange: ' || p_points || ' points at ₱0.05 each');
  UPDATE profiles
  SET carbon_points = carbon_points - p_points,
      wallet_balance = COALESCE(wallet_balance, 0) + v_php_equiv
  WHERE user_id = v_user_id;
  RETURN jsonb_build_object('success', true, 'amount', v_php_equiv);
END;
$$;
GRANT EXECUTE ON FUNCTION public.exchange_carbon_points(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.purchase_mall_product(p_product_id uuid, p_quantity integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_carbon numeric;
  v_product record;
  v_total_price numeric;
  v_carbon_cost numeric;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;
  IF p_quantity < 1 OR p_quantity > 99 THEN
    RETURN jsonb_build_object('error', 'Invalid quantity');
  END IF;
  SELECT * INTO v_product FROM mall_products WHERE id = p_product_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Product not found');
  END IF;
  IF v_product.stock < p_quantity THEN
    RETURN jsonb_build_object('error', 'Insufficient stock');
  END IF;
  v_total_price := v_product.price * p_quantity;
  v_carbon_cost := ROUND(v_total_price / 0.01);
  SELECT carbon_points INTO v_carbon FROM profiles WHERE user_id = v_user_id;
  IF v_carbon IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;
  IF v_carbon_cost > v_carbon THEN
    RETURN jsonb_build_object('error', 'Insufficient carbon points');
  END IF;
  UPDATE profiles SET carbon_points = carbon_points - v_carbon_cost WHERE user_id = v_user_id;
  INSERT INTO carbon_records (user_id, type, points, description)
  VALUES (v_user_id, 'exchange', -v_carbon_cost, 'Mall: ' || v_product.name || ' x' || p_quantity);
  INSERT INTO mall_orders (user_id, product_id, product_name, image_url, quantity, total_price, status)
  VALUES (v_user_id, p_product_id, v_product.name, COALESCE(NULLIF(btrim(v_product.image_url), ''), '/assets/images/carziqo.webp'), p_quantity, v_total_price, 'completed');
  UPDATE mall_products SET stock = stock - p_quantity WHERE id = p_product_id;
  RETURN jsonb_build_object('success', true, 'carbon_cost', v_carbon_cost);
END;
$$;
GRANT EXECUTE ON FUNCTION public.purchase_mall_product(uuid, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_bubble_game(p_points integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_day_start timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  v_already boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;
  IF p_points IS NULL OR p_points < 0 OR p_points > 500 THEN
    RETURN jsonb_build_object('error', 'Invalid score');
  END IF;
  SELECT EXISTS (SELECT 1 FROM bubble_records WHERE user_id = v_user_id AND created_at >= v_day_start) INTO v_already;
  IF v_already THEN
    RETURN jsonb_build_object('error', 'You have already played today. Come back tomorrow.');
  END IF;
  INSERT INTO bubble_records (user_id, points_earned) VALUES (v_user_id, p_points);
  INSERT INTO carbon_records (user_id, type, points, description)
  VALUES (v_user_id, 'earn', p_points, 'Pop Bubbles reward');
  UPDATE profiles SET carbon_points = COALESCE(carbon_points, 0) + p_points WHERE user_id = v_user_id;
  RETURN jsonb_build_object('success', true, 'points', p_points);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.submit_bubble_game(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_bubble_game(integer) TO authenticated;

-- ============= REALTIME PUBLICATION =============
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'vehicles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;

-- ============= SEED DATA: VEHICLES =============
INSERT INTO vehicles (name, description, price, daily_return, image_url, stock, status, category, settlement_cycle, rental_limit, is_free_vehicle)
VALUES (
  'Carziqo Free Trial', 'Free 7-day trial vehicle — one per member. Experience passive income with no cost!',
  0, 50, 'https://images.pexels.com/photos/20000977/pexels-photo-20000977.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  999, 'available', 'standard', 7, 1, true
)
ON CONFLICT DO NOTHING;

INSERT INTO vehicles (name, description, price, daily_return, image_url, stock, status, category, settlement_cycle, rental_limit, is_free_vehicle)
VALUES
('Carziqo Starter 500', 'Entry-level autonomous taxi perfect for first-time investors. Compact, efficient, and affordable.', 550, 236, 'https://images.pexels.com/photos/18379680/pexels-photo-18379680.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 200, 'available', 'standard', 7, 5, false),
('Carziqo City Zip', 'Lightweight city pod designed for urban trips. Great daily returns at a low entry price.', 600, 180, 'https://images.pexels.com/photos/18370674/pexels-photo-18370674.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 200, 'available', 'standard', 10, 5, false),
('Carziqo Eco Dash', 'Eco-friendly compact with fast charging and smart navigation. Reliable daily income.', 650, 195, 'https://images.pexels.com/photos/14436192/pexels-photo-14436192.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 180, 'available', 'standard', 10, 5, false),
('Carziqo Urban Pod', 'Stylish urban commuter with a roomy interior and smooth ride quality.', 700, 175, 'https://images.pexels.com/photos/4014137/pexels-photo-4014137.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 180, 'available', 'standard', 12, 5, false),
('Carziqo Green Runner', 'Green energy compact with extended range. Perfect for eco-conscious investors.', 750, 188, 'https://images.pexels.com/photos/7459481/pexels-photo-7459481.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 160, 'available', 'standard', 12, 5, false),
('Carziqo Micro Cruiser', 'Reliable hatchback with great fuel efficiency and comfortable seating.', 800, 171, 'https://images.pexels.com/photos/27138933/pexels-photo-27138933.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 160, 'available', 'standard', 14, 5, false)
ON CONFLICT DO NOTHING;

INSERT INTO vehicles (name, description, price, daily_return, image_url, stock, status, category, settlement_cycle, rental_limit, is_free_vehicle)
VALUES
('Carziqo Tech Drive', 'Advanced electric sedan with cutting-edge tech and premium comfort.', 15000, 1000, 'https://images.pexels.com/photos/10029873/pexels-photo-10029873.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 40, 'available', 'premium', 45, 2, false),
('Carziqo Business Class', 'Executive sedan with luxury interior and top-tier autonomous capabilities.', 20000, 1200, 'https://images.pexels.com/photos/17233277/pexels-photo-17233277.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 35, 'available', 'premium', 50, 2, false),
('Carziqo Pro Cruiser', 'High-performance SUV with premium features and excellent daily returns.', 35000, 1750, 'https://images.pexels.com/photos/11396006/pexels-photo-11396006.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 20, 'available', 'premium', 60, 2, false),
('Carziqo Elite SUV', 'Top-tier luxury SUV with advanced autonomous fleet management.', 45000, 1929, 'https://images.pexels.com/photos/31118729/pexels-photo-31118729.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 15, 'available', 'premium', 70, 1, false)
ON CONFLICT DO NOTHING;

INSERT INTO vehicles (name, description, price, daily_return, image_url, stock, status, category, settlement_cycle, rental_limit, is_free_vehicle)
VALUES
('Carziqo Executive', 'Premium executive sedan with unmatched comfort and prestige.', 70000, 2625, 'https://images.pexels.com/photos/8662676/pexels-photo-8662676.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 10, 'available', 'luxury', 80, 1, false),
('Carziqo Phantom Series', 'Ultra-luxury autonomous vehicle with bespoke interior and elite performance.', 85000, 2833, 'https://images.pexels.com/photos/13058788/pexels-photo-13058788.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 8, 'available', 'luxury', 90, 1, false),
('Carziqo Apex GT', 'The pinnacle of autonomous luxury. Limited stock, maximum returns.', 100000, 3000, 'https://images.pexels.com/photos/29126220/pexels-photo-29126220.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 5, 'available', 'luxury', 100, 1, false)
ON CONFLICT DO NOTHING;
