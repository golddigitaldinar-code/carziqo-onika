/*
# Add database triggers for recharge and withdrawal status changes

## Root cause
Recharge requests were being marked "approved" without the wallet balance being
updated and without a wallet_transaction being created. This happened because the
status was changed directly in the database or from an old app version that bypassed
the admin_approve_recharge function.

## Fix: Database triggers
Triggers fire AFTER the status column changes, regardless of what caused the change.
This makes the system bulletproof — any path that sets status='approved' or 
status='rejected' will correctly update the wallet.

## Approach
1. recharge_requests trigger: when status changes TO 'approved', credit wallet + insert tx
2. withdrawal_requests trigger: when status changes TO 'approved', update hold tx to completed
   when status changes TO 'rejected', refund wallet + update hold tx
3. Simplify admin functions to only UPDATE the status (trigger handles the rest)
4. Guard against double-processing with a check on existing transactions
*/

-- ============================================================
-- RECHARGE TRIGGER FUNCTION
-- ============================================================
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
  -- Only fire when status changes TO 'approved'
  IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    v_user_id := NEW.user_id;
    v_amount := NEW.amount;
    v_method := NEW.method;

    -- Check if we already created a recharge transaction for this request (prevent double-credit)
    SELECT COUNT(*) INTO v_existing_count
    FROM wallet_transactions
    WHERE user_id = v_user_id
      AND type = 'recharge'
      AND amount = v_amount
      AND created_at >= NEW.created_at
      AND created_at <= NEW.updated_at + interval '1 minute'
      AND description LIKE 'Recharge approved%';

    IF v_existing_count = 0 THEN
      -- Atomically credit the wallet
      UPDATE profiles
      SET wallet_balance = COALESCE(wallet_balance, 0) + v_amount
      WHERE user_id = v_user_id;

      -- Record the transaction
      INSERT INTO wallet_transactions (user_id, type, amount, status, description)
      VALUES (v_user_id, 'recharge', v_amount, 'completed', 'Recharge approved via ' || COALESCE(v_method, 'unknown'));
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Add updated_at column to recharge_requests if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recharge_requests' AND column_name = 'updated_at') THEN
    ALTER TABLE recharge_requests ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create trigger on recharge_requests
DROP TRIGGER IF EXISTS trg_recharge_status_change ON recharge_requests;
CREATE TRIGGER trg_recharge_status_change
  AFTER UPDATE OF status ON recharge_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.on_recharge_status_change();

-- ============================================================
-- WITHDRAWAL TRIGGER FUNCTION
-- ============================================================
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
  -- Only fire when status changes
  IF NEW.status <> OLD.status THEN
    v_user_id := NEW.user_id;
    v_amount := NEW.amount;

    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
      -- Balance was already deducted at submission time (withdrawal_hold).
      -- Just update the hold transaction to completed.
      UPDATE wallet_transactions
      SET status = 'completed', description = 'Withdrawal approved by admin'
      WHERE user_id = v_user_id
        AND type = 'withdrawal_hold'
        AND amount = -v_amount
        AND status = 'pending';

    ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
      -- Refund the held amount atomically
      UPDATE profiles
      SET wallet_balance = COALESCE(wallet_balance, 0) + v_amount
      WHERE user_id = v_user_id;

      -- Update the hold transaction
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

-- Add updated_at column to withdrawal_requests if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'withdrawal_requests' AND column_name = 'updated_at') THEN
    ALTER TABLE withdrawal_requests ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create trigger on withdrawal_requests
DROP TRIGGER IF EXISTS trg_withdrawal_status_change ON withdrawal_requests;
CREATE TRIGGER trg_withdrawal_status_change
  AFTER UPDATE OF status ON withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.on_withdrawal_status_change();

-- ============================================================
-- SIMPLIFY ADMIN FUNCTIONS (trigger handles balance/transactions)
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_approve_recharge(request_id uuid)
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

  IF req_status = 'approved' THEN
    RAISE EXCEPTION 'Recharge already approved';
  END IF;

  IF req_status <> 'pending' THEN
    RAISE EXCEPTION 'Recharge request is not pending';
  END IF;

  -- The trigger will handle wallet balance + transaction
  UPDATE recharge_requests 
  SET status = 'approved', updated_at = now()
  WHERE id = request_id;
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

  UPDATE recharge_requests 
  SET status = 'rejected', updated_at = now()
  WHERE id = request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_approve_withdrawal(request_id uuid)
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

  -- The trigger will handle updating the hold transaction
  UPDATE withdrawal_requests 
  SET status = 'approved', updated_at = now()
  WHERE id = request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reject_withdrawal(request_id uuid)
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

  SELECT status INTO req_status FROM withdrawal_requests WHERE id = request_id;
  IF req_status IS NULL THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;

  IF req_status <> 'pending' THEN
    RAISE EXCEPTION 'Withdrawal request is not pending';
  END IF;

  -- The trigger will handle the refund
  UPDATE withdrawal_requests 
  SET status = 'rejected', updated_at = now()
  WHERE id = request_id;
END;
$$;

-- Re-grant execute permissions
GRANT EXECUTE ON FUNCTION public.admin_approve_recharge(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_recharge(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_withdrawal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_withdrawal(uuid) TO authenticated;
