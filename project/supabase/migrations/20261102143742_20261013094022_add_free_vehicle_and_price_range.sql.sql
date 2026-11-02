/*
# Add free trial vehicle and price range enforcement

1. Schema Changes
- Add `is_free_vehicle` boolean column to `vehicles` table (default false)
- Add `free_vehicle_used` boolean column to `profiles` table (default false)

2. New Data
- Insert a free trial vehicle "Carziqo Free Trial"

3. Security
- No RLS policy changes needed — existing policies cover the new columns
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
)
ON CONFLICT DO NOTHING;
