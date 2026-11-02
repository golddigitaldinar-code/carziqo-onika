/*
# Fix all wallet balance operations with SECURITY DEFINER functions
Atomic balance operations for withdrawals, vehicle rentals, and mall purchases.
*/

-- 1. Request Withdrawal
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_amount numeric,
  p_method text,
  p_address_id uuid,
  p_withdrawal_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_balance numeric;
  v_wd_pwd text;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT wallet_balance, withdrawal_password INTO v_balance, v_wd_pwd
  FROM profiles WHERE user_id = v_user_id;

  IF v_balance IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;

  IF p_amount < 500 THEN
    RETURN jsonb_build_object('error', 'Minimum withdrawal is ₱500');
  END IF;

  IF p_amount > v_balance THEN
    RETURN jsonb_build_object('error', 'Insufficient wallet balance');
  END IF;

  IF p_withdrawal_password IS NULL OR p_withdrawal_password = '' THEN
    RETURN jsonb_build_object('error', 'Withdrawal password required');
  END IF;

  IF v_wd_pwd IS NULL OR v_wd_pwd = '' THEN
    RETURN jsonb_build_object('error', 'Please set a withdrawal password first');
  END IF;

  IF p_withdrawal_password <> v_wd_pwd THEN
    RETURN jsonb_build_object('error', 'Withdrawal password incorrect');
  END IF;

  IF p_address_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Please select a withdrawal address');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM withdrawal_addresses WHERE id = p_address_id AND user_id = v_user_id) THEN
    RETURN jsonb_build_object('error', 'Invalid withdrawal address');
  END IF;

  INSERT INTO withdrawal_requests (user_id, amount, method, status, withdrawal_address_id)
  VALUES (v_user_id, p_amount, p_method, 'pending', p_address_id);

  UPDATE profiles SET wallet_balance = wallet_balance - p_amount WHERE user_id = v_user_id;

  INSERT INTO wallet_transactions (user_id, type, amount, status, description)
  VALUES (v_user_id, 'withdrawal_hold', -p_amount, 'pending', 'Withdrawal pending admin review via ' || p_method);

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 2. Rent Vehicle (uses correct table name 'rentals')
CREATE OR REPLACE FUNCTION public.rent_vehicle(
  p_vehicle_id uuid,
  p_rental_days integer
)
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

    UPDATE profiles SET wallet_balance = wallet_balance - v_vehicle.price WHERE user_id = v_user_id;

    INSERT INTO rentals (user_id, vehicle_id, vehicle_name, rental_period, daily_income, total_income, status)
    VALUES (v_user_id, p_vehicle_id, v_vehicle.name, p_rental_days, v_daily_income, v_total_income, 'active');

    INSERT INTO wallet_transactions (user_id, type, amount, status, description)
    VALUES (v_user_id, 'rental', -v_vehicle.price, 'completed', 'Rented ' || v_vehicle.name);

    UPDATE vehicles SET stock = stock - 1 WHERE id = p_vehicle_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 3. Purchase Mall Product
CREATE OR REPLACE FUNCTION public.purchase_mall_product(
  p_product_id uuid,
  p_quantity integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_balance numeric;
  v_product record;
  v_total_price numeric;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  IF p_quantity < 1 OR p_quantity > 99 THEN
    RETURN jsonb_build_object('error', 'Invalid quantity');
  END IF;

  SELECT * INTO v_product FROM mall_products WHERE id = p_product_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Product not found');
  END IF;

  IF v_product.stock < p_quantity THEN
    RETURN jsonb_build_object('error', 'Insufficient stock');
  END IF;

  v_total_price := v_product.price * p_quantity;

  SELECT wallet_balance INTO v_balance FROM profiles WHERE user_id = v_user_id;
  IF v_balance IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;

  IF v_total_price > v_balance THEN
    RETURN jsonb_build_object('error', 'Insufficient wallet balance');
  END IF;

  UPDATE profiles SET wallet_balance = wallet_balance - v_total_price WHERE user_id = v_user_id;

  INSERT INTO mall_orders (user_id, product_id, product_name, quantity, total_price, status)
  VALUES (v_user_id, p_product_id, v_product.name, p_quantity, v_total_price, 'completed');

  INSERT INTO wallet_transactions (user_id, type, amount, status, description)
  VALUES (v_user_id, 'mall_purchase', -v_total_price, 'completed', 'Purchased ' || v_product.name || ' x' || p_quantity);

  UPDATE mall_products SET stock = stock - p_quantity WHERE id = p_product_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_withdrawal(numeric, text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rent_vehicle(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_mall_product(uuid, integer) TO authenticated;
