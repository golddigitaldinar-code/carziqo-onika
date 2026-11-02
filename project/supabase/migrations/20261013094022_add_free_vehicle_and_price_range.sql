/*
# Add free trial vehicle and price range enforcement

1. Schema Changes
- Add `is_free_vehicle` boolean column to `vehicles` table (default false)
  - Marks a vehicle as a free trial vehicle (no rental charge, 7-day cycle)
- Add `free_vehicle_used` boolean column to `profiles` table (default false)
  - Tracks whether a user has already claimed their free trial vehicle (one per user)

2. New Data
- Insert a free trial vehicle "Carziqo Free Trial" with:
  - price: 0 (free, no wallet charge)
  - daily_return: 5 (small daily earning during trial)
  - settlement_cycle: 7 (7-day trial only)
  - is_free_vehicle: true
  - stock: 999 (effectively unlimited)
  - rental_limit: 1 (one per user, enforced in app)

3. Security
- No RLS policy changes needed — existing policies cover the new columns

4. Notes
- Free vehicle: no wallet charge, 7-day cycle, one per user only
- Paid vehicles: enforced minimum ₱500 and maximum ₱100,000 rental price in app
- The free_vehicle_used flag on profiles prevents users from claiming the free vehicle more than once
*/

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_free_vehicle boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS free_vehicle_used boolean NOT NULL DEFAULT false;

INSERT INTO vehicles (name, description, price, daily_return, image_url, stock, status, category, settlement_cycle, rental_limit, is_free_vehicle)
VALUES (
  'Carziqo Free Trial',
  'Free 7-day trial vehicle — one per member. Experience passive income with no cost!',
  0,
  5,
  '',
  999,
  'available',
  'standard',
  7,
  1,
  true
);
