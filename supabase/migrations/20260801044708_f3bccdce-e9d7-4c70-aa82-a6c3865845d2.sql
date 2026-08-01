CREATE TABLE public.contact_info (
  id integer PRIMARY KEY DEFAULT 1,
  address_line text NOT NULL DEFAULT '425 S MILL AVE, TEMPE, AZ 85281',
  hours_weekday text NOT NULL DEFAULT 'SUN–THU · 11AM – 12AM',
  hours_weekend text NOT NULL DEFAULT 'FRI–SAT · 11AM – 2AM',
  phone text NOT NULL DEFAULT '(480) 555-0142',
  email text NOT NULL DEFAULT 'hello@millsmodernsocial.com',
  instagram_url text NOT NULL DEFAULT '#',
  x_url text NOT NULL DEFAULT '#',
  tiktok_url text NOT NULL DEFAULT '#',
  map_embed_url text NOT NULL DEFAULT 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3330.6194175359587!2d-111.94124292431101!3d33.40709197340681!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x872b09f10e1e446b%3A0xb0712955863e70ff!2sMill''s%20Modern%20Social!5e0!3m2!1sen!2sin!4v1785559000888!5m2!1sen!2sin',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_info_single_row CHECK (id = 1)
);
GRANT SELECT ON public.contact_info TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_info TO authenticated;
GRANT ALL ON public.contact_info TO service_role;
ALTER TABLE public.contact_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view contact info" ON public.contact_info FOR SELECT USING (true);
CREATE POLICY "Admins manage contact info" ON public.contact_info FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER contact_info_updated_at BEFORE UPDATE ON public.contact_info
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
INSERT INTO public.contact_info (id) VALUES (1);

CREATE TABLE public.nfl_streamed_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id bigint NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  date_time text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.nfl_streamed_games TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nfl_streamed_games TO authenticated;
GRANT ALL ON public.nfl_streamed_games TO service_role;
ALTER TABLE public.nfl_streamed_games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view streamed games" ON public.nfl_streamed_games FOR SELECT USING (true);
CREATE POLICY "Admins manage streamed games" ON public.nfl_streamed_games FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER nfl_streamed_games_updated_at BEFORE UPDATE ON public.nfl_streamed_games
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text NOT NULL DEFAULT 'footer',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_subscribers TO authenticated;
GRANT INSERT ON public.newsletter_subscribers TO anon;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete subscribers" ON public.newsletter_subscribers FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT INSERT ON public.contact_messages TO anon;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can send a message" ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view messages" ON public.contact_messages FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update messages" ON public.contact_messages FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete messages" ON public.contact_messages FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));