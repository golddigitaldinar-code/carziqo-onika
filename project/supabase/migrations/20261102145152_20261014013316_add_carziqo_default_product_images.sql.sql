/* Add Carziqo default images to mall products and orders */
ALTER TABLE mall_products
  ALTER COLUMN image_url SET DEFAULT '/assets/images/carziqo.webp';

UPDATE mall_products
SET image_url = '/assets/images/carziqo.webp'
WHERE image_url IS NULL OR btrim(image_url) = '';

ALTER TABLE mall_orders
  ADD COLUMN IF NOT EXISTS image_url text DEFAULT '/assets/images/carziqo.webp';

UPDATE mall_orders
SET image_url = '/assets/images/carziqo.webp'
WHERE image_url IS NULL OR btrim(image_url) = '';

CREATE OR REPLACE FUNCTION public.purchase_mall_product(p_product_id uuid, p_quantity integer)
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

  INSERT INTO wallet_transactions (user_id, type, amount, status, description)
  VALUES (v_user_id, 'mall_purchase', -v_total_price, 'completed', 'Purchased ' || v_product.name || ' x' || p_quantity);

  UPDATE mall_products SET stock = stock - p_quantity WHERE id = p_product_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.purchase_mall_product(uuid, integer) TO authenticated;
