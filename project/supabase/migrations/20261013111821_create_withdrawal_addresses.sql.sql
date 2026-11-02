/*
# Create withdrawal_addresses table

1. New Tables
- `withdrawal_addresses` — stores user's saved withdrawal destinations (bank, GCash, PayMaya, crypto wallets)
  - id (uuid PK)
  - user_id (uuid, defaults to auth.uid())
  - label (text) — user-friendly name e.g. "My GCash", "Binance USDT"
  - method (text) — gcash, paymaya, bank_transfer, usdt_trc20, usdt_bep20, usdt_erc20, bitcoin, eth, bnb, opbnb, worldcoin
  - account_name (text) — holder name for bank/e-wallet
  - account_number (text) — phone number, bank account, or crypto wallet address
  - bank_name (text, nullable) — bank name if bank transfer
  - is_default (boolean, default false)
  - created_at (timestamptz)
2. Modified Tables
- `withdrawal_requests` — add `withdrawal_address_id` (uuid, nullable, FK to withdrawal_addresses)
3. Security
- RLS enabled on withdrawal_addresses
- Owner-scoped CRUD: users can only access their own addresses
*/

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
CREATE POLICY "select_own_withdrawal_addresses"
ON withdrawal_addresses FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_withdrawal_addresses" ON withdrawal_addresses;
CREATE POLICY "insert_own_withdrawal_addresses"
ON withdrawal_addresses FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_withdrawal_addresses" ON withdrawal_addresses;
CREATE POLICY "update_own_withdrawal_addresses"
ON withdrawal_addresses FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_withdrawal_addresses" ON withdrawal_addresses;
CREATE POLICY "delete_own_withdrawal_addresses"
ON withdrawal_addresses FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- Add withdrawal_address_id to withdrawal_requests
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS withdrawal_address_id uuid REFERENCES withdrawal_addresses(id) ON DELETE SET NULL;
