/*
# Fix referral system: auto-create team member + credit referral bonus
*/
CREATE OR REPLACE FUNCTION public.process_referral_signup(p_new_user_id uuid, p_referrer_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referrer_user_id uuid;
  v_referrer_nickname text;
  v_new_nickname text;
  v_new_phone text;
  v_signup_bonus numeric := 50;
  v_existing_count integer;
BEGIN
  IF p_referrer_code IS NULL OR TRIM(p_referrer_code) = '' THEN
    RETURN;
  END IF;

  SELECT user_id, nickname INTO v_referrer_user_id, v_referrer_nickname
  FROM profiles
  WHERE referral_code = TRIM(p_referrer_code)
  LIMIT 1;

  IF v_referrer_user_id IS NULL THEN
    RETURN;
  END IF;

  IF v_referrer_user_id = p_new_user_id THEN
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_existing_count
  FROM team_members
  WHERE user_id = v_referrer_user_id
    AND member_user_id = p_new_user_id;

  IF v_existing_count > 0 THEN
    RETURN;
  END IF;

  SELECT nickname, phone INTO v_new_nickname, v_new_phone
  FROM profiles
  WHERE user_id = p_new_user_id;

  INSERT INTO team_members (user_id, member_user_id, member_name, member_phone, vip_level, total_investment, commission, status)
  VALUES (
    v_referrer_user_id,
    p_new_user_id,
    COALESCE(v_new_nickname, 'New Member'),
    COALESCE(v_new_phone, ''),
    0,
    0,
    v_signup_bonus,
    'active'
  );

  UPDATE profiles
  SET wallet_balance = COALESCE(wallet_balance, 0) + v_signup_bonus,
      total_earnings = COALESCE(total_earnings, 0) + v_signup_bonus
  WHERE user_id = v_referrer_user_id;

  INSERT INTO wallet_transactions (user_id, type, amount, status, description)
  VALUES (v_referrer_user_id, 'referral_bonus', v_signup_bonus, 'completed', 
    'Referral bonus: ' || COALESCE(v_new_nickname, 'New Member') || ' joined with your code');
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_referral_signup(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.process_referral_investment(p_investing_user_id uuid, p_investment_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referrer_code text;
  v_referrer_user_id uuid;
  v_investing_nickname text;
  v_commission numeric;
BEGIN
  SELECT referrer_code, nickname INTO v_referrer_code, v_investing_nickname
  FROM profiles
  WHERE user_id = p_investing_user_id;

  IF v_referrer_code IS NULL OR TRIM(v_referrer_code) = '' THEN
    RETURN;
  END IF;

  SELECT user_id INTO v_referrer_user_id
  FROM profiles
  WHERE referral_code = TRIM(v_referrer_code)
  LIMIT 1;

  IF v_referrer_user_id IS NULL THEN
    RETURN;
  END IF;

  IF v_referrer_user_id = p_investing_user_id THEN
    RETURN;
  END IF;

  v_commission := p_investment_amount * 0.10;

  UPDATE team_members
  SET commission = COALESCE(commission, 0) + v_commission,
      total_investment = COALESCE(total_investment, 0) + p_investment_amount
  WHERE user_id = v_referrer_user_id
    AND member_user_id = p_investing_user_id;

  UPDATE profiles
  SET wallet_balance = COALESCE(wallet_balance, 0) + v_commission,
      total_earnings = COALESCE(total_earnings, 0) + v_commission
  WHERE user_id = v_referrer_user_id;

  INSERT INTO wallet_transactions (user_id, type, amount, status, description)
  VALUES (v_referrer_user_id, 'referral_commission', v_commission, 'completed',
    'Referral commission: 10% of ' || COALESCE(v_investing_nickname, 'member') || '''s investment');
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_referral_investment(uuid, numeric) TO authenticated;
