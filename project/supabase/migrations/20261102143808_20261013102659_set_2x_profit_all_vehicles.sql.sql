/* Set 2X profit on all rental vehicles + 350 total on free trial */
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

UPDATE rentals r
SET
  daily_income = v.daily_return,
  total_income = v.daily_return * r.rental_period
FROM vehicles v
WHERE r.vehicle_id = v.id AND r.status = 'active';
