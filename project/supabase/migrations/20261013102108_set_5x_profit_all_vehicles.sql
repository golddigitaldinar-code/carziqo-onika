/*
# Set 5X profit on all rental vehicles

1. Changes
- Update daily_return for ALL paid vehicles so total_return = price * 6 (5X profit on top of original price)
- Free trial vehicle: total_return = 35 (5/day * 7 days = 35 free earnings, no cost)

2. Calculations (daily_return = price * 6 / settlement_cycle)
- Starter 500: 550 * 6 / 7 = 471.43 → 471
- City Zip: 600 * 6 / 10 = 360
- Eco Dash: 650 * 6 / 10 = 390
- Urban Pod: 700 * 6 / 12 = 350
- Green Runner: 750 * 6 / 12 = 375
- Micro Cruiser: 800 * 6 / 14 = 342.86 → 343
- Mini Pod: 2000 * 6 / 20 = 600
- Auto One: 5000 * 6 / 30 = 1000
- Eco Cruiser: 8000 * 6 / 40 = 1200
- Smart Glide: 12000 * 6 / 45 = 1600
- Tech Drive: 15000 * 6 / 45 = 2000
- Business Class: 20000 * 6 / 50 = 2400
- Luxe Rider: 25000 * 6 / 60 = 2500
- Pro Cruiser: 35000 * 6 / 60 = 3500
- Elite SUV: 45000 * 6 / 70 = 3857.14 → 3857
- Fleet Master: 50000 * 6 / 90 = 3333.33 → 3333
- Executive: 70000 * 6 / 80 = 5250
- Phantom Series: 85000 * 6 / 90 = 5666.67 → 5667
- Apex GT: 100000 * 6 / 100 = 6000

3. Security
- No schema or RLS changes

4. Notes
- Every paid vehicle now returns exactly 6X its price over the full cycle (5X profit + original price back)
- Free trial returns ₱35 total (no cost, pure profit)
- All prices remain within ₱500–₱100,000 range
*/

UPDATE vehicles SET daily_return = 471 WHERE name = 'Carziqo Starter 500';
UPDATE vehicles SET daily_return = 360 WHERE name = 'Carziqo City Zip';
UPDATE vehicles SET daily_return = 390 WHERE name = 'Carziqo Eco Dash';
UPDATE vehicles SET daily_return = 350 WHERE name = 'Carziqo Urban Pod';
UPDATE vehicles SET daily_return = 375 WHERE name = 'Carziqo Green Runner';
UPDATE vehicles SET daily_return = 343 WHERE name = 'Carziqo Micro Cruiser';
UPDATE vehicles SET daily_return = 600 WHERE name = 'Carziqo Mini Pod';
UPDATE vehicles SET daily_return = 1000 WHERE name = 'Carziqo Auto One';
UPDATE vehicles SET daily_return = 1200 WHERE name = 'Carziqo Eco Cruiser';
UPDATE vehicles SET daily_return = 1600 WHERE name = 'Carziqo Smart Glide';
UPDATE vehicles SET daily_return = 2000 WHERE name = 'Carziqo Tech Drive';
UPDATE vehicles SET daily_return = 2400 WHERE name = 'Carziqo Business Class';
UPDATE vehicles SET daily_return = 2500 WHERE name = 'Carziqo Luxe Rider';
UPDATE vehicles SET daily_return = 3500 WHERE name = 'Carziqo Pro Cruiser';
UPDATE vehicles SET daily_return = 3857 WHERE name = 'Carziqo Elite SUV';
UPDATE vehicles SET daily_return = 3333 WHERE name = 'Carziqo Fleet Master';
UPDATE vehicles SET daily_return = 5250 WHERE name = 'Carziqo Executive';
UPDATE vehicles SET daily_return = 5667 WHERE name = 'Carziqo Phantom Series';
UPDATE vehicles SET daily_return = 6000 WHERE name = 'Carziqo Apex GT';
