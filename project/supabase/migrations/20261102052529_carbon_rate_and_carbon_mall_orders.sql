/*
# Carbon exchange rate to ₱0.01 and carbon-point mall orders

1. Changed Functions
- `exchange_carbon_points`: 1 carbon point is now worth ₱0.01 (previously ₱0.05). The transaction history text reflects the new rate.
- `purchase_mall_product`: mall orders are paid with carbon points instead of wallet balance.
  - Carbon cost = product price in pesos divided by 0.01 (so ₱1 = 100 carbon points), multiplied by quantity.
  - The carbon cost is deducted from the member's carbon points and recorded in carbon history.
  - The wallet balance is no longer used for mall purchases.
  - The order is still saved to the member's mall orders with its peso price, and stock is reduced as before.

2. Security
- No table, policy, or grant changes. Both functions keep their existing permissions.

3. Important Notes
- 1. Existing exchange and mall history is not modified.
- 2. Insufficient carbon points returns a clear error and no charge is made.
*/

CREATE OR REPLACE FUNCTION public.exchange_carbon_points(p_points integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

v_php_equiv := p_points * 0.01;

INSERT INTO carbon_records (user_id, type, points, description)
VALUES (v_user_id, 'exchange', -p_points, 'Carbon Exchange');

INSERT INTO wallet_transactions (user_id, type, amount, status, description)
VALUES (v_user_id, 'carbon_exchange', v_php_equiv, 'completed', 'Carbon exchange: ' || p_points || ' points at ₱0.01 each');

UPDATE profiles
SET carbon_points = carbon_points - p_points,
wallet_balance = COALESCE(wallet_balance, 0) + v_php_equiv
WHERE user_id = v_user_id;

RETURN jsonb_build_object('success', true, 'amount', v_php_equiv);
END;
$function$;

CREATE OR REPLACE FUNCTION public.purchase_mall_product(p_product_id uuid, p_quantity integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
v_user_id uuid := auth.uid();
v_carbon numeric;
v_product record;
v_total_price numeric;
v_carbon_cost numeric;
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
v_carbon_cost := ROUND(v_total_price / 0.01);

SELECT carbon_points INTO v_carbon FROM profiles WHERE user_id = v_user_id;
IF v_carbon IS NULL THEN
RETURN jsonb_build_object('error', 'Profile not found');
END IF;

IF v_carbon_cost > v_carbon THEN
RETURN jsonb_build_object('error', 'Insufficient carbon points');
END IF;

UPDATE profiles SET carbon_points = carbon_points - v_carbon_cost WHERE user_id = v_user_id;

INSERT INTO carbon_records (user_id, type, points, description)
VALUES (v_user_id, 'exchange', -v_carbon_cost, 'Mall: ' || v_product.name || ' x' || p_quantity);

INSERT INTO mall_orders (user_id, product_id, product_name, image_url, quantity, total_price, status)
VALUES (
v_user_id,
p_product_id,
v_product.name,
COALESCE(NULLIF(btrim(v_product.image_url), ''), '/assets/images/carziqo.webp'),
p_quantity,
v_total_price,
'completed'
);

UPDATE mall_products SET stock = stock - p_quantity WHERE id = p_product_id;

RETURN jsonb_build_object('success', true, 'carbon_cost', v_carbon_cost);
END;
$function$;
