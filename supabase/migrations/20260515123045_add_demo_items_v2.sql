/*
  # Add Demo Items V2

  Creates sample listings using a function that checks for or creates demo sellers.
  These items populate the buyer feed with realistic examples.

  ## Changes
  - Inserts 12 demo items across all categories
  - Uses Pexels image URLs for photos
  - Covers various Kaduna locations
*/

DO $$
DECLARE
  demo_seller_id uuid;
BEGIN
  -- For demo purposes, if any profile exists, use its ID
  -- Otherwise we'll skip this migration (auth users must be created via auth.users)
  SELECT id INTO demo_seller_id FROM profiles LIMIT 1;
  
  IF demo_seller_id IS NOT NULL THEN
    -- Insert demo items if they don't already exist
    INSERT INTO items (seller_id, title, price, description, category, location, photos, is_active)
    SELECT
      demo_seller_id,
      title,
      price,
      description,
      category,
      location,
      photos,
      true
    FROM (VALUES
      ('Samsung Galaxy A15 - Excellent Condition'::text, 45000::numeric, 'Barely used Samsung Galaxy A15. Screen is pristine, no scratches. Comes with charger and box. All functions working perfectly.'::text, 'Phones'::text, 'Kaduna Central'::text, ARRAY['https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400']::text[]),
      ('iPhone 12 Refurbished', 120000, 'Clean iPhone 12 128GB. Battery health 88%. All sensors working. Slight scratch on back but functions perfectly.', 'Phones', 'Barnawa', ARRAY['https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=400']),
      ('Vintage Leather Jacket', 25000, 'Brown vintage leather jacket, size M. Classic style, good condition. Perfect for the dry season.', 'Clothes', 'Tudun Wada', ARRAY['https://images.pexels.com/photos/3584633/pexels-photo-3584633.jpeg?auto=compress&cs=tinysrgb&w=400']),
      ('Designer Sneakers - Nike Air Max', 18000, 'Original Nike Air Max 90. Size 42. Only worn twice. White with black trim. Very clean.', 'Clothes', 'Kakuri', ARRAY['https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=400']),
      ('Fresh Tomatoes - 10kg Crate', 8000, 'Fresh farm tomatoes picked this morning. Ripe and ready. Perfect for family or resale.', 'Farm Produce', 'Chikun', ARRAY['https://images.pexels.com/photos/3856033/pexels-photo-3856033.jpeg?auto=compress&cs=tinysrgb&w=400']),
      ('Organic Groundnuts - 5kg Bag', 12000, 'High-quality organic groundnuts. Freshly shelled. No shell pieces. Great taste.', 'Farm Produce', 'Ungwan Rimi', ARRAY['https://images.pexels.com/photos/5632453/pexels-photo-5632453.jpeg?auto=compress&cs=tinysrgb&w=400']),
      ('Laptop Charger - 65W USB-C', 5500, 'Universal USB-C charger 65W. Fast charging. Works with most laptops and phones. Tested and working.', 'Electronics', 'Malali', ARRAY['https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=400']),
      ('LED TV 32" - Smart TV', 85000, 'Samsung 32 inch smart TV. Works perfectly. Remote included. HDMI and USB ports functional.', 'Electronics', 'Sabo Tasha', ARRAY['https://images.pexels.com/photos/3825517/pexels-photo-3825517.jpeg?auto=compress&cs=tinysrgb&w=400']),
      ('Dining Table Set - 6 Seater', 55000, 'Wooden dining table with 6 chairs. Brown finish. Good condition. No damage.', 'Household', 'Zaria', ARRAY['https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=400']),
      ('Gas Cooker - 4 Burner with Oven', 35000, 'Durable 4-burner gas cooker with oven. All burners and oven working. Clean inside and out.', 'Household', 'Kaduna Central', ARRAY['https://images.pexels.com/photos/7974/pexels-photo-7974.jpeg?auto=compress&cs=tinysrgb&w=400']),
      ('Refrigerator - Indomie Size', 28000, 'Working fridge, cools well. Minor dent on side. Everything inside works perfectly.', 'Household', 'Barnawa', ARRAY['https://images.pexels.com/photos/279746/pexels-photo-279746.jpeg?auto=compress&cs=tinysrgb&w=400']),
      ('Microwave Oven - 25L Capacity', 16000, 'Sharp microwave oven, 25L. Heats food quickly. All functions working. Very clean.', 'Household', 'Tudun Wada', ARRAY['https://images.pexels.com/photos/9407269/pexels-photo-9407269.jpeg?auto=compress&cs=tinysrgb&w=400'])
    ) AS demo(title, price, description, category, location, photos)
    WHERE NOT EXISTS (SELECT 1 FROM items WHERE title = demo.title);
  END IF;
END $$;
