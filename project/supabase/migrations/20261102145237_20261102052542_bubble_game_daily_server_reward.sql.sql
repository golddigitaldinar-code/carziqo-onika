/*
# Pop Bubbles game: one play per day, server-side reward
*/
CREATE OR REPLACE FUNCTION public.submit_bubble_game(p_points integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_day_start timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  v_already boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  IF p_points IS NULL OR p_points < 0 OR p_points > 500 THEN
    RETURN jsonb_build_object('error', 'Invalid score');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM bubble_records WHERE user_id = v_user_id AND created_at >= v_day_start
  ) INTO v_already;

  IF v_already THEN
    RETURN jsonb_build_object('error', 'You have already played today. Come back tomorrow.');
  END IF;

  INSERT INTO bubble_records (user_id, points_earned) VALUES (v_user_id, p_points);

  INSERT INTO carbon_records (user_id, type, points, description)
  VALUES (v_user_id, 'earn', p_points, 'Pop Bubbles reward');

  UPDATE profiles SET carbon_points = COALESCE(carbon_points, 0) + p_points WHERE user_id = v_user_id;

  RETURN jsonb_build_object('success', true, 'points', p_points);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.submit_bubble_game(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_bubble_game(integer) TO authenticated;
