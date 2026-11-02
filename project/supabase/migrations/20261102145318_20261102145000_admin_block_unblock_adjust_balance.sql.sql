/*
# Admin user management: block/unblock users, adjust wallet balance

1. Schema Changes
- Add `is_blocked` boolean column to `profiles` (default false)
  When true, the user cannot sign in or use the app.

2. New Functions (all SECURITY DEFINER, admin-only)
- `admin_block_user(p_user_id uuid)` — sets is_blocked = true
- `admin_unblock_user(p_user_id uuid)` — sets is_blocked = false
- `admin_adjust_balance(p_user_id uuid, p_amount numeric, p_reason text)` — atomically
  adds (positive) or subtracts (negative) from a user's wallet_balance and logs a
  wallet_transaction. This lets admins correct balances, credit bonuses, or reverse
  erroneous charges.

3. Security
- All three functions require `is_admin()` and run as SECURITY DEFINER.
- Execute revoked from PUBLIC and anon; granted to authenticated only.
- The profiles table SELECT/UPDATE policies are unchanged; blocked status is
  enforced at the application level (the app checks profile.is_blocked).
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;

-- Block a user
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

-- Unblock a user
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

-- Adjust a user's wallet balance (positive = credit, negative = debit)
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

  -- Atomically adjust the balance
  UPDATE profiles
  SET wallet_balance = COALESCE(wallet_balance, 0) + p_amount
  WHERE user_id = p_user_id
  RETURNING wallet_balance INTO v_new_balance;

  -- Log the transaction
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

REVOKE EXECUTE ON FUNCTION public.admin_block_user(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_unblock_user(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_balance(uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_block_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_unblock_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_adjust_balance(uuid, numeric, text) TO authenticated;
