/*
# Update rent_vehicle to process referral commission on paid rentals
*/

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

  -- Check rental limit
  SELECT COUNT(*) INTO v_existing_count
  FROM rentals
  WHERE user_id = v_user_id AND vehicle_id = p_vehicle_id AND status = 'active';

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
    IF v_vehicle.price > v_balance THEN
      RETURN jsonb_build_object('error', 'Insufficient wallet balance');
    END IF;

    v_daily_income := v_vehicle.daily_return;
    v_total_income := v_daily_income * p_rental_days;

    -- Atomically deduct balance
    UPDATE profiles SET wallet_balance = wallet_balance - v_vehicle.price WHERE user_id = v_user_id;

    INSERT INTO rentals (user_id, vehicle_id, vehicle_name, rental_period, daily_income, total_income, status)
    VALUES (v_user_id, p_vehicle_id, v_vehicle.name, p_rental_days, v_daily_income, v_total_income, 'active');

    INSERT INTO wallet_transactions (user_id, type, amount, status, description)
    VALUES (v_user_id, 'rental', -v_vehicle.price, 'completed', 'Rented ' || v_vehicle.name);

    UPDATE vehicles SET stock = stock - 1 WHERE id = p_vehicle_id;

    -- Process referral commission: 10% of rental price to the referrer
    PERFORM process_referral_investment(v_user_id, v_vehicle.price);
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rent_vehicle(uuid, integer) TO authenticated;
