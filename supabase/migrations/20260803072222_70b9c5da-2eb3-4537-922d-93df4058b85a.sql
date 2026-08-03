
-- Rename / reorder roots
UPDATE public.menu_categories SET name='Lunch Specials', sort_order=2 WHERE slug='lunch';
UPDATE public.menu_categories SET sort_order=3 WHERE slug='happy-hour';
UPDATE public.menu_categories SET name='Mills Food Selection', sort_order=4 WHERE slug='food';
UPDATE public.menu_categories SET name='Mills Beverage Selections', sort_order=5 WHERE slug='drinks';

INSERT INTO public.menu_categories (name, slug, parent_id, sort_order, active)
SELECT 'Daily Specials', 'daily-specials', NULL, 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.menu_categories WHERE slug='daily-specials');
UPDATE public.menu_categories SET name='Daily Specials', parent_id=NULL, sort_order=1, active=true WHERE slug='daily-specials';

-- Beverage children
UPDATE public.menu_categories SET name='Mills Cocktail List', sort_order=1 WHERE slug='cocktails';

INSERT INTO public.menu_categories (name, slug, parent_id, sort_order, active)
SELECT v.name, v.slug, (SELECT id FROM public.menu_categories WHERE slug='drinks'), v.sort_order, true
FROM (VALUES ('Draft Beer List','draft-beer-list',2), ('Cans and Bottles','cans-and-bottles',3), ('Non-alcoholic Specialties','non-alcoholic-specialties',4)) AS v(name, slug, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.menu_categories c WHERE c.slug=v.slug);
UPDATE public.menu_categories SET parent_id=(SELECT id FROM public.menu_categories WHERE slug='drinks'), active=true
WHERE slug IN ('draft-beer-list','cans-and-bottles','non-alcoholic-specialties');

-- Move items out of old beer groups
UPDATE public.menu_items SET category_id=(SELECT id FROM public.menu_categories WHERE slug='draft-beer-list'),
  category='Draft Beer List'
WHERE category_id IN (SELECT id FROM public.menu_categories WHERE slug IN ('beer-lager','beer-stout','beer-ale','beer-ipa','beer-cider-sour','beer-fruit-wheat'));

UPDATE public.menu_items SET category_id=(SELECT id FROM public.menu_categories WHERE slug='cans-and-bottles'),
  category='Cans and Bottles'
WHERE category_id IN (SELECT id FROM public.menu_categories WHERE slug IN ('beer-bottles-cans','hard-seltzers'));

UPDATE public.menu_items SET category_id=(SELECT id FROM public.menu_categories WHERE slug='non-alcoholic-specialties'),
  category='Non-alcoholic Specialties'
WHERE category_id IN (SELECT id FROM public.menu_categories WHERE slug='beer-na');

-- Wine groups move under beverages
UPDATE public.menu_categories SET parent_id=(SELECT id FROM public.menu_categories WHERE slug='drinks'), sort_order=5
 WHERE slug='wine';

-- Hide retired beer groups
UPDATE public.menu_categories SET active=false
 WHERE slug IN ('beer','beer-lager','beer-stout','beer-ale','beer-ipa','beer-cider-sour','beer-fruit-wheat','beer-bottles-cans','hard-seltzers','beer-na');
