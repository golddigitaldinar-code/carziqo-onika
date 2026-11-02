/*
# Carziqo Member Platform Schema

1. Overview
This migration creates the full database schema for the Carziqo autonomous taxi
investment platform — a member portal where users register, rent/buy vehicles,
earn daily income, manage a wallet (recharge/withdraw), earn carbon points,
participate in a referral team, browse news/mall, and interact with support.

2. New Tables
- profiles — user profile data (nickname, phone, avatar, wallet balance, carbon points, VIP level, withdrawal password, referral code, referrer)
- vehicles — autonomous taxi vehicles available for rent/purchase (name, price, daily return, image, stock, status, category)
- rentals — user vehicle rental records
- wallet_transactions — wallet transaction history
- recharge_requests — user recharge requests
- bank_cards — user bank cards
- daily_earnings — daily earning records from rented vehicles
- checkins — daily check-in records
- carbon_records — carbon points exchange/earn records
- bubble_records — bubble pop game records
- team_members — referral team member records
- messages — user support messages
- news — news/announcement articles
- broadcasts — broadcast notifications
- coupons — user coupons
- mall_products — merchandise in the mall
- mall_orders — mall purchase orders
- gifts — gift list items (redeemable with carbon points)
- faqs — FAQ entries
- admin_users — admin access control
- performance_records — weekly performance reward records

3. Security
- RLS enabled on every table.
- Owner-scoped policies (auth.uid() = user_id) for user-specific tables.
- Public read policies for shared content tables (news, faqs, mall_products, vehicles, gifts).
- Admin-only access for admin_users table.
*/

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
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_vehicles" ON vehicles;
CREATE POLICY "select_vehicles" ON vehicles FOR SELECT TO anon, authenticated USING (true);

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
  created_at timestamptz DEFAULT now()
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
  image_url text DEFAULT '',
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
  image_url text DEFAULT '',
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

-- ============= ADMIN USERS =============
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
