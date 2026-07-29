
-- MENU ITEMS
CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price text NOT NULL,
  calories int,
  category text NOT NULL,
  tag text,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active menu items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Admins manage menu items" ON public.menu_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- PARTY SPACES
CREATE TABLE public.party_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  capacity text NOT NULL,
  price text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'Users',
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.party_spaces TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.party_spaces TO authenticated;
GRANT ALL ON public.party_spaces TO service_role;
ALTER TABLE public.party_spaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view spaces" ON public.party_spaces FOR SELECT USING (true);
CREATE POLICY "Admins manage spaces" ON public.party_spaces FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- UPCOMING SHOWS
CREATE TABLE public.party_shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_label text NOT NULL,
  time_label text NOT NULL,
  act text NOT NULL,
  event_type text NOT NULL DEFAULT 'Live',
  genre text NOT NULL DEFAULT '',
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.party_shows TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.party_shows TO authenticated;
GRANT ALL ON public.party_shows TO service_role;
ALTER TABLE public.party_shows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view shows" ON public.party_shows FOR SELECT USING (true);
CREATE POLICY "Admins manage shows" ON public.party_shows FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- SPORTS SCHEDULE
CREATE TABLE public.sports_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league text NOT NULL,
  when_label text NOT NULL,
  match_label text NOT NULL,
  note text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sports_schedule TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.sports_schedule TO authenticated;
GRANT ALL ON public.sports_schedule TO service_role;
ALTER TABLE public.sports_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view sports schedule" ON public.sports_schedule FOR SELECT USING (true);
CREATE POLICY "Admins manage sports schedule" ON public.sports_schedule FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- SITE SETTINGS (singleton)
CREATE TABLE public.site_settings (
  id int PRIMARY KEY DEFAULT 1,
  whatsapp_number text NOT NULL DEFAULT '',
  notification_email text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id = 1)
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON public.site_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

INSERT INTO public.site_settings (id, whatsapp_number, notification_email) VALUES (1, '', 'admin@millsmodernsocial.com');

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER menu_items_updated BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER party_spaces_updated BEFORE UPDATE ON public.party_spaces FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER party_shows_updated BEFORE UPDATE ON public.party_shows FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER sports_schedule_updated BEFORE UPDATE ON public.sports_schedule FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER site_settings_updated BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Seed menu items
INSERT INTO public.menu_items (name, description, price, calories, category, tag, sort_order) VALUES
('Smoked Bone Marrow','Roasted marrow, charred sourdough, gremolata.','$15',620,'Starters','Chef''s Pick',1),
('Tempura Green Beans','Crispy beans, sriracha-honey aioli.','$11',480,'Starters',NULL,2),
('Charred Street Corn','Cotija, lime, chili, cilantro.','$10',340,'Starters','Local',3),
('Tuna Tartare Tacos','Ahi, avocado, ponzu, crispy wontons.','$16',410,'Starters','New',4),
('Sticky Social Wings','Gochujang glaze, pickled radish, sesame.','$16',780,'Wings','Chef''s Pick',5),
('Ghost Pepper Wings','Hickory smoked, ghost glaze, ranch.','$16',820,'Wings','Spicy',6),
('Classic Buffalo','Frank''s, butter, blue cheese, celery.','$14',750,'Wings',NULL,7),
('Lemon Pepper Dry Rub','Crispy, citrusy, served with garlic aioli.','$14',690,'Wings',NULL,8),
('The Mill Burger','Wagyu blend, caramelized onion, truffle aioli, brioche.','$18',980,'Burgers & Mains','Chef''s Pick',9),
('Tempe Smash','Double smash, American, balsamic onions, secret sauce.','$16',890,'Burgers & Mains',NULL,10),
('Nashville Hot Chicken','Buttermilk fried, hot honey, pickles, brioche.','$17',920,'Burgers & Mains','Spicy',11),
('Cast Iron Ribeye','12oz prime, herb butter, hand-cut fries.','$38',1180,'Burgers & Mains',NULL,12),
('Short Rib Skins','Braised beef, chipotle crema, pickled Fresno.','$16',860,'Shareables',NULL,13),
('Truffle Parm Fries','Hand cut, parmesan, herbs, garlic oil.','$12',640,'Shareables',NULL,14),
('Brisket Nachos','Smoked brisket, queso, jalapeño, pico.','$17',1050,'Shareables',NULL,15),
('Soft Pretzel Board','Bavarian pretzels, beer cheese, mustard.','$13',720,'Shareables',NULL,16),
('Desert Heat Old Fashioned','Bourbon, ancho chili, charred orange.','$14',220,'Cocktails','Chef''s Pick',17),
('Cobalt Mule','Vodka, blueberry, lime, house ginger beer.','$13',190,'Cocktails',NULL,18),
('Smoked Paloma','Mezcal, grapefruit, lime, smoked salt rim.','$14',210,'Cocktails','New',19),
('Espresso Martini','Vodka, cold brew, vanilla, salted cream.','$13',250,'Cocktails',NULL,20),
('Four Peaks Kilt Lifter','Scottish-style amber. Tempe local.','$7',210,'Drafts','Local',21),
('Huss Scottsdale Blonde','Crisp, light, easy drinking.','$7',170,'Drafts','Local',22),
('Wren House Spellbinder','Hazy IPA, juicy citrus hops.','$8',230,'Drafts','Local',23),
('Guinness','The classic Irish dry stout.','$8',210,'Drafts',NULL,24),
('Skillet Cookie','Warm chocolate chip, vanilla bean ice cream.','$10',890,'Desserts',NULL,25),
('Bourbon Bread Pudding','Brioche, caramel, candied pecans.','$11',760,'Desserts',NULL,26);

INSERT INTO public.party_spaces (name, capacity, price, description, icon, sort_order) VALUES
('Bar Lounge','Up to 25','From $250 min. spend','Reserved section of the main bar with dedicated bartender. Perfect for birthdays and small crews.','Users',1),
('Game Floor Buyout','Up to 60','From $1,200 min. spend','Take over the pool tables, darts, and arcade for the night. Your own space, your own soundtrack.','PartyPopper',2),
('Full Venue','Up to 200','Custom quote','The whole house. Dining room, bar, patio, stage, and game floor — ideal for corporate events and weddings.','Building2',3);

INSERT INTO public.party_shows (date_label, time_label, act, event_type, genre, sort_order) VALUES
('FRI · JUL 03','9:00 PM','The Copper Kings','Live Band','Indie Rock',1),
('SAT · JUL 04','10:00 PM','DJ Nova','DJ Set','House / Top 40',2),
('THU · JUL 09','8:00 PM','Open Mic Night','Live','All Genres',3),
('SAT · JUL 11','9:30 PM','Desert Static','Live Band','Alt Rock',4);

INSERT INTO public.sports_schedule (league, when_label, match_label, note, sort_order) VALUES
('MLB','TONIGHT · 6:40 PM','D-BACKS vs DODGERS','Chase Field feed · sound on Screen 1',1),
('UFC','SAT · 7:00 PM','UFC 329 · MAIN CARD','PPV · full audio · reserved booths',2),
('FIFA 2026','JUN 11 · 10:00 AM','USA vs MEXICO · GROUP A','Opening kickoff · brunch service',3),
('BOXING','JUN 21 · 6:00 PM','CANELO vs CRAWFORD','PPV · $10 reserved seat',4),
('MLB','SUN · 1:10 PM','YANKEES vs RED SOX','Screen 4 · sound on request',5),
('FIFA 2026','JUN 15 · 12:00 PM','ARGENTINA vs GERMANY','Watch party · Messi jerseys 10% off',6);
