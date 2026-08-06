CREATE TABLE IF NOT EXISTS public.ufc_fighter_overrides (
    fighter_name TEXT PRIMARY KEY,
    image_url TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ufc_fighter_overrides TO authenticated;
GRANT ALL ON public.ufc_fighter_overrides TO service_role;
GRANT SELECT ON public.ufc_fighter_overrides TO anon;

ALTER TABLE public.ufc_fighter_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.ufc_fighter_overrides FOR SELECT TO public USING (true);
CREATE POLICY "Allow admin full access" ON public.ufc_fighter_overrides FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
