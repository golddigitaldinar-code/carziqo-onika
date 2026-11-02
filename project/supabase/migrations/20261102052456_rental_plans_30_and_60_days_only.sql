/*
# Rental plans limited to 30 and 60 days

1. Changed Functions
- `rent_vehicle`: paid vehicle rentals now accept only two periods.
  - 30 days: earns 2% of the vehicle price per day.
  - 60 days: earns 3% of the vehicle price per day.
  - Any other period is rejected with a clear message.
- Daily income and total income for paid rentals are now calculated from the chosen plan, so the amount shown to the member matches the amount credited each day.
- Free trial rentals are unchanged (they still use the vehicle's daily return over its trial length).

2. Existing Data
- Rentals already in progress are not modified.

3. Security
- No table, policy, or grant changes. The function keeps its existing permissions.

4. Important Notes
- 1. Only 30 and 60 day rentals can be created from now on.
- 2. Rental income is credited by the existing daily earnings process; nothing there was changed.
*/

CREATE OR REPLACE FUNCTION public.rent_vehicle(p_vehicle_id uuid, p_rental_days integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
v_user_id uuid := auth.uid();
v_balance numeric;
v_vehicle record;
v_daily_rate numeric;
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
IF p_rental_days = 30 THEN
v_daily_rate := 0.02;
ELSIF p_rental_days = 60 THEN
v_daily_rate := 0.03;
ELSE
RETURN jsonb_build_object('error', 'Rental period must be 30 or 60 days');
END IF;

IF v_vehicle.price > v_balance THEN
RETURN jsonb_build_object('error', 'Insufficient wallet balance');
END IF;

v_daily_income := v_vehicle.price * v_daily_rate;
v_total_income := v_daily_income * p_rental_days;

UPDATE profiles SET wallet_balance = wallet_balance - v_vehicle.price WHERE user_id = v_user_id;

INSERT INTO rentals (user_id, vehicle_id, vehicle_name, rental_period, daily_income, total_income, status)
VALUES (v_user_id, p_vehicle_id, v_vehicle.name, p_rental_days, v_daily_income, v_total_income, 'active');

INSERT INTO wallet_transactions (user_id, type, amount, status, description)
VALUES (v_user_id, 'rental', -v_vehicle.price, 'completed', 'Rented ' || v_vehicle.name);

UPDATE vehicles SET stock = stock - 1 WHERE id = p_vehicle_id;

PERFORM process_referral_investment(v_user_id, v_vehicle.price);
END IF;

RETURN jsonb_build_object('success', true);
END;
$function$;
