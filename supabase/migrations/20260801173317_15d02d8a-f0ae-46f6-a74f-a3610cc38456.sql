CREATE TABLE IF NOT EXISTS public.site_media (
  id integer PRIMARY KEY DEFAULT 1,
  hero_video_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_media_single_row CHECK (id = 1)
);
GRANT SELECT ON public.site_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_media TO authenticated;
GRANT ALL ON public.site_media TO service_role;
ALTER TABLE public.site_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_media public read" ON public.site_media FOR SELECT USING (true);
CREATE POLICY "site_media admin write" ON public.site_media FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.site_media (id) VALUES (1) ON CONFLICT (id) DO NOTHING;