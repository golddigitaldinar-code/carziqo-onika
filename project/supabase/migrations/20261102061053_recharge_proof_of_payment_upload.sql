/*
# Proof of payment uploads for cash in requests

1. Modified tables
- `recharge_requests`: new column `proof_path` (text, nullable). Stores the storage path of the screenshot the member uploads as proof of payment. Existing requests keep an empty value.

2. New storage
- Private bucket `payment-proofs`. Not publicly readable. Accepts JPG, PNG and WEBP files up to 5 MB.

3. Security changes
- Members can upload files only into their own folder (folder named after their user id).
- Members cannot read proof files back, so other members' payments stay private.
- Admins can read every proof file through the admin check.
- `admin_get_recharge_requests` now also returns `proof_path`. It stays admin-only, and EXECUTE is revoked from PUBLIC and anon.

4. Important notes
- No existing data is changed or removed.
- The function is recreated because its return columns changed; nothing else depends on it.
*/

ALTER TABLE recharge_requests ADD COLUMN IF NOT EXISTS proof_path text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('payment-proofs', 'payment-proofs', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "payment_proof_upload_own" ON storage.objects;
CREATE POLICY "payment_proof_upload_own" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

DROP POLICY IF EXISTS "payment_proof_read_admin" ON storage.objects;
CREATE POLICY "payment_proof_read_admin" ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND is_admin()
);

DROP FUNCTION IF EXISTS public.admin_get_recharge_requests();

CREATE FUNCTION public.admin_get_recharge_requests()
RETURNS TABLE(
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
  member_phone text,
  proof_path text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT r.id, r.user_id, r.amount, r.method, r.status, r.reference, r.transaction_hash,
         r.created_at, r.updated_at, p.nickname, p.phone, r.proof_path
  FROM recharge_requests r
  LEFT JOIN profiles p ON p.user_id = r.user_id
  ORDER BY r.created_at DESC
  LIMIT 200;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.admin_get_recharge_requests() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_recharge_requests() TO authenticated;
