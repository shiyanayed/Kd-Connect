/*
  # Add More Demo Items

  Expands the demo inventory with additional realistic items at Nigerian market prices.

  ## Changes
  - Adds 15 new items across categories with realistic Naira pricing
  - Better coverage of Kaduna locations
  - Mix of new, refurbished, and used items
*/

DO $$
DECLARE
  demo_seller_id uuid;
BEGIN
  SELECT id INTO demo_seller_id FROM profiles LIMIT 1;
  
  IF demo_seller_id IS NOT NULL THEN
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
      -- More Phones
      ('Tecno Spark 10 - Good Condition'::text, 38000::numeric, 'Tecno Spark 10 with clean screen and original charger. Battery health good. No damage.'::text, 'Phones'::text, 'Malali'::text, ARRAY['https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=400']::text[]),
      ('Nokia 3310 2G Phone - Original'::text, 5500::numeric, 'Classic Nokia 3310. Original. Battery still works. Great for backup phone or collectors.'::text, 'Phones'::text, 'Ungwan Sarki'::text, ARRAY['https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=400']::text[]),
      ('Infinix Hot 12 - Sealed Box'::text, 52000::numeric, 'Brand new sealed Infinix Hot 12. Never opened. Full warranty. Complete accessories inside.'::text, 'Phones'::text, 'Sabo Tasha'::text, ARRAY['https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400']::text[]),
      
      -- More Clothes
      ('Ankara Print Wax - 6 Yards'::text, 9500::numeric, 'Beautiful Ankara wax print fabric. 6 yards. Perfect for sewing. Authentic quality.'::text, 'Clothes'::text, 'Kaduna Central'::text, ARRAY['https://images.pexels.com/photos/3584633/pexels-photo-3584633.jpeg?auto=compress&cs=tinysrgb&w=400']::text[]),
      ('Used Blue Jeans - Size 32'::text, 4500::numeric, 'Lightly used blue jeans. Skinny fit. Size 32. Very clean. No tears or stains.'::text, 'Clothes'::text, 'Barnawa'::text, ARRAY['https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=400']::text[]),
      ('Oshodi Polo Shirt Bundle - 3 pieces'::text, 8000::numeric, 'Bundle of 3 polo shirts. Excellent condition. Various colors. Perfect for work wear.'::text, 'Clothes'::text, 'Tudun Wada'::text, ARRAY['https://images.pexels.com/photos/3584633/pexels-photo-3584633.jpeg?auto=compress&cs=tinysrgb&w=400']::text[]),
      
      -- More Farm Produce
      ('White Rice - 50kg Bag'::text, 22000::numeric, 'Quality white rice. 50kg bag. Well packaged. Fresh stock. Good for resellers.'::text, 'Farm Produce'::text, 'Chikun'::text, ARRAY['https://images.pexels.com/photos/3856033/pexels-photo-3856033.jpeg?auto=compress&cs=tinysrgb&w=400']::text[]),
      ('Cassava Flour - 10kg Pack'::text, 6500::numeric, 'Pure cassava flour. 10kg. Freshly milled. No additives. Perfect for garri or paste.'::text, 'Farm Produce'::text, 'Ungwan Rimi'::text, ARRAY['https://images.pexels.com/photos/5632453/pexels-photo-5632453.jpeg?auto=compress&cs=tinysrgb&w=400']::text[]),
      ('Onions - Wholesale Crate 25kg'::text, 11000::numeric, 'Fresh red onions. 25kg crate. Wholesale price. Perfect for retailers or restaurants.'::text, 'Farm Produce'::text, 'Zaria'::text, ARRAY['https://images.pexels.com/photos/3856033/pexels-photo-3856033.jpeg?auto=compress&cs=tinysrgb&w=400']::text[]),
      
      -- More Electronics
      ('Solar Power Bank - 30000mAh'::text, 12500::numeric, 'Solar charging power bank 30000mAh. Dual USB ports. Waterproof. Fast charge.'::text, 'Electronics'::text, 'Malali'::text, ARRAY['https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=400']::text[]),
      ('Portable Speaker - Bluetooth'::text, 7800::numeric, 'Portable Bluetooth speaker. Good sound quality. Battery lasts 8 hours. Very portable.'::text, 'Electronics'::text, 'Sabo Tasha'::text, ARRAY['https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=400']::text[]),
      ('LED Bulbs - 20W Energy Saver (4 pack)'::text, 3200::numeric, 'LED bulbs 20W. Pack of 4. Energy saving. Long lasting. Cool white light.'::text, 'Electronics'::text, 'Kakuri'::text, ARRAY['https://images.pexels.com/photos/3825517/pexels-photo-3825517.jpeg?auto=compress&cs=tinysrgb&w=400']::text[]),
      
      -- More Household
      ('Ceramic Plates Set - 12 Piece'::text, 8900::numeric, 'Beautiful ceramic plate set. 12 pieces. Microwave safe. Modern design. Very durable.'::text, 'Household'::text, 'Kaduna Central'::text, ARRAY['https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=400']::text[]),
      ('Ceiling Fan - Efficient Model'::text, 16500::numeric, 'Durable ceiling fan. 100% copper winding. Energy efficient. All speeds working.'::text, 'Household'::text, 'Barnawa'::text, ARRAY['https://images.pexels.com/photos/7974/pexels-photo-7974.jpeg?auto=compress&cs=tinysrgb&w=400']::text[]),
      ('Plastic Water Drums - 200L (2 pieces)'::text, 14000::numeric, 'Two 200L plastic water storage drums. Food grade. Durable. Perfect for homes.'::text, 'Household'::text, 'Tudun Wada'::text, ARRAY['https://images.pexels.com/photos/279746/pexels-photo-279746.jpeg?auto=compress&cs=tinysrgb&w=400']::text[])
    ) AS demo(title, price, description, category, location, photos)
    WHERE NOT EXISTS (SELECT 1 FROM items WHERE title = demo.title);
  END IF;
END $$;
