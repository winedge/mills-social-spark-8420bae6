UPDATE public.menu_categories SET sort_order = CASE slug
  WHEN 'hh-6-food' THEN 1 WHEN 'hh-9-food' THEN 2 WHEN 'hh-12-food' THEN 3
  WHEN 'hh-6-drinks' THEN 4 WHEN 'hh-9-drinks' THEN 5 WHEN 'hh-12-drinks' THEN 6 END
WHERE slug IN ('hh-6-food','hh-9-food','hh-12-food','hh-6-drinks','hh-9-drinks','hh-12-drinks');