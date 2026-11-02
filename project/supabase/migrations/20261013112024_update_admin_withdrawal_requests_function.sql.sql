/*
# Update admin_get_withdrawal_requests to include address details

Drop and recreate to change return type. JOIN withdrawal_addresses so admin sees where to send the money.
*/

DROP FUNCTION IF EXISTS public.admin_get_withdrawal_requests();

CREATE OR REPLACE FUNCTION public.admin_get_withdrawal_requests()
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
  addr_bank_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT
    w.id, w.user_id, w.amount, w.method, w.bank_card_id, w.withdrawal_address_id,
    w.status, w.created_at,
    wa.label, wa.method, wa.account_name, wa.account_number, wa.bank_name
  FROM withdrawal_requests w
  LEFT JOIN withdrawal_addresses wa ON wa.id = w.withdrawal_address_id
  ORDER BY w.created_at DESC
  LIMIT 100;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_withdrawal_requests() TO authenticated;
