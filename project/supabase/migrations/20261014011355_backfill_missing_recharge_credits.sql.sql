/*
# Backfill: Credit user for approved recharges that were never reflected in wallet

Two recharge requests were approved but the wallet balance was never updated:
- a2d08c46: ₱5,000 (bnb, approved 2026-10-14 01:03)
- c622fd14: ₱10,000 (paymaya, approved 2026-10-14 00:51)
Total missing: ₱15,000

This was caused by the old admin_approve_recharge function failing silently 
before the balance update executed. The trigger we just added prevents this 
from ever happening again.
*/

-- Credit the missing recharge amounts
UPDATE profiles
SET wallet_balance = COALESCE(wallet_balance, 0) + 15000
WHERE user_id = '80b67ce7-10d8-4751-929a-7202a11102b5';

-- Record the backfill transactions
INSERT INTO wallet_transactions (user_id, type, amount, status, description)
VALUES 
('80b67ce7-10d8-4751-929a-7202a11102b5', 'recharge', 5000, 'completed', 'Backfill: Recharge approved via bnb (previously missing)'),
('80b67ce7-10d8-4751-929a-7202a11102b5', 'recharge', 10000, 'completed', 'Backfill: Recharge approved via paymaya (previously missing)');
