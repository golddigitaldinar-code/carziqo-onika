/*
# Fix referral system: auto-create team member + credit referral bonus

## Problem
When a new user signs up with a referral code:
1. The referrer_code is stored on the new user's profile but nothing else happens
2. No team_members record is created for the referrer
3. No referral bonus is credited to the referrer's wallet
4. The referrer never sees the new member in their team list

## Fix
1. Create a `process_referral_signup` function that:
   - Finds the referrer by their referral_code
   - Creates a team_members record for the referrer
   - Credits a referral bonus (₱50) to the referrer's wallet atomically
   - Records the bonus as a wallet transaction
2. Create a `process_referral_investment` function that:
   - When a referred user makes an investment (rents a vehicle), 
     credits commission to the referrer automatically
3. Add a trigger on profiles INSERT to auto-process referrals

## Referral bonus structure
- Signup bonus: ₱50 credited to referrer when new user registers
- Investment commission: 10% of referred user's vehicle rental amount
*/

-- ============================================================
-- PROCESS REFERRAL SIGNUP FUNCTION
-- ============================================================
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
  -- If no referrer code provided, do nothing
  IF p_referrer_code IS NULL OR TRIM(p_referrer_code) = '' THEN
    RETURN;
  END IF;

  -- Find the referrer by their referral code
  SELECT user_id, nickname INTO v_referrer_user_id, v_referrer_nickname
  FROM profiles
  WHERE referral_code = TRIM(p_referrer_code)
  LIMIT 1;

  -- If no referrer found, do nothing (invalid code)
  IF v_referrer_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Don't process self-referrals
  IF v_referrer_user_id = p_new_user_id THEN
    RETURN;
  END IF;

  -- Check if this referral was already processed (prevent duplicates)
  SELECT COUNT(*) INTO v_existing_count
  FROM team_members
  WHERE user_id = v_referrer_user_id
    AND member_user_id = p_new_user_id;

  IF v_existing_count > 0 THEN
    RETURN; -- Already processed
  END IF;

  -- Get the new user's info
  SELECT nickname, phone INTO v_new_nickname, v_new_phone
  FROM profiles
  WHERE user_id = p_new_user_id;

  -- Create team_members record for the referrer
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

  -- Credit signup bonus to referrer's wallet atomically
  UPDATE profiles
  SET wallet_balance = COALESCE(wallet_balance, 0) + v_signup_bonus,
      total_earnings = COALESCE(total_earnings, 0) + v_signup_bonus
  WHERE user_id = v_referrer_user_id;

  -- Record the referral bonus transaction
  INSERT INTO wallet_transactions (user_id, type, amount, status, description)
  VALUES (v_referrer_user_id, 'referral_bonus', v_signup_bonus, 'completed', 
    'Referral bonus: ' || COALESCE(v_new_nickname, 'New Member') || ' joined with your code');
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_referral_signup(uuid, text) TO authenticated;


-- ============================================================
-- PROCESS REFERRAL INVESTMENT COMMISSION
-- Called when a referred user makes an investment (vehicle rental)
-- Credits 10% commission to the referrer
-- ============================================================
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
  v_existing_member_count integer;
BEGIN
  -- Get the investing user's referrer code
  SELECT referrer_code, nickname INTO v_referrer_code, v_investing_nickname
  FROM profiles
  WHERE user_id = p_investing_user_id;

  -- If no referrer code, do nothing
  IF v_referrer_code IS NULL OR TRIM(v_referrer_code) = '' THEN
    RETURN;
  END IF;

  -- Find the referrer
  SELECT user_id INTO v_referrer_user_id
  FROM profiles
  WHERE referral_code = TRIM(v_referrer_code)
  LIMIT 1;

  IF v_referrer_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Don't process self-referrals
  IF v_referrer_user_id = p_investing_user_id THEN
    RETURN;
  END IF;

  -- Calculate 10% commission
  v_commission := p_investment_amount * 0.10;

  -- Update the team_members record: add commission and investment
  UPDATE team_members
  SET commission = COALESCE(commission, 0) + v_commission,
      total_investment = COALESCE(total_investment, 0) + p_investment_amount
  WHERE user_id = v_referrer_user_id
    AND member_user_id = p_investing_user_id;

  -- Credit commission to referrer's wallet atomically
  UPDATE profiles
  SET wallet_balance = COALESCE(wallet_balance, 0) + v_commission,
      total_earnings = COALESCE(total_earnings, 0) + v_commission
  WHERE user_id = v_referrer_user_id;

  -- Record the commission transaction
  INSERT INTO wallet_transactions (user_id, type, amount, status, description)
  VALUES (v_referrer_user_id, 'referral_commission', v_commission, 'completed',
    'Referral commission: 10% of ' || COALESCE(v_investing_nickname, 'member') || '''s investment');
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_referral_investment(uuid, numeric) TO authenticated;
