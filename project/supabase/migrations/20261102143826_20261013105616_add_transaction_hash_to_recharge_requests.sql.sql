ALTER TABLE recharge_requests ADD COLUMN IF NOT EXISTS transaction_hash text DEFAULT '';
