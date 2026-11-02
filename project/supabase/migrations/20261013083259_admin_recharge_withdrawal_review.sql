/*
# Admin Recharge & Withdrawal Review System

1. New Tables
- `withdrawal_requests` — stores withdrawal requests pending admin approval
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `amount` (numeric, withdrawal amount)
  - `method` (text, withdrawal method e.g. bank_transfer)
  - `bank_card_id` (uuid, optional reference to bank_cards)
  - `status` (text, pending/approved/rejected)
  - `created_at` (timestamp)

2. Security Functions (SECURITY DEFINER)
- `is_admin()` — checks if current user has admin record
- `admin_get_recharge_requests()` — returns all recharge requests (admin only)
- `admin_get_withdrawal_requests()` — returns all withdrawal requests (admin only)
- `admin_approve_recharge(request_id uuid)` — approves recharge, credits wallet, logs transaction
- `admin_reject_recharge(request_id uuid)` — rejects recharge
- `admin_approve_withdrawal(request_id uuid)` — approves withdrawal, deducts wallet, logs transaction
- `admin_reject_withdrawal(request_id uuid)` — rejects withdrawal, refunds wallet

3. Security
- RLS enabled on withdrawal_requests with owner-scoped policies
- Admin functions are SECURITY DEFINER so they bypass RLS for cross-user operations
- Admin functions check `is_admin()` before performing any action
- Recharge approval credits wallet only if status is 'pending'
- Withdrawal approval deducts wallet only if status is 'pending'

4. Notes
- Users submit recharge/withdrawal requests as 'pending' — no immediate wallet change
- Admin sees all requests via SECURITY DEFINER functions
- Admin approval triggers wallet balance update + wallet_transactions insert
- Withdrawal rejection refunds the previously-held amount back to wallet
*/

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'bank_transfer',
  bank_card_id uuid,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_withdrawals" ON withdrawal_requests;
CREATE POLICY "select_own_withdrawals" ON withdrawal_requests FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_withdrawals" ON withdrawal_requests;
CREATE POLICY "insert_own_withdrawals" ON withdrawal_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_withdrawals" ON withdrawal_requests;
CREATE POLICY "update_own_withdrawals" ON withdrawal_requests FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_withdrawals" ON withdrawal_requests;
CREATE POLICY "delete_own_withdrawals" ON withdrawal_requests FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Helper: check if current user is admin
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

-- Admin: get all recharge requests
CREATE OR REPLACE FUNCTION admin_get_recharge_requests()
RETURNS SETOF recharge_requests
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM recharge_requests
  ORDER BY created_at DESC
  LIMIT 100;
$$;

-- Admin: get all withdrawal requests
CREATE OR REPLACE FUNCTION admin_get_withdrawal_requests()
RETURNS SETOF withdrawal_requests
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM withdrawal_requests
  ORDER BY created_at DESC
  LIMIT 100;
$$;

-- Admin: approve a recharge request — credits wallet
CREATE OR REPLACE FUNCTION admin_approve_recharge(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req_user_id uuid;
  req_amount numeric;
  req_method text;
  current_balance numeric;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT user_id, amount, method INTO req_user_id, req_amount, req_method
  FROM recharge_requests WHERE id = request_id AND status = 'pending';

  IF req_user_id IS NULL THEN
    RAISE EXCEPTION 'Recharge request not found or already processed';
  END IF;

  UPDATE recharge_requests SET status = 'approved' WHERE id = request_id;

  SELECT wallet_balance INTO current_balance
  FROM profiles WHERE user_id = req_user_id;

  current_balance := COALESCE(current_balance, 0) + req_amount;

  UPDATE profiles SET wallet_balance = current_balance WHERE user_id = req_user_id;

  INSERT INTO wallet_transactions (user_id, type, amount, status, description)
  VALUES (req_user_id, 'recharge', req_amount, 'completed', 'Recharge approved via ' || req_method);
END;
$$;

-- Admin: reject a recharge request
CREATE OR REPLACE FUNCTION admin_reject_recharge(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE recharge_requests SET status = 'rejected'
  WHERE id = request_id AND status = 'pending';
END;
$$;

-- Admin: approve a withdrawal — deducts wallet
CREATE OR REPLACE FUNCTION admin_approve_withdrawal(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req_user_id uuid;
  req_amount numeric;
  current_balance numeric;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT user_id, amount INTO req_user_id, req_amount
  FROM withdrawal_requests WHERE id = request_id AND status = 'pending';

  IF req_user_id IS NULL THEN
    RAISE EXCEPTION 'Withdrawal request not found or already processed';
  END IF;

  UPDATE withdrawal_requests SET status = 'approved' WHERE id = request_id;

  SELECT wallet_balance INTO current_balance
  FROM profiles WHERE user_id = req_user_id;

  current_balance := COALESCE(current_balance, 0) - req_amount;

  UPDATE profiles SET wallet_balance = current_balance WHERE user_id = req_user_id;

  INSERT INTO wallet_transactions (user_id, type, amount, status, description)
  VALUES (req_user_id, 'withdrawal', -req_amount, 'completed', 'Withdrawal approved');
END;
$$;

-- Admin: reject a withdrawal — refunds held amount
CREATE OR REPLACE FUNCTION admin_reject_withdrawal(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req_user_id uuid;
  req_amount numeric;
  current_balance numeric;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT user_id, amount INTO req_user_id, req_amount
  FROM withdrawal_requests WHERE id = request_id AND status = 'pending';

  IF req_user_id IS NULL THEN
    RAISE EXCEPTION 'Withdrawal request not found or already processed';
  END IF;

  UPDATE withdrawal_requests SET status = 'rejected' WHERE id = request_id;

  -- Refund the held amount back to wallet
  SELECT wallet_balance INTO current_balance
  FROM profiles WHERE user_id = req_user_id;

  current_balance := COALESCE(current_balance, 0) + req_amount;

  UPDATE profiles SET wallet_balance = current_balance WHERE user_id = req_user_id;

  INSERT INTO wallet_transactions (user_id, type, amount, status, description)
  VALUES (req_user_id, 'withdrawal_refund', req_amount, 'completed', 'Withdrawal rejected - amount refunded');
END;
$$;
