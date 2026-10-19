-- ==============================================================================
-- NIRAI E-COMMERCE SEED DATA (DEVELOPMENT / STAGING SEED ONLY)
-- Generated from initial catalog definitions for local or staging environments.
-- In production, Supabase database tables are the sole source of truth.
-- ==============================================================================

-- 1. CATEGORIES
INSERT INTO public.categories (id, slug, name_en, name_ta, level, parent_id, image, description_en, description_ta, is_active, item_count, display_order)
VALUES ('cat-women', 'women', 'Women', 'பெண்கள்', 1, NULL, 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80', 'Handcrafted sarees, silk weaves, and graceful ethnic ensembles.', 'கைத்தறி பட்டுப் புடவைகள் மற்றும் பாரம்பரிய மகளிர் உடைகள்.', true, 14, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.categories (id, slug, name_en, name_ta, level, parent_id, image, description_en, description_ta, is_active, item_count, display_order)
VALUES ('cat-men', 'men', 'Men', 'ஆண்கள்', 1, NULL, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80', 'Pure cotton vestis, angavastrams, and tailored traditional shirts.', 'தூய பருத்தி வேஷ்டிகள், அங்கவஸ்திரம் மற்றும் பாரம்பரிய சட்டைகள்.', true, 10, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.categories (id, slug, name_en, name_ta, level, parent_id, image, description_en, description_ta, is_active, item_count, display_order)
VALUES ('cat-kids', 'kids', 'Kids Ethnic', 'குழந்தைகள்', 1, NULL, 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=800&q=80', 'Pattu pavadai, kids dhoti-kurta sets for temple visits and celebrations.', 'பட்டுப் பாவாடை மற்றும் சிறுவர் பாரம்பரிய வேஷ்டி சட்டை செட்.', true, 8, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.categories (id, slug, name_en, name_ta, level, parent_id, image, description_en, description_ta, is_active, item_count, display_order)
VALUES ('cat-sarees', 'sarees', 'Sarees', 'புடவைகள்', 2, 'cat-women', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80', 'Kanchipuram silks, Chettinad cotton, and festive drapery.', 'காஞ்சிபுரம் பட்டு, செட்டிநாடு காட்டன் மற்றும் திருமண புடவைகள்.', true, 9, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.categories (id, slug, name_en, name_ta, level, parent_id, image, description_en, description_ta, is_active, item_count, display_order)
VALUES ('cat-vesti', 'vesti', 'Vesti & Dhoti', 'வேஷ்டி & வேட்டி', 2, 'cat-men', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80', 'Ceremonial double vestis with traditional gold kasavu and zari borders.', 'தங்க ஜரிகை மற்றும் கசவு கரை அமைந்த விசேஷ இரட்டை வேஷ்டிகள்.', true, 6, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.categories (id, slug, name_en, name_ta, level, parent_id, image, description_en, description_ta, is_active, item_count, display_order)
VALUES ('cat-shirts', 'shirts', 'Traditional Shirts', 'பாரம்பரிய சட்டைகள்', 2, 'cat-men', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80', 'Breathable pure cotton and silk-blend shirts in pristine festive whites.', 'சுத்தமான கதர் மற்றும் பட்டு கலந்த விழா கால சட்டைகள்.', true, 4, 0)
ON CONFLICT (id) DO NOTHING;

-- 2. PRODUCTS
INSERT INTO public.products (id, sku, name_en, name_ta, slug, description_en, description_ta, short_desc_en, short_desc_ta, category_id, sub_category_id, brand, fabric, material, style, care_instructions_en, care_instructions_ta, base_price, regular_discount, special_discount, final_price, stock, low_stock_threshold, is_featured, is_new_arrival, is_active, images, variants, rating, review_count, reviews)
VALUES (
  'prod-kanchi-maroon', 'NIR-SAR-001', 'Vaanam Kanchipuram Pure Silk Saree', 'வானம் காஞ்சிபுரம் தூய பட்டுப் புடவை', 'vaanam-kanchipuram-pure-silk-saree',
  'Woven with certified pure mulberry silk and pure gold zari pallu featuring sacred temple peacock (Mayil) and temple chakra motifs. Drapes with an unmatched regal weight and lustrous drape.', 'மயில் மற்றும் கோவில் சக்கர உருவங்கள் பொறிக்கப்பட்ட தூய பட்டு மற்றும் தங்க ஜரிகை முந்தானை கொண்ட கம்பீரமான காஞ்சிபுரம் பட்டுப்புடவை.', 'Deep crimson maroon with temple gold zari pallu and matching unstitched blouse.', 'கரும் சிவப்பு வண்ணத்தில் தங்க ஜரிகை முந்தானை மற்றும் பிளவுஸ் துணியுடன்.',
  'cat-sarees', 'cat-women', 'Nirai Heritage',
  'Pure Mulberry Silk (GI Certified)', '100% Silk with Zari', 'Bridal & Festival Ceremonial',
  'Dry clean only. Store wrapped in soft muslin cloth. Air periodically.', 'டிரை கிளீன் மட்டும் செய்யவும். மெல்லிய மஸ்லின் துணியில் போர்த்தி வைக்கவும்.',
  12499, 15, 5, 10062,
  14, 4, true, false, true,
  '["https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80","https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80"]'::jsonb,
  '[{"id":"var-1","name":"Deep Crimson & Gold","color":"Deep Crimson Maroon","colorHex":"#6E1E24","size":"Free Size (6.3m)","sku":"NIR-SAR-001-RD","stock":8},{"id":"var-2","name":"Temple Emerald & Gold","color":"Temple Emerald Green","colorHex":"#1B4D3E","size":"Free Size (6.3m)","sku":"NIR-SAR-001-GN","stock":6}]'::jsonb,
  4.9, 28, '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.products (id, sku, name_en, name_ta, slug, description_en, description_ta, short_desc_en, short_desc_ta, category_id, sub_category_id, brand, fabric, material, style, care_instructions_en, care_instructions_ta, base_price, regular_discount, special_discount, final_price, stock, low_stock_threshold, is_featured, is_new_arrival, is_active, images, variants, rating, review_count, reviews)
VALUES (
  'prod-chettinad-cotton', 'NIR-SAR-002', 'Karaikudi Chettinad Handloom Cotton Saree', 'காரைக்குடி செட்டிநாடு கைத்தறி பருத்தி புடவை', 'karaikudi-chettinad-handloom-cotton-saree',
  'Authentic 80s count handspun Chettinad cotton with contrasting mustard yellow temple border (Gopuram) and geometric body weave. Extremely breathable and effortlessly elegant for daily pujas and gatherings.', 'கோபுரக் கரை மற்றும் கட்டம் வடிவிலான செட்டிநாடு பாரம்பரிய பருத்தி புடவை. நாள் முழுதும் உடுத்த இதமானது.', 'Earth red with mustard gopuram borders, breathable handloom comfort.', 'மண் சிவப்பு மற்றும் மஞ்சள் கோபுரக் கரை கொண்ட கைத்தறி ஆடை.',
  'cat-sarees', 'cat-women', 'Nirai Everyday',
  '80s Combed Cotton', '100% Organic Handloom Cotton', 'Pooja & Casual Festive',
  'Cold hand wash with mild eco-detergent. Shade dry.', 'குளிர்ந்த நீரில் கையால் துவைக்கவும். நிழலில் உலர்த்தவும்.',
  2899, 20, 0, 2319,
  22, 5, true, false, true,
  '["https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80","https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80"]'::jsonb,
  '[{"id":"var-3","name":"Terracotta & Mustard","color":"Terracotta Red","colorHex":"#9E4734","size":"Free Size (5.5m)","sku":"NIR-SAR-002-TR","stock":12},{"id":"var-4","name":"Indigo & Turmeric","color":"Indigo Blue","colorHex":"#264348","size":"Free Size (5.5m)","sku":"NIR-SAR-002-IN","stock":10}]'::jsonb,
  4.8, 42, '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.products (id, sku, name_en, name_ta, slug, description_en, description_ta, short_desc_en, short_desc_ta, category_id, sub_category_id, brand, fabric, material, style, care_instructions_en, care_instructions_ta, base_price, regular_discount, special_discount, final_price, stock, low_stock_threshold, is_featured, is_new_arrival, is_active, images, variants, rating, review_count, reviews)
VALUES (
  'prod-salem-vesti', 'NIR-VES-001', 'Salem Royal Pure Cotton Double Vesti & Angavastram', 'சேலம் ராயல் பருத்தி இரட்டை வேஷ்டி & துண்டு', 'salem-royal-pure-cotton-double-vesti-angavastram',
  'Traditional 8-muzham (4 meters) double dhoti paired with 4-muzham matching ceremonial shawl. Woven from 100% combed Egyptian staple cotton with 2-inch temple gold zari border.', '100% தூய பருத்தியில் 2 அங்குல தங்க ஜரிகை கரை அமைந்த 8 முழ இரட்டை வேஷ்டி மற்றும் அங்கவஸ்திரம் தொகுப்பு.', 'Pristine ivory double vesti with 2-inch rich gold zari border.', 'அழகிய சந்தன நிற இரட்டை வேஷ்டி மற்றும் மேல்துண்டு.',
  'cat-vesti', 'cat-men', 'Nirai Parampara',
  'Superfine Combed Cotton', '100% Cotton with Gold Kasavu', 'Wedding & Temple Rituals',
  'Gentle hand wash. Light starch recommended for traditional crisp fold.', 'லேசான கஞ்சியிட்டு அயர்ன் செய்தால் பாரம்பரிய கம்பீரம் கிடைக்கும்.',
  1999, 10, 5, 1709,
  35, 8, true, false, true,
  '["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=80","https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80"]'::jsonb,
  '[{"id":"var-5","name":"Ivory with Gold Kasavu Border","color":"Ivory White","colorHex":"#FBF9F1","size":"Double (8 Muzham + Towel)","sku":"NIR-VES-001-8M","stock":25},{"id":"var-6","name":"Ivory with Maroon & Gold Border","color":"Ivory & Maroon","colorHex":"#EDE8D0","size":"Double (8 Muzham + Towel)","sku":"NIR-VES-001-MG","stock":10}]'::jsonb,
  4.9, 36, '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.products (id, sku, name_en, name_ta, slug, description_en, description_ta, short_desc_en, short_desc_ta, category_id, sub_category_id, brand, fabric, material, style, care_instructions_en, care_instructions_ta, base_price, regular_discount, special_discount, final_price, stock, low_stock_threshold, is_featured, is_new_arrival, is_active, images, variants, rating, review_count, reviews)
VALUES (
  'prod-festive-linen-shirt', 'NIR-SHT-001', 'Adyar Pure Linen Mandarain Collar Traditional Shirt', 'அடையாறு தூய லினன் பாரம்பரிய குர்தா சட்டை', 'adyar-pure-linen-traditional-shirt',
  'Bespoke tailored pure European linen shirt with subtle horn buttons, tailored mandarin band collar, and cuffed sleeves. Pairs seamlessly with traditional silk vestis and celebratory trousers.', 'தூய லினன் இழைகளால் தைக்கப்பட்ட மாண்டரின் காலர் சட்டை. வேஷ்டியுடன் அணிய மிகச் சிறந்த சேர்க்கை.', 'Crisp sand cream linen with breathable comfort and regal silhouette.', 'சந்தன வண்ணத்தில் நேர்த்தியான லினன் சட்டை.',
  'cat-shirts', 'cat-men', 'Nirai Contemporary',
  'Pure Flax Linen', '100% Linen', 'Celebration & Festive Reception',
  'Gentle machine wash with like colors. Warm iron while slightly damp.', 'மென்மையாக துவைக்கவும். மிதமான சூட்டில் அயர்ன் செய்யவும்.',
  2499, 15, 0, 2124,
  18, 4, true, false, true,
  '["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=80"]'::jsonb,
  '[{"id":"var-7","name":"Sand Cream - Size 38 (S)","color":"Sand Cream","colorHex":"#EAE4D3","size":"38 (S)","sku":"NIR-SHT-001-38","stock":4},{"id":"var-8","name":"Sand Cream - Size 40 (M)","color":"Sand Cream","colorHex":"#EAE4D3","size":"40 (M)","sku":"NIR-SHT-001-40","stock":6},{"id":"var-9","name":"Sand Cream - Size 42 (L)","color":"Sand Cream","colorHex":"#EAE4D3","size":"42 (L)","sku":"NIR-SHT-001-42","stock":5},{"id":"var-10","name":"Sand Cream - Size 44 (XL)","color":"Sand Cream","colorHex":"#EAE4D3","size":"44 (XL)","sku":"NIR-SHT-001-44","stock":3}]'::jsonb,
  4.7, 19, '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.products (id, sku, name_en, name_ta, slug, description_en, description_ta, short_desc_en, short_desc_ta, category_id, sub_category_id, brand, fabric, material, style, care_instructions_en, care_instructions_ta, base_price, regular_discount, special_discount, final_price, stock, low_stock_threshold, is_featured, is_new_arrival, is_active, images, variants, rating, review_count, reviews)
VALUES (
  'prod-kids-pattu-pavadai', 'NIR-KID-001', 'Tamizhan Girl Handloom Pattu Pavadai Set', 'தமிழ் பெண் கைத்தறி பட்டுப் பாவாடை சட்டை', 'tamizhan-girl-handloom-pattu-pavadai-set',
  'Vibrant peacock blue and auspicious vermillion red silk pattu pavadai with gold zari borders. Lined with soft breathable pure cotton to ensure absolute comfort for young children.', 'மயில் கழுத்து நீலம் மற்றும் குங்கும சிவப்பு வண்ணத்தில் தங்க ஜரிகை கரை அமைந்த பாரம்பரிய பட்டுப் பாவாடை செட்.', 'Traditional silk lehenga with cotton inner lining for gentle comfort.', 'குழந்தைகளுக்கு உறுத்தாத மெல்லிய பருத்தி உள்வரி கொண்ட பட்டுப் பாவாடை.',
  'cat-kids', 'cat-kids', 'Nirai Kutties',
  'Art Silk with Pure Cotton Lining', 'Silk Blend Outer / 100% Cotton Lining', 'Festivals, Naming Ceremonies & Family Weddings',
  'Dry clean recommended. Low heat iron.', 'டிரை கிளீன் சிறந்தது. மிதமான சூட்டில் அயர்ன் செய்யவும்.',
  3499, 20, 5, 2659,
  15, 3, true, false, true,
  '["https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=1000&q=80"]'::jsonb,
  '[{"id":"var-11","name":"Age 2-3 Years","color":"Peacock Blue & Kumkum Red","colorHex":"#005F73","size":"2-3 Yrs","sku":"NIR-KID-001-2Y","stock":4},{"id":"var-12","name":"Age 4-5 Years","color":"Peacock Blue & Kumkum Red","colorHex":"#005F73","size":"4-5 Yrs","sku":"NIR-KID-001-4Y","stock":6},{"id":"var-13","name":"Age 6-7 Years","color":"Peacock Blue & Kumkum Red","colorHex":"#005F73","size":"6-7 Yrs","sku":"NIR-KID-001-6Y","stock":5}]'::jsonb,
  4.9, 15, '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.products (id, sku, name_en, name_ta, slug, description_en, description_ta, short_desc_en, short_desc_ta, category_id, sub_category_id, brand, fabric, material, style, care_instructions_en, care_instructions_ta, base_price, regular_discount, special_discount, final_price, stock, low_stock_threshold, is_featured, is_new_arrival, is_active, images, variants, rating, review_count, reviews)
VALUES (
  'prod-kids-dhoti-shirt', 'NIR-KID-002', 'Junior Traditional Velcro Pocket Dhoti & Kurta Set', 'சிறுவர் வெல்க்ரோ வேஷ்டி & குர்தா செட்', 'junior-traditional-velcro-pocket-dhoti-kurta-set',
  'Hassle-free readymade pocket dhoti with adjustable velcro waist band and matching gold-piped cream kurta. Makes wearing traditional vesti enjoyable and effortless for young boys.', 'சிறுவர்கள் எளிதாக உடுத்திக்கொள்ளும் வெல்க்ரோ அமைப்பும் பாக்கெட்டும் கொண்ட வேஷ்டி மற்றும் குர்தா செட்.', 'Easy-wear velcro waist dhoti with side pocket and festive kurta.', 'எளிதில் அணியும் வெல்க்ரோ வேஷ்டி மற்றும் சட்டை.',
  'cat-kids', 'cat-kids', 'Nirai Kutties',
  'Soft Combed Cotton', '100% Breathable Cotton', 'Festival & Temple Functions',
  'Machine wash delicate. Secure velcro band before washing.', 'மென்மையாக துவைக்கவும். துவைக்கும் முன் வெல்க்ரோவை இணைத்து வைக்கவும்.',
  1799, 10, 0, 1619,
  20, 5, false, false, true,
  '["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=80"]'::jsonb,
  '[{"id":"var-14","name":"Age 3-4 Years","color":"Ivory & Gold Zari","colorHex":"#F6F3E7","size":"3-4 Yrs","sku":"NIR-KID-002-3Y","stock":7},{"id":"var-15","name":"Age 5-6 Years","color":"Ivory & Gold Zari","colorHex":"#F6F3E7","size":"5-6 Yrs","sku":"NIR-KID-002-5Y","stock":8},{"id":"var-16","name":"Age 7-8 Years","color":"Ivory & Gold Zari","colorHex":"#F6F3E7","size":"7-8 Yrs","sku":"NIR-KID-002-7Y","stock":5}]'::jsonb,
  4.8, 22, '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 3. COUPONS
INSERT INTO public.coupons (id, code, description, discount_type, discount_value, min_order_amount, max_discount, is_active, usage_count)
VALUES ('coup-1', 'NIRAI10', '10% instant festive discount on all handwoven orders', 'PERCENTAGE', 10, 1000, NULL, true, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.coupons (id, code, description, discount_type, discount_value, min_order_amount, max_discount, is_active, usage_count)
VALUES ('coup-2', 'PONGAL2026', 'Flat ₹500 off on festive wedding & family purchases above ₹3,000', 'FIXED', 500, 3000, NULL, true, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.coupons (id, code, description, discount_type, discount_value, min_order_amount, max_discount, is_active, usage_count)
VALUES ('coup-3', 'FIRSTNIRAI', '15% welcome discount for new Nirai family members', 'PERCENTAGE', 15, 1500, NULL, true, 0)
ON CONFLICT (id) DO NOTHING;

-- 4. SUPPLIERS
INSERT INTO public.suppliers (id, name, contact_person, phone, email, city, state, lead_time_days, is_active, notes)
VALUES ('sup-1', 'Kanchipuram Master Weavers Guild', 'S. Ramanathan', '+91 94432 11098', 'ramanathan@kanchiweaves.org', 'Kanchipuram', 'Tamil Nadu', 7, true, 'Primary source for certified GI-tagged pure mulberry silk sarees with gold zari.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.suppliers (id, name, contact_person, phone, email, city, state, lead_time_days, is_active, notes)
VALUES ('sup-2', 'Salem Dhoti & Handloom Cooperative', 'V. Murugan', '+91 98421 55678', 'murugan@salemhandloom.in', 'Salem', 'Tamil Nadu', 4, true, 'Premium pure combed cotton dhotis with fine woven borders.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.suppliers (id, name, contact_person, phone, email, city, state, lead_time_days, is_active, notes)
VALUES ('sup-3', 'Karaikudi Chettinad Artisans Trust', 'Meenakshi Sundaram', '+91 97890 33412', 'chettinadcrafts@karaikudi.org', 'Karaikudi', 'Tamil Nadu', 5, true, 'Handwoven natural dyed Chettinad cotton sarees and temple borders.')
ON CONFLICT (id) DO NOTHING;

-- 5. COURIER PARTNERS
INSERT INTO public.courier_partners (id, name, code, phone, email, delivery_days, coverage, tracking_url_template, badge_text, is_active, notes)
VALUES ('courier-bluedart', 'BLUE DART EXPRESS', 'BLUEDART', '+91 1860 233 1234', 'support@bluedart.com', '2 - 3 Business Days', 'Primary air express partner for metro cities & tier-1 quick dispatch.', 'https://www.bluedart.com/tracking?track={trackingId}', 'BLUEDART', true, '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.courier_partners (id, name, code, phone, email, delivery_days, coverage, tracking_url_template, badge_text, is_active, notes)
VALUES ('courier-delhivery', 'DELHIVERY LOGISTICS', 'DELHIVERY', '+91 124 6719500', 'support@delhivery.com', '3 - 5 Business Days', 'Surface & air network covering 18,500+ pincodes.', 'https://www.delhivery.com/track/package/{trackingId}', 'DELHIVERY', true, '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.courier_partners (id, name, code, phone, email, delivery_days, coverage, tracking_url_template, badge_text, is_active, notes)
VALUES ('courier-dtdc', 'DTDC EXPRESS', 'DTDC', '+91 73057 70477', 'customersupport@dtdc.com', '3 - 4 Business Days', 'Reliable South Indian regional & tier-2/3 town coverage.', 'https://www.dtdc.in/tracking/tracking_results.asp?trType=awb_no&strAwbNo={trackingId}', 'DTDC', true, '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.courier_partners (id, name, code, phone, email, delivery_days, coverage, tracking_url_template, badge_text, is_active, notes)
VALUES ('courier-indiapost', 'INDIA POST SPEED POST', 'INDIA POST', '+91 1800 266 6868', 'ccc@indiapost.gov.in', '4 - 6 Business Days', 'Government postal network reaching remote and rural villages.', 'https://www.indiapost.gov.in/_layouts/15/dpt.cptc.portal/tracking/trackconsignment.aspx?consignmentid={trackingId}', 'INDIA POST', true, '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.courier_partners (id, name, code, phone, email, delivery_days, coverage, tracking_url_template, badge_text, is_active, notes)
VALUES ('courier-professional', 'PROFESSIONAL COURIERS', 'PROFESSIONAL', '+91 44 2829 2041', 'chennai@tpcglobe.com', '2 - 4 Business Days', 'Fast local Tamil Nadu & South India hub distribution.', 'https://www.tpcindia.com/Tracking_search.aspx?id={trackingId}', 'PROFESSIONAL', true, '')
ON CONFLICT (id) DO NOTHING;

-- 6. STORE SETTINGS
INSERT INTO public.settings (id, store_name, tagline_en, tagline_ta, logo, hero_slides, promo_banner, homepage_sections, free_shipping_threshold, standard_shipping_fee, shipping_rules, announcement_en, announcement_ta, is_announcement_active, bank_details, upi_details)
VALUES (
  'nirai_main_settings',
  'Nirai',
  'Where Tradition Feels Complete',
  'பாரம்பரியம் முழுமை பெறும் இடம்',
  '{"desktopLogoUrl":"","mobileLogoUrl":"","altText":"Nirai Pure Handloom Silks"}'::jsonb,
  '[{"id":"slide-1","titleEn":"Where Tradition Feels Complete","titleTa":"பாரம்பரியம் முழுமை பெறும் இடம்","subtitleEn":"Authentic South Indian Handloom Silks & Fine Ceremonial Vestis.","subtitleTa":"நான்காவது தலைமுறை மாஸ்டர் நெசவாளர்களால் உருவாக்கப்பட்ட அசல் பட்டு.","badgeEn":"Festive Handloom Collection","badgeTa":"சிறப்பு திருவிழா கைத்தறி","ctaTextEn":"Shop Now","ctaTextTa":"இப்போதே வாங்கு","ctaLink":"cat-sarees","desktopImage":"https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1920&h=700&q=85","mobileImage":"https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1080&h=1350&q=85","isActive":true,"order":1},{"id":"slide-2","titleEn":"Royal Salem Dhotis & Angavastram","titleTa":"ராஜரீக சேலம் வேஷ்டி தொகுப்பு","subtitleEn":"Double-warp handloom cotton with pure Kasavu zari for wedding rituals.","subtitleTa":"சுபமுகூர்த்தங்களுக்கான அசல் தங்கம் கரை கொண்ட இரட்டை வேஷ்டிகள்.","badgeEn":"Ceremonial Essentials","badgeTa":"சுபநிகழ்ச்சி ஆடைகள்","ctaTextEn":"Explore Vestis","ctaTextTa":"வேஷ்டிகள்","ctaLink":"cat-vesti","desktopImage":"https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1920&h=700&q=85","mobileImage":"https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1080&h=1350&q=85","isActive":true,"order":2},{"id":"slide-3","titleEn":"Chettinad Heritage Earthen Cottons","titleTa":"செட்டிநாடு பாரம்பரிய கைத்தறி","subtitleEn":"Hand-dyed naturally vibrant sarees crafted with vintage geometric borders.","subtitleTa":"இயற்கை சாயமிட்ட கண்ணைக் கவரும் பாரம்பரிய வண்ணங்கள்.","badgeEn":"Daily Luxury","badgeTa":"தினசரி ஆடம்பரம்","ctaTextEn":"Discover Cottons","ctaTextTa":"பருத்தி ஆடைகள்","ctaLink":"cat-cotton","desktopImage":"https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1920&h=700&q=85","mobileImage":"https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1080&h=1350&q=85","isActive":true,"order":3}]'::jsonb,
  '{"id":"promo-1","titleEn":"Festive Muhurtham Edit","titleTa":"சிறப்பு முகூர்த்த தள்ளுபடி திருவிழா","subtitleEn":"Receive a certified commemorative silver coin & festive angavastram on bridal purchases above ₹8,000.","subtitleTa":"₹8,000-க்கு மேல் திருமண ஆடைகள் வாங்குவோருக்கு தூய வெள்ளி நாணயம் மற்றும் அங்கவஸ்திரம் பரிசு.","badgeEn":"Limited Festive Offer","badgeTa":"வரையறுக்கப்பட்ட பண்டிகை சலுகை","ctaTextEn":"Claim Offer","ctaTextTa":"சலுகையைப் பெறுக","ctaLink":"cat-sarees","desktopImage":"https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&h=600&q=85","mobileImage":"https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1080&h=900&q=85","countdownDate":"2026-11-15T23:59:59Z","isActive":true}'::jsonb,
  '[{"id":"hero","label":"Hero Visual Carousel","isVisible":true,"order":1},{"id":"categories","label":"Product Categories","isVisible":true,"order":2},{"id":"featured","label":"Featured Handlooms","isVisible":true,"order":3},{"id":"promo","label":"Promotional Banner","isVisible":true,"order":4},{"id":"new_arrivals","label":"New Arrivals","isVisible":true,"order":5},{"id":"why_us","label":"Why Choose Us","isVisible":true,"order":6},{"id":"final_cta","label":"Final Call To Action","isVisible":true,"order":7}]'::jsonb,
  1500,
  120,
  '{"tamilNaduStandard":40,"tamilNaduExpress":149,"indiaStandard":120,"indiaExpress":299}'::jsonb,
  '✨ Festive Heritage Collection: Free Express Delivery on orders above ₹1,500 | Signature Saree & Ethnic Collections',
  '✨ சிறப்பு பாரம்பரியத் தொகுப்பு: ₹1,500-க்கு மேல் இலவச டெலிவரி | அசல் பட்டு மற்றும் பருத்தி உடைகள்',
  true,
  '{"bankName":"HDFC Bank Ltd","accountName":"NIRAI TRADITIONAL WEAR","accountNumber":"50200088992211","ifscCode":"HDFC0001244","branch":"Cathedral Road, Chennai"}'::jsonb,
  '{"upiId":"nirai@upi","merchantName":"Nirai Traditional Ethnic Apparel","qrCodeNote":"Scan & Pay with GPay, PhonePe or Paytm","qrCodeImageUrl":""}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 7. MEDIA LIBRARY
INSERT INTO public.media_library (url, secure_url, public_id, folder, category, alt_text, width, height, format, bytes)
VALUES ('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&h=120&q=80', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&h=120&q=80', 'nirai/logos/brand_logo_gold', 'nirai/media', 'logos', 'Nirai Handlooms Official Logo', 400, 120, 'png', 250000)
ON CONFLICT (public_id) DO NOTHING;
INSERT INTO public.media_library (url, secure_url, public_id, folder, category, alt_text, width, height, format, bytes)
VALUES ('https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1920&h=700&q=85', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1920&h=700&q=85', 'nirai/hero/kanchi_silks_desktop', 'nirai/media', 'hero', 'Kanchipuram Silk Saree Banner', 1920, 700, 'webp', 250000)
ON CONFLICT (public_id) DO NOTHING;
INSERT INTO public.media_library (url, secure_url, public_id, folder, category, alt_text, width, height, format, bytes)
VALUES ('https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1080&h=1350&q=85', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1080&h=1350&q=85', 'nirai/hero/kanchi_silks_mobile', 'nirai/media', 'hero', 'Kanchipuram Silk Saree Mobile Banner', 1080, 1350, 'webp', 250000)
ON CONFLICT (public_id) DO NOTHING;
INSERT INTO public.media_library (url, secure_url, public_id, folder, category, alt_text, width, height, format, bytes)
VALUES ('https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1920&h=700&q=85', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1920&h=700&q=85', 'nirai/hero/salem_dhotis_desktop', 'nirai/media', 'hero', 'Salem Royal Double Vesti Banner', 1920, 700, 'webp', 250000)
ON CONFLICT (public_id) DO NOTHING;
INSERT INTO public.media_library (url, secure_url, public_id, folder, category, alt_text, width, height, format, bytes)
VALUES ('https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&h=600&q=85', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&h=600&q=85', 'nirai/promotions/festive_muhurtham_desktop', 'nirai/media', 'promotions', 'Festive Muhurtham Edit Promotional Banner', 1600, 600, 'webp', 250000)
ON CONFLICT (public_id) DO NOTHING;
INSERT INTO public.media_library (url, secure_url, public_id, folder, category, alt_text, width, height, format, bytes)
VALUES ('https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&h=1000&q=80', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&h=1000&q=80', 'nirai/categories/bridal_silks_card', 'nirai/media', 'categories', 'Bridal Kanchipuram Silks Collection', 800, 1000, 'webp', 250000)
ON CONFLICT (public_id) DO NOTHING;
INSERT INTO public.media_library (url, secure_url, public_id, folder, category, alt_text, width, height, format, bytes)
VALUES ('https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&h=1000&q=80', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&h=1000&q=80', 'nirai/categories/men_vesti_card', 'nirai/media', 'categories', 'Salem Royal Vesti Collection', 800, 1000, 'webp', 250000)
ON CONFLICT (public_id) DO NOTHING;
