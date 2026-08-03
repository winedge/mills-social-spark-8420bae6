CREATE TABLE IF NOT EXISTS public.site_features (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_features TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_features TO authenticated;
GRANT ALL ON public.site_features TO service_role;
ALTER TABLE public.site_features ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "site_features public read" ON public.site_features;
CREATE POLICY "site_features public read" ON public.site_features FOR SELECT USING (true);
DROP POLICY IF EXISTS "site_features admin write" ON public.site_features;
CREATE POLICY "site_features admin write" ON public.site_features FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.site_features (key, enabled) VALUES ('beer_pong', true) ON CONFLICT (key) DO NOTHING;