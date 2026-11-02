/*
# Proof of payment uploads for cash in requests
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
SET search_path = 'public'
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
