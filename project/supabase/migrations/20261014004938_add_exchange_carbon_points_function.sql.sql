/*
# Add exchange_carbon_points function for atomic carbon exchange

The Carbon page reads wallet_balance, adds the exchange amount, and writes it back.
This can overwrite concurrent admin recharge credits. This function does the update
atomically: SET wallet_balance = wallet_balance + amount, SET carbon_points = carbon_points - pts.
*/

CREATE OR REPLACE FUNCTION public.exchange_carbon_points(p_points integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_carbon_points numeric;
  v_php_equiv numeric;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  IF p_points IS NULL OR p_points <= 0 THEN
    RETURN jsonb_build_object('error', 'Invalid points amount');
  END IF;

  SELECT carbon_points INTO v_carbon_points FROM profiles WHERE user_id = v_user_id;
  IF v_carbon_points IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;

  IF p_points > v_carbon_points THEN
    RETURN jsonb_build_object('error', 'Insufficient carbon points');
  END IF;

  v_php_equiv := p_points * 0.5;

  INSERT INTO carbon_records (user_id, type, points, description)
  VALUES (v_user_id, 'exchange', -p_points, 'Carbon Exchange');

  INSERT INTO wallet_transactions (user_id, type, amount, status, description)
  VALUES (v_user_id, 'carbon_exchange', v_php_equiv, 'completed', 'Carbon exchange: ' || p_points || ' points');

  -- Atomically update both columns (cannot overwrite concurrent operations)
  UPDATE profiles
  SET carbon_points = carbon_points - p_points,
      wallet_balance = COALESCE(wallet_balance, 0) + v_php_equiv
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object('success', true, 'amount', v_php_equiv);
END;
$$;

GRANT EXECUTE ON FUNCTION public.exchange_carbon_points(integer) TO authenticated;
