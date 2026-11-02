/*
# Add database triggers for recharge and withdrawal status changes
*/
-- RECHARGE TRIGGER FUNCTION
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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recharge_requests' AND column_name = 'updated_at') THEN
    ALTER TABLE recharge_requests ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_recharge_status_change ON recharge_requests;
CREATE TRIGGER trg_recharge_status_change
  AFTER UPDATE OF status ON recharge_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.on_recharge_status_change();

-- WITHDRAWAL TRIGGER FUNCTION
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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'withdrawal_requests' AND column_name = 'updated_at') THEN
    ALTER TABLE withdrawal_requests ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_withdrawal_status_change ON withdrawal_requests;
CREATE TRIGGER trg_withdrawal_status_change
  AFTER UPDATE OF status ON withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.on_withdrawal_status_change();

-- SIMPLIFY ADMIN FUNCTIONS (trigger handles balance/transactions)
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

  UPDATE withdrawal_requests 
  SET status = 'rejected', updated_at = now()
  WHERE id = request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_approve_recharge(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_recharge(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_withdrawal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_withdrawal(uuid) TO authenticated;
