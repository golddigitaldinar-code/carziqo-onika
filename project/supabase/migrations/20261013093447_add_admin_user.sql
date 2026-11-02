/*
# Add admin user for existing member

1. Changes
- Inserts an admin_users record for the existing registered user (80b67ce7-10d8-4751-929a-7202a11102b5)
- This grants the user access to the Admin Panel and allows them to approve/reject recharges and withdrawals

2. Security
- No RLS policy changes — the existing owner-scoped policies on admin_users remain unchanged
- The is_admin() SECURITY DEFINER function will now return true for this user
*/

INSERT INTO admin_users (user_id, is_admin)
VALUES ('80b67ce7-10d8-4751-929a-7202a11102b5', true);
