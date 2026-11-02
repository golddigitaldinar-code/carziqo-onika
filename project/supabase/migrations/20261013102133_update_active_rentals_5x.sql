/*
# Update active rentals to 5X profit rates

1. Changes
- Update daily_income and total_income for all active rentals to match the new 5X vehicle rates
- Syncs each active rental's daily_income with the vehicle's updated daily_return

2. Security
- No schema or RLS changes
*/

UPDATE rentals r
SET
  daily_income = v.daily_return,
  total_income = v.daily_return * r.rental_period
FROM vehicles v
WHERE r.vehicle_id = v.id
  AND r.status = 'active'
  AND v.is_free_vehicle = false;

UPDATE rentals r
SET
  daily_income = v.daily_return,
  total_income = v.daily_return * r.rental_period
FROM vehicles v
WHERE r.vehicle_id = v.id
  AND r.status = 'active'
  AND v.is_free_vehicle = true;
