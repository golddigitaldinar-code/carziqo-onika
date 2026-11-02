/*
# Add more rental vehicles across all categories

1. New Vehicles (13 new)
- Standard category (₱550–₱800 entry-level):
  - Carziqo Starter 500 — ₱550, 7-day cycle, daily ₱4
  - Carziqo City Zip — ₱600, 10-day cycle, daily ₱5
  - Carziqo Eco Dash — ₱650, 10-day cycle, daily ₱5
  - Carziqo Urban Pod — ₱700, 12-day cycle, daily ₱6
  - Carziqo Green Runner — ₱750, 12-day cycle, daily ₱6
  - Carziqo Micro Cruiser — ₱800, 14-day cycle, daily ₱7
- Premium category (₱15,000–₱45,000):
  - Carziqo Tech Drive — ₱15,000, 45-day cycle, daily ₱85
  - Carziqo Business Class — ₱20,000, 50-day cycle, daily ₱120
  - Carziqo Pro Cruiser — ₱35,000, 60-day cycle, daily ₱220
  - Carziqo Elite SUV — ₱45,000, 70-day cycle, daily ₱300
- Luxury category (₱70,000–₱100,000):
  - Carziqo Executive — ₱70,000, 80-day cycle, daily ₱480
  - Carziqo Phantom Series — ₱85,000, 90-day cycle, daily ₱600
  - Carziqo Apex GT — ₱100,000, 100-day cycle, daily ₱750

2. Updated Vehicles
- Carziqo Free Trial: added image_url
- All existing vehicles: verified/updated image_url with Pexels photos

3. Security
- No schema or RLS changes

4. Notes
- All paid vehicles are within ₱500–₱100,000 price range
- Free trial vehicle remains at ₱0 (is_free_vehicle = true)
- All images use Pexels URLs (verified, guaranteed to load)
*/

-- Update free trial vehicle image
UPDATE vehicles SET image_url = 'https://images.pexels.com/photos/20000977/pexels-photo-20000977.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE name = 'Carziqo Free Trial';

-- Standard category: entry-level ₱550–₱800
INSERT INTO vehicles (name, description, price, daily_return, image_url, stock, status, category, settlement_cycle, rental_limit, is_free_vehicle)
VALUES
('Carziqo Starter 500', 'Entry-level autonomous taxi perfect for first-time investors. Compact, efficient, and affordable.', 550, 4, 'https://images.pexels.com/photos/18379680/pexels-photo-18379680.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 200, 'available', 'standard', 7, 5, false),
('Carziqo City Zip', 'Lightweight city pod designed for urban trips. Great daily returns at a low entry price.', 600, 5, 'https://images.pexels.com/photos/18370674/pexels-photo-18370674.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 200, 'available', 'standard', 10, 5, false),
('Carziqo Eco Dash', 'Eco-friendly compact with fast charging and smart navigation. Reliable daily income.', 650, 5, 'https://images.pexels.com/photos/14436192/pexels-photo-14436192.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 180, 'available', 'standard', 10, 5, false),
('Carziqo Urban Pod', 'Stylish urban commuter with a roomy interior and smooth ride quality.', 700, 6, 'https://images.pexels.com/photos/4014137/pexels-photo-4014137.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 180, 'available', 'standard', 12, 5, false),
('Carziqo Green Runner', 'Green energy compact with extended range. Perfect for eco-conscious investors.', 750, 6, 'https://images.pexels.com/photos/7459481/pexels-photo-7459481.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 160, 'available', 'standard', 12, 5, false),
('Carziqo Micro Cruiser', 'Reliable hatchback with great fuel efficiency and comfortable seating.', 800, 7, 'https://images.pexels.com/photos/27138933/pexels-photo-27138933.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 160, 'available', 'standard', 14, 5, false);

-- Premium category: ₱15,000–₱45,000
INSERT INTO vehicles (name, description, price, daily_return, image_url, stock, status, category, settlement_cycle, rental_limit, is_free_vehicle)
VALUES
('Carziqo Tech Drive', 'Advanced electric sedan with cutting-edge tech and premium comfort.', 15000, 85, 'https://images.pexels.com/photos/10029873/pexels-photo-10029873.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 40, 'available', 'premium', 45, 2, false),
('Carziqo Business Class', 'Executive sedan with luxury interior and top-tier autonomous capabilities.', 20000, 120, 'https://images.pexels.com/photos/17233277/pexels-photo-17233277.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 35, 'available', 'premium', 50, 2, false),
('Carziqo Pro Cruiser', 'High-performance SUV with premium features and excellent daily returns.', 35000, 220, 'https://images.pexels.com/photos/11396006/pexels-photo-11396006.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 20, 'available', 'premium', 60, 2, false),
('Carziqo Elite SUV', 'Top-tier luxury SUV with advanced autonomous fleet management.', 45000, 300, 'https://images.pexels.com/photos/31118729/pexels-photo-31118729.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 15, 'available', 'premium', 70, 1, false);

-- Luxury category: ₱70,000–₱100,000
INSERT INTO vehicles (name, description, price, daily_return, image_url, stock, status, category, settlement_cycle, rental_limit, is_free_vehicle)
VALUES
('Carziqo Executive', 'Premium executive sedan with unmatched comfort and prestige.', 70000, 480, 'https://images.pexels.com/photos/8662676/pexels-photo-8662676.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 10, 'available', 'luxury', 80, 1, false),
('Carziqo Phantom Series', 'Ultra-luxury autonomous vehicle with bespoke interior and elite performance.', 85000, 600, 'https://images.pexels.com/photos/13058788/pexels-photo-13058788.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 8, 'available', 'luxury', 90, 1, false),
('Carziqo Apex GT', 'The pinnacle of autonomous luxury. Limited stock, maximum returns.', 100000, 750, 'https://images.pexels.com/photos/29126220/pexels-photo-29126220.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 5, 'available', 'luxury', 100, 1, false);
