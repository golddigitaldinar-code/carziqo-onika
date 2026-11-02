/*
# Fix admin_approve_withdrawal: remove double balance deduction

## Bug
The request_withdrawal() function already deducts the balance atomically when the user
submits a withdrawal (creating a 'withdrawal_hold' transaction). But admin_approve_withdrawal()
was ALSO deducting the balance a second time — double-charging the user.

## Fix
admin_approve_withdrawal should only:
1. Mark the withdrawal request as 'approved'
2. Update the existing 'withdrawal_hold' transaction to 'completed'
3. NOT touch the wallet balance (already deducted at submission time)

admin_reject_withdrawal should:
1. Mark the withdrawal request as 'rejected'
2. Atomically refund the held amount (balance + amount)
3. Update the existing 'withdrawal_hold' transaction to 'completed' with refund description

## Also fix admin_approve_recharge to be fully idempotent
Add a guard: if the request is already 'approved', do nothing (prevent double-credit if
admin clicks approve twice quickly).
*/

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
  req_status text;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT user_id, amount, method, status INTO req_user_id, req_amount, req_method, req_status
  FROM recharge_requests WHERE id = request_id;

  IF req_user_id IS NULL THEN
    RAISE EXCEPTION 'Recharge request not found';
  END IF;

  -- Idempotency guard: prevent double-credit
  IF req_status = 'approved' THEN
    RAISE EXCEPTION 'Recharge already approved';
  END IF;

  IF req_status <> 'pending' THEN
    RAISE EXCEPTION 'Recharge request is not pending';
  END IF;

  -- Mark as approved
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

  UPDATE recharge_requests SET status = 'rejected' WHERE id = request_id;
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
  req_status text;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT user_id, amount, status INTO req_user_id, req_amount, req_status
  FROM withdrawal_requests WHERE id = request_id;

  IF req_user_id IS NULL THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;

  -- Idempotency guard
  IF req_status = 'approved' THEN
    RAISE EXCEPTION 'Withdrawal already approved';
  END IF;

  IF req_status <> 'pending' THEN
    RAISE EXCEPTION 'Withdrawal request is not pending';
  END IF;

  -- Mark as approved (balance was already deducted at submission time)
  UPDATE withdrawal_requests SET status = 'approved' WHERE id = request_id;

  -- Update the hold transaction to completed
  UPDATE wallet_transactions 
  SET status = 'completed', description = 'Withdrawal approved by admin'
  WHERE user_id = req_user_id 
    AND type = 'withdrawal_hold' 
    AND amount = -req_amount
    AND status = 'pending'
    AND created_at = (
      SELECT created_at FROM withdrawal_requests WHERE id = request_id
    );
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
  req_status text;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT user_id, amount, status INTO req_user_id, req_amount, req_status
  FROM withdrawal_requests WHERE id = request_id;

  IF req_user_id IS NULL THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;

  -- Idempotency guard
  IF req_status = 'rejected' THEN
    RAISE EXCEPTION 'Withdrawal already rejected';
  END IF;

  IF req_status <> 'pending' THEN
    RAISE EXCEPTION 'Withdrawal request is not pending';
  END IF;

  -- Mark as rejected
  UPDATE withdrawal_requests SET status = 'rejected' WHERE id = request_id;

  -- Atomically refund the held amount
  UPDATE profiles
  SET wallet_balance = COALESCE(wallet_balance, 0) + req_amount
  WHERE user_id = req_user_id;

  -- Update the hold transaction to completed with refund info
  UPDATE wallet_transactions 
  SET status = 'completed', description = 'Withdrawal rejected - amount refunded'
  WHERE user_id = req_user_id 
    AND type = 'withdrawal_hold' 
    AND amount = -req_amount
    AND status = 'pending'
    AND created_at = (
      SELECT created_at FROM withdrawal_requests WHERE id = request_id
    );
END;
$$;

-- Re-grant execute
GRANT EXECUTE ON FUNCTION public.admin_approve_recharge(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_recharge(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_withdrawal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_withdrawal(uuid) TO authenticated;
