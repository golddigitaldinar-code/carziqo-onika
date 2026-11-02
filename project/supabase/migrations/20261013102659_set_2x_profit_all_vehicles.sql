/*
# Set 2X profit on all rental vehicles + 350 total on free trial

1. Paid vehicles: total_return = price * 3 (2X profit + original price back)
   daily_return = price * 3 / settlement_cycle (rounded to nearest integer)

2. Free trial: daily_return = 50, total = 50 * 7 = 350

3. Calculations:
- Free Trial: 50 * 7 = 350
- Starter 500: 550*3/7 = 236 (total 1652, ~2.0X)
- City Zip: 600*3/10 = 180 (total 1800, 3.0X = 2X profit)
- Eco Dash: 650*3/10 = 195 (total 1950, 3.0X)
- Urban Pod: 700*3/12 = 175 (total 2100, 3.0X)
- Green Runner: 750*3/12 = 188 (total 2256, ~3.0X)
- Micro Cruiser: 800*3/14 = 171 (total 2394, ~3.0X)
- Mini Pod: 2000*3/20 = 300 (total 6000, 3.0X)
- Auto One: 5000*3/30 = 500 (total 15000, 3.0X)
- Eco Cruiser: 8000*3/40 = 600 (total 24000, 3.0X)
- Smart Glide: 12000*3/45 = 800 (total 36000, 3.0X)
- Tech Drive: 15000*3/45 = 1000 (total 45000, 3.0X)
- Business Class: 20000*3/50 = 1200 (total 60000, 3.0X)
- Luxe Rider: 25000*3/60 = 1250 (total 75000, 3.0X)
- Pro Cruiser: 35000*3/60 = 1750 (total 105000, 3.0X)
- Elite SUV: 45000*3/70 = 1929 (total 135030, ~3.0X)
- Fleet Master: 50000*3/90 = 1667 (total 150030, ~3.0X)
- Executive: 70000*3/80 = 2625 (total 210000, 3.0X)
- Phantom Series: 85000*3/90 = 2833 (total 254970, ~3.0X)
- Apex GT: 100000*3/100 = 3000 (total 300000, 3.0X)
*/

UPDATE vehicles SET daily_return = 50 WHERE name = 'Carziqo Free Trial';
UPDATE vehicles SET daily_return = 236 WHERE name = 'Carziqo Starter 500';
UPDATE vehicles SET daily_return = 180 WHERE name = 'Carziqo City Zip';
UPDATE vehicles SET daily_return = 195 WHERE name = 'Carziqo Eco Dash';
UPDATE vehicles SET daily_return = 175 WHERE name = 'Carziqo Urban Pod';
UPDATE vehicles SET daily_return = 188 WHERE name = 'Carziqo Green Runner';
UPDATE vehicles SET daily_return = 171 WHERE name = 'Carziqo Micro Cruiser';
UPDATE vehicles SET daily_return = 300 WHERE name = 'Carziqo Mini Pod';
UPDATE vehicles SET daily_return = 500 WHERE name = 'Carziqo Auto One';
UPDATE vehicles SET daily_return = 600 WHERE name = 'Carziqo Eco Cruiser';
UPDATE vehicles SET daily_return = 800 WHERE name = 'Carziqo Smart Glide';
UPDATE vehicles SET daily_return = 1000 WHERE name = 'Carziqo Tech Drive';
UPDATE vehicles SET daily_return = 1200 WHERE name = 'Carziqo Business Class';
UPDATE vehicles SET daily_return = 1250 WHERE name = 'Carziqo Luxe Rider';
UPDATE vehicles SET daily_return = 1750 WHERE name = 'Carziqo Pro Cruiser';
UPDATE vehicles SET daily_return = 1929 WHERE name = 'Carziqo Elite SUV';
UPDATE vehicles SET daily_return = 1667 WHERE name = 'Carziqo Fleet Master';
UPDATE vehicles SET daily_return = 2625 WHERE name = 'Carziqo Executive';
UPDATE vehicles SET daily_return = 2833 WHERE name = 'Carziqo Phantom Series';
UPDATE vehicles SET daily_return = 3000 WHERE name = 'Carziqo Apex GT';

-- Sync active rentals to new rates
UPDATE rentals r
SET
  daily_income = v.daily_return,
  total_income = v.daily_return * r.rental_period
FROM vehicles v
WHERE r.vehicle_id = v.id AND r.status = 'active';
