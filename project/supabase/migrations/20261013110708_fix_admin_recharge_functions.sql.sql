-- Recreate admin functions with atomic balance updates and better error handling

CREATE OR REPLACE FUNCTION public.admin_approve_recharge(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  req_user_id uuid;
  req_amount numeric;
  req_method text;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT user_id, amount, method INTO req_user_id, req_amount, req_method
  FROM recharge_requests WHERE id = request_id AND status = 'pending';

  IF req_user_id IS NULL THEN
    RAISE EXCEPTION 'Recharge request not found or already processed';
  END IF;

  -- Update status first
  UPDATE recharge_requests SET status = 'approved' WHERE id = request_id;

  -- Atomically increment wallet balance
  UPDATE profiles 
  SET wallet_balance = COALESCE(wallet_balance, 0) + req_amount
  WHERE user_id = req_user_id;

  -- Record the transaction
  INSERT INTO wallet_transactions (user_id, type, amount, status, description)
  VALUES (req_user_id, 'recharge', req_amount, 'completed', 'Recharge approved via ' || req_method);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reject_recharge(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE recharge_requests SET status = 'rejected'
  WHERE id = request_id AND status = 'pending';
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_approve_withdrawal(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  req_user_id uuid;
  req_amount numeric;
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

  -- Atomically decrement wallet balance
  UPDATE profiles
  SET wallet_balance = COALESCE(wallet_balance, 0) - req_amount
  WHERE user_id = req_user_id;

  INSERT INTO wallet_transactions (user_id, type, amount, status, description)
  VALUES (req_user_id, 'withdrawal', -req_amount, 'completed', 'Withdrawal approved');
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reject_withdrawal(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  req_user_id uuid;
  req_amount numeric;
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

  -- Refund the held amount back to wallet atomically
  UPDATE profiles
  SET wallet_balance = COALESCE(wallet_balance, 0) + req_amount
  WHERE user_id = req_user_id;

  INSERT INTO wallet_transactions (user_id, type, amount, status, description)
  VALUES (req_user_id, 'withdrawal_refund', req_amount, 'completed', 'Withdrawal rejected - amount refunded');
END;
$$;

-- Backfill missing ₱10000 GCash recharge credit (request a5a9c33d)
-- This approved recharge was never credited to the user's wallet
UPDATE profiles
SET wallet_balance = COALESCE(wallet_balance, 0) + 10000
WHERE user_id = '80b67ce7-10d8-4751-929a-7202a11102b5';

INSERT INTO wallet_transactions (user_id, type, amount, status, description)
VALUES ('80b67ce7-10d8-4751-929a-7202a11102b5', 'recharge', 10000, 'completed', 'Recharge approved via gcash (backfill fix)');
