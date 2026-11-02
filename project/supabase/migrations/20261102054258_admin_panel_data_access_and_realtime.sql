/*
# Admin panel data access, car editing, and live updates

## Plain-English summary
Adds the database pieces the admin panel needs: admin-only lists of recharge and withdrawal requests (with member names), a list of all members, the ability for admins to add and edit cars, and realtime change notifications so users see admin edits without refreshing.

## 1. Modified functions
- `admin_get_recharge_requests()` now requires an admin and returns member nickname and phone. Previously it had no admin check.
- `admin_get_withdrawal_requests()` now also returns member nickname and phone.
- New `admin_get_profiles()` returns all member profiles for admins only.

## 2. Security changes
- Admin-only functions require `is_admin()` and cannot be called by anonymous visitors.
- New policies on `vehicles`: admins can insert and update cars. Regular users still only read cars.
- Realtime is enabled for `vehicles` and `profiles` so changes are pushed to connected users. Row security still applies to what each user receives.

## 3. Important notes
1. No data is deleted or altered; only function signatures and policies change.
2. Functions are re-created with explicit execute permissions for the signed-in role only.
*/

DROP FUNCTION IF EXISTS public.admin_get_recharge_requests();
CREATE FUNCTION public.admin_get_recharge_requests()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  amount numeric,
  method text,
  status text,
  reference text,
  transaction_hash text,
  created_at timestamptz,
  updated_at timestamptz,
  member_nickname text,
  member_phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT r.id, r.user_id, r.amount, r.method, r.status, r.reference, r.transaction_hash,
         r.created_at, r.updated_at, p.nickname, p.phone
  FROM recharge_requests r
  LEFT JOIN profiles p ON p.user_id = r.user_id
  ORDER BY r.created_at DESC
  LIMIT 200;
END;
$$;

DROP FUNCTION IF EXISTS public.admin_get_withdrawal_requests();
CREATE FUNCTION public.admin_get_withdrawal_requests()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  amount numeric,
  method text,
  bank_card_id uuid,
  withdrawal_address_id uuid,
  status text,
  created_at timestamptz,
  addr_label text,
  addr_method text,
  addr_account_name text,
  addr_account_number text,
  addr_bank_name text,
  member_nickname text,
  member_phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT w.id, w.user_id, w.amount, w.method, w.bank_card_id, w.withdrawal_address_id,
         w.status, w.created_at,
         wa.label, wa.method, wa.account_name, wa.account_number, wa.bank_name,
         p.nickname, p.phone
  FROM withdrawal_requests w
  LEFT JOIN withdrawal_addresses wa ON wa.id = w.withdrawal_address_id
  LEFT JOIN profiles p ON p.user_id = w.user_id
  ORDER BY w.created_at DESC
  LIMIT 200;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_profiles()
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT * FROM profiles ORDER BY created_at DESC LIMIT 500;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_get_recharge_requests() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_withdrawal_requests() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_profiles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_recharge_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_withdrawal_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_profiles() TO authenticated;

DROP POLICY IF EXISTS "admin_insert_vehicles" ON vehicles;
CREATE POLICY "admin_insert_vehicles" ON vehicles FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_vehicles" ON vehicles;
CREATE POLICY "admin_update_vehicles" ON vehicles FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'vehicles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;
