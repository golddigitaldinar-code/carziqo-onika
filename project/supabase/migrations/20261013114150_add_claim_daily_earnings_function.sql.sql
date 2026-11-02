/*
# Add claim_daily_earnings function for atomic daily earnings credit

The DailyEarnings page reads wallet_balance, adds daily earnings, and writes it back.
This can overwrite concurrent admin recharge credits. This function does the update
atomically: SET wallet_balance = wallet_balance + amount, SET total_earnings = total_earnings + amount.
*/

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

  -- Check if already claimed today
  SELECT COUNT(*) INTO v_existing_count
  FROM daily_earnings
  WHERE user_id = v_user_id
    AND to_char(date AT TIME ZONE 'UTC', 'YYYY-MM-DD') = v_today;

  IF v_existing_count > 0 THEN
    RETURN jsonb_build_object('success', true, 'already_claimed', true);
  END IF;

  -- Get active rentals
  FOR v_rental IN SELECT id, vehicle_name, daily_income FROM rentals WHERE user_id = v_user_id AND status = 'active'
  LOOP
    INSERT INTO daily_earnings (user_id, rental_id, vehicle_name, amount, date)
    VALUES (v_user_id, v_rental.id, v_rental.vehicle_name, v_rental.daily_income, now());

    v_total_daily := v_total_daily + v_rental.daily_income;
  END LOOP;

  IF v_total_daily = 0 THEN
    RETURN jsonb_build_object('success', true, 'no_earnings', true);
  END IF;

  -- Atomically increment balance and total earnings
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
