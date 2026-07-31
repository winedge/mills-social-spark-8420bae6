CREATE TABLE public.daily_specials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day TEXT NOT NULL DEFAULT '',
  badge TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  price TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.daily_specials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_specials TO authenticated;
GRANT ALL ON public.daily_specials TO service_role;
ALTER TABLE public.daily_specials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view daily specials" ON public.daily_specials FOR SELECT USING (true);
CREATE POLICY "Admins manage daily specials" ON public.daily_specials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER set_daily_specials_updated_at BEFORE UPDATE ON public.daily_specials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.weekly_pulse (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  days_label TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  copy TEXT NOT NULL DEFAULT '',
  accent BOOLEAN NOT NULL DEFAULT FALSE,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.weekly_pulse TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_pulse TO authenticated;
GRANT ALL ON public.weekly_pulse TO service_role;
ALTER TABLE public.weekly_pulse ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view weekly pulse" ON public.weekly_pulse FOR SELECT USING (true);
CREATE POLICY "Admins manage weekly pulse" ON public.weekly_pulse FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER set_weekly_pulse_updated_at BEFORE UPDATE ON public.weekly_pulse
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.daily_specials (day, badge, title, description, price, sort_order) VALUES
  ('MONDAY', '1/2 OFF', 'Burger Night', 'Every Mill Burger and Tempe Smash — half price all night.', 'from $8', 1),
  ('TUESDAY', '$1 EACH', 'Wing It', 'Dollar wings, any flavor, with any pitcher of draft beer.', '$1 / wing', 2),
  ('WEDNESDAY', '2 FOR 1', 'Craft Cocktail Night', 'Two-for-one on every house cocktail from 6PM to close.', 'from $7', 3);

INSERT INTO public.weekly_pulse (days_label, title, copy, accent, sort_order) VALUES
  ('MON–WED', 'HAPPY HOUR', '4PM–7PM. $2 off all drafts & signature cocktails.', FALSE, 1),
  ('THURSDAY', 'TRIVIA NIGHT', '8PM start. Win a $50 bar tab. Hosted by DJ Mac.', TRUE, 2),
  ('FRIDAY', 'LIVE SESSIONS', 'Local artists 9PM–late. High-energy acoustic sets.', FALSE, 3),
  ('SAT–SUN', 'GAME DAY BRUNCH', 'Open early for kickoff. Bottomless mimosas & sliders.', TRUE, 4);